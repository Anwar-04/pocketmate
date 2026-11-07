"use client";

import { useState, useEffect } from "react";
import { parseBankSms, ParsedSmsTransaction } from "@/lib/sms/parser";
import { formatINR } from "@/lib/utils";
import {
  X,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  ArrowRight,
  TrendingDown,
  Tag
} from "lucide-react";

interface SmsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SAMPLE_BANK_MESSAGES = [
  {
    label: "HDFC (₹420 Zomato)",
    text: "HDFC Bank: Rs 420.00 debited from a/c **4120 on 05-Nov-26 at ZOMATO via UPI ref 4312908123.",
  },
  {
    label: "SBI (₹150 Auto)",
    text: "Dear SBI User, A/C 9876 debited by Rs 150.0 on 04Nov26 transfer to AUTO RICKSHAW Ref No 23819.",
  },
  {
    label: "ICICI (₹1,499 Netflix)",
    text: "ICICI Bank: INR 1,499.00 debited on Card ending 4012 at NETFLIX.COM on 03-NOV-26. Avl Lmt: INR 85,000.",
  },
  {
    label: "PhonePe (₹60 Chai)",
    text: "Paid Rs.60 to Chai Point on 05 Nov using PhonePe UPI.",
  },
];

const DAILY_PRESETS = [
  { name: "Tapri Chai & Samosa", amount: 30, category: "Food", method: "UPI", icon: "☕" },
  { name: "Auto Rickshaw Ride", amount: 150, category: "Transportation", method: "UPI", icon: "🛺" },
  { name: "Swiggy Lunch Bowl", amount: 280, category: "Food", method: "UPI", icon: "🍛" },
  { name: "Blinkit Quick Milk & Bread", amount: 480, category: "Groceries", method: "UPI", icon: "🥛" },
  { name: "HPCL Petrol Pump Fuel", amount: 1200, category: "Transportation", method: "Card", icon: "⛽" },
  { name: "Apollo Cold & Cough Meds", amount: 350, category: "Health", method: "UPI", icon: "💊" },
];

