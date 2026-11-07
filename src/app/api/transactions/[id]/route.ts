import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteTransaction, updateTransaction } from "@/lib/db/transactionStore";
import { ALL_CATEGORIES, PAYMENT_METHODS } from "@/types/transaction";

const UpdateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().min(1).max(200).optional(),
  category: z.enum(ALL_CATEGORIES).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  date: z.string().optional(),
  isEssential: z.boolean().optional(),
});

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  try {
    await deleteTransaction(user.id, id);
    return NextResponse.json({ success: true, message: "Transaction deleted" });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  try {
    const body = await request.json();
    const validated = UpdateTransactionSchema.parse(body);

    await updateTransaction(user.id, id, validated);
    return NextResponse.json({ success: true, message: "Transaction updated" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.errors[0]?.message || "Validation error" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}
