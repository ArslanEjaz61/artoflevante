"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/mobile";
import { Sparkles, ArrowRight, ShieldCheck, Phone, CheckCircle2, ChevronRight, Store, ArrowLeft } from "lucide-react";

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
    try {
      const b = new URLSearchParams(window.location.search).get("b");
      if (b) setBranchCode(b);
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => {
        setBranches(d.branches || []);
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
      router.push("/card");
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
                {mode === "register" ? "Instant 10% Welcome Reward" : "Welcome Back"}
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[var(--ink)]">
                {mode === "register" ? "Join the club" : "Sign in to your card"}
              </h2>
              <p className="text-sm text-[var(--ink-2)] mt-1.5 leading-relaxed">
                {mode === "register"
                  ? "Register once. Earn points & redeem treats at every branch."
                  : "Enter your mobile number to receive a secure login code."}
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
                    className="w-full px-4 py-3 text-base bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[#C0392B] transition-colors"
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
                    className="flex-1 min-w-0 px-4 py-3 text-base bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[#C0392B] transition-colors"
                    inputMode="tel"
                    placeholder="50 123 4567"
                    value={f.mobile}
                    onChange={setField("mobile")}
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
                      placeholder="you@example.com"
                      value={f.email}
                      onChange={setField("email")}
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="birthday">
                      Birthday <span className="text-[var(--ink-3)] font-normal normal-case">— for your birthday treat</span>
                    </label>
                    <input
                      id="birthday"
                      type="date"
                      className="w-full px-4 py-3 text-base bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#C0392B] transition-colors"
                      value={f.birthday}
                      onChange={setField("birthday")}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="branchCode">
                      Branch Code <span className="text-[var(--ink-3)] font-normal normal-case">— from table QR</span>
                    </label>
                    <input
                      id="branchCode"
                      inputMode="numeric"
                      maxLength={4}
                      className="w-full px-4 py-3 text-base bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[#C0392B] font-mono tracking-wider transition-colors"
                      placeholder="e.g. 1007"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                    />
                    {branchCode && (
                      <div className="mt-2 text-xs font-semibold">
                        {matchedBranch ? (
                          <div className="text-[#1E7A4D] flex items-center gap-1.5 bg-[#E3F2E9] p-2 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            {matchedBranch.name} — {matchedBranch.city}
                          </div>
                        ) : (
                          <div className="text-[#C0392B] bg-[#FBEAE7] p-2 rounded-lg">
                            Code not recognised. Select below instead.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="branch">
                      {matchedBranch ? "Selected Home Branch" : "Select Your Home Branch"}
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
                    Sending Code…
                  </>
                ) : (
                  <>
                    Send Verification Code
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
                    className="font-bold text-[#C0392B] hover:underline"
                  >
                    Sign in
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
                    className="font-bold text-[#C0392B] hover:underline"
                  >
                    Join now
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
                    Confirm & View Card
                    <ChevronRight className="w-4 h-4" />
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

      {/* Footer Navigation Links */}
      <footer className="w-full flex items-center justify-center gap-6 mt-8 text-xs font-semibold text-[var(--ink-3)]">
        <a href="/staff" className="hover:text-[#C0392B] transition-colors">
          Staff Till Sign-in →
        </a>
        <span>·</span>
        <a href="/admin" className="hover:text-[#C0392B] transition-colors">
          Management Admin →
        </a>
      </footer>
    </div>
  );
}