export function SmsImportModal({ isOpen, onClose, onSuccess }: SmsImportModalProps) {
  const [activeTab, setActiveTab] = useState<"paste" | "presets" | "automated">("paste");
  const [smsInput, setSmsInput] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedSmsTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/profile");
        const json = await res.json();
        if (json.success && json.user?.id) {
          setUserId(json.user.id);
        }
      } catch {}
    }
    if (isOpen) {
      loadUser();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTextChange = (text: string) => {
    setSmsInput(text);
    setSuccessMessage(null);
    setErrorMessage(null);

    if (text.trim().length > 10) {
      const res = parseBankSms(text);
      setParsed(res);
    } else {
      setParsed(null);
    }
  };

  const handleSelectSample = (sampleText: string) => {
    setSmsInput(sampleText);
    const res = parseBankSms(sampleText);
    setParsed(res);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleLogSms = async () => {
    if (!smsInput.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/webhooks/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: smsInput }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to log SMS");

      setSuccessMessage(json.message || "Expense successfully recorded!");
      setSmsInput("");
      setParsed(null);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error logging transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleLogPreset = async (preset: typeof DAILY_PRESETS[0]) => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const simulatedSms = `Paid Rs.${preset.amount} to ${preset.name} on ${new Date().toISOString().split("T")[0]} via ${preset.method}`;
      const res = await fetch("/api/webhooks/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: simulatedSms }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to log preset");

      setSuccessMessage(`Logged ${preset.name} (${formatINR(preset.amount)})!`);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error logging preset");
    } finally {
      setLoading(false);
    }
  };

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/sms?token=${userId || "YOUR_USER_TOKEN"}`
    : `http://localhost:3000/api/webhooks/sms?token=${userId || "YOUR_USER_TOKEN"}`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 text-slate-100">
      <div className="bg-[#131922] w-full max-w-2xl rounded-3xl border border-[#243041] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#243041] flex items-center justify-between bg-[#0B0F14]/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center border border-amber-800/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Bank SMS & Quick-Log Hub
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Instant
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Auto-extracts amounts and merchants from Indian bank and UPI notifications
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

        {/* Tab Navigation */}
        <div className="flex border-b border-[#243041] bg-[#0B0F14]/60 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab("paste")}
            className={`pb-3 px-3 border-b-2 transition-all ${
              activeTab === "paste"
                ? "border-teal-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Paste or Test SMS
          </button>
          <button
            onClick={() => setActiveTab("presets")}
            className={`pb-3 px-3 border-b-2 transition-all ${
              activeTab === "presets"
                ? "border-teal-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            1-Tap Daily Presets
          </button>
          <button
            onClick={() => setActiveTab("automated")}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "automated"
                ? "border-teal-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
            <span>Automate Background Sync</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: PASTE OR TEST SMS */}
          {activeTab === "paste" && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-2">
                  Try 1-Click Sample Bank SMS:
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_BANK_MESSAGES.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(s.text)}
                      className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700/80 transition-all font-semibold hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Paste Bank or UPI SMS Message
                </label>
                <textarea
                  rows={3}
                  value={smsInput}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Paste e.g. 'HDFC Bank: Rs 420.00 debited from a/c **4120 on 05-Nov-26 at ZOMATO via UPI...'"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-800 bg-slate-950 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
                />
              </div>

              {/* Reactive Extracted Receipt Preview */}
              {parsed ? (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-3 animate-in fade-in-50 duration-150 shadow-inner">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Extracted Financial Receipt
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black uppercase">
                      {parsed.confidence} Match
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block font-semibold">Amount</span>
                      <span className="text-base font-black text-rose-400 font-mono">- {formatINR(parsed.amount)}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block font-semibold">Merchant</span>
                      <span className="text-xs font-bold text-white truncate block">{parsed.merchant}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block font-semibold">Category</span>
                      <span className="text-xs font-bold text-indigo-300 block">{parsed.category}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block font-semibold">Channel</span>
                      <span className="text-xs font-bold text-slate-300 block">{parsed.paymentMethod}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogSms}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-xs text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 border border-indigo-400/30"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    <span>Confirm & Recalculate Safe Daily Spend</span>
                  </button>
                </div>
              ) : smsInput.trim().length > 10 ? (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 text-amber-300 text-xs">
                  Analyzing message... Could not detect a valid debit amount or merchant. Try a standard bank SMS.
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 2: 1-TAP DAILY PRESETS */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Tap any common expense to record it instantly without filling out a form or waiting for an SMS:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DAILY_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={loading}
                    onClick={() => handleLogPreset(p)}
                    className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                  >
                    <div className="text-2xl mb-2">{p.icon}</div>
                    <div className="text-xs font-bold text-white truncate">{p.name}</div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="font-mono font-black text-rose-400">{formatINR(p.amount)}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{p.method}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AUTOMATED BACKGROUND SYNC */}
          {activeTab === "automated" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/30 space-y-2">
                <span className="font-bold text-teal-300 block">
                  Zero-Tap Android Background Tracking
                </span>
                <p className="text-slate-300 leading-relaxed">
                  You can automatically forward your bank SMS messages to SpendWise without opening the app, using any free background forwarding tool (like <strong>SMS Forwarder</strong> or <strong>Tasker</strong> on Google Play Store).
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Your Private Webhook URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#243041] bg-[#0B0F14] font-mono text-xs text-slate-300 focus:outline-none"
                  />
                  <button
                    onClick={copyWebhook}
                    className="px-3.5 py-2.5 rounded-xl bg-[#1B2330] hover:bg-slate-700 font-bold text-xs text-white border border-[#243041] flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="font-bold text-white block">2-Minute Setup Guide:</span>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                  <li>Install <strong>SMS Forwarder</strong> (or MacroDroid/Tasker) from Google Play Store.</li>
                  <li>Create a new forward rule with target type: <strong>Webhook (HTTP POST)</strong>.</li>
                  <li>Paste the webhook URL above and select JSON payload with <code className="text-teal-400">message</code>.</li>
                  <li>Done! Any bank SMS will now automatically log in real-time.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


