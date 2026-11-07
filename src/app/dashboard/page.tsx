"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSafeSpendCard } from "@/components/dashboard/HeroSafeSpendCard";
import { StatCards } from "@/components/dashboard/StatCards";
import { PaceVisualizer } from "@/components/dashboard/PaceVisualizer";
import { CategoryDonutChart } from "@/components/dashboard/CategoryDonutChart";
import { ActiveLeaksStrip } from "@/components/dashboard/ActiveLeaksStrip";
import { QuickCoachWidget } from "@/components/dashboard/QuickCoachWidget";
import { SmsImportModal } from "@/components/transactions/SmsImportModal";
import { CycleReportModal } from "@/components/reports/CycleReportModal";
import { DashboardData } from "@/types/financial";
import { Calendar, Clock, Loader2, AlertCircle, RefreshCw, Zap, FileText, LogIn } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      if (res.status === 401) {
        setError("Your session has expired. Please sign in again.");
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to load dashboard metrics");
      }
      if (json.needsOnboarding) {
        window.location.href = "/onboarding";
        return;
      }
      setData(json.data);
      try {
        sessionStorage.setItem("spendwise_dashboard_cache", JSON.stringify(json.data));
      } catch {
        // session storage quota safety
      }
    } catch (err: unknown) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Network error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("spendwise_dashboard_cache");
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
        fetchDashboardData(true); // background revalidate
        return;
      }
    } catch {
      // ignore parse errors
    }
    fetchDashboardData(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col text-slate-100">
      <Navbar userName={data?.profile.name} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6 pb-24 md:pb-12">
        {/* Loading State */}
        {loading && (
          <div className="h-96 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            <p className="text-sm font-medium text-slate-400">
              Computing deterministic salary-cycle metrics...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-8 bg-rose-950/40 border border-rose-900/80 rounded-3xl text-center space-y-4 max-w-md mx-auto my-12">
            <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-rose-200">
              {error.includes("session") ? "Session Expired" : "Unable to load dashboard"}
            </h3>
            <p className="text-xs text-rose-400 max-w-sm mx-auto leading-relaxed">{error}</p>
            {error.includes("session") ? (
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(13,148,136,0.3)]"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In to SpendWise</span>
              </a>
            ) : (
              <button
                onClick={() => fetchDashboardData(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* Main Content */}
        {data && !loading && (
          <>
            {/* Top Cycle Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#243041]">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Hello, {data.profile.name.split(" ")[0]} 👋
                </h1>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-teal-400" />
                    Cycle: {data.cycle.cycleStartFormatted} – {data.cycle.nextPaydayFormatted}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span>Payday: {data.cycle.nextPaydayFormatted}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
                <button
                  onClick={() => setIsReportOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#131922] hover:bg-[#1B2330] border border-[#243041] text-slate-300 text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-teal-400" />
                  <span>Cycle Statement</span>
                </button>

                <button
                  onClick={() => setIsSmsOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)] transition-all cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>⚡ Quick Log / SMS</span>
                </button>

                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-bold shadow-[0_0_15px_rgba(13,148,136,0.2)]">
                  <Clock className="h-3.5 w-3.5 text-teal-400" />
                  <span>{data.cycle.daysUntilPayday} days remaining</span>
                </div>
              </div>
            </div>

            {/* 1. Hero Card: Safe to Spend Today (With Interactive What-If Simulator) */}
            <HeroSafeSpendCard metrics={data.metrics} cycle={data.cycle} />

            {/* 2. 6 Financial Summary Cards */}
            <StatCards metrics={data.metrics} />

            {/* 3. Pace Visualizer + Category Donut Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaceVisualizer metrics={data.metrics} cycle={data.cycle} />
              <CategoryDonutChart data={data.categoryBreakdown} />
            </div>

            {/* 4. Active Spending Leaks Strip */}
            <ActiveLeaksStrip leaks={data.activeLeaks} />

            {/* 5. AI Coach Quick Widget */}
            <QuickCoachWidget />

            {/* Quick Log / SMS Import Modal */}
            <SmsImportModal
              isOpen={isSmsOpen}
              onClose={() => setIsSmsOpen(false)}
              onSuccess={() => {
                setIsSmsOpen(false);
                fetchDashboardData();
              }}
            />

            {/* End-of-Cycle Audit Report Modal */}
            <CycleReportModal
              isOpen={isReportOpen}
              onClose={() => setIsReportOpen(false)}
              data={data}
            />
          </>
        )}
      </main>
    </div>
  );
}
