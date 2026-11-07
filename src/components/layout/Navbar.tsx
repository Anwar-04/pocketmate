"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, ReceiptText, LineChart, Sparkles, ShieldCheck, Settings } from "lucide-react";
import { SettingsModal } from "@/components/settings/SettingsModal";

export function Navbar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentName, setCurrentName] = useState<string>(userName || "");

  // Sync state whenever the prop updates
  useEffect(() => {
    if (userName && userName.trim()) {
      setCurrentName(userName);
      try {
        sessionStorage.setItem("spendwise_user_name", userName);
      } catch {}
    }
  }, [userName]);

  // Fallback: If name is not yet set, automatically fetch from profile API
  useEffect(() => {
    async function loadUserName() {
      try {
        const cached = sessionStorage.getItem("spendwise_user_name");
        if (cached && !currentName) {
          setCurrentName(cached);
          return;
        }

        const res = await fetch("/api/auth/profile");
        const json = await res.json();
        if (json.success && json.user?.name) {
          setCurrentName(json.user.name);
          try {
            sessionStorage.setItem("spendwise_user_name", json.user.name);
          } catch {}
        }
      } catch {
        // keep existing state
      }
    }

    if (!currentName) {
      loadUserName();
    }
  }, [currentName]);

  const handleLogout = async () => {
    try {
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch {}

      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Proceed even on network hiccup
    } finally {
      window.location.href = "/login";
    }
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: ReceiptText },
    { href: "/insights", label: "Leaks & Insights", icon: LineChart },
    { href: "/coach", label: "Financial Coach", icon: Sparkles },
  ];

  return (
    <>
      <header className="border-b border-[#243041] bg-[#0B0F14]/90 backdrop-blur-xl sticky top-0 z-40 transition-all">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand & Nav */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(13,148,136,0.3)] group-hover:scale-105 transition-transform border border-teal-500/30">
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
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-teal-950/70 text-teal-300 shadow-[0_0_15px_rgba(13,148,136,0.15)] border border-teal-500/30"
                        : "text-slate-400 hover:text-white hover:bg-[#1B2330]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-teal-400" : "text-slate-500"}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User profile & Settings */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2.5 pl-2 group text-left cursor-pointer"
              title="Salary & Cycle Settings"
            >
              <div className="h-8 w-8 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 font-bold text-xs flex items-center justify-center shadow-inner group-hover:border-teal-400 transition-colors uppercase">
                {currentName ? currentName.charAt(0) : "U"}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-white leading-tight group-hover:text-teal-200 transition-colors">
                  {currentName || "My Account"}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  Cycle Protected
                </span>
              </div>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Salary & Cycle Settings"
              className="p-2 rounded-xl text-slate-400 hover:text-teal-300 hover:bg-[#1B2330] transition-colors border border-transparent hover:border-[#243041]"
            >
              <Settings className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-[#243041] hidden sm:block" />

            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors border border-transparent hover:border-rose-900/40"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Salary & Cycle Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSuccess={(newName) => setCurrentName(newName)}
      />

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0F14]/95 backdrop-blur-xl border-t border-[#243041] py-2 px-3 flex justify-around items-center shadow-2xl">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? "text-teal-400 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] tracking-tight">{link.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
