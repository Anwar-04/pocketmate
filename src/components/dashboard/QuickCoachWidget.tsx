"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Send, Bot } from "lucide-react";

export function QuickCoachWidget() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const suggestedQuestions = [
    "Can I afford a ₹2,000 purchase?",
    "Where did most of my salary go?",
    "How much can I spend this week?",
    "What expenses should I reduce?",
  ];

  const handleAsk = (questionText: string) => {
    if (!questionText.trim()) return;
    router.push(`/coach?q=${encodeURIComponent(questionText.trim())}`);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#131922] via-[#1B2330] to-[#131922] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-[#243041]">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 text-teal-400 text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="h-4 w-4" />
          <span>Salary-Cycle Financial Coach</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5 tracking-tight">
          Have a purchase or budget decision in mind?
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 mb-5 max-w-xl">
          Get instantaneous, data-backed affordability verdicts tested against your real ₹8,500 flexible buffer.
        </p>

        {/* Suggested Chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleAsk(q)}
              className="text-xs font-semibold bg-[#0B0F14]/60 hover:bg-[#1B2330] text-slate-200 px-3.5 py-2 rounded-xl border border-[#243041] transition-all hover:border-teal-500/40 text-left hover:-translate-y-0.5"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="flex gap-2 max-w-2xl"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask e.g. Can I afford a ₹1,800 weekend dinner?"
            className="flex-1 px-4 py-3 rounded-2xl bg-[#0B0F14]/80 border border-[#243041] text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 font-bold text-xs sm:text-sm text-white flex items-center gap-2 transition-all shadow-md shadow-teal-900/40 disabled:opacity-50 border border-teal-500/30"
          >
            <span>Ask Coach</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
