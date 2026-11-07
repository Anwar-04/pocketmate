import { BudgetMetrics, BudgetStatus } from "@/types/financial";

export interface BudgetCalculationParams {
  monthlySalary: number;
  totalSpentThisCycle: number;
  upcomingEssentials: number;
  savingsGoal: number;
  daysUntilPayday: number;
  daysElapsed: number;
  totalDaysInCycle: number;
}

/**
 * Pure, deterministic calculation of budget metrics for the salary cycle.
 *
 * Rules:
 * - Flexible Money = Monthly Salary - Spent - Upcoming Essentials - Savings Goal
 * - Safe Daily Spend = max(0, floor(Flexible Money / Days Until Payday))
 * - Never returns negative safe daily spend (clamps to 0 with 'risk' status)
 * - Burn rate = floor(Spent / Days Elapsed)
 * - Pace ratio = (Spend pace) / (Calendar time progression)
 */
export function calculateBudgetMetrics(params: BudgetCalculationParams): BudgetMetrics {
  const {
    monthlySalary,
    totalSpentThisCycle,
    upcomingEssentials,
    savingsGoal,
    daysUntilPayday,
    daysElapsed,
    totalDaysInCycle,
  } = params;

  // 1. Calculate Flexible Money pool
  // Total pool available at beginning of cycle for discretionary spending:
  const flexibleBudgetPool = Math.max(0, monthlySalary - upcomingEssentials - savingsGoal);

  // Remaining flexible money for the rest of this cycle:
  const flexibleMoney = monthlySalary - totalSpentThisCycle - upcomingEssentials - savingsGoal;

  // 2. Calculate Safe Daily Spend (Floored to integer INR)
  const safeDays = Math.max(1, daysUntilPayday);
  const safeDailySpend = flexibleMoney > 0 ? Math.floor(flexibleMoney / safeDays) : 0;

  // 3. Burn Rate Per Day
  const safeDaysElapsed = Math.max(1, daysElapsed);
  const burnRatePerDay = Math.round(totalSpentThisCycle / safeDaysElapsed);

  // 4. Projected End of Cycle Spend
  const projectedEndSpend = totalSpentThisCycle + burnRatePerDay * safeDays;

  // 5. Percentages
  const spentPercent = monthlySalary > 0 ? Math.round((totalSpentThisCycle / monthlySalary) * 100) : 0;

  const flexiblePercentRemaining =
    flexibleBudgetPool > 0
      ? Math.max(0, Math.round((flexibleMoney / flexibleBudgetPool) * 100))
      : 0;

  // 6. Pace Ratio (Spending speed compared to calendar time speed)
  // E.g. If you used 60% of flexible budget in 40% of the cycle, paceRatio = 1.5 (High burn)
  const safeTotalDays = Math.max(1, totalDaysInCycle);
  const cycleTimeFraction = safeDaysElapsed / safeTotalDays;
  const budgetUsedFraction =
    flexibleBudgetPool > 0
      ? (flexibleBudgetPool - Math.max(0, flexibleMoney)) / flexibleBudgetPool
      : 1;

  const paceRatio = Number(
    (budgetUsedFraction / Math.max(0.01, cycleTimeFraction)).toFixed(2)
  );

  // 7. Determine Budget Status
  let budgetStatus: BudgetStatus = "healthy";

  if (flexibleMoney <= 0) {
    budgetStatus = "risk"; // Over budget or deficit
  } else if (burnRatePerDay > safeDailySpend * 1.35 || paceRatio > 1.25) {
    budgetStatus = "risk"; // Significantly outpacing daily allowance
  } else if (burnRatePerDay > safeDailySpend * 1.1 || paceRatio > 1.05) {
    budgetStatus = "watch"; // Moderately higher than sustainable pace
  }

  return {
    monthlySalary,
    totalSpentThisCycle,
    upcomingEssentials,
    savingsGoal,
    flexibleMoney,
    safeDailySpend,
    burnRatePerDay,
    projectedEndSpend,
    spentPercent,
    flexiblePercentRemaining,
    paceRatio,
    budgetStatus,
  };
}
