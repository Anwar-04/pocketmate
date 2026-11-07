import { BudgetMetrics, SalaryCycleDates } from "@/types/financial";
import { Clock, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface PaceVisualizerProps {
  metrics: BudgetMetrics;
  cycle: SalaryCycleDates;
}

export function PaceVisualizer({ metrics, cycle }: PaceVisualizerProps) {
  const timeProgress = Math.min(
    100,
    Math.round((cycle.daysElapsed / cycle.totalDaysInCycle) * 100)
  );

  const isOverBudget = metrics.flexibleMoney <= 0;
  const isPaceHigh = metrics.paceRatio > 1.15;
  const budgetConsumedPercent = Math.min(100, Math.max(0, 100 - metrics.flexiblePercentRemaining));

  return (
    <div className="bg-[#131922] backdrop-blur-xl p-6 rounded-3xl border border-[#243041] shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-950/60 text-teal-400 border border-teal-800/40">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Cycle Progression vs Spending Pace
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Calendar time vs flexible money burn
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-300 bg-[#1B2330] border border-[#243041] px-2.5 py-1 rounded-lg font-mono">
            Day {cycle.daysElapsed} / {cycle.totalDaysInCycle}
          </span>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
              <span>Calendar Days Elapsed</span>
              <span className="font-mono text-slate-200">{cycle.daysElapsed} days ({timeProgress}%)</span>
            </div>
            <div className="w-full h-3 bg-[#0B0F14] rounded-full overflow-hidden p-0.5 border border-[#243041]">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(13,148,136,0.4)]"
                style={{ width: `${timeProgress}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
              <span>Flexible Budget Consumed</span>
              <span className={`font-mono font-bold ${isOverBudget ? "text-rose-400" : isPaceHigh ? "text-amber-400" : "text-emerald-400"}`}>
                {budgetConsumedPercent}%
              </span>
            </div>
            <div className="w-full h-3 bg-[#0B0F14] rounded-full overflow-hidden p-0.5 border border-[#243041]">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isOverBudget
                    ? "bg-rose-500 shadow-[0_0_10px_#f43f5e]"
                    : isPaceHigh
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_10px_#f59e0b]"
                    : "bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_10px_#10b981]"
                }`}
                style={{ width: `${budgetConsumedPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Alert */}
      <div className="mt-5 pt-4 border-t border-[#243041] flex items-start gap-2.5 text-xs">
        {isOverBudget ? (
          <>
            <div className="p-1 rounded-md bg-rose-950 text-rose-400 flex-shrink-0 mt-0.5 border border-rose-800">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
            <p className="text-rose-300 font-medium leading-relaxed">
              Flexible pool exhausted. Daily spend is locked to ₹0 to protect your committed bills and ₹{metrics.savingsGoal.toLocaleString("en-IN")} savings goal.
            </p>
          </>
        ) : isPaceHigh ? (
          <>
            <div className="p-1 rounded-md bg-amber-950 text-amber-400 flex-shrink-0 mt-0.5 border border-amber-800">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <p className="text-slate-300 leading-relaxed">
              Burn pace is{" "}
              <strong className="text-amber-400">
                {Math.round((metrics.paceRatio - 1) * 100)}% faster
              </strong>{" "}
              than calendar days. Adhere to your ₹{metrics.safeDailySpend}/day target to prevent an end-of-cycle squeeze.
            </p>
          </>
        ) : (
          <>
            <div className="p-1 rounded-md bg-emerald-950 text-emerald-400 flex-shrink-0 mt-0.5 border border-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <p className="text-slate-300 leading-relaxed">
              Spending velocity is aligned with your salary timeline. You have{" "}
              <strong className="text-emerald-400">
                {cycle.daysUntilPayday} days
              </strong>{" "}
              remaining with a healthy ₹{metrics.safeDailySpend}/day allowance.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
