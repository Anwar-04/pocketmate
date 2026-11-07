import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { calculateSalaryCycleDates } from "@/lib/financial/salaryCycle";
import { calculateBudgetMetrics } from "@/lib/financial/budget";
import { detectSpendingLeaks } from "@/lib/financial/leaks";
import { buildCoachFinancialContext } from "@/lib/ai/contextBuilder";
import { askAiCoach, ChatHistoryMessage } from "@/lib/ai/coachService";
import { Category, TransactionItem } from "@/types/transaction";
import { CategorySpendSummary, DashboardData } from "@/types/financial";

const CoachRequestSchema = z.object({
  question: z.string().min(1, "Question is too short").max(1000, "Question is too long"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { question, history } = CoachRequestSchema.parse(body);

    // Fetch user's real profile and transactions
    const profile = await prisma.financialProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Please complete your salary cycle baseline in onboarding before asking the coach.",
        },
        { status: 400 }
      );
    }

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

    const today = new Date();
    const cycleDates = calculateSalaryCycleDates(profile.salaryDate, today);
    const totalSpent = transactions.reduce(
      (acc, t) => acc + (t.type === "debit" ? t.amount : 0),
      0
    );

    const metrics = calculateBudgetMetrics({
      monthlySalary: profile.monthlySalary,
      totalSpentThisCycle: totalSpent,
      upcomingEssentials: profile.upcomingEssentials,
      savingsGoal: profile.monthlySavingsGoal,
      daysUntilPayday: cycleDates.daysUntilPayday,
      daysElapsed: cycleDates.daysElapsed,
      totalDaysInCycle: cycleDates.totalDaysInCycle,
    });

    const activeLeaks = transactions.length > 0 ? detectSpendingLeaks(transactions, metrics, cycleDates) : [];

    const categoryMap = new Map<Category, { amount: number; count: number }>();
    for (const t of transactions) {
      if (t.type === "debit") {
        const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
        categoryMap.set(t.category, {
          amount: existing.amount + t.amount,
          count: existing.count + 1,
        });
      }
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
      activeLeaks,
      recentTransactions: transactions.slice(0, 10),
    };

    // Build grounding context from user's real financial data
    const financialContext = buildCoachFinancialContext(dashboardData);

    // Ask AI Coach with streaming or direct response
    const coachResponse = await askAiCoach(
      question,
      financialContext,
      history as ChatHistoryMessage[]
    );

    return NextResponse.json({
      success: true,
      answer: coachResponse,
      metricsSummary: {
        safeDailySpend: metrics.safeDailySpend,
        flexibleMoney: metrics.flexibleMoney,
        daysUntilPayday: cycleDates.daysUntilPayday,
        totalSpentThisCycle: metrics.totalSpentThisCycle,
        budgetStatus: metrics.budgetStatus,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.errors[0]?.message || "Validation error" },
        { status: 400 }
      );
    }
    console.error("Coach error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate coaching response" },
      { status: 500 }
    );
  }
}
