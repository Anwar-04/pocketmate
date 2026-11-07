"use client";

import { useState, useEffect } from "react";
import { formatINR } from "@/lib/utils";
import {
  X,
  Settings,
  Wallet,
  Calendar,
  PiggyBank,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  User,
  ShieldCheck,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedName: string) => void;
}

export function SettingsModal({ isOpen, onClose, onSuccess }: SettingsModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [salaryDate, setSalaryDate] = useState(1);
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState(0);
  const [upcomingEssentials, setUpcomingEssentials] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    async function loadCurrentProfile() {
      setLoading(true);
      setError(null);
      setSuccess(false);
      try {
        const res = await fetch("/api/auth/profile");
        const json = await res.json();
        if (json.success && json.profile) {
          setName(json.user?.name || "");
          setMonthlySalary(json.profile.monthlySalary || 0);
          setSalaryDate(json.profile.salaryDate || 1);
          setMonthlySavingsGoal(json.profile.monthlySavingsGoal || 0);
          setUpcomingEssentials(json.profile.upcomingEssentials || 0);
        } else if (json.success && json.user) {
          setName(json.user.name || "");
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCurrentProfile();
  }, [isOpen]);

  if (!isOpen) return null;

  // Real-time calculation of flexible money
  const calculatedFlexible = monthlySalary - upcomingEssentials - monthlySavingsGoal;
  const isBudgetValid = calculatedFlexible >= 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBudgetValid) {
      setError("Committed essentials and savings goal cannot exceed your monthly salary.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "User",
          monthlySalary: Number(monthlySalary),
          salaryDate: Number(salaryDate),
          monthlySavingsGoal: Number(monthlySavingsGoal),
          upcomingEssentials: Number(upcomingEssentials),
          currentBalance: Math.max(0, calculatedFlexible),
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update profile settings");

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(name.trim() || "User");
        onClose();
        window.location.reload(); // Refresh cycle metrics immediately
      }, 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#131922] w-full max-w-lg rounded-3xl border border-[#243041] shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#243041] flex items-center justify-between bg-[#0B0F14]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-950 text-teal-400 border border-teal-800/60 shadow-[0_0_12px_rgba(13,148,136,0.2)]">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Salary & Cycle Configuration
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Adjust income, payday boundaries & financial commitments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1B2330] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-teal-500" />
            <p className="text-xs font-semibold text-slate-400">Loading your profile parameters...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                <span>Salary profile updated! Recalculating cycle boundaries...</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B0F14] border border-[#243041] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                />
              </div>
            </div>

            {/* Monthly Take-Home Salary */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Monthly Net Take-Home Salary (₹)
              </label>
              <div className="relative">
                <Wallet className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  required
                  min={1000}
                  step={500}
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(Number(e.target.value))}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B0F14] border border-[#243041] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Your credited amount after tax, PF, and statutory deductions.
              </p>
            </div>

            {/* Salary Credit Day */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Monthly Payday (Salary Credit Date)
              </label>
              <div className="relative">
                <Calendar className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={salaryDate}
                  onChange={(e) => setSalaryDate(Number(e.target.value))}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B0F14] border border-[#243041] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"} of every month
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Your salary cycle resets and recalculates from this calendar day.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Committed Fixed Essentials */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Fixed Essentials (₹)
                </label>
                <div className="relative">
                  <CalendarCheck className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={upcomingEssentials}
                    onChange={(e) => setUpcomingEssentials(Number(e.target.value))}
                    className="w-full pl-9 pr-2.5 py-2 bg-[#0B0F14] border border-[#243041] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Rent, EMIs & Bills</p>
              </div>

              {/* Day-1 Protected Savings Goal */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Savings Goal (₹)
                </label>
                <div className="relative">
                  <PiggyBank className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={monthlySavingsGoal}
                    onChange={(e) => setMonthlySavingsGoal(Number(e.target.value))}
                    className="w-full pl-9 pr-2.5 py-2 bg-[#0B0F14] border border-[#243041] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Protected upfront on Day 1</p>
              </div>
            </div>

            {/* Live Formula Preview Box */}
            <div className="mt-2 p-4 rounded-2xl bg-[#0B0F14] border border-[#243041] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">
                  Recalibrated Flexible Budget
                </span>
                <span
                  className={`font-mono text-sm font-black ${
                    isBudgetValid ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatINR(calculatedFlexible)}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono leading-relaxed">
                ₹{monthlySalary.toLocaleString("en-IN")} (Salary) − ₹{upcomingEssentials.toLocaleString("en-IN")} (Essentials) − ₹{monthlySavingsGoal.toLocaleString("en-IN")} (Savings)
              </div>
              {!isBudgetValid && (
                <div className="text-[10px] text-rose-300 font-bold pt-1">
                  ⚠️ Deficit Warning: Fixed expenses and savings exceed your monthly salary.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#243041] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !isBudgetValid}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(13,148,136,0.3)] disabled:opacity-50 flex items-center gap-1.5 transition-all border border-teal-500/30"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{saving ? "Updating..." : "Save & Recalculate Cycle"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
