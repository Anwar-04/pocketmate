import { formatINR } from "@/lib/utils";
import { BudgetMetrics } from "@/types/financial";
import {
  Wallet,
  Receipt,
  CalendarCheck,
  PiggyBank,
  Sparkles,
  Flame,
} from "lucide-react";

interface StatCardsProps {
  metrics: BudgetMetrics;
}

export function StatCards({ metrics }: StatCardsProps) {
  const cards = [
    {
      title: "Monthly Salary",
      amount: formatINR(metrics.monthlySalary),
      subtext: "Net Take-Home Pay",
      icon: Wallet,
      color: "text-teal-400",
      bg: "bg-teal-950/60 border-teal-800/40",
      borderGlow: "group-hover:border-teal-500/50",
    },
    {
      title: "Spent This Cycle",
      amount: formatINR(metrics.totalSpentThisCycle),
      subtext: `${metrics.spentPercent}% of salary utilized`,
      icon: Receipt,
      color: "text-rose-400",
      bg: "bg-rose-950/60 border-rose-800/40",
      borderGlow: "group-hover:border-rose-500/50",
    },
    {
      title: "Upcoming Essentials",
      amount: formatINR(metrics.upcomingEssentials),
      subtext: "Rent, EMIs, Bills",
      icon: CalendarCheck,
      color: "text-amber-400",
      bg: "bg-amber-950/60 border-amber-800/40",
      borderGlow: "group-hover:border-amber-500/50",
    },
    {
      title: "Savings Goal",
      amount: formatINR(metrics.savingsGoal),
      subtext: "Protected on Day 1",
      icon: PiggyBank,
      color: "text-emerald-400",
      bg: "bg-emerald-950/60 border-emerald-800/40",
      borderGlow: "group-hover:border-emerald-500/50",
    },
    {
      title: "Flexible Buffer",
      amount: formatINR(metrics.flexibleMoney),
      subtext: "Remaining Discretionary",
      icon: Sparkles,
      color: metrics.flexibleMoney >= 0 ? "text-teal-400" : "text-rose-400",
      bg: metrics.flexibleMoney >= 0 ? "bg-teal-950/60 border-teal-800/40" : "bg-rose-950/60 border-rose-800/40",
      borderGlow: "group-hover:border-teal-500/50",
    },
    {
      title: "Daily Burn Rate",
      amount: `${formatINR(metrics.burnRatePerDay)}/d`,
      subtext: "Current daily average",
      icon: Flame,
      color: "text-orange-400",
      bg: "bg-orange-950/60 border-orange-800/40",
      borderGlow: "group-hover:border-orange-500/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`group bg-[#131922] backdrop-blur-xl p-4 sm:p-4.5 rounded-2xl border border-[#243041] shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${c.borderGlow}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {c.title}
              </span>
              <div className={`p-1.5 rounded-xl border ${c.bg} ${c.color} shadow-sm group-hover:scale-110 transition-transform`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>

            <div>
              <span className="text-base sm:text-lg font-black text-white tracking-tight block tabular-nums">
                {c.amount}
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate block mt-0.5">
                {c.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
