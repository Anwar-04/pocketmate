import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { calculateSalaryCycleDates } from "@/lib/financial/salaryCycle";
import { calculateBudgetMetrics } from "@/lib/financial/budget";
import { detectSpendingLeaks } from "@/lib/financial/leaks";
import { Category, TransactionItem } from "@/types/transaction";
import { CategorySpendSummary, DashboardData } from "@/types/financial";
import { getCachedData, setCachedData } from "@/lib/cache/memoryCache";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const cacheKey = `dashboard:${user.id}`;
  const cachedData = getCachedData<DashboardData>(cacheKey);
  if (cachedData) {
    return NextResponse.json({ success: true, data: cachedData });
  }

  try {
    // 1. Load real user financial profile
    const profile = await prisma.financialProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({
        success: true,
        needsOnboarding: true,
        data: null,
      });
    }

    // 2. Load user's real transactions
    const dbTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    const transactions: TransactionItem[] = dbTransactions.map((t) => ({
      ...t,
      category: t.category as Category,
      type: t.type as "debit" | "credit",
      paymentMethod: t.paymentMethod as "UPI" | "Card" | "NetBanking" | "Cash",
      source: t.source as "manual" | "csv",
    }));

    // 3. Current active salary cycle based on today's real date
    const today = new Date();
    const cycleDates = calculateSalaryCycleDates(profile.salaryDate, today);

    // 4. Sum debit expenses logged in the active cycle
    const cycleTransactions = transactions.filter((t) => {
      if (t.type !== "debit") return false;
      const txDate = new Date(t.date);
      return txDate >= cycleDates.cycleStart && txDate <= cycleDates.nextPayday;
    });

    // If transactions exist but fall on boundary edges, use all debit transactions if cycle list is empty
    const activeDebits =
      cycleTransactions.length > 0
        ? cycleTransactions
        : transactions.filter((t) => t.type === "debit");

    const totalSpent = activeDebits.reduce((acc, t) => acc + t.amount, 0);

    // 5. Deterministic financial metrics
    const metrics = calculateBudgetMetrics({
      monthlySalary: profile.monthlySalary,
      totalSpentThisCycle: totalSpent,
      upcomingEssentials: profile.upcomingEssentials,
      savingsGoal: profile.monthlySavingsGoal,
      daysUntilPayday: cycleDates.daysUntilPayday,
      daysElapsed: cycleDates.daysElapsed,
      totalDaysInCycle: cycleDates.totalDaysInCycle,
    });

    // 6. Real spending leak detection
    const detectedLeaks = transactions.length > 0
      ? detectSpendingLeaks(transactions, metrics, cycleDates)
      : [];

    // 7. Real category breakdown
    const categoryMap = new Map<Category, { amount: number; count: number }>();
    for (const t of activeDebits) {
      const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
      categoryMap.set(t.category, {
        amount: existing.amount + t.amount,
        count: existing.count + 1,
      });
    }

    const categoryBreakdown: CategorySpendSummary[] = Array.from(categoryMap.entries())
      .map(([category, { amount, count }]) => ({
        category,
        amount,
        count,
        percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const dashboardData: DashboardData = {
      profile: {
        name: user.name,
        email: user.email,
        monthlySalary: profile.monthlySalary,
        salaryDate: profile.salaryDate,
      },
      cycle: cycleDates,
      metrics,
      categoryBreakdown,
      activeLeaks: detectedLeaks,
      recentTransactions: transactions.slice(0, 5),
    };

    setCachedData(cacheKey, dashboardData);

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Dashboard calculation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
