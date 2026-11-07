import { calculateBudgetMetrics } from "./budget";
import { calculateSalaryCycleDates } from "./salaryCycle";

function assertEqual<T>(actual: T, expected: T, testName: string) {
  if (actual !== expected) {
    console.error(`❌ FAIL: ${testName} -> Expected: ${expected}, Got: ${actual}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${testName}`);
  }
}

console.log("--- RUNNING FINANCIAL ENGINE TESTS ---\n");

// TEST 1: Rahul Benchmark Scenario (From Product Concept)
// Salary = ₹60,000, Spent = ₹38,500, Essentials = ₹8,000, Savings = ₹5,000, Days Left = 12
const rahulMetrics = calculateBudgetMetrics({
  monthlySalary: 60000,
  totalSpentThisCycle: 38500,
  upcomingEssentials: 8000,
  savingsGoal: 5000,
  daysUntilPayday: 12,
  daysElapsed: 18,
  totalDaysInCycle: 30,
});

assertEqual(rahulMetrics.flexibleMoney, 8500, "Rahul Flexible Money is ₹8,500");
assertEqual(rahulMetrics.safeDailySpend, 708, "Rahul Safe Daily Spend is ₹708");
assertEqual(rahulMetrics.spentPercent, 64, "Rahul Spent Percent is 64%");

// TEST 2: Deficit / Over-Budget Guardrail (Safe Daily Spend clamped to 0)
// Spent = ₹50,000 with ₹8k essentials and ₹5k savings -> Flexible Money = -₹3,000
const overBudgetMetrics = calculateBudgetMetrics({
  monthlySalary: 60000,
  totalSpentThisCycle: 50000,
  upcomingEssentials: 8000,
  savingsGoal: 5000,
  daysUntilPayday: 10,
  daysElapsed: 20,
  totalDaysInCycle: 30,
});

assertEqual(overBudgetMetrics.flexibleMoney, -3000, "Deficit Flexible Money is -₹3,000");
assertEqual(overBudgetMetrics.safeDailySpend, 0, "Safe Daily Spend clamped to ₹0 on deficit");
assertEqual(overBudgetMetrics.budgetStatus, "risk", "Deficit status is 'risk'");

// TEST 3: Zero or Low Discretionary Spend (Beginning of Cycle)
const freshCycleMetrics = calculateBudgetMetrics({
  monthlySalary: 60000,
  totalSpentThisCycle: 0,
  upcomingEssentials: 15000,
  savingsGoal: 10000,
  daysUntilPayday: 30,
  daysElapsed: 1,
  totalDaysInCycle: 30,
});

// Flexible = 60,000 - 15,000 - 10,000 = 35,000 -> 35,000 / 30 = 1,166
assertEqual(freshCycleMetrics.flexibleMoney, 35000, "Fresh Cycle Flexible Money is ₹35,000");
assertEqual(freshCycleMetrics.safeDailySpend, 1166, "Fresh Cycle Safe Daily Spend is ₹1,166");
assertEqual(freshCycleMetrics.budgetStatus, "healthy", "Fresh Cycle Status is 'healthy'");

// TEST 4: Salary Cycle Dates Snapping (31st in a 30-day month)
// Test date: April 15, 2026. Target salary day: 31st.
// April has only 30 days, so cycle boundary must snap to April 30.
const aprilCycle = calculateSalaryCycleDates(31, new Date("2026-04-15T12:00:00Z"));
assertEqual(aprilCycle.nextPayday.getDate(), 30, "Snaps 31st salary date to 30th in April");

// Test date: February 10, 2026 (non-leap year). Target salary day: 31st.
const febCycle = calculateSalaryCycleDates(31, new Date("2026-02-10T12:00:00Z"));
assertEqual(febCycle.nextPayday.getDate(), 28, "Snaps 31st salary date to 28th in February 2026");

console.log("\n--- ALL FINANCIAL ENGINE TESTS PASSED SUCCESSFULLY! ---");
