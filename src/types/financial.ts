import { Category } from "./transaction";

export interface FinancialProfileData {
  id: string;
  userId: string;
  monthlySalary: number;
  salaryDate: number; // 1 - 31
  currentBalance: number;
  monthlySavingsGoal: number;
  upcomingEssentials: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SalaryCycleDates {
  cycleStart: Date;
  nextPayday: Date;
  totalDaysInCycle: number;
  daysElapsed: number;
  daysUntilPayday: number;
  cycleStartFormatted: string;
  nextPaydayFormatted: string;
}

export type BudgetStatus = "healthy" | "watch" | "risk";

export interface BudgetMetrics {
  monthlySalary: number;
  totalSpentThisCycle: number;
  upcomingEssentials: number;
  savingsGoal: number;
  flexibleMoney: number;
  safeDailySpend: number;
  burnRatePerDay: number;
  projectedEndSpend: number;
  spentPercent: number;
  flexiblePercentRemaining: number;
  paceRatio: number;
  budgetStatus: BudgetStatus;
}

export interface CategorySpendSummary {
  category: Category;
  amount: number;
  percentage: number;
  count: number;
}

export type LeakSeverity = "low" | "medium" | "high";

export interface SpendingLeak {
  id: string;
  type: "micro_expense" | "subscription" | "category_spike" | "high_burn_rate";
  title: string;
  description: string;
  impactAmount?: number;
  impactPercentage?: number;
  impactDescription: string;
  severity: LeakSeverity;
  recommendation: string;
}

export interface DashboardData {
  profile: {
    name: string;
    email: string;
    monthlySalary: number;
    salaryDate: number;
  };
  cycle: SalaryCycleDates;
  metrics: BudgetMetrics;
  categoryBreakdown: CategorySpendSummary[];
  activeLeaks: SpendingLeak[];
  recentTransactions: import("./transaction").TransactionItem[];
}
