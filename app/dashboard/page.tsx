"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  QrCode,
  Gift,
  Clock,
  User,
  History,
  Tag,
  ChevronRight,
  RefreshCw,
  LogOut,
  Edit3,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Ticket,
  Check,
  X,
  Coins,
  Zap,
  Receipt,
  Award,
} from "lucide-react";

const BRAND = process.env.NEXT_PUBLIC_APP_NAME || "Loyalty Club";

function formatRelativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", birthday: "" });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Branch Visit Verification & Bill Popup
  const [visitCodeInput, setVisitCodeInput] = useState("");
  const [checkingCode, setCheckingCode] = useState(false);
  const [verifiedBranch, setVerifiedBranch] = useState<{ id: string; name: string; code: string; city?: string } | null>(null);
  const [verifiedCoupon, setVerifiedCoupon] = useState("");
  const [showBillModal, setShowBillModal] = useState(false);
  const [invoiceInput, setInvoiceInput] = useState("");
  const [billAmountInput, setBillAmountInput] = useState("");
  const [billSubmitting, setBillSubmitting] = useState(false);
  const [modalErr, setModalErr] = useState("");
  const [visitMsg, setVisitMsg] = useState<{ type: "ok" | "err"; text: string; details?: any } | null>(null);

  // Step 1: Check if coupon code is valid
  async function handleCheckCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!visitCodeInput.trim()) {
      setVisitMsg({ type: "err", text: "Please enter the branch 24h coupon code first." });
      return;
    }

    setCheckingCode(true);
    setVisitMsg(null);
    try {
      const r = await fetch("/api/visits/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: visitCodeInput.trim() }),
      });
      const d = await r.json();
      if (!r.ok) {
        throw new Error(d.error || "Invalid branch coupon code.");
      }

      setVerifiedBranch(d.branch);
      setVerifiedCoupon(d.couponCode);
      setInvoiceInput("");
      setBillAmountInput("");
      setModalErr("");
      setShowBillModal(true);
    } catch (err2: any) {
      setVisitMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setCheckingCode(false);
    }
  }

  // Step 2: Confirm Invoice & Bill in Popup Modal
  async function handleConfirmBill(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceInput.trim()) {
      setModalErr("Please enter the invoice / receipt number (e.g. INV-1002).");
      return;
    }
    if (!billAmountInput || Number(billAmountInput) <= 0) {
      setModalErr("Please enter a valid bill payment amount (e.g. 50.00).");
      return;
    }

    setBillSubmitting(true);
    setModalErr("");
    try {
      const r = await fetch("/api/visits/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: verifiedCoupon || visitCodeInput.trim(),
          invoiceNumber: invoiceInput.trim(),
          amount: Number(billAmountInput),
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        throw new Error(d.error || "Could not record visit and bill.");
      }

      setShowBillModal(false);
      setVisitCodeInput("");
      setInvoiceInput("");
      setBillAmountInput("");
      setVerifiedBranch(null);
      setVisitMsg({
        type: "ok",
        text: d.message || "Visit & bill recorded successfully!",
        details: d,
      });
      loadCard();
    } catch (err3: any) {
      setModalErr(String(err3.message || err3));
    } finally {
      setBillSubmitting(false);
    }
  }

  const loadCard = useCallback(async () => {
    try {
      const r = await fetch("/api/card");
      if (r.status === 401) {
        router.push("/login");
        return;
      }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not load your loyalty card.");
      setData(d);
    } catch (e: any) {
      setErr(String(e.message || e));
    }
  }, [router]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  // Refresh QR code before expiration
  useEffect(() => {
    if (!data?.qr?.ttlSeconds) return undefined;
    const ms = Math.max((data.qr.ttlSeconds - 10) * 1000, 15000);
    const interval = setInterval(loadCard, ms);
    return () => clearInterval(interval);
  }, [data?.qr?.ttlSeconds, loadCard]);

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-[#C0392B] mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Notice</h2>
          <p className="text-sm text-[var(--ink-2)] mb-4">{err}</p>
          <button
            onClick={() => router.push("/login")}
            className="py-2.5 px-6 rounded-xl bg-[#C0392B] text-white font-bold text-sm"
          >
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-md mx-auto">
        <div className="w-8 h-8 border-3 border-[#C0392B]/30 border-t-[#C0392B] rounded-full animate-spin-custom mb-3" />
        <p className="text-sm font-semibold text-[var(--ink-2)]">Loading your card…</p>
      </div>
    );
  }

  const { customer, qr, rewards, transactions, offers, nextTargets, currency, loyaltyRules, redemptionStatus } = data;
  const availableRewards = rewards.filter((r: any) => r.status === "AVAILABLE");
  const usedRewards = rewards.filter((r: any) => r.status !== "AVAILABLE");

  function openEditor() {
    setProfile({
      name: customer.name || "",
      email: customer.email || "",
      birthday: customer.birthday ? String(customer.birthday).slice(0, 10) : "",
    });
    setProfileMsg(null);
    setEditing(true);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not save details.");
      setProfileMsg({ type: "ok", text: "Profile updated successfully." });
      setEditing(false);
      loadCard();
    } catch (e2: any) {
      setProfileMsg({ type: "err", text: String(e2.message || e2) });
    } finally {
      setProfileBusy(false);
    }
  }

  return (
    <div className="min-h-screen pb-16 px-4 pt-6 max-w-md mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C0392B] flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-[#C0392B]/20">
            LC
          </div>
          <div>
            <div className="text-base font-extrabold text-[var(--ink)] leading-none">{BRAND}</div>
            <div className="text-xs font-semibold text-[var(--ink-3)] uppercase tracking-wider mt-0.5">
              {customer.homeBranch ? `${customer.homeBranch.name} · ${customer.homeBranch.city}` : "Loyalty Member"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={loadCard}
            className="p-2 rounded-xl text-[var(--ink-2)] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--line)] transition-all cursor-pointer"
            title="Refresh Card"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <a
            href="/api/auth/logout"
            className="p-2 rounded-xl text-[var(--ink-3)] hover:text-[#C0392B] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--line)] transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Digital Loyalty Card (Luxury Red VIP Aesthetic) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#C0392B] via-[#A92D21] to-[#801D13] p-5 sm:p-6 text-white shadow-2xl shadow-[#C0392B]/30 mb-4">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-between text-xs font-semibold text-white/80 mb-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#E5A844]" /> VIP Member
            </span>
            <span>
              Since{" "}
              {new Date(customer.memberSince).toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-3">{customer.name}</h1>

          {/* Compact QR Code Container */}
          <div className="bg-white p-2.5 rounded-2xl shadow-lg leading-none mb-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.image} alt="Loyalty Card QR" className="w-32 h-32 sm:w-36 sm:h-36 rounded-lg block" />
          </div>

          {/* 8-character manual code */}
          <div className="text-xl sm:text-2xl font-mono font-black tracking-[0.2em] text-white">
            {qr.code}
          </div>
          <p className="text-[10px] sm:text-[11px] text-white/75 font-medium mt-1">
            Show code to cashier · Auto-refreshes every 3 mins
          </p>
        </div>
      </div>

      {/* Branch Visit Check-in Banner / Form (Directly below QR Card) */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-4 sm:p-5 mb-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C0392B]/10 text-[#C0392B] flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[var(--ink)] leading-tight">
                Dine-in Visit & Bill Check-in
              </div>
              <div className="text-[11px] text-[var(--ink-3)]">
                Enter today&apos;s 24H branch coupon code to verify & record your bill
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] text-[10px] font-black uppercase">
            Earn Points
          </span>
        </div>

        {visitMsg && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold space-y-1.5 ${
              visitMsg.type === "ok"
                ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/25"
                : "bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/25"
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                {visitMsg.type === "ok" ? <CheckCircle2 className="w-4 h-4 text-[#1E7A4D]" /> : <AlertCircle className="w-4 h-4 text-[#C0392B]" />}
                {visitMsg.text}
              </span>
              <button onClick={() => setVisitMsg(null)} className="p-0.5 hover:opacity-75">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {visitMsg.details?.transaction && (
              <div className="text-[11px] text-[#1E7A4D]/90 pt-1 border-t border-[#1E7A4D]/20 flex items-center justify-between">
                <span>Invoice #{visitMsg.details.transaction.invoiceNumber} · {currency} {visitMsg.details.transaction.amount}</span>
                <span className="font-extrabold">+{visitMsg.details.transaction.pointsEarned} Points Added</span>
              </div>
            )}
            {visitMsg.details?.newRewards?.length > 0 && (
              <div className="text-[11px] bg-[#1E7A4D]/15 p-2 rounded-xl text-[#1E7A4D] font-bold flex items-center gap-1.5 mt-1">
                <Sparkles className="w-3.5 h-3.5" />
                Unlocked Reward: {visitMsg.details.newRewards[0].name}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleCheckCoupon} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="e.g. 1015-7K9A"
              value={visitCodeInput}
              onChange={(e) => setVisitCodeInput(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-xl font-mono text-xs font-bold text-[var(--ink)] placeholder-[var(--ink-3)] uppercase focus:outline-none focus:border-[#C0392B]"
              required
            />
            <Ticket className="w-3.5 h-3.5 text-[var(--ink-3)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            type="submit"
            disabled={checkingCode || !visitCodeInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50 cursor-pointer shrink-0 transition-all flex items-center gap-1.5"
          >
            {checkingCode ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Checking…
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Check Code
              </>
            )}
          </button>
        </form>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5 text-center shadow-sm">
          <div className="text-2xl font-black text-[#C0392B] leading-none">{customer.pointsBalance}</div>
          <div className="text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-wider mt-1.5">Points</div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5 text-center shadow-sm">
          <div className="text-2xl font-black text-[var(--ink)] leading-none">{customer.visitCount}</div>
          <div className="text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-wider mt-1.5">Visits</div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5 text-center shadow-sm">
          <div className="text-2xl font-black text-[var(--ink)] leading-none">{Math.round(customer.totalSpend)}</div>
          <div className="text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-wider mt-1.5">{currency} Spent</div>
        </div>
      </div>

      {/* Dynamic Points Cash Value & Reward Redemption Engine */}
      <div className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-subtle)] border border-[var(--line)] rounded-3xl p-5 mb-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E5A844]/15 text-[#C68A1E] flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[var(--ink-3)] uppercase tracking-wider">
                Points Cash Value
              </div>
              <div className="text-lg font-black text-[var(--ink)] leading-tight">
                {currency} {loyaltyRules?.pointsCashValue ?? "0.00"}
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] text-[11px] font-extrabold border border-[#1E7A4D]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#1E7A4D]" /> Active Perks
          </span>
        </div>

        {/* Unlocked Reward Banner if eligible */}
        {redemptionStatus?.isReadyToRedeem && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1E7A4D]/15 via-[#1E7A4D]/10 to-transparent border border-[#1E7A4D]/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#1E7A4D] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#1E7A4D]" />
                {currency} {redemptionStatus.unlockedValue} Discount Ready to Redeem!
              </span>
              <span className="text-[10px] font-bold uppercase bg-[#1E7A4D] text-white px-2 py-0.5 rounded-full">
                Unlocked
              </span>
            </div>
            <p className="text-[11px] text-[var(--ink-2)]">
              Show your VIP QR code to cashier at checkout to apply your cash discount on your bill.
            </p>
          </div>
        )}

        {/* Dynamic Redemption Progress Goal */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="font-extrabold text-[var(--ink)] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#C0392B]" />
              <span>{currency} {redemptionStatus?.nextTierValue || (loyaltyRules?.currencyValuePerRedemptionPoints || 10)} reward</span>
            </div>
            <span className="text-[11px] font-bold text-[#1E7A4D] bg-[#E3F2E9] px-2.5 py-0.5 rounded-full">
              {redemptionStatus?.pointsNeeded ?? (loyaltyRules?.pointsRequiredForRedemption || 100)} more points
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[var(--line)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#C0392B] to-[#96291D] h-full rounded-full transition-all duration-500"
              style={{ width: `${redemptionStatus?.progressPercent ?? 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-[var(--ink-3)] font-semibold">
            <span>
              {(redemptionStatus?.pointsBalance || 0) % (redemptionStatus?.pointsRequired || 100)} / {redemptionStatus?.pointsRequired || 100} pts ({redemptionStatus?.progressPercent ?? 0}%)
            </span>
            <span>
              Every {loyaltyRules?.pointsRequiredForRedemption || 100} pts = {currency} {loyaltyRules?.currencyValuePerRedemptionPoints || 10}
            </span>
          </div>
        </div>

        {/* Earning and Redemption Policy Transparency */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <div className="bg-[var(--surface)] p-2.5 rounded-xl text-left border border-[var(--line)]">
            <span className="block text-[10px] font-bold uppercase text-[var(--ink-3)]">Earning Rate</span>
            <span className="font-extrabold text-[var(--ink)]">
              +{loyaltyRules?.pointsEarnedPerSpend || 1} pt / {currency} {loyaltyRules?.spendAedForPoints || 10}
            </span>
          </div>
          <div className="bg-[var(--surface)] p-2.5 rounded-xl text-left border border-[var(--line)]">
            <span className="block text-[10px] font-bold uppercase text-[var(--ink-3)]">Redemption</span>
            <span className="font-extrabold text-[#1E7A4D]">
              {loyaltyRules?.pointsRequiredForRedemption || 100} pts = {currency} {loyaltyRules?.currencyValuePerRedemptionPoints || 10}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice & Bill Popup Modal (Opens only when coupon is verified) */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 shadow-2xl text-[var(--ink)] space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[var(--line)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C0392B] to-[#96291D] flex items-center justify-center text-white font-bold shadow-md shadow-[#C0392B]/30 shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-[var(--ink)] leading-tight">
                    Record Bill & Earn Points
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#1E7A4D]/10 text-[#1E7A4D] font-bold text-[10px] uppercase">
                      ✓ {verifiedBranch?.name || "Branch Verified"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[var(--surface-subtle)] border border-[var(--line)] font-mono font-bold text-[10px] text-[#C0392B]">
                      {verifiedCoupon}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBillModal(false)}
                className="p-1 rounded-xl text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error in modal */}
            {modalErr && (
              <div className="p-3 rounded-xl bg-[#C0392B]/10 border border-[#C0392B]/25 text-[#C0392B] text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalErr}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleConfirmBill} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-[var(--ink-2)] tracking-wider mb-1.5">
                  Invoice / Bill Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-1002"
                    value={invoiceInput}
                    onChange={(e) => setInvoiceInput(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-[var(--surface-subtle)] border border-[var(--line-2)] rounded-xl font-mono text-sm font-bold text-[var(--ink)] placeholder-[var(--ink-3)] uppercase focus:outline-none focus:border-[#C0392B]"
                    autoFocus
                  />
                  <Receipt className="w-4 h-4 text-[var(--ink-3)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[10px] text-[var(--ink-3)] mt-1 font-medium">
                  Enter unique receipt # from the cashier bill (no duplicate entries).
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[var(--ink-2)] tracking-wider mb-1.5">
                  Total Bill Payment ({currency}) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 150.00"
                    value={billAmountInput}
                    onChange={(e) => setBillAmountInput(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--surface-subtle)] border border-[var(--line-2)] rounded-xl text-sm font-bold text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[#C0392B]"
                  />
                  <Coins className="w-4 h-4 text-[var(--ink-3)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Dynamic live points preview */}
              {billAmountInput && Number(billAmountInput) > 0 && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-[#E5A844]/15 to-[#C68A1E]/10 border border-[#E5A844]/30 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E690B]">
                      Points to Earn
                    </div>
                    <div className="text-xs font-semibold text-[var(--ink-2)]">
                      Rate: 1 pt per {currency} {loyaltyRules?.spendAedForPoints || 10}
                    </div>
                  </div>
                  <div className="text-lg font-black text-[#C68A1E]">
                    +{Math.floor((Number(billAmountInput) / (loyaltyRules?.spendAedForPoints || 10)) * (loyaltyRules?.pointsEarnedPerSpend || 1))} pts
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--line)] text-xs font-bold text-[var(--ink-2)] hover:bg-[var(--line)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={billSubmitting || !invoiceInput.trim() || !billAmountInput || Number(billAmountInput) <= 0}
                  className="flex-[2] py-3 px-4 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {billSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adding Points…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      OK, Confirm & Earn Points
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Next Milestones ("Almost there") */}
      {nextTargets?.length > 0 && (
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--ink-2)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C68A1E]" /> Almost There
            </h2>
            <span className="text-[11px] font-semibold text-[var(--ink-3)]">Next Unlock Targets</span>
          </div>
          <div className="space-y-2.5">
            {nextTargets.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--line)]">
                <div>
                  <div className="font-bold text-sm text-[var(--ink)]">{t.name}</div>
                  {t.nameAr && <div className="text-xs text-[var(--ink-3)] font-semibold mt-0.5" dir="rtl">{t.nameAr}</div>}
                  {t.progressPercent !== undefined && (
                    <div className="text-[10px] text-[var(--ink-3)] mt-0.5">
                      {t.current ?? 0} of {t.threshold} {t.kind === "points" ? "pts" : "visits"} ({t.progressPercent}%)
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-[#1E7A4D] bg-[#E3F2E9] px-2.5 py-1 rounded-full shrink-0">
                  {t.need} more {t.kind === "points" ? "points" : t.need === 1 ? "visit" : "visits"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rewards Section */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-[var(--ink)] flex items-center gap-2">
            <Gift className="w-4 h-4 text-[#C68A1E]" /> Your Rewards & Vouchers
          </h2>
          <span className="text-xs font-bold text-[var(--ink-3)]">
            {availableRewards.length} Available
          </span>
        </div>

        {availableRewards.length === 0 && usedRewards.length === 0 ? (
          <div className="py-6 text-center text-sm text-[var(--ink-3)]">
            No rewards yet. They unlock automatically as you visit and dine!
          </div>
        ) : (
          <div className="space-y-3">
            {availableRewards.map((r: any) => (
              <div
                key={r.id}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#FBF1DC]/40 border border-[#C68A1E]/20"
              >
                <div className="w-10 h-10 rounded-xl bg-[#C68A1E] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                  ★
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-[var(--ink)] truncate">{r.name}</div>
                  <div className="text-xs text-[var(--ink-2)] truncate">{r.description}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#E3F2E9] text-[#1E7A4D] text-xs font-extrabold shrink-0">
                  Ready to Use
                </span>
              </div>
            ))}

            {usedRewards.map((r: any) => (
              <div
                key={r.id}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--surface-subtle)] opacity-60"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--line-2)] text-[var(--ink-3)] flex items-center justify-center font-bold text-sm shrink-0">
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-[var(--ink)] truncate">{r.name}</div>
                  <div className="text-[11px] text-[var(--ink-3)] truncate">
                    {r.status === "REDEEMED" ? `Redeemed ${formatRelativeTime(r.redeemedAt)}` : "Expired"}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[var(--ink-3)] uppercase">
                  {r.status === "REDEEMED" ? "Used" : "Expired"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Special Offers Section */}
      {offers?.length > 0 && (
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 mb-5 shadow-sm">
          <h2 className="text-base font-extrabold text-[var(--ink)] flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-[#C0392B]" /> Special Offers & Deals
          </h2>
          <div className="space-y-2.5">
            {offers.map((o: any) => (
              <div key={o.id} className="p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--line)] flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-[var(--ink)]">{o.name}</div>
                  <div className="text-xs text-[var(--ink-3)] mt-0.5">
                    {o.description || (o.isPercent ? `${o.value}% discount` : `${currency} ${o.value} off`)} · {o.everywhere ? "All branches" : "Selected branch"}
                  </div>
                </div>
                {o.endsAt && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FBEAE7] text-[#C0392B] shrink-0">
                    Till {new Date(o.endsAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Profile Details & Editor */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold text-[var(--ink)] flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--ink-2)]" /> Member Profile
          </h2>
          {!editing && (
            <button
              onClick={openEditor}
              className="text-xs font-bold text-[#C0392B] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        {!editing ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-[var(--line)]">
              <span className="text-[var(--ink-3)]">Name</span>
              <span className="font-bold text-[var(--ink)]">{customer.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--line)]">
              <span className="text-[var(--ink-3)]">Mobile</span>
              <span className="font-bold text-[var(--ink)]">+{customer.mobile}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--line)]">
              <span className="text-[var(--ink-3)]">Email</span>
              <span className="font-bold text-[var(--ink)]">{customer.email || "—"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[var(--ink-3)]">Birthday</span>
              <span className="font-bold text-[var(--ink)]">
                {customer.birthday ? new Date(customer.birthday).toLocaleDateString() : "—"}
              </span>
            </div>
            {profileMsg?.type === "ok" && (
              <div className="mt-2 p-2.5 rounded-xl bg-[#E3F2E9] text-[#1E7A4D] text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {profileMsg.text}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={saveProfile} className="space-y-3 mt-3">
            <div>
              <label className="block text-xs font-bold uppercase text-[var(--ink-2)] mb-1">Full Name</label>
              <input
                className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#C0392B]"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[var(--ink-2)] mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#C0392B]"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[var(--ink-2)] mb-1">Birthday</label>
              <input
                type="date"
                className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#C0392B]"
                value={profile.birthday}
                onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={profileBusy}
                className="flex-1 py-2 rounded-xl bg-[#C0392B] hover:bg-[#96291D] text-white text-xs font-bold cursor-pointer"
              >
                {profileBusy ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--line)] text-xs font-bold text-[var(--ink-2)] cursor-pointer"
              >
                Cancel
              </button>
            </div>
            {profileMsg?.type === "err" && (
              <div className="p-2.5 rounded-xl bg-[#FBEAE7] text-[#C0392B] text-xs font-semibold">
                {profileMsg.text}
              </div>
            )}
          </form>
        )}
      </section>

      {/* Recent Visits History */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 shadow-sm">
        <h2 className="text-base font-extrabold text-[var(--ink)] flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-[var(--ink-2)]" /> Recent Visits
        </h2>
        {transactions.length === 0 ? (
          <div className="py-6 text-center text-sm text-[var(--ink-3)]">
            Your first visit with points earned will appear here.
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t: any) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-2.5 border-b border-[var(--line)] last:border-0"
              >
                <div>
                  <div className="font-bold text-sm text-[var(--ink)]">{t.branch}</div>
                  <div className="text-xs text-[var(--ink-3)]">
                    {formatRelativeTime(t.createdAt)} · {currency} {t.amount}
                  </div>
                </div>
                <div className="font-extrabold text-sm text-[#1E7A4D]">
                  +{t.pointsEarned} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
