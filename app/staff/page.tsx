"use client";

import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import {
  Camera,
  Search,
  CheckCircle2,
  AlertCircle,
  Receipt,
  User,
  Sparkles,
  ArrowRight,
  LogOut,
  X,
  CreditCard,
  Building,
} from "lucide-react";

export default function StaffPage() {
  const [staff, setStaff] = useState<any>(null);
  const [login, setLogin] = useState({ username: "", pin: "" });
  const [scanned, setScanned] = useState<any>(null);
  const [manualToken, setManualToken] = useState("");
  const [bill, setBill] = useState({ invoiceNumber: "", amount: "", redeemRewardId: "" });
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [scanning, setScanning] = useState(false);
  const [canScan, setCanScan] = useState(false);
  const [scanHint, setScanHint] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCanScan(
      typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia)
    );
    return () => stopCamera();
  }, []);

  function stopCamera() {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
    setScanHint("");
  }

  async function startCamera() {
    setErr("");
    setScanHint("Starting camera…");
    setScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error("Video element missing");

      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.muted = true;

      await new Promise<void>((resolve) => {
        if (video.readyState >= 1) return resolve();
        video.onloadedmetadata = () => resolve();
        setTimeout(resolve, 3000);
      });

      try {
        await video.play();
      } catch {
        setScanHint("Tap the video to start the camera stream");
      }

      setScanHint("Point camera at customer's QR code");

      const detector =
        typeof window !== "undefined" && "BarcodeDetector" in window
          ? new (window as any).BarcodeDetector({ formats: ["qr_code"] })
          : null;

      loopRef.current = setInterval(async () => {
        const v = videoRef.current;
        if (!v || v.readyState < 2 || !v.videoWidth) return;

        let value: string | null = null;

        if (detector) {
          try {
            const codes = await detector.detect(v);
            if (codes.length > 0) value = codes[0].rawValue;
          } catch {}
        } else {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const w = v.videoWidth;
          const h = v.videoHeight;
          if (!w || !h) return;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;
          ctx.drawImage(v, 0, 0, w, h);
          try {
            const img = ctx.getImageData(0, 0, w, h);
            const found = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
            if (found?.data) value = found.data;
          } catch {}
        }

        if (value) {
          stopCamera();
          doScan(value);
        }
      }, 300);
    } catch {
      setErr("Could not open camera. Please enter code manually.");
      setScanning(false);
    }
  }

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not sign in.");
      setStaff(d.staff);
    } catch (e2: any) {
      setErr(String(e2.message || e2));
    } finally {
      setBusy(false);
    }
  }

  async function doScan(token: string) {
    setBusy(true);
    setErr("");
    setResult(null);
    try {
      const r = await fetch("/api/staff/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not read that code.");
      setScanned(d);
      setManualToken("");
    } catch (e2: any) {
      setErr(String(e2.message || e2));
    } finally {
      setBusy(false);
    }
  }

  async function doSearch(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setResult(null);
    try {
      const r = await fetch(`/api/staff/search?q=${encodeURIComponent(search.trim())}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not search.");
      setSearchResults(d.customers);
    } catch (e2: any) {
      setErr(String(e2.message || e2));
    } finally {
      setBusy(false);
    }
  }

  function pickCustomer(c: any) {
    setScanned({ token: null, customer: c, availableRewards: c.availableRewards });
    setSearchResults(null);
    setSearch("");
  }

  async function submitBill(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/staff/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: scanned.token || undefined,
          customerId: scanned.token ? undefined : scanned.customer.id,
          invoiceNumber: bill.invoiceNumber,
          amount: bill.amount,
          redeemRewardId: bill.redeemRewardId || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not save bill transaction.");
      setResult(d);
      setScanned(null);
      setBill({ invoiceNumber: "", amount: "", redeemRewardId: "" });
    } catch (e2: any) {
      setErr(String(e2.message || e2));
    } finally {
      setBusy(false);
    }
  }

  // Signed out state
  if (!staff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-md mx-auto">
        <div className="w-full flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#1E7A4D] flex items-center justify-center text-white font-extrabold text-base shadow-md">
            ST
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[var(--ink)] leading-none">Staff Till POS</h1>
            <p className="text-xs font-semibold text-[var(--ink-3)] uppercase tracking-wider mt-1">
              Counter Terminal Sign-In
            </p>
          </div>
        </div>

        <div className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/[0.03]">
          <h2 className="text-2xl font-black text-[var(--ink)] mb-2">Cashier Login</h2>
          <p className="text-sm text-[var(--ink-2)] mb-6">Enter your counter username and PIN.</p>

          <form onSubmit={doLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="su">
                Username
              </label>
              <input
                id="su"
                className="w-full px-4 py-3 text-base bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#1E7A4D]"
                value={login.username}
                onChange={(e) => setLogin({ ...login, username: e.target.value })}
                autoComplete="username"
                placeholder="e.g. cashier or manager"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="sp">
                PIN Code
              </label>
              <input
                id="sp"
                type="password"
                inputMode="numeric"
                className="w-full px-4 py-3 text-base bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#1E7A4D] font-mono tracking-widest"
                value={login.pin}
                onChange={(e) => setLogin({ ...login, pin: e.target.value })}
                placeholder="••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 px-6 rounded-xl bg-[#1E7A4D] hover:bg-[#155A38] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#1E7A4D]/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              {busy ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin-custom" />
                  Verifying PIN…
                </>
              ) : (
                "Sign In to Till"
              )}
            </button>
          </form>

          {err && (
            <div className="mt-4 p-3.5 rounded-xl bg-[#FBEAE7] border border-[#C0392B]/20 text-[#C0392B] text-sm font-semibold">
              {err}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-[var(--line)] text-center text-xs text-[var(--ink-3)]">
            Default Demo PINs: <span className="font-mono text-[var(--ink)] font-bold">cashier (112233)</span> ·{" "}
            <span className="font-mono text-[var(--ink)] font-bold">manager (135790)</span>
          </div>
        </div>
      </div>
    );
  }

  // Signed in state
  return (
    <div className="min-h-screen pb-16 px-4 pt-6 max-w-md mx-auto">
      {/* Staff Bar */}
      <header className="flex items-center justify-between bg-[var(--surface)] border border-[var(--line)] p-4 rounded-2xl mb-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E7A4D] text-white font-extrabold flex items-center justify-center text-sm">
            ST
          </div>
          <div>
            <div className="text-sm font-extrabold text-[var(--ink)]">{staff.name}</div>
            <div className="text-xs text-[var(--ink-3)] font-semibold flex items-center gap-1">
              <Building className="w-3 h-3" />
              {staff.branch ? `${staff.branch.name} · ${staff.branch.city}` : staff.role}
            </div>
          </div>
        </div>
        <button
          onClick={() => setStaff(null)}
          className="p-2 text-[var(--ink-3)] hover:text-[#C0392B] rounded-lg hover:bg-[var(--surface-subtle)]"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Transaction Result Success Modal/Card */}
      {result && (
        <div className="bg-[var(--surface)] border-2 border-[#1E7A4D] rounded-3xl p-6 mb-5 shadow-lg">
          <div className="flex items-center gap-2.5 text-[#1E7A4D] font-extrabold text-base mb-2">
            <CheckCircle2 className="w-6 h-6" /> Sale Saved Successfully!
          </div>
          <p className="text-sm text-[var(--ink-2)] mb-4">
            <strong className="text-[var(--ink)]">{result.customer.name}</strong> now has{" "}
            <span className="font-extrabold text-[#C0392B]">{result.customer.pointsBalance} points</span> and{" "}
            <strong>{result.customer.visitCount} visits</strong>.
          </p>

          <div className="p-3.5 bg-[var(--surface-subtle)] rounded-2xl text-sm space-y-1.5 mb-4">
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">Invoice</span>
              <span className="font-bold font-mono">{result.transaction.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">Points Earned</span>
              <span className="font-bold text-[#1E7A4D]">+{result.transaction.pointsEarned} pts</span>
            </div>
            {result.redeemed && (
              <div className="flex justify-between text-[#C68A1E]">
                <span className="font-semibold">Reward Redeemed</span>
                <span className="font-bold">{result.redeemed.name}</span>
              </div>
            )}
          </div>

          {result.newRewards?.length > 0 && (
            <div className="mb-4 space-y-2">
              <div className="text-xs font-bold uppercase text-[#C68A1E]">Unlocked New Rewards:</div>
              {result.newRewards.map((n: any) => (
                <div key={n.id} className="p-2.5 rounded-xl bg-[#FBF1DC] text-xs text-[#C68A1E] font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <div>
                    <div>{n.name}</div>
                    <div className="font-normal text-[11px] opacity-80">{n.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setResult(null)}
            className="w-full py-3 rounded-xl bg-[#1E7A4D] text-white font-bold text-sm cursor-pointer"
          >
            Process Next Customer
          </button>
        </div>
      )}

      {/* Lookup / Scanner Mode */}
      {!scanned && !result && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-[var(--ink)] mb-1">Scan Customer Card</h2>
          <p className="text-xs text-[var(--ink-2)] mb-5">
            Scan the customer&apos;s digital card or type the 8-character code.
          </p>

          {/* Camera Scanner Viewport */}
          {scanning ? (
            <div className="mb-4">
              <div className="relative w-full aspect-[3/4] max-h-[50vh] rounded-2xl overflow-hidden bg-black mb-3">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover"
                  onClick={() => videoRef.current?.play().catch(() => {})}
                />
                {/* Visual Camera Scan Guide Bracket */}
                <div className="absolute inset-12 border-2 border-white/90 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] pointer-events-none" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              {scanHint && <p className="text-center text-xs font-semibold text-[var(--ink-2)] mb-3">{scanHint}</p>}
              <button
                onClick={stopCamera}
                className="w-full py-2.5 rounded-xl border border-[var(--line-2)] text-xs font-bold text-[var(--ink-2)]"
              >
                Cancel Camera Scan
              </button>
            </div>
          ) : (
            canScan && (
              <button
                onClick={startCamera}
                className="w-full py-3 px-4 rounded-xl bg-[#C0392B] hover:bg-[#96291D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#C0392B]/20 mb-4 cursor-pointer"
              >
                <Camera className="w-4 h-4" /> Open Camera Scanner
              </button>
            )
          )}

          {/* Manual Code Lookup */}
          {!scanning && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="ctok">
                  Or Type 8-Character Card Code
                </label>
                <input
                  id="ctok"
                  className="w-full py-3 px-4 text-center text-xl font-mono font-black tracking-[0.2em] bg-[var(--surface-subtle)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#1E7A4D] uppercase"
                  placeholder="e.g. K7M2 9XPQ"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value.toUpperCase())}
                />
              </div>
              <button
                disabled={busy || !manualToken.trim()}
                onClick={() => doScan(manualToken)}
                className="w-full py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--line-2)] text-xs font-bold text-[var(--ink)] hover:bg-[#1E7A4D] hover:text-white hover:border-[#1E7A4D] disabled:opacity-40 transition-all cursor-pointer"
              >
                {busy ? "Looking up…" : "Look Up Code"}
              </button>

              {/* Customer Search Fallback */}
              <div className="pt-4 border-t border-[var(--line)]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="cs">
                  No Card Handy? Search by Name or Mobile
                </label>
                <form onSubmit={doSearch} className="flex gap-2">
                  <input
                    id="cs"
                    className="flex-1 px-3 py-2 text-sm bg-[var(--surface-subtle)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#1E7A4D]"
                    placeholder="e.g. Imran or 50 123 4567"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={busy || search.trim().length < 3}
                    className="px-4 py-2 bg-[#1E7A4D] text-white rounded-xl text-xs font-bold disabled:opacity-40"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </form>

                {searchResults && (
                  <div className="mt-3 space-y-2">
                    {searchResults.length === 0 ? (
                      <div className="text-center py-3 text-xs text-[var(--ink-3)]">No customer found.</div>
                    ) : (
                      searchResults.map((c: any) => (
                        <button
                          key={c.id}
                          onClick={() => pickCustomer(c)}
                          className="w-full text-left p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--line)] flex items-center justify-between hover:border-[#1E7A4D] transition-all"
                        >
                          <div>
                            <div className="font-bold text-sm text-[var(--ink)]">{c.name}</div>
                            <div className="text-xs text-[var(--ink-3)]">
                              {c.mobile} · {c.pointsBalance} pts · {c.visitCount} visits
                            </div>
                          </div>
                          <span className="text-xs font-bold text-[#1E7A4D]">Select →</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {err && (
            <div className="mt-4 p-3.5 rounded-xl bg-[#FBEAE7] border border-[#C0392B]/20 text-[#C0392B] text-xs font-semibold">
              {err}
            </div>
          )}
        </div>
      )}

      {/* Bill Entry Stage (When Customer is Scanned/Selected) */}
      {scanned && (
        <div className="space-y-4">
          {/* Customer Profile Banner */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#C0392B] text-white flex items-center justify-center font-bold text-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[var(--ink)]">{scanned.customer.name}</h3>
                  <div className="text-xs text-[var(--ink-3)]">+{scanned.customer.mobile}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setScanned(null);
                  setErr("");
                }}
                className="p-1.5 rounded-lg text-[var(--ink-3)] hover:text-[#C0392B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-[var(--surface-subtle)]">
                <div className="font-black text-sm text-[#C0392B]">{scanned.customer.pointsBalance}</div>
                <div className="text-[10px] text-[var(--ink-3)] uppercase">Points</div>
              </div>
              <div className="p-2 rounded-xl bg-[var(--surface-subtle)]">
                <div className="font-black text-sm text-[var(--ink)]">{scanned.customer.visitCount}</div>
                <div className="text-[10px] text-[var(--ink-3)] uppercase">Visits</div>
              </div>
              <div className="p-2 rounded-xl bg-[var(--surface-subtle)]">
                <div className="font-black text-sm text-[var(--ink)]">{Math.round(scanned.customer.totalSpend)}</div>
                <div className="text-[10px] text-[var(--ink-3)] uppercase">Spent</div>
              </div>
            </div>
          </div>

          {/* Record Bill Form */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-[var(--ink)] mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#1E7A4D]" /> Record Visit & Sale
            </h3>

            <form onSubmit={submitBill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="inv">
                  Invoice Number
                </label>
                <input
                  id="inv"
                  className="w-full px-4 py-3 text-base bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#1E7A4D] font-mono uppercase"
                  placeholder="e.g. INV-2026-99"
                  value={bill.invoiceNumber}
                  onChange={(e) => setBill({ ...bill, invoiceNumber: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="amt">
                  Bill Amount (AED)
                </label>
                <input
                  id="amt"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className="w-full px-4 py-3 text-base bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#1E7A4D] font-mono text-lg font-bold"
                  placeholder="e.g. 150.00"
                  value={bill.amount}
                  onChange={(e) => setBill({ ...bill, amount: e.target.value })}
                  required
                />
              </div>

              {scanned.availableRewards.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-2)] mb-1.5" htmlFor="rw">
                    Redeem Available Reward <span className="text-[var(--ink-3)] font-normal normal-case">(optional)</span>
                  </label>
                  <select
                    id="rw"
                    className="w-full px-3 py-3 text-sm bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#1E7A4D] font-medium"
                    value={bill.redeemRewardId}
                    onChange={(e) => setBill({ ...bill, redeemRewardId: e.target.value })}
                  >
                    <option value="">No reward discount applied</option>
                    {scanned.availableRewards.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.isPercent ? `— ${r.value}% OFF` : r.value ? `— AED ${r.value} OFF` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 px-6 rounded-xl bg-[#1E7A4D] hover:bg-[#155A38] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#1E7A4D]/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {busy ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin-custom" />
                    Recording Sale…
                  </>
                ) : (
                  <>
                    Complete Visit & Award Points
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {err && (
              <div className="mt-4 p-3.5 rounded-xl bg-[#FBEAE7] border border-[#C0392B]/20 text-[#C0392B] text-xs font-semibold">
                {err}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
