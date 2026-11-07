"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardData, SpendingLeak } from "@/types/financial";
import { formatINR } from "@/lib/utils";
import {
  Flame,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Clock,
  Loader2,
  Sparkles,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { CycleReportModal } from "@/components/reports/CycleReportModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "#0d9488", // Glacier Teal
  "#14b8a6", // Crisp Teal
  "#06b6d4", // Bright Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#38bdf8", // Sky Blue
  "#64748b", // Slate
  "#475569", // Steel Slate
  "#334155", // Charcoal Slate
];

interface BarTooltipItem {
  value: number;
  payload: {
    category: string;
    amount: number;
    count: number;
  };
}

interface CustomBarTooltipProps {
  active?: boolean;
  payload?: BarTooltipItem[];
}

function CustomBarTooltip({ active, payload }: CustomBarTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const categoryName = item.payload.category;
    const amount = item.value;
    const count = item.payload.count;

    return (
      <div className="bg-[#0B0F14] border border-[#243041] px-4 py-2.5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <div className="text-xs font-semibold text-slate-300 mb-1">
          {categoryName}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-black text-white font-mono">
            {formatINR(amount)}
          </span>
          <span className="text-xs font-bold text-slate-400 font-mono">
            ({count} txns)
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export default function InsightsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<"all" | "high" | "medium">("all");
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("spendwise_dashboard_cache");
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
      }
    } catch {
      // ignore
    }

    async function loadInsights() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          try {
            sessionStorage.setItem("spendwise_dashboard_cache", JSON.stringify(json.data));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error("Failed to load insights:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A11] flex flex-col text-slate-100">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-xs font-semibold text-slate-400">
            Auditing spending patterns & detecting leaks...
          </p>
        </div>
      </div>
    );
  }

  const leaks: SpendingLeak[] = data?.activeLeaks || [];
  const filteredLeaks =
    severityFilter === "all" ? leaks : leaks.filter((l) => l.severity === severityFilter);

  const barChartData = (data?.categoryBreakdown || []).map((cat) => ({
    category: cat.category,
    amount: cat.amount,
  }));

  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col text-slate-100">
      <Navbar userName={data?.profile.name} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8 pb-24 md:pb-12">
        {/* Page Header */}
        <div className="pb-4 border-b border-[#243041] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-950/80 text-teal-400 shadow-[0_0_12px_rgba(13,148,136,0.2)] border border-teal-800/60">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Spending Insights & Leak Audits
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Automated detection of micro-expenses, recurring drain, and velocity spikes
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(13,148,136,0.3)] border border-teal-500/30 transition-all self-start sm:self-center cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Executive Cycle Report</span>
          </button>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#131922] backdrop-blur-xl p-6 rounded-3xl border border-[#243041] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Active Leak Alerts
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-950 text-rose-300 border border-rose-800 shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                {leaks.length} Detected
              </span>
            </div>
            <div>
              <span className="text-3xl font-black text-white tracking-tight">
                {leaks.filter((l) => l.severity === "high").length} Critical
              </span>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Patterns directly eroding your daily safe spending buffer
              </p>
            </div>
          </div>

          <div className="bg-[#131922] backdrop-blur-xl p-6 rounded-3xl border border-[#243041] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Current Burn Rate
              </span>
              <div className="p-1.5 rounded-xl bg-orange-950 text-orange-400 border border-orange-800/60">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-white tracking-tight tabular-nums">
                {formatINR(data?.metrics.burnRatePerDay || 0)} <span className="text-sm font-semibold text-slate-400">/ day</span>
              </span>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Safe pace allowance:{" "}
                <strong className="text-emerald-400">
                  {formatINR(data?.metrics.safeDailySpend || 0)}/d
                </strong>
              </p>
            </div>
          </div>

          <div className="bg-[#131922] backdrop-blur-xl p-6 rounded-3xl border border-[#243041] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Pace Velocity Ratio
              </span>
              <div className="p-1.5 rounded-xl bg-teal-950 text-teal-400 border border-teal-800/60">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-white tracking-tight tabular-nums">
                {data?.metrics.paceRatio}x
              </span>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {Number(data?.metrics.paceRatio) > 1.1
                  ? "Burning faster than calendar days elapsed"
                  : "Daily spending pace is balanced"}
              </p>
            </div>
          </div>
        </div>

        {/* Category Expenditure Bar Chart */}
        <div className="bg-[#131922] backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-[#243041] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-black text-white tracking-tight">
                Cycle Spending by Category
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Distribution of expenses in current salary period
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dedicated Spending Leaks Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Active Leak Heuristics & Recommendations
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Actionable interventions to reclaim your flexible reserves
              </p>
            </div>

            {/* Severity Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-[#0B0F14] border border-[#243041] p-1 rounded-2xl self-start">
              {(["all", "high", "medium"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl capitalize transition-all ${
                    severityFilter === s
                      ? "bg-teal-600 text-white shadow-[0_0_12px_rgba(13,148,136,0.3)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLeaks.map((leak) => (
              <div
                key={leak.id}
                className="bg-[#131922] backdrop-blur-xl p-6 rounded-3xl border border-[#243041] shadow-sm flex flex-col justify-between hover:border-slate-600 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        leak.severity === "high"
                          ? "bg-rose-950 text-rose-300 border-rose-800 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                          : "bg-amber-950 text-amber-300 border-amber-800 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                      }`}
                    >
                      {leak.severity} severity
                    </span>
                    <span className="text-xs font-black text-white font-mono">
                      {leak.impactDescription}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mb-2 leading-snug">
                    {leak.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {leak.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#243041] bg-[#0B0F14]/60 -mx-6 -mb-6 p-5 rounded-b-3xl space-y-2">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>Recommended Action</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {leak.recommendation}
                  </p>

                  <Link
                    href={`/coach?q=${encodeURIComponent(`How can I eliminate the ${leak.title} leak?`)}`}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-400 hover:text-teal-300 pt-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Ask Coach for customized recovery action &rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* End-of-Cycle Audit Report Modal */}
        {data && (
          <CycleReportModal
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            data={data}
          />
        )}
      </main>
    </div>
  );
}
