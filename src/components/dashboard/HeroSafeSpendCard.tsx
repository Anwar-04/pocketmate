"use client";

import { useState } from "react";
import { formatINR } from "@/lib/utils";
import { BudgetMetrics, SalaryCycleDates } from "@/types/financial";
import {
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Sparkles,
  Sliders,
  RotateCcw,
  TrendingDown
} from "lucide-react";
import Link from "next/link";

interface HeroSafeSpendCardProps {
  metrics: BudgetMetrics;
  cycle: SalaryCycleDates;
}

export function HeroSafeSpendCard({ metrics, cycle }: HeroSafeSpendCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatedPurchase, setSimulatedPurchase] = useState<number>(0);

  const days = Math.max(1, cycle.daysUntilPayday);
  const baseSafeSpend = metrics.safeDailySpend;

  // What-if calculation
  const simulatedRemaining = metrics.flexibleMoney - simulatedPurchase;
  const simulatedSafeDaily = simulatedRemaining > 0 ? Math.floor(simulatedRemaining / days) : 0;
  const isSimulatedDeficit = simulatedRemaining <= 0;
  const simulatedPercentOfFlexible = metrics.flexibleMoney > 0 ? Math.round((simulatedPurchase / metrics.flexibleMoney) * 100) : 100;

  const isOverBudget = metrics.flexibleMoney <= 0;
  const isHealthy = metrics.budgetStatus === "healthy";
  const isWatch = metrics.budgetStatus === "watch";

  const statusBadge = isOverBudget ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
      <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
      Budget Deficit
    </span>
  ) : isWatch ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
      <Flame className="h-3.5 w-3.5 text-amber-400" />
      High Burn Pace
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
      Healthy Spending Pace
    </span>
  );

  return (
    <div className="relative overflow-hidden bg-[#131922] backdrop-blur-xl rounded-3xl border border-[#243041] shadow-[0_4px_30px_rgba(0,0,0,0.5)] p-6 sm:p-8 transition-all hover:border-slate-600">
      {/* Top Cyber Accent Strip */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isOverBudget
            ? "bg-rose-500 shadow-[0_0_12px_#f43f5e]"
            : isWatch
            ? "bg-amber-500 shadow-[0_0_12px_#f59e0b]"
            : "bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 shadow-[0_0_15px_rgba(13,148,136,0.3)]"
        }`}
      />

      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#243041] pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-950/60 px-2.5 py-0.5 rounded-md border border-teal-800/50">
              Active Cycle
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">
              Daily Safe Pace
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5">
            Safe to spend today
          </h2>
        </div>
        <div>{statusBadge}</div>
      </div>

      {/* Main Metric Hero Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
        <div>
          <div className="flex items-baseline gap-3">
            <span
              className={`text-5xl sm:text-6xl font-black tracking-tight tabular-nums ${
                isOverBudget
                  ? "text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.3)]"
                  : isWatch
                  ? "text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)]"
                  : "text-white"
              }`}
            >
              {formatINR(simulatedPurchase > 0 ? simulatedSafeDaily : baseSafeSpend)}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-400">
              / day
            </span>
            {simulatedPurchase > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Simulated: -{formatINR(baseSafeSpend - simulatedSafeDaily)}/d
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">
            Calculated over the next <strong className="text-slate-200">{cycle.daysUntilPayday} days</strong> until payday on {cycle.nextPaydayFormatted}.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all border ${
              showSimulator
                ? "bg-teal-600 text-white border-teal-500 shadow-[0_0_15px_rgba(13,148,136,0.3)]"
                : "bg-[#1B2330] hover:bg-slate-700 text-slate-300 border-[#243041]"
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-teal-400" />
            <span>{showSimulator ? "Close Simulator" : "What-If Simulator"}</span>
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-[#1B2330] hover:bg-slate-700 px-3.5 py-2 rounded-xl transition-colors border border-[#243041]"
          >
            <Info className="h-3.5 w-3.5 text-slate-400" />
            <span>{expanded ? "Hide Formula" : "View Formula"}</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <Link
            href="/coach?q=Can%20I%20afford%20a%20%E2%82%B92,000%20purchase?"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 px-3.5 py-2 rounded-xl transition-all shadow-[0_0_20px_rgba(13,148,136,0.25)] border border-teal-500/30"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ask Financial Coach</span>
          </Link>
        </div>
      </div>

      {/* Interactive What-If Simulator Panel */}
      {showSimulator && (
        <div className="mb-6 p-5 rounded-2xl bg-[#1B2330] border border-[#243041] space-y-4 animate-in fade-in-50 duration-200 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-bold text-teal-200">
                Interactive Purchase Impact Simulator
              </span>
            </div>
            {simulatedPurchase > 0 && (
              <button
                onClick={() => setSimulatedPurchase(0)}
                className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-300">Test a purchase amount:</span>
              <span className="text-lg font-black text-white font-mono">{formatINR(simulatedPurchase)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(5000, metrics.flexibleMoney * 1.2)}
              step={100}
              value={simulatedPurchase}
              onChange={(e) => setSimulatedPurchase(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>₹0</span>
              <span>₹2,500</span>
              <span>₹5,000+</span>
            </div>
          </div>

          {simulatedPurchase > 0 && (
            <div className="pt-2 border-t border-[#243041] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-300">Remaining Flexible: </span>
                <span className={`font-bold font-mono ${isSimulatedDeficit ? "text-rose-400" : "text-white"}`}>
                  {formatINR(simulatedRemaining)}
                </span>
                <span className="text-slate-400 ml-2">({simulatedPercentOfFlexible}% of buffer consumed)</span>
              </div>

              <div>
                {isSimulatedDeficit ? (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 font-bold border border-rose-800 text-[11px]">
                    Deficit: Will cut into savings!
                  </span>
                ) : simulatedPercentOfFlexible > 20 ? (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 font-bold border border-amber-800 text-[11px]">
                    Caution: Daily spend drops to {formatINR(simulatedSafeDaily)}/d
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 text-[11px]">
                    Comfortably Affordable ({formatINR(simulatedSafeDaily)}/d remains)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-[#243041] text-xs">
        <div className="bg-[#1B2330] p-3.5 rounded-2xl border border-[#243041]">
          <span className="text-slate-400 font-medium block text-[11px]">Flexible Pool</span>
          <span className="text-white font-black text-sm tabular-nums mt-0.5 block">{formatINR(metrics.flexibleMoney)}</span>
        </div>
        <div className="bg-[#1B2330] p-3.5 rounded-2xl border border-[#243041]">
          <span className="text-slate-400 font-medium block text-[11px]">Daily Burn Pace</span>
          <span className="text-amber-400 font-black text-sm tabular-nums mt-0.5 block">{formatINR(metrics.burnRatePerDay)}/d</span>
        </div>
        <div className="bg-[#1B2330] p-3.5 rounded-2xl border border-[#243041]">
          <span className="text-slate-400 font-medium block text-[11px]">Upcoming Bills</span>
          <span className="text-slate-300 font-black text-sm tabular-nums mt-0.5 block">{formatINR(metrics.upcomingEssentials)}</span>
        </div>
        <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-900/50">
          <span className="text-emerald-400 font-semibold block text-[11px]">Protected Savings</span>
          <span className="text-emerald-300 font-black text-sm tabular-nums mt-0.5 block">{formatINR(metrics.savingsGoal)}</span>
        </div>
      </div>

      {/* Expandable Transparent Calculation Drawer */}
      {expanded && (
        <div className="mt-6 bg-[#0B0F14] rounded-2xl p-5 border border-[#243041] space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="uppercase tracking-wider text-[11px] text-slate-400">
              Deterministic Mathematical Equation
            </span>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              100% Deterministic (Zero Hallucinated Math)
            </span>
          </div>

          <div className="bg-[#131922] rounded-xl p-4 border border-[#243041] space-y-2.5 text-xs font-mono text-slate-300">
            <div className="flex justify-between py-0.5">
              <span>1. Monthly Net Salary:</span>
              <span className="font-bold text-white">{formatINR(metrics.monthlySalary)}</span>
            </div>
            <div className="flex justify-between py-0.5 text-rose-400">
              <span>2. Deduct Spent So Far:</span>
              <span className="font-bold">− {formatINR(metrics.totalSpentThisCycle)}</span>
            </div>
            <div className="flex justify-between py-0.5 text-amber-400">
              <span>3. Deduct Committed Essentials:</span>
              <span className="font-bold">− {formatINR(metrics.upcomingEssentials)}</span>
            </div>
            <div className="flex justify-between py-0.5 text-emerald-400">
              <span>4. Deduct Monthly Savings Goal:</span>
              <span className="font-bold">− {formatINR(metrics.savingsGoal)}</span>
            </div>
            <div className="pt-2 border-t border-dashed border-[#243041] flex justify-between font-bold text-white">
              <span>= Remaining Flexible Money:</span>
              <span className="text-teal-400">{formatINR(metrics.flexibleMoney)}</span>
            </div>
            <div className="pt-1 flex justify-between font-bold text-white text-sm">
              <span>÷ Days Until Payday ({cycle.daysUntilPayday} days):</span>
              <span className="text-emerald-400">{formatINR(metrics.safeDailySpend)} / day</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Ringfencing committed rent, bills, and your monthly savings upfront protects you from month-end cash squeezes.
          </p>
        </div>
      )}
    </div>
  );
}
