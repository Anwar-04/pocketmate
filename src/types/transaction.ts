export const ALL_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Subscriptions",
  "Healthcare",
  "Rent",
  "Education",
  "Travel",
  "Groceries",
  "Other",
] as const;

export type Category = (typeof ALL_CATEGORIES)[number];

export const PAYMENT_METHODS = ["UPI", "Card", "NetBanking", "Cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TRANSACTION_TYPES = ["debit", "credit"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_SOURCES = ["manual", "csv"] as const;
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number];

export interface TransactionItem {
  id: string;
  userId: string;
  amount: number;
  merchant: string | null;
  description: string;
  category: Category;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  date: Date | string;
  source: TransactionSource;
  isEssential: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateTransactionInput {
  amount: number;
  description: string;
  merchant?: string;
  category?: Category;
  type?: TransactionType;
  paymentMethod?: PaymentMethod;
  date: string;
  isEssential?: boolean;
}

export interface CsvImportRow {
  date: string;
  description: string;
  amount: number;
  category?: Category;
  paymentMethod?: PaymentMethod;
  merchant?: string;
}
