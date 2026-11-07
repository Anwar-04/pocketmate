"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Authentication failed");
      }

      // Hard redirect to dashboard or onboarding
      window.location.href = data.redirect || "/dashboard";
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Authentication error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-[0_0_15px_rgba(13,148,136,0.3)] border border-teal-500/30 group-hover:scale-105 transition-transform">
            ₹
          </div>
          <span className="font-extrabold text-white tracking-tight text-2xl flex items-center gap-1.5">
            SpendWise
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Welcome to SpendWise
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter your email and password to sign in or create your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#131922] backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-[#243041] sm:px-10">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#243041] bg-[#0B0F14] text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#243041] bg-[#0B0F14] text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Minimum 6 characters. If new, this will be your account password.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 transition-all shadow-[0_0_20px_rgba(13,148,136,0.3)] disabled:opacity-50 mt-6 border border-teal-500/30 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#243041] text-center">
            <p className="text-[11px] text-slate-500">
              Deterministic Salary-Cycle Financial Intelligence • Privacy-First
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
