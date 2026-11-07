import { SalaryCycleDates } from "@/types/financial";

/**
 * Calculates the salary cycle boundary dates and days remaining until next payday.
 * 
 * Rules:
 * - If salaryDate is 31 and the month has only 30 days (or 28/29 in Feb), snaps to last day of month.
 * - Current cycle runs from the latest payday (on or before referenceDate) to the next payday.
 * - Days remaining is inclusive of the current day (minimum 1 to prevent division by zero).
 * 
 * @param salaryDay Day of month (1 - 31) when salary is credited. Default: 1
 * @param referenceDate The current date to calculate against. Defaults to current system time.
 */
export function calculateSalaryCycleDates(
  salaryDay: number = 1,
  referenceDate: Date = new Date()
): SalaryCycleDates {
  const now = new Date(referenceDate);
  const clampedSalaryDay = Math.min(Math.max(1, salaryDay), 31);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  const currentDate = now.getDate();

  // Helper to get safe day for a specific year and month
  const getSafeDateInMonth = (year: number, month: number, targetDay: number): Date => {
    // Setting day 0 of next month returns the last day of target month
    const daysInTargetMonth = new Date(year, month + 1, 0).getDate();
    const effectiveDay = Math.min(targetDay, daysInTargetMonth);
    return new Date(year, month, effectiveDay, 0, 0, 0, 0);
  };

  let cycleStartDate: Date;
  let nextPaydayDate: Date;

  // Determine if today is on or after the salary date in the current month
  const effectiveDayThisMonth = Math.min(
    clampedSalaryDay,
    new Date(currentYear, currentMonth + 1, 0).getDate()
  );

  if (currentDate >= effectiveDayThisMonth) {
    // Current cycle started this month
    cycleStartDate = getSafeDateInMonth(currentYear, currentMonth, clampedSalaryDay);
    // Next payday is in the next month
    nextPaydayDate = getSafeDateInMonth(currentYear, currentMonth + 1, clampedSalaryDay);
  } else {
    // Current cycle started in the previous month
    cycleStartDate = getSafeDateInMonth(currentYear, currentMonth - 1, clampedSalaryDay);
    // Next payday is in the current month
    nextPaydayDate = getSafeDateInMonth(currentYear, currentMonth, clampedSalaryDay);
  }

  // Calculate day differences using UTC timestamps to avoid daylight savings/DST drift
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const totalDaysInCycle = Math.max(
    1,
    Math.round((nextPaydayDate.getTime() - cycleStartDate.getTime()) / MS_PER_DAY)
  );

  // Normalize current date to midnight for day comparison
  const todayMidnight = new Date(currentYear, currentMonth, currentDate, 0, 0, 0, 0);

  const daysElapsed = Math.max(
    1,
    Math.round((todayMidnight.getTime() - cycleStartDate.getTime()) / MS_PER_DAY)
  );

  // Days remaining includes today (e.g. if today is 19th and next payday is 1st of next 30-day month -> 12 days)
  const diffDays = Math.round((nextPaydayDate.getTime() - todayMidnight.getTime()) / MS_PER_DAY);
  const daysUntilPayday = Math.max(1, diffDays);

  const dateFormatter = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  });

  const yearDateFormatter = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    cycleStart: cycleStartDate,
    nextPayday: nextPaydayDate,
    totalDaysInCycle,
    daysElapsed,
    daysUntilPayday,
    cycleStartFormatted: dateFormatter.format(cycleStartDate),
    nextPaydayFormatted: yearDateFormatter.format(nextPaydayDate),
  };
}
