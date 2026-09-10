"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/mobile";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Phone,
  CheckCircle2,
  ChevronRight,
  Store,
  ArrowLeft,
  Gift,
  Coins,
  Ticket,
  X,
} from "lucide-react";

const BRAND = process.env.NEXT_PUBLIC_APP_NAME || "Loyalty Club";

interface Branch {
  id: string;
  code: string;
  name: string;
  city?: string | null;
}

function matchBranch(list: Branch[], raw: string): Branch | null {
  const v = String(raw || "").trim();
  if (!v) return null;
  const upper = v.toUpperCase();
  return (
    list.find((b) => b.code?.toUpperCase() === upper) ||
    (/^\d+$/.test(v) ? list.find((b) => Number(b.code) === Number(v)) : null) ||
    null
  );
}

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [stage, setStage] = useState<"form" | "code">("form");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [programInfo, setProgramInfo] = useState<{
    welcomeDiscountPercent: number;
    welcomeBonusPoints: number;
    currency: string;
    spendAedForPoints: number;
    pointsEarnedPerSpend: number;
    pointsRequiredForRedemption: number;
    currencyValuePerRedemptionPoints: number;
  }>({
    welcomeDiscountPercent: 10,
    welcomeBonusPoints: 50,
    currency: "AED",
    spendAedForPoints: 10,
    pointsEarnedPerSpend: 1,
    pointsRequiredForRedemption: 100,
    currencyValuePerRedemptionPoints: 5,
  });
  const [welcomeGift, setWelcomeGift] = useState<{
    bonusPoints: number;
    discountPercent: number;
    currency: string;
    pointsAedValue: number;
  } | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const [f, setF] = useState({
    name: "",
    mobile: "",
    countryCode: DEFAULT_COUNTRY,
    email: "",
    birthday: "",
    branchId: "",
  });
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [branchCode, setBranchCode] = useState("");

  useEffect(() => {
    fetch("/api/card")
      .then((r) => {
        if (r.ok) {
          router.push("/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        if (window.location.pathname.includes("/login") || window.location.search.includes("mode=login")) {
          setMode("login");
        }
        const b = new URLSearchParams(window.location.search).get("b");
        if (b) setBranchCode(b);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => {
        setBranches(d.branches || []);
        if (d.programInfo) {
          setProgramInfo(d.programInfo);
        }
        if (d.branches?.length) {
          setF((x) => ({ ...x, branchId: x.branchId || d.branches[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  const matchedBranch = matchBranch(branches, branchCode);
  useEffect(() => {
    if (matchedBranch) {
      setF((x) => ({ ...x, branchId: matchedBranch.id }));
    }
  }, [matchedBranch]);

  const setField = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setF((x) => ({ ...x, mobile: digitsOnly }));
  };

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, mode }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.alreadyRegistered) setMode("login");
        if (d.notRegistered) setMode("register");
        throw new Error(d.error || "Something went wrong.");
      }
      setDevCode(d.devCode || "");
      setStage("code");
    } catch (e2: any) {
      setErr(String(e2.message || e2));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: f.mobile, countryCode: f.countryCode, code, mode }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Something went wrong.");

      if (d.isNew && d.welcome) {
        setWelcomeGift(d.welcome);
        setShowWelcomeModal(true);
      } else {
        router.push("/dashboard");
      }
    } catch (e2: any) {
      setErr(String(e2.message || e2));
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto">
      {/* Brand Header */}
      <header className="w-full flex items-center gap-3.5 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[#C0392B] flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-[#C0392B]/20">
          LC
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--ink)] leading-none">
            {BRAND}
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-3)] mt-1">
            Every branch · One digital card
          </p>
        </div>
      </header>

      {/* Main Card */}
      <main className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/[0.03] transition-all">
        {stage === "form" ? (
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBEAE7] text-[#C0392B] text-xs font-bold mb-2.5">
                <Sparkles className="w-3.5 h-3.5" />
                {mode === "register"
                  ? `Instant ${programInfo.welcomeDiscountPercent}% Voucher + ${programInfo.welcomeBonusPoints} Pts Bonus`
                  : "Member Direct Access"}
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[var(--ink)]">
                {mode === "register" ? "Join the VIP Club" : "Sign in to your card"}
              </h2>
              <p className="text-sm text-[var(--ink-2)] mt-1.5 leading-relaxed">
                {mode === "register"
                  ? `Register now. Get +${programInfo.welcomeBonusPoints} points credited to your wallet and a ${programInfo.welcomeDiscountPercent}% discount voucher instantly.`
                  : "Enter your registered mobile number to receive a secure login code."}
              </p>
            </div>

            <form onSubmit={sendCode} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    className="w-full px-4 py-3 text-base bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[#C0392B] transition-colors font-medium"
                    placeholder="e.g. Imran Sheikh"
                    value={f.name}
                    onChange={setField("name")}
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="mobile">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <select
                    className="w-32 px-3 py-3 text-sm bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#C0392B] shrink-0 font-medium"
                    aria-label="Country Code"
                    value={f.countryCode}
                    onChange={setField("countryCode")}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} +{c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="flex-1 min-w-0 px-4 py-3 text-base bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[#C0392B] font-mono tracking-wider transition-colors"
                    placeholder="501234567"
                    value={f.mobile}
                    onChange={handleMobileChange}
                    onKeyDown={(e) => {
                      if (
                        [
                          "Backspace",
                          "Delete",
                          "Tab",
                          "ArrowLeft",
                          "ArrowRight",
                          "ArrowUp",
                          "ArrowDown",
                          "Enter",
                        ].includes(e.key) ||
                        e.ctrlKey ||
                        e.metaKey
                      ) {
                        return;
                      }
                      if (!/^\d$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              {mode === "register" && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="email">
                      Email Address <span className="text-[var(--ink-3)] font-normal normal-case">(optional)</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="w-full px-4 py-3 text-base bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[#C0392B] transition-colors"
                      placeholder="name@example.com"
                      value={f.email}
                      onChange={setField("email")}
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="birthday">
                      Birthday <span className="text-[var(--ink-3)] font-normal normal-case">(for birthday surprises)</span>
                    </label>
                    <input
                      id="birthday"
                      type="date"
                      className="w-full px-4 py-3 text-sm bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#C0392B] transition-colors"
                      value={f.birthday}
                      onChange={setField("birthday")}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="branch">
                      Select Your Home Branch
                    </label>
                    <select
                      id="branch"
                      className="w-full px-4 py-3 text-sm bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#C0392B] font-medium"
                      value={f.branchId}
                      onChange={setField("branchId")}
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} — {b.city} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#C0392B] hover:bg-[#96291D] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#C0392B]/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {busy ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin-custom" />
                    {mode === "register" ? "Creating Membership…" : "Sending Login Code…"}
                  </>
                ) : (
                  <>
                    {mode === "register" ? "Register & Get Welcome Gifts" : "Sign In & Send Code"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {err && (
              <div className="mt-4 p-3.5 rounded-xl bg-[#FBEAE7] border border-[#C0392B]/20 text-[#C0392B] text-sm font-semibold">
                {err}
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-[var(--line)] text-center text-sm text-[var(--ink-2)]">
              {mode === "register" ? (
                <>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErr("");
                    }}
                    className="font-bold text-[#C0392B] hover:underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </>
              ) : (
                <>
                  New to the club?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setErr("");
                    }}
                    className="font-bold text-[#C0392B] hover:underline cursor-pointer"
                  >
                    Join now & get rewards
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => {
                setStage("form");
                setCode("");
                setErr("");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ink-2)] hover:text-[var(--ink)] mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Change Number
            </button>

            <h2 className="text-2xl font-black tracking-tight text-[var(--ink)] mb-1">
              Enter 6-digit Code
            </h2>
            <p className="text-sm text-[var(--ink-2)] mb-6">
              We sent a verification code to{" "}
              <strong className="text-[var(--ink)] font-bold">
                +{f.countryCode} {f.mobile}
              </strong>
            </p>

            <form onSubmit={verify} className="space-y-4">
              <div>
                <input
                  className="w-full py-4 text-center text-3xl font-black tracking-[0.35em] bg-[var(--surface)] border-2 border-[var(--line-2)] focus:border-[#C0392B] rounded-2xl text-[var(--ink)] focus:outline-none transition-all font-mono"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={busy || code.length < 4}
                className="w-full py-3.5 px-6 rounded-xl bg-[#C0392B] hover:bg-[#96291D] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#C0392B]/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {busy ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin-custom" />
                    Verifying…
                  </>
                ) : (
                  <>
                    {mode === "register" ? "Confirm & Join Club" : "Confirm & Sign In"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {devCode && (
              <div className="mt-4 p-3.5 rounded-xl bg-[#FBF1DC] border border-[#C68A1E]/30 text-[#C68A1E] text-xs font-bold">
                Development Mode OTP: <span className="font-mono text-sm underline">{devCode}</span>
              </div>
            )}

            {err && (
              <div className="mt-4 p-3.5 rounded-xl bg-[#FBEAE7] border border-[#C0392B]/20 text-[#C0392B] text-sm font-semibold">
                {err}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Welcome Celebration Modal for New Registrations */}
      {showWelcomeModal && welcomeGift && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-center space-y-4">
            {/* Celebration Icon Header */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#C0392B] to-[#96291D] flex items-center justify-center text-white mx-auto shadow-xl shadow-[#C0392B]/30">
              <Sparkles className="w-8 h-8 text-[#FFD700]" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 text-xs font-black uppercase tracking-wider">
                Membership Activated!
              </span>
              <h3 className="text-2xl font-black text-[#1E1815] tracking-tight mt-2">
                Welcome to the Club!
              </h3>
              <p className="text-xs text-[#7A6E67] mt-1">
                Your account is ready! We&apos;ve credited your welcome gifts directly to your new digital card:
              </p>
            </div>

            {/* Gifts Unlocked Cards */}
            <div className="space-y-2.5 text-left">
              {/* Gift 1: Welcome Bonus Points */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C68A1E] to-[#9E690B] flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                  🪙
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm text-[#1E1815]">
                    +{welcomeGift.bonusPoints} Welcome Points
                  </div>
                  <div className="text-[11px] text-[#7A6E67]">
                    Credited to wallet (Worth {welcomeGift.currency} {Number(welcomeGift.pointsAedValue || 0).toFixed(2)})
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] text-[10px] font-extrabold shrink-0">
                  Added!
                </span>
              </div>

              {/* Gift 2: Welcome Discount Voucher */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C0392B] to-[#96291D] flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                  🏷️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm text-[#1E1815]">
                    {welcomeGift.discountPercent}% Welcome Voucher
                  </div>
                  <div className="text-[11px] text-[#7A6E67]">
                    Ready to use on your first dining order
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] text-[10px] font-extrabold shrink-0">
                  Unlocked!
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-sm shadow-xl shadow-[#C0392B]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Open My Digital VIP Card</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
