import { prisma } from "./prisma";
import {
  TransactionItem,
  CreateTransactionInput,
  Category,
  PaymentMethod,
  TransactionType,
  TransactionSource,
} from "@/types/transaction";

export async function getTransactions(
  userId: string,
  filters?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ transactions: TransactionItem[]; total: number }> {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;

  try {
    const whereClause: {
      userId: string;
      category?: Category;
      OR?: Array<{ description?: { contains: string; mode: "insensitive" }; merchant?: { contains: string; mode: "insensitive" } }>;
    } = { userId };

    if (filters?.category && filters.category !== "all") {
      whereClause.category = filters.category as Category;
    }

    if (filters?.search) {
      whereClause.OR = [
        { description: { contains: filters.search, mode: "insensitive" } },
        { merchant: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [dbTransactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    return {
      transactions: dbTransactions.map((t) => ({
        ...t,
        category: t.category as Category,
        type: t.type as TransactionType,
        paymentMethod: t.paymentMethod as PaymentMethod,
        source: t.source as TransactionSource,
      })),
      total,
    };
  } catch (err) {
    console.error("Prisma getTransactions error:", err);
    return { transactions: [], total: 0 };
  }
}

export async function addTransaction(
  userId: string,
  input: CreateTransactionInput
): Promise<TransactionItem> {
  const created = await prisma.transaction.create({
    data: {
      userId,
      amount: input.amount,
      merchant: input.merchant || null,
      description: input.description,
      category: (input.category || "Other") as Category,
      type: (input.type || "debit") as TransactionType,
      paymentMethod: (input.paymentMethod || "UPI") as PaymentMethod,
      date: new Date(input.date),
      source: "manual",
      isEssential: input.isEssential || false,
    },
  });

  return {
    ...created,
    category: created.category as Category,
    type: created.type as TransactionType,
    paymentMethod: created.paymentMethod as PaymentMethod,
    source: created.source as TransactionSource,
  };
}

export async function deleteTransaction(userId: string, id: string): Promise<boolean> {
  await prisma.transaction.deleteMany({
    where: { id, userId },
  });
  return true;
}

export async function updateTransaction(
  userId: string,
  id: string,
  updates: Partial<CreateTransactionInput>
): Promise<boolean> {
  await prisma.transaction.updateMany({
    where: { id, userId },
    data: {
      ...(updates.amount !== undefined && { amount: updates.amount }),
      ...(updates.description && { description: updates.description }),
      ...(updates.category && { category: updates.category as Category }),
      ...(updates.paymentMethod && { paymentMethod: updates.paymentMethod as PaymentMethod }),
      ...(updates.date && { date: new Date(updates.date) }),
      ...(updates.isEssential !== undefined && { isEssential: updates.isEssential }),
    },
  });
  return true;
}
