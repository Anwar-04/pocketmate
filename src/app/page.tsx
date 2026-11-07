import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Sparkles, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F14] text-slate-100 selection:bg-teal-500 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-[#243041] bg-[#0B0F14]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(13,148,136,0.3)] border border-teal-500/30">
              ₹
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white tracking-tight text-lg leading-tight flex items-center gap-1.5">
                SpendWise
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Salary Coach
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-400 hover:text-white px-3.5 py-2 rounded-xl hover:bg-[#1B2330] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 px-4 py-2 rounded-xl transition-all shadow-[0_0_20px_rgba(13,148,136,0.3)] border border-teal-500/30 hover:scale-105 active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 md:py-28 px-4 max-w-5xl mx-auto text-center">
          {/* Ambient glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-bold mb-6 shadow-[0_0_15px_rgba(13,148,136,0.2)]">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              <span>Built for Salaried Indian Working Professionals</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.12] mb-6">
              Know where your salary went. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400">
                Know what you can safely spend next.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              An intelligent financial coach tuned to your real salary cycle. Converts your income, expenses,
              committed bills, and savings goal into one actionable daily number:
              <strong className="text-white font-bold"> your safe daily spend.</strong>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/login?mode=signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 px-7 py-3.5 rounded-2xl shadow-[0_0_25px_rgba(13,148,136,0.35)] border border-teal-500/30 transition-all hover:scale-105 active:scale-95"
              >
                <span>Get started free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold text-slate-300 bg-[#131922] hover:bg-[#1B2330] border border-[#243041] px-7 py-3.5 rounded-2xl transition-all shadow-sm hover:border-slate-500"
              >
                <span>Sign In to Your Account</span>
              </Link>
            </div>

            {/* Interactive Safe-to-Spend Concept Card */}
            <div className="max-w-2xl mx-auto bg-[#131922] backdrop-blur-xl rounded-3xl border border-[#243041] shadow-[0_4px_30px_rgba(0,0,0,0.5)] p-6 sm:p-8 text-left transition-all hover:border-slate-600">
              <div className="flex items-center justify-between border-b border-[#243041] pb-4 mb-6">
                <div>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    The Daily Decision Metric
                  </p>
                  <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
                    Safe to spend today
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                  Healthy Pace
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-5xl sm:text-6xl font-black text-white tracking-tight tabular-nums">
                  ₹708
                </span>
                <span className="text-sm font-bold text-slate-400">
                  / day until payday (12 days left)
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed font-normal">
                Based on your remaining flexible buffer, committed essentials, and protected ₹15,000 savings goal.
              </p>

              {/* Formula Breakdown Drawer */}
              <div className="bg-[#0B0F14] rounded-2xl p-5 border border-[#243041] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="uppercase tracking-wider text-[10px] text-slate-500">Deterministic Equation</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified Arithmetic
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 font-mono bg-[#131922] p-3.5 rounded-xl border border-[#243041]">
                  <div className="flex justify-between">
                    <span>Monthly Salary:</span>
                    <span className="font-bold text-white">₹75,000</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>− Spent this cycle:</span>
                    <span className="font-bold">− ₹38,500</span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>− Committed essentials (Rent, EMIs):</span>
                    <span className="font-bold">− ₹13,000</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>− Protected savings goal:</span>
                    <span className="font-bold">− ₹15,000</span>
                  </div>
                  <div className="border-t border-dashed border-[#243041] pt-1.5 flex justify-between font-bold text-white">
                    <span>= Remaining Flexible Money:</span>
                    <span className="text-teal-400">₹8,500</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs bg-teal-950/60 text-teal-200 p-3 rounded-xl border border-teal-800/40 font-bold">
                  <span>₹8,500 Flexible ÷ 12 Days Remaining</span>
                  <span className="text-emerald-400 text-sm">≈ ₹708 / day</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-20 bg-[#0B0F14] border-t border-[#243041]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
                Why SpendWise is Different
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Traditional expense trackers show you the rear-view mirror. SpendWise guides your very next financial decision.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-7 rounded-3xl bg-[#131922] border border-[#243041] hover:border-slate-600 transition-colors">
                <div className="h-12 w-12 rounded-2xl bg-teal-950 text-teal-400 flex items-center justify-center mb-5 border border-teal-800/60 shadow-sm">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="font-black text-white text-lg mb-2">Salary Cycle Cadence</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Cycles align with your real payday (1st, 28th, or custom), not artificial calendar months.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-[#131922] border border-[#243041] hover:border-slate-600 transition-colors">
                <div className="h-12 w-12 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center mb-5 border border-emerald-800/60 shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-black text-white text-lg mb-2">Upfront Savings Protection</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Your monthly savings goal is ringfenced on Day 1. Only true discretionary money is ever allocated to your daily spend.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-[#131922] border border-[#243041] hover:border-slate-600 transition-colors">
                <div className="h-12 w-12 rounded-2xl bg-amber-950 text-amber-400 flex items-center justify-center mb-5 border border-amber-800/60 shadow-sm">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="font-black text-white text-lg mb-2">Personal Financial Coach</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Evaluate spontaneous purchases, ask where your salary went, and get grounded advice with zero guesswork.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#243041] bg-[#0B0F14] py-8 px-4 text-center text-xs text-slate-500">
        <p>© 2026 SpendWise. Salary-to-Salary Financial Coaching for Working Professionals in India.</p>
      </footer>
    </div>
  );
}
