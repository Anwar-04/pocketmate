import { SpendingLeak } from "@/types/financial";
import { AlertCircle, Flame, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function ActiveLeaksStrip({ leaks }: { leaks: SpendingLeak[] }) {
  if (!leaks || leaks.length === 0) return null;

  return (
    <div className="bg-[#131922] backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-[#243041] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-950/80 border border-amber-800/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight">
              Detected Spending Leaks
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Behavioral patterns eroding your flexible buffer and safe daily spend
            </p>
          </div>
        </div>

        <Link
          href="/insights"
          className="text-xs font-bold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1.5 self-start sm:self-center"
        >
          <span>Full Leak Audit</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaks.map((leak) => (
          <div
            key={leak.id}
            className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-lg ${
              leak.severity === "high"
                ? "bg-rose-950/20 border-rose-900/60 hover:border-rose-700/80"
                : "bg-[#1B2330] border-[#243041] hover:border-slate-600"
            }`}
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

              <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">
                {leak.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {leak.description}
              </p>
            </div>

            <div className="pt-3 border-t border-[#243041] space-y-2">
              <div className="text-xs text-slate-300 font-medium flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold flex-shrink-0">Action:</span>
                <span>{leak.recommendation}</span>
              </div>

              <Link
                href={`/coach?q=${encodeURIComponent(`How can I fix the ${leak.title} leak?`)}`}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 hover:text-teal-300 mt-1"
              >
                <Sparkles className="h-3 w-3" />
                <span>Ask Coach for recovery plan &rarr;</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
