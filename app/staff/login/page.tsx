"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building, Lock, KeyRound, AlertCircle, ArrowRight, UserCheck } from "lucide-react";

export default function StaffLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", pin: "" });
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState("");

  // Check if already authenticated as Staff
  useEffect(() => {
    fetch("/api/staff/session")
      .then((r) => {
        if (r.ok) {
          router.replace("/staff");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) {
        throw new Error(d.error || "Authentication failed.");
      }
      router.push("/staff");
    } catch (e2: any) {
      setErr(String(e2.message || e2));
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-md mx-auto">
        <div className="w-8 h-8 border-3 border-[#1E7A4D]/30 border-t-[#1E7A4D] rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-[var(--ink-2)]">Checking till session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-md mx-auto">
      {/* Brand Header */}
      <div className="w-full flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[#1E7A4D] flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-[#1E7A4D]/25">
          ST
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-[var(--ink)] leading-none">Staff Till POS</h1>
          <p className="text-xs font-semibold text-[var(--ink-3)] uppercase tracking-wider mt-1">
            Counter Terminal Sign-In
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/[0.03]">
        <h2 className="text-2xl font-black text-[var(--ink)] mb-1.5">Cashier Login</h2>
        <p className="text-sm text-[var(--ink-2)] mb-6">
          Enter your counter username and PIN code to activate this register terminal.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="staff-u">
              Cashier Username
            </label>
            <div className="relative">
              <input
                id="staff-u"
                type="text"
                className="w-full px-4 py-3 text-base bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[#1E7A4D] transition-colors"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
                placeholder="e.g. cashier or manager"
                required
                autoFocus
              />
              <UserCheck className="w-4 h-4 text-[var(--ink-3)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="staff-p">
              PIN Code
            </label>
            <div className="relative">
              <input
                id="staff-p"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full px-4 py-3 text-base bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#1E7A4D] font-mono tracking-widest transition-colors"
                value={form.pin}
                onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })}
                onKeyDown={(e) => {
                  if (
                    ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter"].includes(e.key) ||
                    e.ctrlKey ||
                    e.metaKey
                  ) {
                    return;
                  }
                  if (!/^\d$/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                placeholder="••••••"
                required
              />
              <KeyRound className="w-4 h-4 text-[var(--ink-3)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {err && (
            <div className="p-3.5 rounded-xl bg-[#FBEAE7] border border-[#C0392B]/20 text-[#C0392B] text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !form.username.trim() || !form.pin.trim()}
            className="w-full py-3.5 px-6 rounded-xl bg-[#1E7A4D] hover:bg-[#155A38] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#1E7A4D]/25 disabled:opacity-50 transition-all cursor-pointer"
          >
            {busy ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Verifying PIN…</span>
              </>
            ) : (
              <>
                <span>Sign In to Till</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[var(--line)] text-center text-xs text-[var(--ink-3)] space-y-1">
          <div>Cashier Demo: <span className="font-mono text-[var(--ink)] font-bold">cashier (112233)</span></div>
          <div>Manager Demo: <span className="font-mono text-[var(--ink)] font-bold">manager (135790)</span></div>
        </div>
      </div>
    </div>
  );
}
