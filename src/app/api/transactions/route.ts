import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getTransactions, addTransaction } from "@/lib/db/transactionStore";
import { autoCategorize } from "@/lib/financial/categorizer";
import { ALL_CATEGORIES, PAYMENT_METHODS } from "@/types/transaction";
import { invalidateCache } from "@/lib/cache/memoryCache";

const CreateTransactionSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string().min(1, "Description is required").max(200),
  merchant: z.string().optional(),
  category: z.enum(ALL_CATEGORIES).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).default("UPI"),
  date: z.string().min(1, "Date is required"),
  isEssential: z.boolean().default(false),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  try {
    const { transactions, total } = await getTransactions(user.id, {
      category,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreateTransactionSchema.parse(body);

    // Auto-categorize if category is omitted or 'Other'
    const category =
      validated.category && validated.category !== "Other"
        ? validated.category
        : autoCategorize(`${validated.merchant || ""} ${validated.description}`);

    const newTx = await addTransaction(user.id, {
      ...validated,
      category,
    });

    invalidateCache(`dashboard:${user.id}`);

    return NextResponse.json({
      success: true,
      data: newTx,
      message: "Transaction recorded successfully",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.errors[0]?.message || "Validation error" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
