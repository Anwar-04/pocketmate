"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/utils";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [monthlySalary, setMonthlySalary] = useState<number>(75000);
  const [salaryDate, setSalaryDate] = useState<number>(1);
  const [currentBalance, setCurrentBalance] = useState<number>(21500);
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState<number>(15000);
  const [upcomingEssentials, setUpcomingEssentials] = useState<number>(13000);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserName() {
      try {
        const res = await fetch("/api/auth/profile");
        const json = await res.json();
        if (json.success && json.user?.name) {
          setName(json.user.name);
        }
      } catch {}
    }
    loadUserName();
  }, []);

  // Compute live budget preview
  const liveBudget = useMemo(() => {
    const salary = Number(monthlySalary) || 0;
    const essentials = Number(upcomingEssentials) || 0;
    const savings = Number(monthlySavingsGoal) || 0;

    const flexibleMoney = salary - essentials - savings;
    const simulatedDaysRemaining = 12;
    const safeDailySpend =
      flexibleMoney > 0 ? Math.floor(flexibleMoney / simulatedDaysRemaining) : 0;

    return {
      flexibleMoney,
      safeDailySpend,
      isValid: flexibleMoney >= 0,
      daysRemaining: simulatedDaysRemaining,
    };
  }, [monthlySalary, upcomingEssentials, monthlySavingsGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          monthlySalary: Number(monthlySalary),
          salaryDate: Number(salaryDate),
          currentBalance: Number(currentBalance),
          monthlySavingsGoal: Number(monthlySavingsGoal),
          upcomingEssentials: Number(upcomingEssentials),
        }),
      });

      if (res.status === 401) {
        window.location.href = "/login?redirect=/onboarding";
        return;
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save profile");
      }

      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] py-12 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-bold mb-3 shadow-[0_0_12px_rgba(13,148,136,0.2)]">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span>Configure Your Salary Cycle Baseline</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Let’s set up your personal budget baseline
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
            SpendWise uses your payday cadence, committed essentials, and savings target to
            calculate your real-time safe daily spending.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Configuration Form */}
          <div className="lg:col-span-7 bg-[#131922] backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-[#243041] shadow-2xl">
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#243041] bg-[#0B0F14] text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Monthly Net Salary (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={500}
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(Number(e.target.value))}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#243041] bg-[#0B0F14] text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Salary Credit Day
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <select
                      value={salaryDate}
                      onChange={(e) => setSalaryDate(Number(e.target.value))}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#243041] bg-[#0B0F14] text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          {day}
                          {day === 1
                            ? "st"
                            : day === 2
                            ? "nd"
                            : day === 3
                            ? "rd"
                            : "th"}{" "}
                          of month
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Current Liquid Cash Balance (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#243041] bg-[#0B0F14] text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Total liquid funds across salary bank account and UPI apps.
                </p>
              </div>

              <div className="border-t border-[#243041] pt-5 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Monthly Savings Goal (₹)
                    </label>
                    <span className="text-[11px] text-emerald-400 font-bold">
                      Protected Upfront
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={monthlySavingsGoal}
                      onChange={(e) => setMonthlySavingsGoal(Number(e.target.value))}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#243041] bg-[#0B0F14] text-sm text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Ringfenced on Day 1 so discretionary spending cannot erode it.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Committed Monthly Bills & Rent (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={upcomingEssentials}
                      onChange={(e) => setUpcomingEssentials(Number(e.target.value))}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#243041] bg-[#0B0F14] text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    House rent, loan EMIs, electricity, and broadband bills.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !liveBudget.isValid}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 transition-all shadow-[0_0_20px_rgba(13,148,136,0.25)] disabled:opacity-50 mt-6 border border-teal-500/30"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Launch Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Real-time Live Calculation Preview */}
          <div className="lg:col-span-5 bg-[#131922] text-white p-6 sm:p-7 rounded-3xl border border-[#243041] shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Live Budget Preview</span>
              </div>
              <h3 className="text-xl font-black text-white mb-6">
                Your Initial Salary-Cycle Pace
              </h3>

              {/* The Hero Preview */}
              <div className="bg-[#0B0F14] rounded-2xl p-5 border border-[#243041] mb-6 shadow-inner">
                <span className="text-xs text-slate-400 font-medium">
                  Initial Safe Daily Spend
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black text-emerald-400 tabular-nums">
                    {formatINR(liveBudget.safeDailySpend)}
                  </span>
                  <span className="text-xs text-slate-400">/ day</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Estimated based on {liveBudget.daysRemaining} days remaining until your payday.
                </p>
              </div>

              {/* Mathematical Breakdown */}
              <div className="space-y-2.5 text-xs font-mono border-t border-[#243041] pt-4">
                <div className="flex justify-between text-slate-400">
                  <span>Monthly Salary:</span>
                  <span className="text-white font-bold">{formatINR(monthlySalary)}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>− Committed Essentials:</span>
                  <span>− {formatINR(upcomingEssentials)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>− Savings Goal (Protected):</span>
                  <span>− {formatINR(monthlySavingsGoal)}</span>
                </div>
                <div className="border-t border-dashed border-[#243041] pt-2 flex justify-between text-sm font-bold text-white">
                  <span>= Flexible Buffer:</span>
                  <span className={liveBudget.flexibleMoney >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {formatINR(liveBudget.flexibleMoney)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#243041] text-[11px] text-slate-400 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                100% deterministic arithmetic. Your monthly savings goal is ringfenced on Day 1.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
