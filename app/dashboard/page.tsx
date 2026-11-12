"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  QrCode,
  Gift,
  Tag,
  ChevronRight,
  ChevronLeft,
  Bell,
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
  Clock,
  PartyPopper,
  Calendar,
  Lock,
  Unlock,
  Trash2,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import QRCode from "qrcode";
import { usePwaInstall } from "@/lib/usePwaInstall";
import { InstallGuideModal } from "@/components/InstallGuideModal";
import ReceiptScanner from "@/components/ReceiptScanner";
import { AppleWalletIcon, GoogleWalletIcon } from "@/components/WalletIcons";
import CustomerDesignB from "@/components/customer/CustomerDesignB";
import { CountryCodePicker } from "@/components/CountryCodePicker";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/mobile";

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

function formatCustomerCode(code?: string | null): string {
  if (!code) return "LP987 867";
  const clean = String(code).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length > 5) return clean.slice(0, 5) + " " + clean.slice(5);
  return clean;
}

function formatExactDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7days" | "30days">("all");
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ name: "", mobile: "", countryCode: DEFAULT_COUNTRY, email: "", birthday: "" });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [historyTab, setHistoryTab] = useState<"bills" | "rewards">("bills");
  const [redeemModalReward, setRedeemModalReward] = useState<any | null>(null);
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [showAppleWalletModal, setShowAppleWalletModal] = useState(false);
  const [showGoogleWalletModal, setShowGoogleWalletModal] = useState(false);

  // Promotional Banner Slider & In-App Offer Notification States
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [popupOffer, setPopupOffer] = useState<any | null>(null);
  const [unreadOffersCount, setUnreadOffersCount] = useState(0);
  const [clearedOfferIds, setClearedOfferIds] = useState<string[]>([]);

  // Load cleared offers from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("bc_cleared_offers");
        if (stored) setClearedOfferIds(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Filter offers that have a custom promotional banner image
  const bannerOffers: any[] = (data?.offers || []).filter((o: any) => o.imageUrl);

  // Auto-advance banner slider every 4.5 seconds if multiple promotional banners exist
  useEffect(() => {
    if (bannerOffers.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % bannerOffers.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [bannerOffers.length]);

  // Track unread/unseen offers count for the bell badge
  useEffect(() => {
    if (!data?.offers || data.offers.length === 0) {
      setUnreadOffersCount(0);
      return;
    }
    if (typeof window === "undefined") return;

    // Count how many active offers have not been seen
    const unread = data.offers.filter((o: any) => {
      return !localStorage.getItem(`bc_seen_offer_${o.id}`);
    }).length;
    setUnreadOffersCount(unread);
  }, [data?.offers]);

  // Trigger New Offer Popup Announcement for unread/unseen active promotions
  useEffect(() => {
    if (!data?.offers || data.offers.length === 0) return;
    if (typeof window === "undefined") return;

    // Find the first active offer not yet dismissed in localStorage
    const unseenOffer = data.offers.find((o: any) => {
      return !localStorage.getItem(`bc_seen_offer_${o.id}`);
    });

    if (unseenOffer) {
      const timeout = setTimeout(() => {
        setPopupOffer(unseenOffer);
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [data?.offers]);

  const handleDismissPopupOffer = (offerId: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`bc_seen_offer_${offerId}`, "1");
    }
    setPopupOffer(null);
    setUnreadOffersCount((prev) => Math.max(0, prev - 1));
  };

  const handleOpenOffersModal = () => {
    setShowOffersModal(true);
    // Mark all active offers as seen when customer opens the notifications/deals sheet
    if (typeof window !== "undefined" && data?.offers) {
      data.offers.forEach((o: any) => {
        localStorage.setItem(`bc_seen_offer_${o.id}`, "1");
      });
      setUnreadOffersCount(0);
    }
  };

  const handleClearAllOffers = () => {
    if (!data?.offers) return;
    const allIds: string[] = data.offers.map((o: any) => o.id);
    setClearedOfferIds(allIds);
    if (typeof window !== "undefined") {
      localStorage.setItem("bc_cleared_offers", JSON.stringify(allIds));
      data.offers.forEach((o: any) => {
        localStorage.setItem(`bc_seen_offer_${o.id}`, "1");
      });
    }
    setUnreadOffersCount(0);
  };

  const handleClearSingleOffer = (offerId: string) => {
    setClearedOfferIds((prev) => {
      const updated = Array.from(new Set([...prev, offerId]));
      if (typeof window !== "undefined") {
        localStorage.setItem("bc_cleared_offers", JSON.stringify(updated));
        localStorage.setItem(`bc_seen_offer_${offerId}`, "1");
      }
      return updated;
    });
  };

  const handleRestoreOffers = () => {
    setClearedOfferIds([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("bc_cleared_offers");
    }
  };

  // Customer Portal QR Modal State
  const [showPortalQrModal, setShowPortalQrModal] = useState(false);
  const [portalQrDataUrl, setPortalQrDataUrl] = useState<string>("");
  const [portalUrl, setPortalUrl] = useState<string>("");
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = window.location.origin;
      setPortalUrl(url);
      QRCode.toDataURL(url, {
        margin: 1,
        width: 400,
        color: {
          dark: "#143F26",
          light: "#FFFFFF",
        },
      })
        .then((dataUrl) => setPortalQrDataUrl(dataUrl))
        .catch(() => {});
    }
  }, []);

  const handleSharePortalLink = async () => {
    const url = portalUrl || (typeof window !== "undefined" ? window.location.origin : "");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Levante Rewards",
          text: "Scan or tap to join Levante Rewards and get exclusive rewards!",
          url: url,
        });
      } catch {}
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedPortalLink(true);
      setTimeout(() => setCopiedPortalLink(false), 3000);
    }
  };

  // PWA Install hook
  const { triggerInstall, isInstallable, isInstalled, isIos } = usePwaInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

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
      if (r.status === 401 || r.status === 403) {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {}
        window.location.href = "/login";
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

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/";
  }

  const handleConfirmRedeem = async () => {
    if (!redeemModalReward) return;
    try {
      setRedeemBusy(true);
      const res = await fetch("/api/card/redeem-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerRewardId: redeemModalReward.id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to activate reward.");
      setToast(`✓ ${redeemModalReward.name} is now ready! Show cashier to apply.`);
      setTimeout(() => setToast(null), 4000);
      setRedeemModalReward(null);
      await loadCard();
    } catch (e: any) {
      setToast(String(e.message || e));
      setTimeout(() => setToast(null), 3500);
    } finally {
      setRedeemBusy(false);
    }
  };

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

  function openEditor() {
    if (!data?.customer) return;
    let raw = data.customer.mobile || "";
    let cc = DEFAULT_COUNTRY;
    let num = raw;
    if (num.startsWith("+")) num = num.slice(1);
    for (const country of COUNTRIES) {
      if (num.startsWith(country.code)) {
        cc = country.code;
        num = num.slice(country.code.length);
        break;
      }
    }
    setProfile({
      name: data.customer.name || "",
      mobile: num,
      countryCode: cc,
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
        body: JSON.stringify({
          name: profile.name.trim(),
          mobile: profile.mobile.trim(),
          countryCode: profile.countryCode,
          email: profile.email.trim(),
          birthday: profile.birthday || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not save details.");
      setToast("Profile updated successfully!");
      setEditing(false);
      await loadCard();
      setTimeout(() => setToast(null), 3000);
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
          <AlertCircle className="w-12 h-12 text-[#0E331E] mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2 text-[#1E1815]">Notice</h2>
          <p className="text-sm text-[#7A6E67] mb-4">{err}</p>
          <button
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } catch {}
              window.location.href = "/login";
            }}
            className="py-2.5 px-6 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-bold text-sm cursor-pointer shadow-md transition-all"
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
        <div className="w-9 h-9 border-3 border-[#0E331E]/20 border-t-[#0E331E] rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-[#7A6E67]">Loading your loyalty profile…</p>
      </div>
    );
  }

  const {
    customer,
    qr,
    rewards,
    transactions,
    offers,
    nextTargets,
    currency,
    loyaltyRules,
    redemptionStatus,
    birthdayStatus,
    milestoneProgress,
  } = data;
  const availableRewards = rewards?.filter((r: any) => r.status === "AVAILABLE") || [];
  const usedRewards = rewards?.filter((r: any) => r.status === "REDEEMED" || r.status === "EXPIRED") || [];

  // Filter transactions by selected date range
  const filteredTransactions = (transactions || []).filter((t: any) => {
    if (dateFilter === "all") return true;
    if (!t.createdAt) return true;
    const txDate = new Date(t.createdAt);
    const now = new Date();
    if (dateFilter === "today") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return txDate >= startOfToday;
    }
    if (dateFilter === "7days") {
      const cutoff = new Date(now.getTime() - 7 * 86400_000);
      return txDate >= cutoff;
    }
    if (dateFilter === "30days") {
      const cutoff = new Date(now.getTime() - 30 * 86400_000);
      return txDate >= cutoff;
    }
    return true;
  });

  // Milestone calculation from backend data & milestoneProgress helper
  const visitTarget = nextTargets?.find((t: any) => t.kind === "visits");
  const currentVisits = customer?.visitCount || 0;
  const milestoneThreshold = milestoneProgress?.threshold || visitTarget?.threshold || 5;
  const visitsIntoCycle = milestoneProgress?.visitsInCycle ?? (currentVisits % milestoneThreshold);
  const visitsNeeded = milestoneProgress?.visitsNeeded ?? Math.max(0, milestoneThreshold - visitsIntoCycle);
  const progressPercent =
    milestoneProgress?.progressPercent ??
    (visitsNeeded <= 0 ? 100 : Math.min(100, Math.round((visitsIntoCycle / milestoneThreshold) * 100)));

  // Detect unlocked surprise / visit milestone reward
  const unlockedSurpriseReward =
    milestoneProgress?.unlockedReward ||
    availableRewards.find((r: any) => r.type === "VISITS" || r.name?.toLowerCase().includes("visit"));
  const isSurpriseUnlocked = milestoneProgress?.isUnlocked ?? !!unlockedSurpriseReward;

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

  // Visit milestone coupon: updates when 5 visits completed (every 5 visits = +1 coupon)
  const visitCoupons = availableRewards.filter(
    (r: any) => r.type === "VISITS" || r.name?.toLowerCase().includes("visit") || r.name?.toLowerCase().includes("milestone")
  );
  const completed5VisitCycles = Math.floor(currentVisits / 5);
  const couponCount = Math.max(visitCoupons.length, completed5VisitCycles > 0 ? 1 : 0);
  const couponDisplay = String(couponCount).padStart(2, "0");

  const targetStamps = milestoneThreshold === 6 ? 6 : 5;
  const stampsEarned = visitsIntoCycle;

  // Separate Welcome Discount and Available Gift Rewards
  const welcomeReward = availableRewards.find(
    (r: any) => r.type === "WELCOME" || r.name?.toLowerCase().includes("welcome")
  );
  const availableGifts = availableRewards.filter(
    (r: any) => r.id !== welcomeReward?.id
  );

  return (
    <div className="min-h-screen bg-[#EFEBE0] text-[#1E1815] pb-24 px-3.5 sm:px-4 pt-3.5 sm:pt-5 max-w-md w-full mx-auto fold-safe [box-shadow:0_0_0_100vmax_#EFEBE0] [clip-path:inset(0_-100vmax)] selection:bg-[#0E331E] selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1E1815] text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 max-w-[90vw] text-center">
          <CheckCircle2 className="w-4 h-4 text-[#E5A93C] shrink-0" />
          <span className="truncate">{toast}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP HEADER (Brand Roundel & "Loyality Reward Path")          */}
      {/* ============================================================== */}
      <header className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-11 h-11 min-[380px]:w-12 min-[380px]:h-12 sm:w-14 sm:h-14 shrink-0 rounded-full overflow-hidden shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bc-roundel.png" alt="Levante" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-[17px] min-[380px]:text-[19px] sm:text-[21px] leading-tight text-[#1a3c24] tracking-tight truncate">
              Loyality Reward Path
            </h1>
          </div>
        </div>

        {/* Action icons (Notifications & Menu) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleOpenOffersModal}
            className="w-9 h-9 rounded-xl bg-white hover:bg-stone-50 text-[#0d331c] flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95 relative border border-stone-200/60"
            title="Special Offers & Deals"
            aria-label="View Deals"
          >
            <Bell className="w-4 h-4 text-[#0d331c]" />
            {unreadOffersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#0d331c] text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white animate-pulse">
                {unreadOffersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowSwitchModal(true)}
            className="w-9 h-9 rounded-xl bg-white hover:bg-stone-50 text-[#0d331c] flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 border border-stone-200/60"
            title="Account Menu"
            aria-label="Open Menu"
          >
            <Menu className="w-4 h-4 text-[#0d331c]" />
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. DIGITAL MEMBERSHIP & STAMP CARD (CustomerDesignB 2-Card)    */}
      {/* ============================================================== */}
      <CustomerDesignB
        customer={customer}
        qr={qr}
        customerCode={formatCustomerCode(qr?.code || "LP987867")}
        targetStamps={targetStamps}
        stampsEarned={stampsEarned}
        couponDisplay={couponDisplay}
      />

      {/* ============================================================== */}
      {/* 3. THREE BLACK ACTION BUTTONS (Apple / Google / Web App)       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
        {/* 1. Add to Apple Wallet */}
        <button
          type="button"
          onClick={() => setShowAppleWalletModal(true)}
          className="bg-[#151515] hover:bg-[#222222] text-white rounded-xl py-2 px-1 min-[380px]:px-1.5 sm:px-2 flex items-center gap-1.5 min-[380px]:gap-2 cursor-pointer transition-all active:scale-95 shadow-xs"
        >
          <AppleWalletIcon className="w-5 h-4 sm:w-5.5 sm:h-4.5 shrink-0" />
          <div className="text-left min-w-0">
            <div className="text-[7.5px] min-[380px]:text-[8px] text-[#A0A0A0] leading-tight font-medium">Add to</div>
            <div className="text-[9px] min-[380px]:text-[10px] font-bold text-white leading-tight truncate">Apple Wallet</div>
          </div>
        </button>

        {/* 2. Add to Google Wallet */}
        <button
          type="button"
          onClick={() => setShowGoogleWalletModal(true)}
          className="bg-[#151515] hover:bg-[#222222] text-white rounded-xl py-2 px-1 min-[380px]:px-1.5 sm:px-2 flex items-center gap-1.5 min-[380px]:gap-2 cursor-pointer transition-all active:scale-95 shadow-xs"
        >
          <div className="w-5 h-4 sm:w-5.5 sm:h-4.5 shrink-0 flex items-center justify-center">
            <GoogleWalletIcon className="w-5 h-4 sm:w-5.5 sm:h-4.5" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-[7.5px] min-[380px]:text-[8px] text-[#A0A0A0] leading-tight font-medium">Add to</div>
            <div className="text-[9px] min-[380px]:text-[10px] font-bold text-white leading-tight truncate">Google Wallet</div>
          </div>
        </button>

        {/* 3. Download it as WEB APP */}
        <button
          type="button"
          onClick={handleInstall}
          className="bg-[#151515] hover:bg-[#222222] text-white rounded-xl py-2 px-1 min-[380px]:px-1.5 sm:px-2 flex items-center justify-between gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
        >
          <div className="text-left min-w-0">
            <div className="text-[7.5px] min-[380px]:text-[8px] text-[#A0A0A0] leading-tight font-medium">Download as</div>
            <div className="text-[9px] min-[380px]:text-[10px] font-bold text-white leading-tight truncate">WEB APP</div>
          </div>
          <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white shrink-0" />
        </button>
      </div>

      {/* ============================================================== */}
      {/* 4. SCAN RECEIPT BANNER                                         */}
      {/* ============================================================== */}
      <ReceiptScanner onClaimed={loadCard} />

      {/* ============================================================== */}
      {/* 5. WELCOME DISCOUNT CARD (From loyalty design)                 */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl h-[70px] min-[380px]:h-[76px] sm:h-[80px] flex items-center justify-between overflow-hidden shadow-xs mb-3 relative border border-[#E8E2D7]">
        {/* Left: WELCOME DISCOUNT */}
        <div className="flex flex-col justify-center leading-none pl-3 min-[380px]:pl-4 py-1.5 min-w-0 pr-1">
          <span className="font-black text-lg min-[380px]:text-xl sm:text-[23px] tracking-tight text-[#1b3124] uppercase leading-[0.9]">
            WELCOME
          </span>
          <span className="font-black text-lg min-[380px]:text-xl sm:text-[23px] tracking-tight text-[#1b3124] uppercase leading-[0.9] mt-0.5 sm:mt-1">
            DISCOUNT
          </span>
        </div>

        {/* Center: TAP TO REDEEM ➔ or REDEEMED */}
        {welcomeReward?.isRedeemRequested ? (
          <div className="flex items-center gap-1 bg-white/95 text-emerald-800 px-2 min-[380px]:px-2.5 py-1 rounded-full text-[9px] min-[380px]:text-[10px] font-black tracking-wider border border-emerald-300 shadow-2xs whitespace-nowrap">
            <span>REDEEMED</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (welcomeReward) setRedeemModalReward(welcomeReward);
              else handleOpenOffersModal();
            }}
            className="flex items-center gap-0.5 min-[380px]:gap-1 text-[8.5px] min-[380px]:text-[10px] font-bold text-[#1b3124] hover:underline cursor-pointer active:scale-95 transition-transform whitespace-nowrap px-1"
          >
            <span>TAP TO REDEEM</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1b3124]" />
          </button>
        )}

        {/* Right: Folded Ribbon 10% OFF */}
        <div className="relative bg-[#0d331c] text-white pl-4 min-[380px]:pl-5 pr-3 min-[380px]:pr-4 py-2 sm:py-2.5 h-full flex flex-col justify-center items-center overflow-hidden [clip-path:polygon(20%_0%,_100%_0%,_100%_100%,_0%_100%)] shrink-0 min-w-[85px] sm:min-w-[95px]">
          <div className="font-black text-xl min-[380px]:text-2xl sm:text-[27px] leading-none text-white tracking-tighter">
            {welcomeReward?.value ? Math.round(welcomeReward.value) : 10}%
          </div>
          <div className="font-black text-[9px] min-[380px]:text-xs leading-none text-white tracking-widest uppercase mt-0.5">
            OFF
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5.1 ADDITIONAL UNLOCKED GIFTS (Rendered in matching shape)     */}
      {/* ============================================================== */}
      {availableGifts.map((gift: any) => (
        <div
          key={gift.id}
          className="bg-white rounded-2xl h-[70px] min-[380px]:h-[76px] sm:h-[80px] flex items-center justify-between overflow-hidden shadow-xs mb-3 relative border border-[#E8E2D7]"
        >
          {/* Left: GIFT REWARD & NAME */}
          <div className="flex flex-col justify-center leading-none pl-3 min-[380px]:pl-4 py-1.5 min-w-0 pr-1">
            <span className="font-black text-[10px] min-[380px]:text-[11px] sm:text-xs tracking-tight text-[#1b3124]/75 uppercase leading-none">
              GIFT REWARD
            </span>
            <span className="font-black text-base min-[380px]:text-lg sm:text-[20px] tracking-tight text-[#1b3124] uppercase leading-tight mt-0.5 sm:mt-1 truncate max-w-[120px] min-[380px]:max-w-[140px] sm:max-w-[160px]">
              {gift.name}
            </span>
          </div>

          {/* Center: TAP TO REDEEM ➔ or REDEEMED */}
          {gift.isRedeemRequested ? (
            <div className="flex items-center gap-1 bg-white/95 text-emerald-800 px-2 min-[380px]:px-2.5 py-1 rounded-full text-[9px] min-[380px]:text-[10px] font-black tracking-wider border border-emerald-300 shadow-2xs whitespace-nowrap">
              <span>REDEEMED</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRedeemModalReward(gift)}
              className="flex items-center gap-0.5 min-[380px]:gap-1 text-[8.5px] min-[380px]:text-[10px] font-bold text-[#1b3124] hover:underline cursor-pointer active:scale-95 transition-transform shrink-0 whitespace-nowrap px-1"
            >
              <span>TAP TO REDEEM</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1b3124]" />
            </button>
          )}

          {/* Right: Folded Ribbon FREE GIFT */}
          <div className="relative bg-[#0d331c] text-white pl-4 min-[380px]:pl-5 pr-3 min-[380px]:pr-4 py-2 sm:py-2.5 h-full flex flex-col justify-center items-center overflow-hidden [clip-path:polygon(20%_0%,_100%_0%,_100%_100%,_0%_100%)] shrink-0 min-w-[85px] sm:min-w-[95px]">
            <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <div className="font-black text-[9px] min-[380px]:text-[10px] leading-none text-white tracking-widest uppercase mt-0.5">
              FREE
            </div>
          </div>
        </div>
      ))}

      {/* ============================================================== */}
      {/* 6. VISIT MILESTONE REWARD TRACKER CARD                         */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-3 min-[380px]:p-3.5 sm:p-4 shadow-xs mb-3 flex items-center justify-between gap-2 border border-[#E8E2D7]">
        {/* Left: VISIT MILESTONE REWARD */}
        <div className="flex flex-col justify-center leading-none min-w-0">
          <span className="font-black text-lg min-[380px]:text-xl sm:text-2xl tracking-tight text-[#163827] uppercase leading-[0.9]">
            VISIT MILESTONE
          </span>
          <span className="font-black text-lg min-[380px]:text-xl sm:text-2xl tracking-tight text-[#163827] uppercase leading-[0.9] mt-0.5 sm:mt-1">
            REWARD
          </span>
        </div>

        {/* Right: 0/5 & Gift Icon & unlock text */}
        <div className="flex flex-col items-end shrink-0 text-right">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="font-black text-xl min-[380px]:text-2xl sm:text-[26px] text-[#163827] leading-none">
              {visitsIntoCycle}/{milestoneThreshold}
            </span>
            <div className="text-[#163827]">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-[#163827]" viewBox="0 0 24 24">
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.65-.5-.65C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1h-2V5c0-.55.45-1 1-1zM9 4c.55 0 1 .45 1 1v1H8c0-.55.45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h7v6h2V8h7v6z"/>
              </svg>
            </div>
          </div>
          <span className="text-[8px] min-[380px]:text-[9.5px] sm:text-[10px] font-semibold text-[#163827] mt-0.5 sm:mt-1 leading-tight whitespace-nowrap">
            unlock after every {milestoneThreshold === 5 ? "5th" : `${milestoneThreshold}th`} visit
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 7. LOYALTY POINTS & REWARDS SECTION (Sage Green #809181)       */}
      {/* ============================================================== */}
      <div className="bg-[#809181] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-white shadow-xs mb-3 space-y-2.5">
        {/* Section Title Pill */}
        <div className="bg-white rounded-xl py-1.5 px-3 text-center">
          <h3 className="font-bold text-xs min-[380px]:text-sm tracking-wider uppercase text-[#1b3124]">
            LOYALTY POINTS &amp; REWARDS
          </h3>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center justify-between gap-1 min-[380px]:gap-1.5 px-0.5">
          {(
            [
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "7days", label: "Last 7 Days" },
              { id: "30days", label: "Last 30 Days" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id)}
              className={`flex-1 py-1 rounded-full text-[9px] min-[360px]:text-[10px] min-[390px]:text-[11px] font-bold text-center transition-all cursor-pointer truncate ${
                dateFilter === tab.id
                  ? "bg-[#0d331c] text-white shadow-xs font-black"
                  : "bg-white text-[#1b3124] hover:bg-stone-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* White Inner Box: Recent visits and reciepts */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 text-[#1E1815] min-h-[170px] shadow-xs">
          <div className="font-normal text-xs min-[380px]:text-sm text-[#1E1815] mb-2.5 font-medium">
            Recent visits and reciepts:
          </div>

          {filteredTransactions && filteredTransactions.length > 0 ? (
            <div className="divide-y divide-[#EFE8E1]">
              {filteredTransactions.map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedReceipt(t)}
                  className="py-2.5 px-1 rounded-xl hover:bg-[#FAF7F4] active:bg-[#F2ECE5] transition-all flex items-center justify-between first:pt-1 last:pb-1 gap-2 cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  title="Click to view full receipt breakdown"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs sm:text-sm text-[#1E1815] group-hover:text-[#0d331c] transition-colors truncate flex items-center gap-1">
                      <span>{t.branch || customer.homeBranch?.name || "Branch Visit"}</span>
                      <span className="text-[10px] text-[#A0938C]">›</span>
                    </div>
                    <div className="text-[10px] text-[#7A6E67] flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {t.invoiceNumber && (
                        <span className="font-mono font-bold text-[#1E1815]">#{t.invoiceNumber}</span>
                      )}
                      <span>•</span>
                      <span>{formatRelativeTime(t.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-xs sm:text-sm text-[#1E1815]">
                      {currency} {Number(t.amount || 0).toFixed(2)}
                    </div>
                    {t.pointsEarned > 0 && (
                      <div className="text-[10px] font-extrabold text-emerald-700">
                        +{t.pointsEarned} pts
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-7 text-xs text-[#7A6E67]">
              <Receipt className="w-6 h-6 text-[#809181]/40 mx-auto mb-1.5" />
              <p className="font-semibold text-[#1E1815]">
                {dateFilter === "all"
                  ? "No previous visits recorded yet."
                  : `No visits recorded for ${dateFilter === "today" ? "today" : dateFilter === "7days" ? "the last 7 days" : "the last 30 days"}.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* CONFIRMATION POPUP MODAL: TAP TO REDEEM REWARD                 */}
      {/* ============================================================== */}
      {redeemModalReward && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-[#EAE3DC] shadow-2xl space-y-4 animate-in zoom-in-95 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0d331c] mx-auto flex items-center justify-center border border-emerald-100 shadow-xs">
              <Gift className="w-7 h-7 text-[#0d331c]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#1E1815]">Redeem Reward?</h3>
              <p className="text-sm font-semibold text-[#0d331c] mt-1">
                {redeemModalReward.name}
              </p>
              <p className="text-xs text-[#7A6E67] mt-2 leading-relaxed">
                Do you want to redeem this reward now? Once confirmed, it will be activated so the cashier at the outlet counter can apply it to your bill.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setRedeemModalReward(null)}
                disabled={redeemBusy}
                className="py-2.5 px-4 rounded-xl border border-stone-200 text-[#7A6E67] hover:bg-[#FAF7F4] font-bold text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRedeem}
                disabled={redeemBusy}
                className="py-2.5 px-4 rounded-xl bg-[#0d331c] hover:bg-[#163827] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
              >
                {redeemBusy ? "Activating…" : "Yes, Redeem"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: APPLE WALLET PASS INSTRUCTIONS                          */}
      {/* ============================================================== */}
      {showAppleWalletModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1C1C1E] text-white rounded-3xl max-w-sm w-full p-5 border border-white/10 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <AppleWalletIcon className="w-6 h-4.5 shrink-0" />
                <h3 className="font-bold text-sm tracking-tight text-white">Apple Wallet Pass</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAppleWalletModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white text-[#1E1815] rounded-2xl p-4 shadow-lg space-y-2.5 relative overflow-hidden border border-stone-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/bc-roundel.png" alt="Levante" className="w-7 h-7 rounded-full object-contain" />
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wider text-[#1a3c24]">Levante</div>
                    <div className="text-[9px] text-[#7A6E67] font-semibold">Loyalty Card</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-bold text-[#7A6E67] uppercase">VISITS</div>
                  <div className="text-sm font-black leading-tight text-[#1a3c24]">{visitsIntoCycle} / {milestoneThreshold}</div>
                </div>
              </div>

              <div className="flex justify-between items-end pt-1 border-t border-stone-100">
                <div>
                  <div className="text-[9px] text-[#7A6E67] uppercase font-medium">MEMBER NAME</div>
                  <div className="font-bold text-xs truncate max-w-[170px] text-[#1E1815]">{customer?.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-[#7A6E67] uppercase font-medium">COUPON / PTS</div>
                  <div className="font-bold text-xs text-[#1E1815]">{couponDisplay} • {customer?.pointsBalance || 0} pts</div>
                </div>
              </div>

              <div className="bg-stone-50 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
                {qr?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr.image} alt="Wallet Barcode" className="w-24 h-24 object-contain" />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-xs font-mono text-gray-400">QR</div>
                )}
                <div className="text-[11px] font-mono font-bold text-black mt-1">
                  {formatCustomerCode(qr?.code || "LP987867")}
                </div>
              </div>
            </div>

            <div className="text-xs text-white/70 space-y-1.5 px-0.5">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span><strong>iPhone Safari:</strong> Add to Apple Wallet by opening this page in Safari.</span>
              </div>
            </div>

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setToast("Apple Wallet pass sync initiated!");
                  setShowAppleWalletModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-white hover:bg-gray-100 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                <span>Add to Apple Wallet</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAppleWalletModal(false)}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: GOOGLE WALLET PASS INSTRUCTIONS                          */}
      {/* ============================================================== */}
      {showGoogleWalletModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1C1C1E] text-white rounded-3xl max-w-sm w-full p-5 border border-white/10 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <GoogleWalletIcon className="w-6 h-4.5 shrink-0" />
                <h3 className="font-bold text-sm tracking-tight text-white">Google Wallet Pass</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleWalletModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white text-[#1E1815] rounded-2xl p-4 shadow-lg space-y-2.5 relative overflow-hidden border border-stone-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/bc-roundel.png" alt="Levante" className="w-7 h-7 rounded-full object-contain" />
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wider text-[#1a3c24]">Levante</div>
                    <div className="text-[9px] text-[#7A6E67] font-semibold">Loyalty Card</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-bold text-[#7A6E67] uppercase">POINTS</div>
                  <div className="text-sm font-black leading-tight text-[#1a3c24]">{customer?.pointsBalance || 0} pts</div>
                </div>
              </div>

              <div className="bg-stone-50 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
                {qr?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr.image} alt="Wallet Barcode" className="w-24 h-24 object-contain" />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-xs font-mono text-gray-400">QR</div>
                )}
                <div className="text-[11px] font-mono font-bold text-black mt-1">
                  {formatCustomerCode(qr?.code || "LP987867")}
                </div>
              </div>
            </div>

            <div className="text-xs text-white/70 space-y-1.5 px-0.5">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold shrink-0">•</span>
                <span>Keep your loyalty membership barcode and stamps handy directly in Google Wallet.</span>
              </div>
            </div>

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setToast("Google Wallet pass saved!");
                  setShowGoogleWalletModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-white hover:bg-gray-100 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                <span>Save to Google Wallet</span>
              </button>
              <button
                type="button"
                onClick={() => setShowGoogleWalletModal(false)}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. HAMBURGER MENU / PROFILE SLIDEOUT MODAL                    */}
      {/* ============================================================== */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 border border-[#EAE3DC] shadow-2xl space-y-5 animate-in slide-in-from-bottom-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0E331E] text-white flex items-center justify-center font-bold text-sm">
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
                    <Edit3 className="w-3.5 h-3.5 text-[#0E331E]" /> Edit Profile
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
                {profileMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      profileMsg.type === "ok"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {profileMsg.text}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">
                    Mobile Number (Login &amp; WhatsApp OTP)
                  </label>
                  <div className="flex gap-1.5 items-center">
                    <CountryCodePicker
                      value={profile.countryCode}
                      onChange={(code) => setProfile({ ...profile, countryCode: code })}
                    />
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      placeholder="50 123 4567"
                      value={profile.mobile}
                      onChange={(e) => setProfile({ ...profile, mobile: e.target.value.replace(/\D/g, "") })}
                      className="flex-1 min-w-0 px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] font-mono font-bold focus:outline-none focus:border-[#0E331E]"
                    />
                  </div>
                  <p className="text-[10px] text-[#7A6E67] mt-1">
                    Enter digits without country code. Used for WhatsApp OTP and till loyalty search.
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">
                    Email Address (Login &amp; Digital Receipts)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                  />
                  <p className="text-[10px] text-[#7A6E67] mt-1">
                    Used for email login and digital promotion gift vouchers.
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">Birthday</label>
                  <input
                    type="date"
                    value={profile.birthday}
                    onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={profileBusy}
                    className="flex-1 py-2 rounded-xl bg-[#0E331E] hover:bg-[#143F26] text-white text-xs font-bold cursor-pointer"
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
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-[#0E331E] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out / Switch Account
              </button>
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
                <div className="w-10 h-10 rounded-2xl bg-[#0E331E] text-white flex items-center justify-center shadow-md shadow-[#0E331E]/20">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E1815]">Record Bill & Earn Points</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase">
                      ✓ {verifiedBranch?.name || "Branch Verified"}
                    </span>
                    <span className="font-mono text-[9px] font-bold text-[#0E331E]">
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
                  className="w-full px-3 py-2.5 bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-xs font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
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
                  className="w-full px-3 py-2.5 bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
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
                  className="flex-[2] py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#143F26] text-white font-bold text-xs shadow-md shadow-[#0E331E]/20 disabled:opacity-50"
                >
                  {billSubmitting ? "Adding Points…" : "Confirm & Earn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 13. CUSTOMER PORTAL QR CODE MODAL (Matches Image 3)            */}
      {/* ============================================================== */}
      {showPortalQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F4] border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl relative text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowPortalQrModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white hover:bg-[#EFE9E2] border border-[#EAE3DC] text-[#7A6E67] hover:text-[#1E1815] flex items-center justify-center cursor-pointer transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="pr-8 mb-4">
              <h3 className="text-lg font-black text-[#1E1815] tracking-tight">
                Customer Portal QR Code
              </h3>
              <p className="text-[11px] text-[#7A6E67] mt-1 leading-snug">
                Guests can scan this code to register or open their loyalty account.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-3.5 rounded-3xl border border-[#EAE3DC] shadow-xs inline-block my-2">
              {portalQrDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={portalQrDataUrl}
                  alt="Customer Portal QR Code"
                  className="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-[#0E331E]/20 border-t-[#0E331E] rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Subtext & URL Display */}
            <div className="my-3 space-y-1">
              <div className="text-xs font-semibold text-[#7A6E67]">
                Scan to join Levante Rewards
              </div>
              <div className="text-[10px] font-mono text-[#0E331E] break-all px-2 font-bold select-all bg-white/70 py-1.5 rounded-lg border border-[#EAE3DC]/60">
                {portalUrl || "https://artoflevante.ae"}
              </div>
            </div>

            {/* Share Link Button */}
            <button
              onClick={handleSharePortalLink}
              className="w-full mt-2 py-3 px-5 rounded-2xl bg-[#092015] hover:bg-[#092015] text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedPortalLink ? "Link Copied to Clipboard!" : "SHARE LINK"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 14. DIGITAL RECEIPT DETAILS MODAL (Matches user design)         */}
      {/* ============================================================== */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-emerald-200 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200 relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Checkmark Icon */}
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>

            {/* Receipt Header */}
            <div>
              <h3 className="font-serif font-black text-2xl text-emerald-950">Sale &amp; Points Succeeded!</h3>
              <p className="text-xs text-emerald-800 font-medium mt-1">
                Invoice #{selectedReceipt.invoiceNumber} recorded at {selectedReceipt.branch || customer.homeBranch?.name || "Branch"}.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-900 text-[11px] font-medium mt-2">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>{formatExactDateTime(selectedReceipt.createdAt)}</span>
              </div>
            </div>

            {/* Breakdown Card */}
            <div className="bg-[#FAF7F4] rounded-2xl p-4.5 border border-emerald-200/80 text-xs text-left space-y-2.5 font-medium shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#7A6E67]">Gross Bill:</span>
                <span className="font-bold text-[#1E1815] font-mono">
                  {currency} {Number(selectedReceipt.grossBill ?? selectedReceipt.amount ?? 0).toFixed(2)}
                </span>
              </div>

              {Number(selectedReceipt.discountGiven || 0) > 0 && (
                <div className="flex justify-between items-start text-red-700">
                  <span>
                    Total Discount:
                    {selectedReceipt.redeemedRewards && selectedReceipt.redeemedRewards.length > 0 && (
                      <span className="block text-[10px] text-red-600 font-normal">
                        ({selectedReceipt.redeemedRewards.join(", ")})
                      </span>
                    )}
                  </span>
                  <span className="font-bold font-mono">
                    -{currency} {Number(selectedReceipt.discountGiven).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-[#1E1815] pt-1.5 border-t border-[#EAE3DC]">
                <span className="font-black text-xs text-[#0E331E]">Customer Paid (Net):</span>
                <span className="font-black text-sm text-[#0E331E] font-mono">
                  {currency} {Number(
                    selectedReceipt.amountPaid ??
                    Math.max(0, Number(selectedReceipt.amount || 0) - Number(selectedReceipt.discountGiven || 0))
                  ).toFixed(2)}
                </span>
              </div>

              {Number(selectedReceipt.pointsRedeemed || 0) > 0 && (
                <div className="flex justify-between items-center text-red-700 pt-1.5 border-t border-[#EAE3DC]/60">
                  <span>Points Redeemed:</span>
                  <span className="font-bold font-mono">-{selectedReceipt.pointsRedeemed} pts</span>
                </div>
              )}

              {Number(selectedReceipt.pointsEarned || 0) > 0 && (
                <div className="flex justify-between items-center text-emerald-800">
                  <span>Points Awarded:</span>
                  <span className="font-black font-mono">+{selectedReceipt.pointsEarned} pts</span>
                </div>
              )}

              <div className="flex justify-between items-center text-blue-800 pt-1.5 border-t border-[#EAE3DC]/60">
                <span>Transaction Status:</span>
                <span className="font-black font-mono">Completed &amp; Stamped ✓</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-3 px-6 rounded-xl bg-[#092015] hover:bg-[#092015] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              CLOSE RECEIPT
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

      {/* ============================================================== */}
      {/* MODAL: NEW PROMOTIONAL OFFER POPUP ANNOUNCEMENT                */}
      {/* ============================================================== */}
      {popupOffer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
            {/* Top decorative gradient bar */}
            <div className="h-2 bg-gradient-to-r from-[#0E331E] via-[#D4AF37] to-[#0E331E]" />

            {/* Offer Banner Image if available */}
            {popupOffer.imageUrl && (
              <div className="relative aspect-[2/1] w-full overflow-hidden bg-[#1E1815]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={popupOffer.imageUrl}
                  alt={popupOffer.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0E331E] text-white font-display font-extrabold text-[11px] uppercase tracking-wider shadow-md">
                  🔥 Special Deal
                </span>
                <button
                  type="button"
                  onClick={() => handleDismissPopupOffer(popupOffer.id)}
                  className="absolute top-3 right-3 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="p-5 text-center space-y-3">
              {!popupOffer.imageUrl && (
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#0E331E]/10 text-[#0E331E] border border-[#0E331E]/20 flex items-center justify-center mx-auto shadow-sm">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDismissPopupOffer(popupOffer.id)}
                    className="p-1 rounded-full hover:bg-[#FAF7F4] text-[#7A6E67] cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0E331E]/10 text-[#0E331E] text-xs font-display font-bold uppercase tracking-wider mb-2">
                  <Tag className="w-3.5 h-3.5" />
                  <span>
                    {popupOffer.isPercent ? `${popupOffer.value}% DISCOUNT` : `AED ${popupOffer.value} OFF`}
                  </span>
                </div>
                <h3 className="font-display font-black text-xl text-[#1E1815] leading-tight">
                  {popupOffer.name}
                </h3>
                <p className="text-xs text-[#7A6E67] mt-1.5 leading-relaxed font-body">
                  {popupOffer.description || "Visit the Levante boutique to enjoy this special deal on your next visit!"}
                </p>
              </div>

              {popupOffer.endsAt && (
                <div className="text-[11px] font-semibold text-[#0E331E] bg-[#FAF7F4] py-1.5 px-3 rounded-xl border border-[#EAE3DC] inline-block">
                  ⏳ Valid until {new Date(popupOffer.endsAt).toLocaleDateString()}
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => handleDismissPopupOffer(popupOffer.id)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0E331E] to-[#0E331E] hover:from-[#0A2617] text-white font-display font-bold text-sm tracking-wide shadow-md shadow-[#0E331E]/30 transition-all cursor-pointer active:scale-98"
                >
                  Got it, Let&apos;s Dine! 🎉
                </button>
                <button
                  type="button"
                  onClick={() => handleDismissPopupOffer(popupOffer.id)}
                  className="w-full py-2 text-xs font-bold text-[#7A6E67] hover:text-[#1E1815] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CUSTOMER ALL ACTIVE DEALS & PROMOTIONS SHEET            */}
      {/* ============================================================== */}
      {showOffersModal && (() => {
        const visibleOffers = (data?.offers || []).filter(
          (offer: any) => !clearedOfferIds.includes(offer.id)
        );
        const hasClearedAny = clearedOfferIds.length > 0 && (data?.offers || []).length > 0;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-[#EAE3DC] rounded-3xl max-w-md w-full shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAE3DC] bg-[#FAF7F4] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#0E331E] text-white flex items-center justify-center shadow-xs">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[#1E1815]">Active Deals &amp; Offers</h3>
                    <p className="text-[11px] text-[#7A6E67]">Exclusive promotions for Loyalty Club members</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {visibleOffers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllOffers}
                      className="px-2.5 py-1 text-[11px] font-bold text-[#7A6E67] hover:text-[#143F26] hover:bg-white rounded-lg border border-transparent hover:border-[#EAE3DC] transition-all flex items-center gap-1 cursor-pointer"
                      title="Clear all active offers from list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowOffersModal(false)}
                    className="p-1.5 rounded-xl text-[#7A6E67] hover:bg-white hover:text-[#1E1815] border border-transparent hover:border-[#EAE3DC] transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 overflow-y-auto space-y-2.5 custom-scrollbar flex-1">
                {visibleOffers.length > 0 ? (
                  visibleOffers.map((offer: any) => (
                    <div
                      key={offer.id}
                      className="p-3 rounded-2xl bg-[#FAF7F4] hover:bg-white border border-[#EAE3DC] hover:border-[#0E331E]/30 transition-all flex items-start gap-3 shadow-2xs relative overflow-hidden group"
                    >
                      {/* Left Side Thumbnail Image */}
                      {offer.imageUrl ? (
                        <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden shrink-0 bg-[#1E1815] border border-[#EAE3DC] relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={offer.imageUrl}
                            alt={offer.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-[#0E331E]/10 to-[#FAF3E6] border border-[#0E331E]/20 flex items-center justify-center text-[#0E331E] shrink-0">
                          <Tag className="w-6 h-6" />
                        </div>
                      )}

                      {/* Right Side Content (Title, Description, Off Badge, Validity) */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch pr-5">
                        <div>
                          <div className="flex items-start justify-between gap-1.5">
                            <h4 className="font-display font-bold text-xs sm:text-sm text-[#1E1815] leading-snug line-clamp-1 group-hover:text-[#0E331E] transition-colors">
                              {offer.name}
                            </h4>
                            <span className="shrink-0 px-2 py-0.5 rounded-lg bg-[#0E331E] text-white font-display font-black text-[10px] sm:text-[11px] whitespace-nowrap shadow-2xs">
                              {offer.isPercent ? `${offer.value}% OFF` : `AED ${offer.value} OFF`}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#7A6E67] leading-snug line-clamp-2 mt-1">
                            {offer.description || "Show your loyalty card or phone number at checkout to redeem this promotion."}
                          </p>
                        </div>

                        {offer.endsAt && (
                          <div className="text-[10px] font-bold text-[#0E331E] flex items-center gap-1 mt-1.5 pt-1 border-t border-[#EAE3DC]/60">
                            <Clock className="w-3 h-3 text-[#C68A1E] shrink-0" />
                            <span>Valid until {new Date(offer.endsAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Individual Dismiss / Clear Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearSingleOffer(offer.id);
                        }}
                        className="absolute top-2 right-2 p-1 text-[#7A6E67] hover:text-[#143F26] hover:bg-white rounded-md transition-colors cursor-pointer"
                        title="Dismiss / Clear this offer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : hasClearedAny ? (
                  <div className="text-center py-8 text-xs text-[#7A6E67] space-y-2">
                    <Sparkles className="w-8 h-8 text-[#0E331E]/40 mx-auto" />
                    <p className="font-bold text-[#1E1815] text-sm">All Deals Cleared</p>
                    <p className="text-[11px] text-[#7A6E67] max-w-xs mx-auto">
                      You have cleared active promotions from your list. You can restore them anytime to view current deals.
                    </p>
                    <button
                      type="button"
                      onClick={handleRestoreOffers}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F4] hover:bg-[#FAF3E6] border border-[#EAE3DC] text-xs font-bold text-[#0E331E] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore All Deals</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-[#7A6E67]">
                    <Sparkles className="w-8 h-8 text-[#0E331E]/30 mx-auto mb-2" />
                    <p className="font-bold text-[#1E1815]">No Active Promotions at This Moment</p>
                    <p className="text-[11px] mt-1">Watch this space for upcoming weekend deals and special discounts!</p>
                  </div>
                )}
              </div>

              <div className="px-5 py-3.5 border-t border-[#EAE3DC] bg-[#FAF7F4] flex items-center justify-between gap-2 shrink-0">
                {hasClearedAny && visibleOffers.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleRestoreOffers}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-[#EAE3DC] hover:bg-[#FAF3E6] font-display font-bold text-xs text-[#0E331E] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Deals</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowOffersModal(false)}
                    className="w-full py-2.5 rounded-xl bg-white border border-[#EAE3DC] hover:bg-[#FAF7F4] font-display font-bold text-xs text-[#1E1815] cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
