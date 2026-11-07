"use client";

import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/auth/supabase-client";
import { ArrowRight, Lock, Mail, User, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("provider is not enabled") || msg.includes("Unsupported provider")) {
        setErrorMessage(
          "Google Sign-In provider is currently not enabled in your Supabase Dashboard. Enable Google under Authentication -> Providers, or sign in directly with Email below."
        );
      } else {
        setErrorMessage(msg);
      }
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload =
        mode === "signup"
          ? { email: email.trim(), password, name: name.trim() || email.split("@")[0] }
          : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Authentication failed");
      }

      // Hard redirect ensures all server cookies, middleware, and session contexts initialize cleanly
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
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {mode === "signin"
            ? "Sign in to calculate today's safe spending limit"
            : "Start your salary-cycle financial coaching"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#131922] backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-[#243041] sm:px-10">
          {/* Google OAuth Action */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-[#0B0F14] hover:bg-[#1B2330] text-white border border-[#243041] transition-all hover:border-slate-500 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#243041]" />
              </div>
              <span className="relative bg-[#131922] px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Or continue with email
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        emailInputRef.current?.focus();
                      }
                    }}
                    placeholder="e.g. Anwar Hussain"
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-[#243041] rounded-xl text-sm bg-[#0B0F14] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  ref={emailInputRef}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && mode === "signup") {
                      e.preventDefault();
                      passwordInputRef.current?.focus();
                    }
                  }}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-[#243041] rounded-xl text-sm bg-[#0B0F14] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  ref={passwordInputRef}
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-[#243041] rounded-xl text-sm bg-[#0B0F14] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
              {mode === "signup" && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Minimum 6 characters. If you already have an account, this will update your password.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 transition-all shadow-[0_0_20px_rgba(13,148,136,0.25)] disabled:opacity-50 border border-teal-500/30 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  <span>{mode === "signin" ? "Sign In" : "Continue to Onboarding"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                const nextMode = mode === "signin" ? "signup" : "signin";
                setMode(nextMode);
                setErrorMessage(null);
                try {
                  window.history.replaceState(null, "", nextMode === "signup" ? "/login?mode=signup" : "/login");
                } catch {}
              }}
              className="text-xs font-bold text-teal-400 hover:text-teal-300 cursor-pointer"
            >
              {mode === "signin"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
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
        <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center text-slate-100">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
