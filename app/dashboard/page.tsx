"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  QrCode,
  Gift,
  Tag,
  ChevronRight,
  RefreshCw,
  LogOut,
  Edit3,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Ticket,
  X,
  Coins,
  Receipt,
  Award,
  Share2,
  Download,
  Check,
  User,
  History,
  Menu,
} from "lucide-react";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

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
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", birthday: "" });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Toast message for share / install
  const [toast, setToast] = useState<string | null>(null);

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

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "Loyalty Club",
          text: "Join our Loyalty Club and get exclusive discounts and points on every visit!",
          url: window.location.origin,
        })
        .catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin);
      setToast("Invite link copied to clipboard!");
      setTimeout(() => setToast(null), 3000);
    }
  }

  function handleInstall() {
    setToast("To install, tap Share in browser & select 'Add to Home Screen'");
    setTimeout(() => setToast(null), 4000);
  }

  function openEditor() {
    if (!data?.customer) return;
    setProfile({
      name: data.customer.name || "",
      email: data.customer.email || "",
      birthday: data.customer.birthday ? String(data.customer.birthday).slice(0, 10) : "",
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

  if (err) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-[#EAE3DC] rounded-3xl p-6 text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-[#801313] mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2 text-[#1E1815]">Notice</h2>
          <p className="text-sm text-[#7A6E67] mb-4">{err}</p>
          <button
            onClick={() => router.push("/login")}
            className="py-2.5 px-6 rounded-xl bg-[#801313] text-white font-bold text-sm cursor-pointer shadow-md"
          >
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex flex-col items-center justify-center p-4 max-w-md mx-auto">
        <div className="w-9 h-9 border-3 border-[#801313]/20 border-t-[#801313] rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-[#7A6E67]">Loading your loyalty profile…</p>
      </div>
    );
  }

  const { customer, qr, rewards, transactions, offers, nextTargets, currency, loyaltyRules, redemptionStatus } = data;
  const availableRewards = rewards?.filter((r: any) => r.status === "AVAILABLE") || [];
  const usedRewards = rewards?.filter((r: any) => r.status !== "AVAILABLE") || [];

  // Milestone calculation from backend data
  const visitTarget = nextTargets?.find((t: any) => t.kind === "visits");
  const currentVisits = customer?.visitCount || 0;
  const milestoneThreshold = visitTarget?.threshold || 7;
  const visitsIntoCycle = currentVisits % milestoneThreshold;
  const visitsNeeded = visitTarget?.need ?? (milestoneThreshold - visitsIntoCycle || milestoneThreshold);
  const progressPercent =
    visitTarget?.progressPercent ??
    Math.min(100, Math.round((visitsIntoCycle / milestoneThreshold) * 100));

  // Dynamic Free Voucher Title / Discount calculation
  const primaryVoucher = availableRewards[0];
  const discountDisplay = primaryVoucher
    ? primaryVoucher.isPercent
      ? `${primaryVoucher.value}% OFF`
      : `${currency} ${primaryVoucher.value} OFF`
    : `${loyaltyRules?.welcomeDiscountPercent || 10}% OFF`;

  const voucherTitle = primaryVoucher
    ? primaryVoucher.name.includes("%")
      ? primaryVoucher.name
      : `${primaryVoucher.name} (${discountDisplay})`
    : `Welcome discount (${discountDisplay})`;

  // First name for greeting
  const firstName = customer?.name ? customer.name.trim().split(" ")[0] : "VIP Member";

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#1E1815] pb-24 px-4 pt-5 max-w-md mx-auto selection:bg-[#801313] selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1E1815] text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-[#E5A93C]" />
          <span>{toast}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP HEADER (With Brand Avatar & Hamburger Menu)             */}
      {/* ============================================================== */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Brand Logo Avatar */}
          <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-[#D4AF37]/40 shadow-xs bg-[#801313] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lofoe.png" alt="Brand Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#7A6E67]">
              {getTimeGreeting()}
            </div>
            <h1 className="text-2xl font-bold font-serif text-[#1E1815] leading-tight">
              {firstName}
            </h1>
          </div>
        </div>

        {/* Hamburger Menu Button */}
        <button
          onClick={() => setShowSwitchModal(true)}
          className="w-10 h-10 rounded-2xl bg-[#EFE9E2] hover:bg-[#E5DDD4] text-[#801313] flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          title="Account Menu"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5 text-[#801313]" />
        </button>
      </header>

      {/* ============================================================== */}
      {/* 2. CULINARY HERO BANNER CARD                                   */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl h-56 p-5 sm:p-6 text-white shadow-md flex flex-col justify-end mb-3.5 group">
        {/* Banner Food Photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/food_banner.jpg"
          alt="Culinary Delights"
          className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105"
        />
        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/25 pointer-events-none" />

        <div className="relative z-10">
          <div className="text-[9px] font-extrabold tracking-widest text-[#E5A93C] uppercase mb-1">
            LATEST AT {customer.homeBranch?.name ? customer.homeBranch.name.toUpperCase() : "BOMBAY CHOWPATTY"}
          </div>
          <h2 className="font-serif text-2xl sm:text-[26px] font-bold text-white leading-tight mb-1.5">
            Flavours worth coming back for
          </h2>
          <p className="text-[11px] text-white/85 leading-relaxed max-w-[280px]">
            Watch this space for our newest offers and festival wishes.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. TWO ACTION BUTTONS (Share / Install)                        */}
      {/* ============================================================== */}
      <div className="space-y-2.5 mb-4">
        <button
          onClick={handleShare}
          className="w-full bg-white hover:bg-[#FAF7F4] border border-[#EAE3DC] text-[#801313] rounded-2xl py-3 px-4 font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
        >
          <Share2 className="w-4 h-4 text-[#801313]" />
          <span>Share with a friend</span>
        </button>
        <button
          onClick={handleInstall}
          className="w-full bg-white hover:bg-[#FAF7F4] border border-[#EAE3DC] text-[#801313] rounded-2xl py-3 px-4 font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
        >
          <Download className="w-4 h-4 text-[#801313]" />
          <span>Install loyalty app</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 4. AVAILABLE POINTS VELVET CARD                                */}
      {/* ============================================================== */}
      <div className="rounded-3xl bg-gradient-to-br from-[#6E1111] via-[#801313] to-[#4A0A0A] p-5 sm:p-6 text-white shadow-md mb-4 relative overflow-hidden">
        {/* Subtle Decorative Background Ring */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/5 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-extrabold tracking-widest text-[#E5A93C] uppercase">
              AVAILABLE POINTS
            </div>
            <div className="text-4xl sm:text-5xl font-serif font-black text-white leading-none my-2.5">
              {customer.pointsBalance}
            </div>
            <div className="text-[11px] text-white/80 font-medium">
              {loyaltyRules?.pointsRequiredForRedemption || 100} points = {currency} {loyaltyRules?.currencyValuePerRedemptionPoints || 1} · Tap to redeem
            </div>
          </div>

          {/* Golden Ribbon / Medallion Emblem */}
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#E5A93C] shrink-0">
            <Award className="w-9 h-9 text-[#E5A93C] stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. DINE-IN CHECK-IN CARD (Placed directly ABOVE QR Scan Card!)  */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-5 border border-[#EAE3DC] shadow-xs mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#801313]/10 text-[#801313] flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] font-extrabold tracking-widest text-[#7A6E67] uppercase">
                DINE-IN CHECK-IN
              </div>
              <div className="font-bold text-xs text-[#1E1815]">
                Enter branch 24h coupon to record bill
              </div>
            </div>
          </div>
        </div>

        {visitMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold mb-3 ${
              visitMsg.type === "ok"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>{visitMsg.text}</span>
              <button onClick={() => setVisitMsg(null)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {visitMsg.details?.transaction && (
              <div className="text-[11px] pt-1 mt-1 border-t border-emerald-200 flex justify-between">
                <span>Inv #{visitMsg.details.transaction.invoiceNumber}</span>
                <span className="font-black">+{visitMsg.details.transaction.pointsEarned} pts</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleCheckCoupon} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 1015-7K9A"
            value={visitCodeInput}
            onChange={(e) => setVisitCodeInput(e.target.value.toUpperCase())}
            className="flex-1 px-3 py-2.5 bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-xs font-bold text-[#1E1815] uppercase focus:outline-none focus:border-[#801313]"
            required
          />
          <button
            type="submit"
            disabled={checkingCode || !visitCodeInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#801313] hover:bg-[#6E1111] text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer shrink-0 transition-colors"
          >
            {checkingCode ? "Checking…" : "Verify"}
          </button>
        </form>
      </div>

      {/* ============================================================== */}
      {/* 6. MEMBERSHIP QR CARD                                          */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#EAE3DC] text-center mb-4">
        {/* Header Label */}
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <QrCode className="w-4 h-4 text-[#801313]" />
          <span className="text-[10px] font-extrabold tracking-widest text-[#7A6E67] uppercase">
            YOUR MEMBERSHIP QR
          </span>
        </div>
        <h3 className="text-base sm:text-lg font-black text-[#801313] mb-4">
          Scan at any outlet
        </h3>

        {/* QR Code */}
        <div className="bg-[#FAF7F4] p-3 rounded-2xl border border-[#EAE3DC] inline-block mb-3.5 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr.image}
            alt="Membership QR"
            className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl block"
          />
        </div>

        {/* Monospace Code */}
        <div className="font-mono text-xs sm:text-sm font-bold text-[#801313] tracking-widest">
          {qr.code}
        </div>

        {/* Helper micro-copy */}
        <p className="text-[11px] text-[#7A6E67] leading-relaxed max-w-xs mx-auto mt-2">
          Show this QR to the cashier. Scanning opens your loyalty profile without sharing your mobile number.
        </p>
      </div>

      {/* ============================================================== */}
      {/* 7. FREE VOUCHER (WITH AVAILABLE BADGE) & SPECIAL OFFER CARDS   */}
      {/* ============================================================== */}
      <div className="space-y-2.5 mb-4">
        {/* Voucher Card with AVAILABLE Badge (Matches Image 1) */}
        <div className="bg-white rounded-2xl p-4 border border-[#EAE3DC] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-[#FFF6E5] text-[#C68A1E] flex items-center justify-center shrink-0 border border-[#EFE7D8]">
              <Gift className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm text-[#1E1815] truncate">
                {voucherTitle}
              </div>
              <div className="text-[10px] text-[#7A6E67]">Tap to show cashier</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
            AVAILABLE
          </span>
        </div>

        {/* Special Offer Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#EAE3DC] shadow-xs flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-[#801313]/10 text-[#801313] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-extrabold tracking-widest text-[#7A6E67] uppercase">
              SPECIAL OFFER JUST FOR YOU
            </div>
            <div className="font-bold text-xs sm:text-sm text-[#1E1815] truncate">
              {offers?.[0]?.name || (visitsNeeded > 0 ? "A delicious surprise is coming soon" : "Milestone Reward Unlocked!")}
            </div>
            <div className="text-[10px] text-[#7A6E67] mt-0.5">
              {visitsNeeded > 0
                ? `Unlocks once you complete ${milestoneThreshold} visits (${visitsNeeded} visit${visitsNeeded > 1 ? "s" : ""} left)`
                : `All ${milestoneThreshold} visits completed! Available on your next order.`}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 8. REPEAT-VISIT REWARD PATH (Single Clean Progress Bar)        */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-[#EAE3DC] mb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[9px] font-extrabold tracking-widest text-[#7A6E67] uppercase">
              YOUR REPEAT-VISIT REWARD PATH
            </div>
            <div className="font-black text-sm text-[#801313] mt-0.5">
              {customer.homeBranch?.name || "Dubai Festival City"}
            </div>
          </div>
          <div className="font-black text-sm text-[#801313]">
            {currentVisits} visits
          </div>
        </div>

        {/* Stepper Circles dynamically generated */}
        <div className="flex items-center justify-between gap-1 py-1">
          {Array.from({ length: Math.min(milestoneThreshold, 7) }, (_, idx) => {
            const stepNum = idx + 1;
            const isMilestone = stepNum === Math.min(milestoneThreshold, 7);
            const isCompleted =
              visitsIntoCycle >= stepNum || (currentVisits >= milestoneThreshold && visitsIntoCycle === 0);

            if (isMilestone) {
              return (
                <div
                  key={stepNum}
                  className={`w-9 h-9 rounded-full flex items-center justify-center relative shadow-xs ${
                    isCompleted
                      ? "bg-[#801313] text-white border-2 border-[#E5A93C]"
                      : "border-2 border-dashed border-[#E5A93C] bg-[#FFFBF0] text-[#C68A1E]"
                  }`}
                >
                  <Gift className={`w-4 h-4 ${isCompleted ? "text-white" : "text-[#C68A1E]"}`} />
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-black flex items-center justify-center ${
                      isCompleted
                        ? "bg-[#801313] border border-white text-white"
                        : "bg-[#FFFBF0] border border-[#E5A93C] text-[#C68A1E]"
                    }`}
                  >
                    {milestoneThreshold}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={stepNum}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? "bg-[#801313] text-white shadow-xs"
                    : "border border-dashed border-[#D5CBC3] text-[#8C7F78] bg-[#FAF7F4]"
                }`}
              >
                {isCompleted ? "✓" : stepNum}
              </div>
            );
          })}
        </div>

        {/* Dynamic Progress Bar (Fills according to completed visits) */}
        <div className="w-full mt-3.5 mb-2">
          <div
            className="bg-[#801313] h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(progressPercent, 2)}%` }}
          />
        </div>

        <div className="text-[11px] text-[#7A6E67]">
          {visitsNeeded > 0
            ? `${visitsNeeded} more visit(s) to unlock your next gift.`
            : "Congratulations! Milestone reward unlocked on your next visit."}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 9. RECENT VISITS & RECEIPTS HISTORY (Backend Data)             */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-[#EAE3DC] mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#801313]/10 text-[#801313] flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-[#1E1815]">
              Recent Visits & Receipts
            </h3>
          </div>
          <span className="text-[10px] font-bold text-[#7A6E67] uppercase tracking-wider">
            {transactions?.length || 0} Records
          </span>
        </div>

        {transactions && transactions.length > 0 ? (
          <div className="divide-y divide-[#EFE8E1]">
            {transactions.map((t: any) => (
              <div key={t.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="min-w-0 pr-3">
                  <div className="font-bold text-xs sm:text-sm text-[#1E1815] truncate">
                    {t.branch || customer.homeBranch?.name || "Branch Visit"}
                  </div>
                  <div className="text-[10px] text-[#7A6E67] flex items-center gap-2 mt-0.5">
                    <span>{formatRelativeTime(t.createdAt)}</span>
                    <span>•</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-xs sm:text-sm text-[#1E1815]">
                    {currency} {Number(t.amount || 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700">
                    +{t.pointsEarned} pts
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-[#7A6E67]">
            <Receipt className="w-7 h-7 text-[#801313]/30 mx-auto mb-1.5" />
            <p className="font-semibold">No previous visits recorded yet.</p>
            <p className="text-[10px] text-[#A0938C] mt-0.5">
              Points earned on your dine-in bills will appear here automatically.
            </p>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 11. HAMBURGER MENU / PROFILE SLIDEOUT MODAL                    */}
      {/* ============================================================== */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 border border-[#EAE3DC] shadow-2xl space-y-5 animate-in slide-in-from-bottom-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#801313] text-white flex items-center justify-center font-bold text-sm">
                  {firstName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E1815]">{customer.name}</h3>
                  <p className="text-[11px] font-mono text-[#7A6E67]">+{customer.mobile}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSwitchModal(false);
                  setEditing(false);
                }}
                className="w-8 h-8 rounded-full bg-[#FAF7F4] hover:bg-[#EFE9E2] text-[#7A6E67] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info or Edit Form */}
            {!editing ? (
              <div className="space-y-3">
                <div className="p-4 bg-[#FAF7F4] rounded-2xl border border-[#EAE3DC] text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                    <span className="text-[#7A6E67]">Home Branch</span>
                    <span className="font-bold text-[#1E1815]">{customer.homeBranch?.name || "All Branches"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                    <span className="text-[#7A6E67]">Phone Number</span>
                    <span className="font-mono font-bold text-[#1E1815]">
                      {customer.mobile ? (customer.mobile.startsWith("+") ? customer.mobile : `+${customer.mobile}`) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                    <span className="text-[#7A6E67]">Email Address</span>
                    <span className="font-bold text-[#1E1815]">{customer.email || "Not set"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#7A6E67]">Member Since</span>
                    <span className="font-bold text-[#1E1815]">
                      {new Date(customer.memberSince || customer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={openEditor}
                    className="flex-1 py-2.5 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC] text-xs font-bold text-[#1E1815] hover:bg-[#EFE9E2] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#801313]" /> Edit Profile
                  </button>
                  <button
                    onClick={loadCard}
                    className="p-2.5 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC] text-[#7A6E67] hover:bg-[#EFE9E2] cursor-pointer"
                    title="Refresh Data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={saveProfile} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#801313]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#801313]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">Birthday</label>
                  <input
                    type="date"
                    value={profile.birthday}
                    onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#801313]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={profileBusy}
                    className="flex-1 py-2 rounded-xl bg-[#801313] hover:bg-[#6E1111] text-white text-xs font-bold cursor-pointer"
                  >
                    {profileBusy ? "Saving…" : "Save Details"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Logout Action */}
            <div className="pt-3 border-t border-[#EAE3DC]">
              <a
                href="/api/auth/logout"
                className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-[#801313] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out / Switch Account
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 12. INVOICE & BILL POPUP MODAL                                 */}
      {/* ============================================================== */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-2xl text-[#1E1815] space-y-4">
            <div className="flex items-start justify-between border-b border-[#EAE3DC] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#801313] text-white flex items-center justify-center shadow-md shadow-[#801313]/20">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E1815]">Record Bill & Earn Points</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase">
                      ✓ {verifiedBranch?.name || "Branch Verified"}
                    </span>
                    <span className="font-mono text-[9px] font-bold text-[#801313]">
                      {verifiedCoupon}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowBillModal(false)} className="p-1 rounded-full text-[#7A6E67] hover:bg-[#FAF7F4]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalErr && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-800 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalErr}</span>
              </div>
            )}

            <form onSubmit={handleConfirmBill} className="space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">Invoice / Receipt # *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-1002"
                  value={invoiceInput}
                  onChange={(e) => setInvoiceInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-xs font-bold text-[#1E1815] focus:outline-none focus:border-[#801313]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">Total Bill Payment ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 150.00"
                  value={billAmountInput}
                  onChange={(e) => setBillAmountInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1E1815] focus:outline-none focus:border-[#801313]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={billSubmitting || !invoiceInput.trim() || !billAmountInput || Number(billAmountInput) <= 0}
                  className="flex-[2] py-2.5 rounded-xl bg-[#801313] hover:bg-[#6E1111] text-white font-bold text-xs shadow-md shadow-[#801313]/20 disabled:opacity-50"
                >
                  {billSubmitting ? "Adding Points…" : "Confirm & Earn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
