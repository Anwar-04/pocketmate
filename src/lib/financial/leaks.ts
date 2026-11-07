import { TransactionItem } from "@/types/transaction";
import { SpendingLeak, BudgetMetrics, SalaryCycleDates } from "@/types/financial";
import { formatINR } from "@/lib/utils";

/**
 * Pure, deterministic leak detection engine.
 * Audits cycle transactions and budget metrics to detect:
 * 1. Micro-expense drain (frequent purchases ≤ ₹100)
 * 2. Subscription accumulation (> ₹1,500)
 * 3. Category spending spikes (e.g. Food > 30% of total spend)
 * 4. Runaway burn rate (daily burn outpacing safe daily spend by > 25%)
 */
export function detectSpendingLeaks(
  transactions: TransactionItem[],
  metrics: BudgetMetrics,
  cycle: SalaryCycleDates
): SpendingLeak[] {
  const leaks: SpendingLeak[] = [];
  const debitTransactions = transactions.filter((t) => t.type === "debit");

  // --- RULE 1: Micro-Expense Audit ("Death by 1,000 Cuts") ---
  const microTransactions = debitTransactions.filter((t) => t.amount <= 100);
  const microCount = microTransactions.length;
  const microTotal = microTransactions.reduce((acc, t) => acc + t.amount, 0);

  if (microCount >= 15 && microTotal >= 1500) {
    leaks.push({
      id: "leak-micro-high",
      type: "micro_expense",
      title: `${microCount} small purchases added up to ${formatINR(microTotal)}`,
      description: `Frequent micro-expenses (≤ ₹100 for chai, snacks, delivery tips) quietly drained significant cash without conscious purchase decisions.`,
      impactAmount: microTotal,
      impactDescription: `Reduces your safe daily spend by ~${formatINR(Math.round(microTotal / cycle.daysUntilPayday))}/day`,
      severity: "high",
      recommendation: "Cap spontaneous cash and UPI micro-spend with a fixed ₹500 weekly pocket allowance.",
    });
  } else if (microCount >= 10 && microTotal >= 500) {
    leaks.push({
      id: "leak-micro-med",
      type: "micro_expense",
      title: `${microCount} small purchases added up to ${formatINR(microTotal)}`,
      description: `You have logged ${microCount} frequent transactions under ₹100 this cycle. Incidental spending is beginning to eat into your flexible buffer.`,
      impactAmount: microTotal,
      impactDescription: `Equivalent to ${Math.max(1, Math.round(microTotal / Math.max(1, metrics.safeDailySpend)))} full days of safe spending`,
      severity: "medium",
      recommendation: "Group snack and tea orders or set a dedicated weekly UPI wallet balance.",
    });
  }

  // --- RULE 2: Recurring Subscription Audit ---
  const subTransactions = debitTransactions.filter((t) => t.category === "Subscriptions");
  const subTotal = subTransactions.reduce((acc, t) => acc + t.amount, 0);

  if (subTotal > 1500) {
    const subImpactPercent =
      metrics.flexibleMoney > 0
        ? Math.round((subTotal / (metrics.flexibleMoney + subTotal)) * 100)
        : 35;

    leaks.push({
      id: "leak-subscriptions",
      type: "subscription",
      title: `You spent ${formatINR(subTotal)} on digital subscriptions`,
      description: `Total subscription spend (${subTransactions.length} services) exceeded the ₹1,500 recommended monthly benchmark.`,
      impactAmount: subTotal,
      impactDescription: `Consumes ${subImpactPercent}% of your discretionary budget`,
      severity: subTotal >= 2500 ? "high" : "medium",
      recommendation: "Audit redundant streaming or gym memberships and switch to annual discounted tiers where possible.",
    });
  }

  // --- RULE 3: Category Spending Spike Audit ---
  const categoryTotals: Record<string, number> = {};
  for (const t of debitTransactions) {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  }

  const foodSpend = categoryTotals["Food"] || 0;
  const totalSpent = metrics.totalSpentThisCycle;

  if (totalSpent > 0 && foodSpend / totalSpent > 0.28) {
    const foodPercent = Math.round((foodSpend / totalSpent) * 100);
    leaks.push({
      id: "leak-food-spike",
      type: "category_spike",
      title: `Food spending is ${foodPercent}% of your total expenditure`,
      description: `You spent ${formatINR(foodSpend)} on food delivery, dining, and cafes this cycle. This is 38% higher than a typical balanced white-collar budget.`,
      impactAmount: foodSpend,
      impactDescription: `Diverts ~${formatINR(Math.round(foodSpend * 0.3))} from your flexible money`,
      severity: "high",
      recommendation: "Limit Swiggy and Zomato orders to once or twice a week; prepare quick home meals for weeknights.",
    });
  }

  // --- RULE 4: Runaway Burn Rate Audit ---
  if (
    metrics.burnRatePerDay > metrics.safeDailySpend * 1.25 &&
    metrics.flexibleMoney > 0 &&
    cycle.daysElapsed >= 5
  ) {
    const projectedExhaustionDay = Math.max(
      1,
      Math.floor(metrics.flexibleMoney / Math.max(1, metrics.burnRatePerDay))
    );

    leaks.push({
      id: "leak-high-burn",
      type: "high_burn_rate",
      title: "Current daily burn rate is outpacing your safe allowance",
      description: `You are burning ${formatINR(metrics.burnRatePerDay)}/day against a safe pace of ${formatINR(metrics.safeDailySpend)}/day. At this pace, your flexible money will be exhausted in ~${projectedExhaustionDay} days.`,
      impactAmount: metrics.burnRatePerDay - metrics.safeDailySpend,
      impactDescription: `Overspending by ${formatINR(metrics.burnRatePerDay - metrics.safeDailySpend)} each day`,
      severity: "high",
      recommendation: "Reduce discretionary purchases for the next 3 days to bring your burn rate back in line.",
    });
  }

  return leaks;
}
