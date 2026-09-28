"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, KeyRound, AlertTriangle, ArrowRight, Store, Eye, EyeOff } from "lucide-react";
import { CrmTopHeader } from "@/components/CrmTopHeader";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", pin: "" });
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState("");

  // Check if already authenticated as Admin
  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => {
        if (r.ok) {
          router.replace("/admin");
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
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) {
        throw new Error(d.error || "Authentication failed.");
      }
      router.push("/admin");
    } catch (e2: any) {
      setErr(String(e2.message || e2));
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0] text-[#1E1815]">
        <CrmTopHeader activeTab="master" />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-[#0E331E]/20 border-t-[#0E331E] rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-[#7A6E67]">Verifying executive session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0] text-[#1E1815]">
      <CrmTopHeader activeTab="master" />
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#EAE3DC] rounded-3xl p-7 sm:p-8 shadow-xl">
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bc-roundel.png"
            alt="Levante"
            className="w-14 h-14 object-contain shrink-0 drop-shadow-sm"
          />
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#1E1815] leading-none">Levante</h1>
            <p className="text-xs font-semibold text-[#7A6E67] uppercase tracking-wider mt-1">
              Executive Portal
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-black tracking-tight text-[#1E1815] mb-1.5">Management Sign In</h2>
        <p className="text-xs text-[#7A6E67] mb-6 leading-relaxed">
          Enter your administrative username and security PIN to access the management control center.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7A6E67] mb-1.5" htmlFor="admin-u">
              Admin Username
            </label>
            <div className="relative">
              <input
                id="admin-u"
                type="text"
                className="w-full px-4 py-3 bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#0E331E] transition-colors font-medium text-sm pr-10"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
                placeholder="e.g. admin or manager"
                required
                autoFocus
              />
              <ShieldCheck className="w-4 h-4 text-[#8C7F78] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7A6E67] mb-1.5" htmlFor="admin-p">
              Admin Password / PIN Code
            </label>
            <div className="relative">
              <input
                id="admin-p"
                type={showPin ? "text" : "password"}
                className="w-full pl-4 pr-11 py-3 bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E] font-medium transition-colors text-sm"
                value={form.pin}
                onChange={(e) => setForm({ ...form, pin: e.target.value })}
                placeholder={showPin ? "Enter password" : "••••••••"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8C7F78] hover:text-[#0E331E] transition-colors rounded-lg focus:outline-none cursor-pointer"
                title={showPin ? "Hide Password" : "Show Password"}
                aria-label={showPin ? "Hide Password" : "Show Password"}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {err && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !form.username.trim() || !form.pin.trim()}
            className="w-full py-3.5 px-6 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {busy ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Authenticating…</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
