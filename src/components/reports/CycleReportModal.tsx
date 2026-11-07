"use client";

import { useState } from "react";
import { DashboardData } from "@/types/financial";
import { formatINR } from "@/lib/utils";
import {
  X,
  Printer,
  Download,
  FileText,
  ShieldCheck,
  TrendingDown,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

interface CycleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DashboardData;
}

export function CycleReportModal({ isOpen, onClose, data }: CycleReportModalProps) {
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  if (!isOpen) return null;

  const { profile, cycle, metrics, categoryBreakdown, activeLeaks, recentTransactions } = data;
  const flexiblePool = metrics.monthlySalary - metrics.upcomingEssentials - metrics.savingsGoal;
  const timeProgress = Math.min(100, Math.round((cycle.daysElapsed / cycle.totalDaysInCycle) * 100));
  const reportId = `SW-AUDIT-${cycle.cycleStartFormatted.replace(/[^a-zA-Z0-9]/g, "")}`;
  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    setDownloadingCsv(true);
    try {
      const lines: string[] = [];
      lines.push("SPENDWISE SALARY CYCLE AUDIT REPORT");
      lines.push(`Report Reference,${reportId}`);
      lines.push(`Generated On,${generatedDate}`);
      lines.push(`Account Name,${profile.name}`);
      lines.push(`Cycle Period,${cycle.cycleStartFormatted} to ${cycle.nextPaydayFormatted}`);
      lines.push(`Days Elapsed,${cycle.daysElapsed} of ${cycle.totalDaysInCycle}`);
      lines.push(`Days Remaining,${cycle.daysUntilPayday}`);
      lines.push("");

      lines.push("1. CORE SALARY CYCLE BUDGET METRICS");
      lines.push("Metric,Amount (INR),Notes");
      lines.push(`Monthly Net Salary,${metrics.monthlySalary},Verified take-home income`);
      lines.push(`Committed Fixed Essentials,${metrics.upcomingEssentials},Rent / EMIs / Utilities`);
      lines.push(`Protected Savings Goal,${metrics.savingsGoal},Protected upfront on Day 1`);
      lines.push(`Total Discretionary Pool,${flexiblePool},Calculated flexible allowance`);
      lines.push(`Spent This Cycle,${metrics.totalSpentThisCycle},Total logged expenditures`);
      lines.push(`Remaining Flexible Buffer,${metrics.flexibleMoney},Spendable before next payday`);
      lines.push(`Safe Daily Spend Target,${metrics.safeDailySpend},Spend limit per day`);
      lines.push(`Current Daily Burn Rate,${metrics.burnRatePerDay},Actual burn velocity`);
      lines.push("");

      lines.push("2. EXPENDITURE BREAKDOWN BY CATEGORY");
      lines.push("Category,Amount (INR),Percentage,Transactions Count");
      categoryBreakdown.forEach((c) => {
        lines.push(`"${c.category}",${c.amount},${c.percentage}%,${c.count}`);
      });
      lines.push("");

      lines.push("3. DETECTED SPENDING LEAKS");
      lines.push("Title,Severity,Impact Description,Remediation Action");
      if (activeLeaks.length > 0) {
        activeLeaks.forEach((l) => {
          lines.push(`"${l.title}","${l.severity}","${l.impactDescription}","${l.recommendation.replace(/"/g, '""')}"`);
        });
      } else {
        lines.push("No active spending leaks detected,,Zero critical erosion,On optimal track");
      }
      lines.push("");

      lines.push("4. VERIFIED SALARY CYCLE TRANSACTIONS");
      lines.push("Date,Description,Category,Payment Method,Amount (INR)");
      recentTransactions.forEach((t) => {
        const d = typeof t.date === "string" ? t.date.split("T")[0] : new Date(t.date).toISOString().split("T")[0];
        lines.push(`"${d}","${t.description.replace(/"/g, '""')}","${t.category}","${t.paymentMethod}",${t.amount}`);
      });

      const csvBlob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(csvBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SpendWise_Report_${profile.name.replace(/\s+/g, "_")}_${cycle.cycleStartFormatted}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV Export failed:", err);
    } finally {
      setDownloadingCsv(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-[#131922] w-full max-w-4xl rounded-3xl border border-[#243041] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] text-slate-100">
        {/* Modal Controls Header (Hidden during Print) */}
        <div className="no-print px-6 py-4 border-b border-[#243041] flex items-center justify-between bg-[#0B0F14]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-950 text-teal-400 border border-teal-800/60 shadow-[0_0_12px_rgba(13,148,136,0.2)]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Executive Salary-to-Salary Statement
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Cycle: {cycle.cycleStartFormatted} – {cycle.nextPaydayFormatted} • Deterministic Audit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={downloadingCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B0F14] hover:bg-[#1B2330] text-slate-200 border border-[#243041] text-xs font-bold transition-all disabled:opacity-50"
              title="Download CSV Spreadsheet"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>{downloadingCsv ? "Exporting..." : "CSV Export"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(13,148,136,0.3)] border border-teal-500/30 transition-all"
              title="Print or Save as PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1B2330] transition-colors ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div id="printable-cycle-report" className="print-page p-6 sm:p-8 overflow-y-auto space-y-6 text-xs bg-[#0B0F14]">
          {/* Statement Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#243041]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white uppercase font-mono">
                  SPEND<span className="text-teal-400">WISE</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-950/80 text-teal-300 border border-teal-800/60 uppercase tracking-widest">
                  Official Statement
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Forward-Looking Financial Architecture for Salaried Professionals
              </p>
            </div>

            <div className="text-left sm:text-right font-mono space-y-0.5">
              <div className="text-slate-400 font-bold text-[11px]">
                Report Ref: <span className="text-white">{reportId}</span>
              </div>
              <div className="text-slate-400 text-[10px]">Generated: {generatedDate}</div>
              <div className="text-emerald-400 text-[10px] font-bold">Verified Deterministic Math</div>
            </div>
          </div>

          {/* Executive Health Banner */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              metrics.budgetStatus === "healthy"
                ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-200"
                : metrics.budgetStatus === "watch"
                ? "bg-amber-950/40 border-amber-800/80 text-amber-200"
                : "bg-rose-950/40 border-rose-800/80 text-rose-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  metrics.budgetStatus === "healthy"
                    ? "bg-emerald-900/60 text-emerald-300"
                    : metrics.budgetStatus === "watch"
                    ? "bg-amber-900/60 text-amber-300"
                    : "bg-rose-900/60 text-rose-300"
                }`}
              >
                {metrics.budgetStatus === "healthy" ? (
                  <ShieldCheck className="h-5 w-5" />
                ) : metrics.budgetStatus === "watch" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
              </div>
              <div>
                <span className="font-black text-sm block tracking-tight">
                  {metrics.budgetStatus === "healthy"
                    ? "EXECUTIVE STATUS: ON-TRACK & HEALTHY"
                    : metrics.budgetStatus === "watch"
                    ? "EXECUTIVE STATUS: CAUTION — HIGH SPENDING PACE"
                    : "EXECUTIVE STATUS: DEFICIT WARNING"}
                </span>
                <span className="text-xs opacity-90 block mt-0.5">
                  Safe allowance of <strong>{formatINR(metrics.safeDailySpend)}/day</strong> remaining for{" "}
                  {cycle.daysUntilPayday} days until next salary credit ({cycle.nextPaydayFormatted}).
                </span>
              </div>
            </div>

            <div className="text-right flex-shrink-0 font-mono">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">
                Flexible Pool Remaining
              </span>
              <span className="text-lg font-black text-white">{formatINR(metrics.flexibleMoney)}</span>
            </div>
          </div>

          {/* Member & Cycle Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Member Name</span>
              <span className="text-xs font-bold text-white block mt-0.5">{profile.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Cycle Window</span>
              <span className="text-xs font-bold text-slate-200 block mt-0.5">
                {cycle.cycleStartFormatted} – {cycle.nextPaydayFormatted}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Progress</span>
              <span className="text-xs font-bold text-indigo-300 block mt-0.5">
                Day {cycle.daysElapsed} of {cycle.totalDaysInCycle} ({timeProgress}%)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Target Payday</span>
              <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                {cycle.daysUntilPayday} days remaining
              </span>
            </div>
          </div>

          {/* Core Mathematical Reconciliation Table */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span>1. Salary Cycle Budget Reconciliation</span>
            </h4>
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
              <table className="w-full text-left">
                <thead className="bg-slate-900 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                  <tr>
                    <th className="py-2.5 px-3.5">Financial Component</th>
                    <th className="py-2.5 px-3.5 text-right">Allocated Amount</th>
                    <th className="py-2.5 px-3.5 text-right">% of Salary</th>
                    <th className="py-2.5 px-3.5">Architectural Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono">
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-white font-sans">Net Take-Home Salary</td>
                    <td className="py-2.5 px-3.5 text-right font-black text-white">{formatINR(metrics.monthlySalary)}</td>
                    <td className="py-2.5 px-3.5 text-right text-slate-300">100.0%</td>
                    <td className="py-2.5 px-3.5 text-slate-400 font-sans">Total regular income baseline</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-amber-300 font-sans">Committed Fixed Essentials</td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-amber-300">
                      - {formatINR(metrics.upcomingEssentials)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-slate-300">
                      {Math.round((metrics.upcomingEssentials / metrics.monthlySalary) * 100)}%
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-400 font-sans">Non-negotiable Rent, EMIs & Bills</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-emerald-300 font-sans">Protected Savings Goal</td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-emerald-300">
                      - {formatINR(metrics.savingsGoal)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-slate-300">
                      {Math.round((metrics.savingsGoal / metrics.monthlySalary) * 100)}%
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-400 font-sans">Deducted on Day 1 (Pay Yourself First)</td>
                  </tr>
                  <tr className="bg-slate-900/60 font-bold">
                    <td className="py-2.5 px-3.5 text-indigo-300 font-sans">Total Flexible Spending Pool</td>
                    <td className="py-2.5 px-3.5 text-right text-indigo-300 font-black">{formatINR(flexiblePool)}</td>
                    <td className="py-2.5 px-3.5 text-right text-slate-300">
                      {Math.round((flexiblePool / metrics.monthlySalary) * 100)}%
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-400 font-sans">Available for lifestyle & daily expenses</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-rose-300 font-sans">Flexible Spent to Date</td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-rose-300">
                      - {formatINR(metrics.totalSpentThisCycle)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-slate-300">{metrics.spentPercent}%</td>
                    <td className="py-2.5 px-3.5 text-slate-400 font-sans">Cumulative debits recorded in cycle</td>
                  </tr>
                  <tr className="bg-slate-900/90 font-black">
                    <td className="py-3 px-3.5 text-white font-sans">Remaining Discretionary Buffer</td>
                    <td className="py-3 px-3.5 text-right text-emerald-400 text-sm font-black">
                      {formatINR(metrics.flexibleMoney)}
                    </td>
                    <td className="py-3 px-3.5 text-right text-emerald-300">{metrics.flexiblePercentRemaining}%</td>
                    <td className="py-3 px-3.5 text-indigo-300 font-sans">
                      Yields exactly <strong>{formatINR(metrics.safeDailySpend)}/day</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Expenditure Table */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>2. Expenditure Distribution by Category</span>
              <span className="text-[10px] font-medium text-slate-400 font-mono">
                {categoryBreakdown.length} Active Categories
              </span>
            </h4>
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
              <table className="w-full text-left">
                <thead className="bg-slate-900 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                  <tr>
                    <th className="py-2.5 px-3.5">Category</th>
                    <th className="py-2.5 px-3.5 text-right">Amount Spent</th>
                    <th className="py-2.5 px-3.5 text-right">Share of Spend</th>
                    <th className="py-2.5 px-3.5 text-right">Transactions</th>
                    <th className="py-2.5 px-3.5">Velocity Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono">
                  {categoryBreakdown.map((c) => (
                    <tr key={c.category} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3.5 font-bold text-white font-sans">{c.category}</td>
                      <td className="py-2.5 px-3.5 text-right font-black text-slate-200">{formatINR(c.amount)}</td>
                      <td className="py-2.5 px-3.5 text-right text-slate-300">{c.percentage}%</td>
                      <td className="py-2.5 px-3.5 text-right text-slate-400">{c.count} txns</td>
                      <td className="py-2.5 px-3.5 font-sans">
                        {c.percentage >= 35 ? (
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            Primary Spend Driver
                          </span>
                        ) : c.percentage >= 15 ? (
                          <span className="text-[10px] font-bold text-slate-300">Moderate Weight</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Within Budget</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Spending Leaks & Action Items */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span>3. Detected Behavioral Spending Leaks & Remediation</span>
            </h4>
            {activeLeaks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeLeaks.map((leak) => (
                  <div
                    key={leak.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{leak.title}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            leak.severity === "high"
                              ? "bg-rose-950 text-rose-300 border-rose-800"
                              : "bg-amber-950 text-amber-300 border-amber-800"
                          }`}
                        >
                          {leak.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {leak.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 text-[11px]">
                      <span className="text-emerald-400 font-bold">Action: </span>
                      <span className="text-slate-300">{leak.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-center text-xs">
                ✅ Zero critical spending leaks detected in this active cycle.
              </div>
            )}
          </div>

          {/* Itemized Audit Trail */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>4. Verified Ledger Transactions ({recentTransactions.length} Items)</span>
              <span className="text-[10px] text-slate-400 font-mono">Bank Reconciliation</span>
            </h4>
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
              <table className="w-full text-left">
                <thead className="bg-slate-900 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Description / Merchant</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Channel</th>
                    <th className="py-2 px-3 text-right">Debit (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {recentTransactions.map((tx) => {
                    const dateFormatted = new Intl.DateTimeFormat("en-IN", {
                      day: "numeric",
                      month: "short",
                    }).format(new Date(tx.date));
                    return (
                      <tr key={tx.id} className="hover:bg-slate-900/30">
                        <td className="py-2 px-3 text-slate-400 whitespace-nowrap">{dateFormatted}</td>
                        <td className="py-2 px-3 font-sans font-medium text-white truncate max-w-xs">
                          {tx.merchant || tx.description}
                        </td>
                        <td className="py-2 px-3 text-indigo-300 font-sans">{tx.category}</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">{tx.paymentMethod}</td>
                        <td className="py-2 px-3 text-right font-bold text-rose-400">- {formatINR(tx.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclaimer & Footer */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 font-mono gap-2">
            <span>SpendWise Financial Engine v1.0 • Pure Deterministic Accounting</span>
            <span>All calculations strictly isolated to User ID: {data.profile.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
