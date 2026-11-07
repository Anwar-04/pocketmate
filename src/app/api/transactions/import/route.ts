import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ALL_CATEGORIES, PAYMENT_METHODS, Category, PaymentMethod } from "@/types/transaction";
import { normalizeCategory } from "@/lib/financial/categorizer";
import { invalidateCache } from "@/lib/cache/memoryCache";

const ImportPayloadSchema = z.object({
  transactions: z
    .array(
      z.object({
        date: z.string().min(1),
        description: z.string().min(1).max(200),
        amount: z.number().positive(),
        category: z
          .string()
          .optional()
          .transform((val) => normalizeCategory(val) as Category),
        paymentMethod: z
          .string()
          .optional()
          .transform((val) => {
            if (val && ["UPI", "Card", "NetBanking", "Cash"].includes(val)) {
              return val as PaymentMethod;
            }
            return "UPI" as PaymentMethod;
          }),
      })
    )
    .min(1, "At least one transaction is required")
    .max(500, "Maximum 500 transactions per import batch"),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = ImportPayloadSchema.parse(body);

    const rows = validated.transactions;

    // Batch insert into PostgreSQL via Prisma
    const result = await prisma.transaction.createMany({
      data: rows.map((r) => ({
        userId: user.id,
        amount: r.amount,
        description: r.description,
        category: r.category || "Other",
        type: "debit",
        paymentMethod: r.paymentMethod || "UPI",
        date: new Date(r.date),
        source: "csv",
        isEssential: r.category === "Rent" || r.category === "Bills",
      })),
    });

    invalidateCache(`dashboard:${user.id}`);

    return NextResponse.json({
      success: true,
      importedCount: result.count,
      message: `Successfully imported ${result.count} transactions.`,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.errors[0]?.message || "Validation error" },
        { status: 400 }
      );
    }
    console.error("CSV import error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to import transactions to database" },
      { status: 500 }
    );
  }
}
