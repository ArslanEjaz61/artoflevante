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
} from "lucide-react";
import QRCode from "qrcode";
import { usePwaInstall } from "@/lib/usePwaInstall";
import { InstallGuideModal } from "@/components/InstallGuideModal";

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
  const [profile, setProfile] = useState({ name: "", email: "", birthday: "" });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [historyTab, setHistoryTab] = useState<"bills" | "rewards">("bills");

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

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/";
  }

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
        body: JSON.stringify({
          name: profile.name.trim(),
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
            onClick={() => router.push("/login")}
            className="py-2.5 px-6 rounded-xl bg-[#0E331E] text-white font-bold text-sm cursor-pointer shadow-md"
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

  return (
    <div className="min-h-screen bg-[#F5EFE0] text-[#1E1815] pb-24 px-3.5 sm:px-4 pt-3.5 sm:pt-5 max-w-md w-full mx-auto selection:bg-[#0E331E] selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1E1815] text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 max-w-[90vw] text-center">
          <CheckCircle2 className="w-4 h-4 text-[#E5A93C] shrink-0" />
          <span className="truncate">{toast}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP HEADER (With Brand Avatar & Hamburger Menu)             */}
      {/* ============================================================== */}
      <header className="flex items-center justify-between mb-3.5 sm:mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Brand Logo Avatar */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bc-roundel.png" alt="Levante" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold uppercase tracking-[0.02em] text-[16px] sm:text-[21px] leading-none text-[#A57414] truncate">
              Welcome Back
            </div>
            <h1 className="font-display text-[17px] sm:text-[21px] font-bold text-[#1E1815] leading-tight mt-0.5 truncate">
              {firstName}
            </h1>
          </div>
        </div>

        {/* Actions (Offers Notification Bell & Hamburger Menu) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Deals / Notifications Bell */}
          <button
            onClick={handleOpenOffersModal}
            className="w-10 h-10 rounded-2xl bg-[#EFE9E2] hover:bg-[#E5DDD4] text-[#0E331E] flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95 relative"
            title="Special Offers & Deals"
            aria-label="View Deals"
          >
            <Bell className="w-5 h-5 text-[#0E331E]" />
            {unreadOffersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0E331E] text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-[#FAF7F4] animate-pulse">
                {unreadOffersCount}
              </span>
            )}
          </button>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setShowSwitchModal(true)}
            className="w-10 h-10 rounded-2xl bg-[#EFE9E2] hover:bg-[#E5DDD4] text-[#0E331E] flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
            title="Account Menu"
            aria-label="Open Menu"
          >
            <Menu className="w-5 h-5 text-[#0E331E]" />
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. CULINARY HERO BANNER CARD (Fallback / Single / Carousel)   */}
      {/* ============================================================== */}
      <div className="rounded-3xl overflow-hidden shadow-md mb-3.5 relative bg-[#1E1815]">
        {bannerOffers.length === 0 ? (
          /* Fallback: Default supplied artwork */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src="/banner-art.jpg"
            alt="Double the flavour, double the delight — watch this space for our deals and discounts."
            className="w-full h-auto block select-none"
            draggable={false}
          />
        ) : bannerOffers.length === 1 ? (
          /* Single Active Promotional Banner */
          <div
            className="relative group cursor-pointer"
            onClick={() => setPopupOffer(bannerOffers[0])}
            title="Click to view promotional details"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerOffers[0].imageUrl}
              alt={bannerOffers[0].name}
              className="w-full h-auto block select-none object-cover"
              draggable={false}
            />
          </div>
        ) : (
          /* Multi-Offer Auto-Sliding Carousel */
          <div className="relative overflow-hidden group">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}
            >
              {bannerOffers.map((offer: any, idx: number) => (
                <div
                  key={offer.id || idx}
                  className="w-full shrink-0 relative cursor-pointer"
                  onClick={() => setPopupOffer(offer)}
                  title="Click to view offer details"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={offer.imageUrl}
                    alt={offer.name}
                    className="w-full h-auto block select-none object-cover"
                    draggable={false}
                  />
                </div>
              ))}
            </div>

            {/* Prev / Next Arrows */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlideIndex((prev) => (prev === 0 ? bannerOffers.length - 1 : prev - 1));
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer opacity-70 hover:opacity-100 shadow-md"
              aria-label="Previous Offer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlideIndex((prev) => (prev + 1) % bannerOffers.length);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer opacity-70 hover:opacity-100 shadow-md"
              aria-label="Next Offer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
              {bannerOffers.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlideIndex(idx);
                  }}
                  className={`transition-all rounded-full pointer-events-auto cursor-pointer ${
                    currentSlideIndex === idx
                      ? "w-6 h-1.5 bg-[#F5EFE0] shadow-xs"
                      : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. ACTION BUTTONS (Share with a friend, QR Code & Install)     */}
      {/* ============================================================== */}
      <div className="space-y-2.5 mb-4">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleShare}
            className="bg-white hover:bg-[#FAF7F4] text-[#0E331E] rounded-2xl py-3.5 px-3 font-display font-bold text-[15px] leading-tight shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.99]"
          >
            <Share2 className="w-[18px] h-[18px] shrink-0" />
            <span>Share with a<span className="block">friend</span></span>
          </button>
          <button
            onClick={() => setShowPortalQrModal(true)}
            className="bg-white hover:bg-[#FAF7F4] text-[#0E331E] rounded-2xl py-3.5 px-3 font-display font-bold text-[15px] leading-tight shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.99]"
          >
            <QrCode className="w-[18px] h-[18px] shrink-0" />
            <span>QR Code</span>
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="w-full bg-white hover:bg-[#FAF7F4] text-[#0E331E] rounded-2xl py-3 px-4 font-display font-bold text-[15px] shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.99]"
        >
          <Download className="w-[18px] h-[18px] shrink-0" />
          <span>Install loyalty app</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 4. AVAILABLE POINTS VELVET CARD                                */}
      {/* ============================================================== */}
      <div className="rounded-3xl bg-[#0E331E] px-4.5 sm:px-6 pt-4 pb-5 shadow-md mb-4 relative overflow-hidden">
        {/* Subtle Decorative Background Ring */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/5 blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="font-display font-extrabold uppercase tracking-[0.01em] text-[#F5EFE0] text-[20px] sm:text-[26px] leading-tight">
            Available Points
          </div>

          <div className="flex items-end justify-between gap-2 sm:gap-3">
            <div className="font-display font-extrabold text-[#CC8820] text-[58px] xs:text-[68px] sm:text-[80px] leading-[0.9] -mt-1 truncate">
              {customer.pointsBalance}
            </div>

            {/* Golden Ribbon / Medallion Emblem */}
            <Award className="w-[64px] h-[64px] sm:w-[84px] sm:h-[84px] text-[#CC8820] stroke-[1.5] shrink-0 mb-1" />
          </div>

          <div className="flex items-end justify-between gap-2 sm:gap-3 -mt-1 flex-wrap">
            <div className="font-display font-bold text-white text-[12px] sm:text-[14px]">
              {loyaltyRules?.pointsRequiredForRedemption || 100} Points = {currency} {loyaltyRules?.currencyValuePerRedemptionPoints || 1}
            </div>
            <div className="font-display font-bold uppercase text-white text-[13px] sm:text-[16px] shrink-0">
              Tap to redeem
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. MEMBERSHIP QR CARD                                          */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm text-center mb-4">
        {/* Header Label */}
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <QrCode className="w-[18px] h-[18px] text-[#8A7F7C]" />
          <span className="font-display text-[14px] sm:text-[15px] font-semibold tracking-[0.06em] text-[#8A7F7C] uppercase">
            Your Membership QR
          </span>
        </div>
        <h3 className="font-display text-[18px] sm:text-[20px] font-bold text-[#0E331E] mb-4 sm:mb-5">
          Scan at any outlet
        </h3>

        {/* QR Code */}
        <div className="bg-[#FAF7F4] p-3 sm:p-3.5 rounded-2xl inline-block mb-3.5 sm:mb-4 shadow-inner max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr.image}
            alt="Membership QR"
            className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl block mx-auto object-contain"
          />
        </div>

        {/* Monospace Code */}
        <div className="font-mono text-sm sm:text-base font-bold text-[#0E331E] tracking-[0.16em] sm:tracking-[0.18em]">
          {qr.code}
        </div>

        {/* Helper micro-copy */}
        <p className="font-display text-xs sm:text-[14px] text-[#8A7F7C] leading-[1.45] max-w-[270px] mx-auto mt-2">
          Show this QR to cashier. Scanning opens your profile without sharing mobile number.
        </p>
      </div>

      {/* ============================================================== */}
      {/* 7. BIRTHDAY SURPRISE & FREE VOUCHERS CARDS                     */}
      {/* ============================================================== */}
      <div className="space-y-2.5 mb-4">
        {/* Case A: Birthday Surprise Gift Countdown (Locked Mystery State) */}
        {birthdayStatus?.status === "COUNTDOWN_LOCKED" && (
          <div className="rounded-2xl p-4 bg-gradient-to-r from-[#FFF9EE] via-[#FFF3DD] to-[#FFE8C2] border-2 border-[#E5A93C] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 pr-1">
                <div className="w-10 h-10 rounded-2xl bg-[#CC8820] text-white flex items-center justify-center shadow-md shadow-[#CC8820]/30 shrink-0">
                  <Gift className="w-5 h-5 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#8A5600] bg-[#FFD88A] px-2 py-0.5 rounded-md">
                      🎂 Birthday Mystery Gift
                    </span>
                    <span className="text-[9px] font-extrabold text-[#A06000] flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-[#1E1815] truncate mt-0.5">
                    Unlocks in {birthdayStatus.daysUntilBirthday} {birthdayStatus.daysUntilBirthday === 1 ? "day" : "days"}!
                  </div>
                  <div className="text-[10px] text-[#7A6E67] leading-tight mt-0.5">
                    Your special birthday surprise gift will reveal &amp; unlock automatically on your birthday!
                  </div>
                </div>
              </div>
              <div className="text-center shrink-0 bg-white/95 px-2.5 py-1.5 rounded-xl border border-[#E5A93C]/50 shadow-xs">
                <div className="text-[16px] sm:text-[18px] font-black text-[#CC8820] font-mono leading-none">
                  {birthdayStatus.daysUntilBirthday}
                </div>
                <div className="text-[7px] sm:text-[8px] font-black uppercase text-[#8A5600] tracking-wider mt-0.5">
                  Days Left
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Case B: Birthday Treat Unlocked (Available State) */}
        {birthdayStatus?.status === "AVAILABLE" && (
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#FFF5F5] to-[#FBF0EE] border-2 border-[#0E331E] shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 pr-1">
                <div className="w-10 h-10 rounded-2xl bg-[#0E331E] text-white flex items-center justify-center shadow-md shadow-[#0E331E]/25 shrink-0">
                  <PartyPopper className="w-5 h-5 text-[#F5EFE0]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#0E331E] bg-[#0E331E]/10 px-2 py-0.5 rounded-md">
                      🎉 Happy Birthday Treat!
                    </span>
                    <span className="text-[9px] font-black text-emerald-700 flex items-center gap-1">
                      <Unlock className="w-2.5 h-2.5" /> Unlocked
                    </span>
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm text-[#0E331E] truncate mt-0.5">
                    {birthdayStatus.reward?.name || "Special Birthday Gift"}
                  </div>
                  <div className="text-[10px] text-[#5C504A] leading-tight mt-0.5">
                    {birthdayStatus.reward?.description || "Show at any branch counter to claim your birthday surprise!"}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                READY
              </span>
            </div>
          </div>
        )}

        {/* Available Vouchers List */}
        {availableRewards.length > 0 &&
          availableRewards.map((reward: any) => {
            const discText = reward.isPercent
              ? `${reward.value}% OFF`
              : reward.value > 0
              ? `${currency} ${reward.value} OFF`
              : "Complimentary Item";
            const title = reward.name.includes("%") || reward.name.includes("OFF")
              ? reward.name
              : `${reward.name} (${discText})`;

            return (
              <div key={reward.id} className="bg-white rounded-2xl p-4 border border-[#EAE3DC] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF6E5] text-[#C68A1E] flex items-center justify-center shrink-0 border border-[#EFE7D8]">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-[#1E1815] truncate">
                      {title}
                    </div>
                    <div className="text-[10px] text-[#7A6E67]">Tap to show cashier</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  AVAILABLE
                </span>
              </div>
            );
          })}

        {/* Visit Milestone Surprise Reward Card */}
        <div
          className={`rounded-2xl p-4 border shadow-xs flex items-center justify-between gap-3 transition-all ${
            isSurpriseUnlocked
              ? "bg-[#FAF5EE] border-[#D8C7B5] ring-1 ring-[#D8C7B5]/60"
              : "bg-white border-[#EAE3DC]"
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0 pr-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isSurpriseUnlocked
                  ? "bg-[#0E331E] text-white border-[#0E331E]"
                  : "bg-[#0E331E]/10 text-[#0E331E] border-[#0E331E]/15"
              }`}
            >
              {isSurpriseUnlocked ? <Gift className="w-5 h-5" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-extrabold tracking-widest text-[#7A6E67] uppercase flex items-center gap-1.5">
                <span>{isSurpriseUnlocked ? "SURPRISE REWARD UNLOCKED" : "VISIT MILESTONE REWARD"}</span>
              </div>
              <div className="font-bold text-xs sm:text-sm text-[#1E1815] truncate">
                {isSurpriseUnlocked
                  ? (unlockedSurpriseReward?.name || `Free Gift on ${milestoneThreshold}th Visit`)
                  : "A delicious surprise is coming soon"}
              </div>
              <div className="text-[10px] text-[#7A6E67] mt-0.5">
                {isSurpriseUnlocked
                  ? (unlockedSurpriseReward?.description || `All ${milestoneThreshold} visits completed! Ready to redeem at the counter.`)
                  : `Unlocks once you complete ${milestoneThreshold} visits (${visitsNeeded} visit${visitsNeeded > 1 ? "s" : ""} left)`}
              </div>
            </div>
          </div>
          {isSurpriseUnlocked && (
            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
              READY
            </span>
          )}
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
            <div className="font-black text-sm text-[#0E331E] mt-0.5">
              {customer.homeBranch?.name || "Dubai Festival City"}
            </div>
          </div>
          <div className="text-right">
            <div className="font-black text-sm text-[#0E331E]">
              {visitsIntoCycle} of {milestoneThreshold} visits
            </div>
            {milestoneProgress?.cycleNumber && milestoneProgress.cycleNumber > 1 && (
              <div className="text-[9px] font-bold text-[#7A6E67] uppercase">
                Cycle #{milestoneProgress.cycleNumber}
              </div>
            )}
          </div>
        </div>

        {/* Stepper Circles dynamically generated */}
        <div className="flex items-center justify-between gap-1 py-1">
          {Array.from({ length: Math.min(milestoneThreshold, 7) }, (_, idx) => {
            const stepNum = idx + 1;
            const isMilestone = stepNum === Math.min(milestoneThreshold, 7);
            const isCompleted = visitsIntoCycle >= stepNum;

            if (isMilestone) {
              return (
                <div
                  key={stepNum}
                  className={`w-9 h-9 rounded-full flex items-center justify-center relative shadow-xs ${
                    isCompleted
                      ? "bg-[#0E331E] text-white border-2 border-[#E5A93C]"
                      : "border-2 border-dashed border-[#E5A93C] bg-[#FFFBF0] text-[#C68A1E]"
                  }`}
                >
                  <Gift className={`w-4 h-4 ${isCompleted ? "text-white" : "text-[#C68A1E]"}`} />
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-black flex items-center justify-center ${
                      isCompleted
                        ? "bg-[#0E331E] border border-white text-white"
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
                    ? "bg-[#0E331E] text-white shadow-xs"
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
            className="bg-[#0E331E] h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(progressPercent, 2)}%` }}
          />
        </div>

        <div className="text-[11px] text-[#7A6E67]">
          {visitsIntoCycle >= milestoneThreshold
            ? "Congratulations! Surprise milestone reward is unlocked and ready to redeem!"
            : visitsNeeded > 0
            ? `${visitsNeeded} more visit(s) to unlock your next gift.`
            : "Milestone goal reached!"}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 8.5 HISTORY SWITCH TABS (Bills & Receipts vs Claimed Rewards)  */}
      {/* ============================================================== */}
      <div className="flex bg-[#EAE3DC] p-1 rounded-2xl mb-3 gap-1">
        <button
          type="button"
          onClick={() => setHistoryTab("bills")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            historyTab === "bills"
              ? "bg-white text-[#0E331E] shadow-xs font-black"
              : "text-[#7A6E67] hover:text-[#1E1815]"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Bills &amp; Points ({filteredTransactions.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setHistoryTab("rewards")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            historyTab === "rewards"
              ? "bg-white text-[#0E331E] shadow-xs font-black"
              : "text-[#7A6E67] hover:text-[#1E1815]"
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Claimed Perks ({usedRewards.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 8.6 DATE RANGE FILTER PILL BAR (When Bills Tab is selected)    */}
      {/* ============================================================== */}
      {historyTab === "bills" && (
        <div className="bg-white rounded-2xl p-1 sm:p-1.5 border border-[#EAE3DC] shadow-2xs mb-4 flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => setDateFilter("all")}
            className={`flex-1 py-2 px-1 text-center rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
              dateFilter === "all"
                ? "bg-[#0E331E] text-white shadow-xs font-black"
                : "text-[#7A6E67] hover:text-[#1E1815] hover:bg-[#FAF7F4]"
            }`}
          >
            All Time
          </button>
          <button
            type="button"
            onClick={() => setDateFilter("today")}
            className={`flex-1 py-2 px-1 text-center rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
              dateFilter === "today"
                ? "bg-[#0E331E] text-white shadow-xs font-black"
                : "text-[#7A6E67] hover:text-[#1E1815] hover:bg-[#FAF7F4]"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDateFilter("7days")}
            className={`flex-1 py-2 px-1 text-center rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
              dateFilter === "7days"
                ? "bg-[#0E331E] text-white shadow-xs font-black"
                : "text-[#7A6E67] hover:text-[#1E1815] hover:bg-[#FAF7F4]"
            }`}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => setDateFilter("30days")}
            className={`flex-1 py-2 px-1 text-center rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
              dateFilter === "30days"
                ? "bg-[#0E331E] text-white shadow-xs font-black"
                : "text-[#7A6E67] hover:text-[#1E1815] hover:bg-[#FAF7F4]"
            }`}
          >
            Last 30 Days
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. HISTORY SECTION (Bills vs Claimed Perks)                     */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-[#EAE3DC] mb-4">
        {historyTab === "bills" ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0E331E]/10 text-[#0E331E] flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E1815]">
                    Recent Visits &amp; Receipts
                  </h3>
                  {dateFilter !== "all" && (
                    <div className="text-[10px] font-bold text-[#0E331E]">
                      Showing: {dateFilter === "today" ? "Today" : dateFilter === "7days" ? "Past 7 Days" : "Past 30 Days"}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#7A6E67] uppercase tracking-wider bg-[#FAF7F4] px-2 py-0.5 rounded-lg border border-[#EAE3DC]">
                {filteredTransactions.length} {filteredTransactions.length === 1 ? "Record" : "Records"}
              </span>
            </div>

            {filteredTransactions && filteredTransactions.length > 0 ? (
              <div className="divide-y divide-[#EFE8E1]">
                {filteredTransactions.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedReceipt(t)}
                    className="py-3 px-2.5 -mx-2 rounded-xl hover:bg-[#FAF7F4] active:bg-[#F2ECE5] transition-all flex items-center justify-between first:pt-2 last:pb-2 gap-3 cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    title="Click to view full receipt breakdown"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-[#1E1815] group-hover:text-[#0E331E] transition-colors truncate flex items-center gap-1.5">
                        <span>{t.branch || customer.homeBranch?.name || "Branch Visit"}</span>
                        <span className="text-[10px] text-[#A0938C] font-normal group-hover:text-[#0E331E]">›</span>
                      </div>
                      <div className="text-[10px] text-[#7A6E67] flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {t.invoiceNumber && (
                          <>
                            <span className="font-mono font-bold text-[#1E1815]">#{t.invoiceNumber}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{formatRelativeTime(t.createdAt)}</span>
                        <span>•</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                      {t.discountGiven > 0 && (
                        <div className="text-[10px] text-[#0E331E] font-bold mt-0.5">
                          Discount: -{currency} {Number(t.discountGiven).toFixed(2)}
                          {t.redeemedRewards?.length > 0 && ` (${t.redeemedRewards.join(", ")})`}
                        </div>
                      )}
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
                      {t.pointsRedeemed > 0 && (
                        <div className="text-[10px] font-extrabold text-red-700">
                          -{t.pointsRedeemed} pts redeemed
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[#7A6E67]">
                <Receipt className="w-7 h-7 text-[#0E331E]/30 mx-auto mb-1.5" />
                <p className="font-semibold">
                  {dateFilter === "all"
                    ? "No previous visits recorded yet."
                    : `No visits or receipts recorded for ${dateFilter === "today" ? "today" : dateFilter === "7days" ? "the last 7 days" : "the last 30 days"}.`}
                </p>
                {dateFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setDateFilter("all")}
                    className="mt-2 text-[11px] font-bold text-[#0E331E] hover:underline cursor-pointer"
                  >
                    Show All Time History ({transactions?.length || 0} Records)
                  </button>
                )}
                {dateFilter === "all" && (
                  <p className="text-[10px] text-[#A0938C] mt-0.5">
                    Points earned and redeemed on your bills will appear here automatically.
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          /* Claimed Perks & Rewards History Tab */
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E1815]">
                    Claimed Perks &amp; Rewards
                  </h3>
                  <div className="text-[10px] text-[#7A6E67]">
                    Vouchers, milestone perks &amp; gifts redeemed
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#7A6E67] uppercase tracking-wider bg-[#FAF7F4] px-2 py-0.5 rounded-lg border border-[#EAE3DC]">
                {usedRewards.length} {usedRewards.length === 1 ? "Perk" : "Perks"}
              </span>
            </div>

            {usedRewards && usedRewards.length > 0 ? (
              <div className="divide-y divide-[#EFE8E1]">
                {usedRewards.map((cr: any) => (
                  <div key={cr.id} className="py-3 px-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center shrink-0 border border-stone-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-stone-800 truncate">
                          {cr.name}
                        </div>
                        <div className="text-[10px] text-[#7A6E67] flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span>Redeemed {cr.redeemedAt ? formatRelativeTime(cr.redeemedAt) : "Recently"}</span>
                          {cr.redeemedBranch && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-[#1E1815]">{cr.redeemedBranch}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-300 shrink-0">
                      REDEEMED ✓
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[#7A6E67]">
                <Gift className="w-7 h-7 text-[#0E331E]/30 mx-auto mb-1.5" />
                <p className="font-semibold">No claimed perks yet.</p>
                <p className="text-[10px] text-[#A0938C] mt-0.5">
                  When you redeem milestone treats, birthday gifts, or vouchers at checkout, they will appear here in your permanent rewards history.
                </p>
              </div>
            )}
          </>
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
                  <label className="block text-[10px] font-extrabold uppercase text-[#7A6E67] mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                  />
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
