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
  Store,
  ArrowLeft,
  Coins,
  Ticket,
  X,
  RotateCw,
} from "lucide-react";
import { usePwaInstall } from "@/lib/usePwaInstall";
import { InstallGuideModal } from "@/components/InstallGuideModal";

const BRAND = process.env.NEXT_PUBLIC_APP_NAME || "Bombay Chowpatty Loyalty";

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
  const { triggerInstall, isInstallable, isInstalled, isIos } = usePwaInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [view, setView] = useState<"hero" | "form" | "code">("hero");
  const [mode, setMode] = useState<"register" | "login">("register");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [toast, setToast] = useState<string | null>(null);
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
  const [resendTimer, setResendTimer] = useState(30);
  const [resendSuccess, setResendSuccess] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let interval: any;
    if (view === "code" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, resendTimer]);

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
          setView("form");
        } else if (window.location.search.includes("mode=register")) {
          setMode("register");
          setView("form");
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

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "Bombay Chowpatty Loyalty",
          text: "Join Bombay Chowpatty Loyalty Club and get an instant 10% discount on your first order!",
          url: window.location.origin,
        })
        .catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin);
      setToast("Invite link copied to clipboard!");
      setTimeout(() => setToast(null), 3000);
    }
  }

  async function handleInstall() {
    if (isInstallable) {
      const outcome = await triggerInstall();
      if (outcome === "accepted") {
        setToast("App installed successfully! Shortcut added to home screen.");
        setTimeout(() => setToast(null), 4000);
        return;
      }
    }
    // Open the sleek install guide modal with exact instructions for their device
    setShowInstallGuide(true);
  }

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setErr("");
    setResendSuccess("");
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
      setResendTimer(30);
      setView("code");
    } catch (e2: any) {
      setErr(String(e2.message || e2));
    } finally {
      setBusy(false);
    }
  }

  async function handleResendCode() {
    if (resending || resendTimer > 0) return;
    setResending(true);
    setErr("");
    setResendSuccess("");
    try {
      const r = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, mode }),
      });
      const d = await r.json();
      if (!r.ok) {
        throw new Error(d.error || "Could not resend code.");
      }
      setDevCode(d.devCode || "");
      setResendTimer(30);
      setResendSuccess("A new verification code has been sent!");
    } catch (e2: any) {
      setErr(String(e2.message || e2));
    } finally {
      setResending(false);
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
    <div className="min-h-screen bg-[#EDE7DF] flex flex-col items-center justify-center p-3 sm:p-5 max-w-md mx-auto selection:bg-[#801313] selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1E1815] text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-[#E5A93C]" />
          <span>{toast}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. HERO ONBOARDING VIEW (Exact design matching reference)      */}
      {/* ============================================================== */}
      {view === "hero" && (
        // The welcome screen is the supplied artwork itself. The tappable areas
        // are transparent overlays positioned as percentages of the image, so
        // they stay aligned at any width.
        <div className="w-full relative overflow-hidden rounded-[28px] shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/welcome-art.jpg"
            alt={`${BRAND} — join and get ${programInfo.welcomeDiscountPercent}% off your first order`}
            className="w-full h-auto block select-none"
            draggable={false}
          />

          <button
            onClick={() => {
              setMode("register");
              setView("form");
              setErr("");
            }}
            aria-label="Join now"
            className="absolute rounded-full cursor-pointer transition-colors hover:bg-white/10 active:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FEF7C5]"
            style={{ left: "17.75%", top: "65.72%", width: "62.97%", height: "7.73%" }}
          />

          <button
            onClick={() => {
              setMode("login");
              setView("form");
              setErr("");
            }}
            aria-label="View my rewards"
            className="absolute rounded-md cursor-pointer transition-colors hover:bg-white/10 active:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FEF7C5]"
            style={{ left: "51.48%", top: "75.14%", width: "36.69%", height: "3.25%" }}
          />

          <button
            onClick={handleShare}
            aria-label="Treat a friend"
            className="absolute rounded-xl cursor-pointer transition-colors hover:bg-white/10 active:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FEF7C5]"
            style={{ left: "12.09%", top: "82.96%", width: "37.16%", height: "12.89%" }}
          />

          <button
            onClick={handleInstall}
            aria-label="Get the loyalty app"
            className="absolute rounded-xl cursor-pointer transition-colors hover:bg-white/10 active:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FEF7C5]"
            style={{ left: "51.02%", top: "82.27%", width: "40.17%", height: "13.99%" }}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. REGISTRATION & LOGIN FORM VIEW                              */}
      {/* ============================================================== */}
      {view === "form" && (
        <div className="w-full bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-[#EAE3DC] transition-all">
          {/* Back to Hero Button */}
          <button
            onClick={() => {
              setView("hero");
              setErr("");
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A6E67] hover:text-[#1E1815] mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {/* Brand Header inside Form */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] to-[#AA7C11] shrink-0">
              <div className="w-full h-full rounded-full bg-[#801313] overflow-hidden flex items-center justify-center p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/lofoe.png"
                  alt="Bombay Chowpatty"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div>
              <div className="text-[9px] font-extrabold tracking-widest text-[#801313] uppercase">
                BOMBAY CHOWPATTY
              </div>
              <h2 className="text-xl font-black text-[#1E1815] leading-tight">
                {mode === "register" ? "Join the Loyalty Club" : "Sign In to Your Card"}
              </h2>
            </div>
          </div>

          <p className="text-xs text-[#7A6E67] mb-5 leading-relaxed">
            {mode === "register"
              ? `Register to unlock an instant ${programInfo.welcomeDiscountPercent}% welcome voucher and earn points on every dining visit.`
              : "Enter your registered mobile number to receive a secure login code."}
          </p>

          <form onSubmit={sendCode} className="space-y-3.5">
            {mode === "register" && (
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Imran Sheikh"
                  value={f.name}
                  onChange={setField("name")}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#801313] font-medium"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <select
                  aria-label="Country Code"
                  value={f.countryCode}
                  onChange={setField("countryCode")}
                  className="w-28 px-2.5 py-2.5 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#801313] font-bold"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} +{c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="501234567"
                  value={f.mobile}
                  onChange={handleMobileChange}
                  className="flex-1 min-w-0 px-3.5 py-2.5 text-sm bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] font-mono font-bold focus:outline-none focus:border-[#801313]"
                  required
                />
              </div>
            </div>

            {mode === "register" && (
              <>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={f.email}
                    onChange={setField("email")}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#801313]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">
                    Birthday (for birthday surprises)
                  </label>
                  <input
                    type="date"
                    value={f.birthday}
                    onChange={setField("birthday")}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#801313]"
                  />
                </div>

                {branches.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">
                      Preferred Home Branch
                    </label>
                    <select
                      value={f.branchId}
                      onChange={setField("branchId")}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#801313] font-bold"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} {b.city ? `(${b.city})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 px-4 rounded-xl bg-[#801313] hover:bg-[#6A0F0F] text-white font-black text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-2"
            >
              {busy ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Sending Code…
                </>
              ) : (
                <>
                  <span>{mode === "register" ? "Register & Get Voucher" : "Send Verification Code"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {err && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
              {err}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-[#EAE3DC] text-center text-xs text-[#7A6E67]">
            {mode === "register" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErr("");
                  }}
                  className="font-bold text-[#801313] hover:underline cursor-pointer"
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
                  className="font-bold text-[#801313] hover:underline cursor-pointer"
                >
                  Join now & get rewards
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. VERIFICATION CODE (OTP) VIEW                                */}
      {/* ============================================================== */}
      {view === "code" && (
        <div className="w-full bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-[#EAE3DC] transition-all">
          <button
            onClick={() => {
              setView("form");
              setCode("");
              setErr("");
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A6E67] hover:text-[#1E1815] mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Change Number
          </button>

          <h2 className="text-xl font-black text-[#1E1815] mb-1">
            Enter 6-digit Code
          </h2>
          <p className="text-xs text-[#7A6E67] mb-5">
            We sent a verification code to{" "}
            <strong className="text-[#1E1815] font-bold">
              +{f.countryCode} {f.mobile}
            </strong>
          </p>

          <form onSubmit={verify} className="space-y-4">
            <div>
              <input
                className="w-full py-3.5 text-center text-3xl font-black tracking-[0.35em] bg-[#FAF7F4] border-2 border-[#EAE3DC] focus:border-[#801313] rounded-2xl text-[#1E1815] focus:outline-none transition-all font-mono"
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
              className="w-full py-3.5 px-6 rounded-xl bg-[#801313] hover:bg-[#6A0F0F] text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all cursor-pointer"
            >
              {busy ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <span>{mode === "register" ? "Confirm & Join Club" : "Confirm & Sign In"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs">
              {resendTimer > 0 ? (
                <span className="text-[#7A6E67] font-medium">
                  Didn&apos;t receive code? Resend in{" "}
                  <strong className="text-[#1E1815] font-bold">{resendTimer}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="font-bold text-[#801313] hover:underline cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                  {resending ? "Resending Code…" : "Resend Verification Code"}
                </button>
              )}
            </div>
          </form>

          {resendSuccess && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {resendSuccess}
            </div>
          )}

          {devCode && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              Development OTP: <span className="font-mono text-sm underline">{devCode}</span>
            </div>
          )}

          {err && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
              {err}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. WELCOME CELEBRATION MODAL FOR NEW REGISTRATIONS             */}
      {/* ============================================================== */}
      {showWelcomeModal && welcomeGift && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-center space-y-4">
            {/* Celebration Mascot Header */}
            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#D4AF37] to-[#AA7C11] mx-auto shadow-lg">
              <div className="w-full h-full rounded-full bg-[#801313] overflow-hidden flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/lofoe.png"
                  alt="Bombay Chowpatty"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                Membership Activated!
              </span>
              <h3 className="text-2xl font-black text-[#1E1815] tracking-tight mt-2">
                Welcome to Bombay Chowpatty!
              </h3>
              <p className="text-xs text-[#7A6E67] mt-1">
                Your account is ready! We&apos;ve credited your welcome gifts directly to your new digital card:
              </p>
            </div>

            {/* Gifts Unlocked Cards */}
            <div className="space-y-2.5 text-left">
              {/* Gift 1: Welcome Bonus Points */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C68A1E] to-[#9E690B] flex items-center justify-center text-white font-bold text-lg shadow-xs shrink-0">
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
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold shrink-0">
                  Added!
                </span>
              </div>

              {/* Gift 2: Welcome Discount Voucher */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#801313] to-[#550B0B] flex items-center justify-center text-white font-bold text-lg shadow-xs shrink-0">
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
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold shrink-0">
                  Unlocked!
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#801313] hover:bg-[#6A0F0F] text-white font-black text-sm uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Open My Digital Card</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Guide Modal */}
      <InstallGuideModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        onTriggerNative={triggerInstall}
        isNativeAvailable={isInstallable}
      />
    </div>
  );
}
