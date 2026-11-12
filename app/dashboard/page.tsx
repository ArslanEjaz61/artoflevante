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
import "./customer-dashboard.css";
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
  if (!code) return "LP987867";
  let clean = String(code).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!clean.startsWith("LP")) {
    clean = "LP" + clean;
  }
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
  const [googleWalletSaveUrl, setGoogleWalletSaveUrl] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState<"apple" | "google" | null>(null);

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

  const handleAppleWallet = async () => {
    try {
      const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const code = qr?.code ? String(qr.code).replace(/\s+/g, "") : "";
      const passUrl = `/api/card/wallet/apple?code=${encodeURIComponent(code)}`;

      const check = await fetch("/api/card/wallet/apple?check=1").catch(() => null);
      if (!check?.ok) {
        setShowAppleWalletModal(true);
        return;
      }

      if (isIOS) {
        window.location.href = passUrl;
      } else {
        const a = document.createElement("a");
        a.href = passUrl;
        a.download = `Levante-${code || "loyalty"}.pkpass`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setShowAppleWalletModal(true);
      }
    } catch {
      setShowAppleWalletModal(true);
    }
  };

  const handleGoogleWallet = async () => {
    if (googleWalletSaveUrl) {
      window.location.href = googleWalletSaveUrl;
      return;
    }

    try {
      setWalletLoading("google");
      const code = qr?.code ? String(qr.code).replace(/\s+/g, "") : "";
      const res = await fetch(`/api/card/wallet/google?code=${encodeURIComponent(code)}`);
      const d = await res.json();
      if (d.saveUrl) {
        setGoogleWalletSaveUrl(d.saveUrl);
        window.location.href = d.saveUrl;
      } else {
        setGoogleWalletSaveUrl(null);
        setShowGoogleWalletModal(true);
      }
    } catch {
      setGoogleWalletSaveUrl(null);
      setShowGoogleWalletModal(true);
    } finally {
      setWalletLoading(null);
    }
  };

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

  // Visit milestone coupon: cyclical every 5 visits (every 5 visits = +1 coupon and stamps restart for the next cycle)
  const completed5VisitCycles = Math.floor(currentVisits / 5);
  const couponCount = completed5VisitCycles;
  const couponDisplay = String(couponCount).padStart(2, "0");

  const targetStamps = 5;
  const stampsEarned = currentVisits % 5;

  // Separate Welcome Discount and Available Gift Rewards
  const welcomeReward = availableRewards.find(
    (r: any) => r.type === "WELCOME" || r.name?.toLowerCase().includes("welcome")
  );
  const availableGifts = availableRewards.filter(
    (r: any) => r.id !== welcomeReward?.id
  );

  const welcomePercent = welcomeReward?.value ? Math.round(welcomeReward.value) : loyaltyRules?.welcomeDiscountPercent || 10;
  const nthSuffix = (n: number) =>
    n % 100 >= 11 && n % 100 <= 13 ? "th" : n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th";

  return (
    <div className="cd min-h-screen bg-[#EFEBE0] pb-24 max-w-md w-full mx-auto fold-safe [box-shadow:0_0_0_100vmax_#EFEBE0] [clip-path:inset(0_-100vmax)] selection:bg-[#0E331E] selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1E1815] text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 max-w-[90vw] text-center">
          <CheckCircle2 className="w-4 h-4 text-[#E5A93C] shrink-0" />
          <span className="truncate">{toast}</span>
        </div>
      )}

      {/* 1. HEADER: roundel + "Loyality Reward Path" (sizes: ./customer-dashboard.css) */}
      <header className="cd-header">
        <div className="cd-header-brand">
          <div className="cd-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bc-roundel.png" alt="Levante" />
          </div>
          <h1 className="cd-title">Loyality Reward Path</h1>
        </div>
        <div className="cd-header-actions">
          <button
            type="button"
            onClick={handleOpenOffersModal}
            className="cd-icon-btn"
            title="Special Offers & Deals"
            aria-label="View Deals"
          >
            <Bell />
            {unreadOffersCount > 0 && <span className="cd-icon-badge">{unreadOffersCount}</span>}
          </button>
          <button
            type="button"
            onClick={() => setShowSwitchModal(true)}
            className="cd-icon-btn"
            title="Account Menu"
            aria-label="Open Menu"
          >
            <Menu />
          </button>
        </div>
      </header>

      {/* 2. STAMP CARD + QR CARD */}
      <CustomerDesignB
        customer={customer}
        qr={qr}
        customerCode={formatCustomerCode(qr?.code || "LP987867")}
        targetStamps={targetStamps}
        stampsEarned={stampsEarned}
        couponDisplay={couponDisplay}
      />

      {/* 3. APPLE WALLET / GOOGLE WALLET / WEB APP */}
      <div className="cd-wallets">
        <button type="button" onClick={handleAppleWallet} disabled={walletLoading === "apple"} className="cd-wallet">
          <AppleWalletIcon className="cd-wallet-icon" />
          <div className="min-w-0">
            <small>Add to</small>
            <b>Apple Wallet</b>
          </div>
        </button>
        <button
          type="button"
          onClick={handleGoogleWallet}
          disabled={walletLoading === "google"}
          className="cd-wallet cd-wallet-google"
        >
          <GoogleWalletIcon className="cd-wallet-icon-g" />
          <div className="min-w-0">
            <small>Add to</small>
            <b>{walletLoading === "google" ? "Saving..." : "Google Wallet"}</b>
          </div>
        </button>
        <button type="button" onClick={handleInstall} className="cd-wallet cd-wallet-web">
          <span>
            Download it as
            <br />
            WEB APP
          </span>
          <svg viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M28 4v32M15 24l13 13 13-13M4 38v14h48V38" />
          </svg>
        </button>
      </div>

      {/* 4. SCAN RECEIPT ROW */}
      <ReceiptScanner onClaimed={loadCard} />

      {/* 5. WELCOME DISCOUNT */}
      <div className="cd-banner cd-banner-first">
        <div className="cd-banner-title">
          Welcome
          <br />
          Discount
        </div>
        {welcomeReward?.isRedeemRequested ? (
          <span className="cd-redeemed">REDEEMED</span>
        ) : (
          <button
            type="button"
            className="cd-tap"
            onClick={() => {
              if (welcomeReward) setRedeemModalReward(welcomeReward);
              else handleOpenOffersModal();
            }}
          >
            TAP TO REDEEM
            <svg viewBox="0 0 205 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 10h198M190 2l9 8-9 8" />
            </svg>
          </button>
        )}
        <div className="cd-ribbon" />
        <span className="cd-big cd-ten">{welcomePercent}</span>
        <span className="cd-big cd-pct">%</span>
        <span className="cd-big cd-off">OFF</span>
      </div>

      {/* 5.1 OTHER UNLOCKED GIFTS (same banner shape) */}
      {availableGifts.map((gift: any) => (
        <div key={gift.id} className="cd-banner">
          <div className="cd-banner-title">
            <small>Gift Reward</small>
            <em>{gift.name}</em>
          </div>
          {gift.isRedeemRequested ? (
            <span className="cd-redeemed">REDEEMED</span>
          ) : (
            <button type="button" className="cd-tap" onClick={() => setRedeemModalReward(gift)}>
              TAP TO REDEEM
              <svg viewBox="0 0 205 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 10h198M190 2l9 8-9 8" />
              </svg>
            </button>
          )}
          <div className="cd-ribbon" />
          <span className="cd-big cd-gift-free">
            <Gift />
            FREE
          </span>
        </div>
      ))}

      {/* 6. VISIT MILESTONE REWARD */}
      <div className="cd-banner cd-banner-visit">
        <div className="cd-banner-title">
          Visit Milestone
          <br />
          Reward
        </div>
        <span className="cd-visit-count">
          {visitsIntoCycle}/{milestoneThreshold}
        </span>
        <span className="cd-visit-note">
          unlock after every {milestoneThreshold}
          <sup>{nthSuffix(milestoneThreshold)}</sup> visit
        </span>
        <svg className="cd-visit-gift" viewBox="0 0 122 140" fill="currentColor" aria-hidden="true">
          <path d="M61 34c-6-14-20-26-33-22-9 3-9 15 0 19 9 4 24 4 33 3zm0 0c6-14 20-26 33-22 9 3 9 15 0 19-9 4-24 4-33 3z" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
          <rect x="0" y="40" width="122" height="24" />
          <rect x="10" y="72" width="102" height="68" />
          <rect x="56" y="40" width="10" height="100" fill="#fff" />
        </svg>
      </div>

      {/* 7. LOYALITY POINTS & REWARDS */}
      <div className="cd-panel">
        <div className="cd-panel-title">LOYALITY POINTS &amp; REWARDS</div>

        <div className="cd-filters">
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
              type="button"
              onClick={() => setDateFilter(tab.id)}
              className={`cd-filter ${dateFilter === tab.id && tab.id !== "all" ? "cd-filter-on" : ""}`}
              aria-pressed={dateFilter === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="cd-recent">
          <div className="cd-recent-title">Recent visits and reciepts:</div>

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

            {/* Unified Card matching Image 3 (100% same to same) */}
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-[#E8E2D7] relative overflow-hidden text-[#1E1815]">
              {/* Subtle Watermark */}
              <div className="absolute right-0 top-0 bottom-0 w-36 pointer-events-none select-none z-0 overflow-hidden flex items-center justify-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/watermark-top.png" alt="" className="h-[110%] w-auto object-contain opacity-90" />
              </div>

              {/* Header: LEVANTE */}
              <div className="flex flex-col items-start justify-center pt-0.5 mb-2.5 relative z-10">
                <div className="font-blossom tracking-[0.12em] text-xl font-normal text-[#1E1815] leading-none">
                  LEVANTE
                </div>
                <div className="text-[6.5px] tracking-[0.25em] uppercase text-[#7A6A68] mt-0.5 font-sans font-medium">
                  COFFEE • FLOWERS • CHOCOLATE
                </div>
              </div>

              {/* 5 Stamps Row */}
              <div className="relative z-10 my-2.5 flex items-center justify-between gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const isFilled = i < stampsEarned;
                  return (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-[1.5px] border-[#8E7E7C] flex items-center justify-center bg-transparent overflow-hidden shrink-0"
                    >
                      {isFilled && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src="/levante-stamp.png" alt="Stamp" className="w-7 h-7 object-contain" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Customer Details */}
              <div className="flex items-end justify-between gap-2 pt-1 pb-2 relative z-10">
                <div className="min-w-0 flex-1 pr-1">
                  <div className="text-[9px] font-medium text-[#7A6A68] leading-tight">Full Name</div>
                  <div className="text-[13px] font-bold text-[#1E1815] leading-snug tracking-tight truncate">
                    {customer?.name || "Bilal Chishty"}
                  </div>
                </div>
                <div className="text-right shrink-0 whitespace-nowrap">
                  <div className="text-[9px] font-bold text-[#1E1815] leading-tight">
                    Cupon: {couponDisplay}
                  </div>
                  <div className="text-[9px] font-bold text-[#1E1815] leading-tight mt-0.5">
                    Loyality Points: {customer?.pointsBalance ?? 0}
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="pt-1.5 flex flex-col items-center justify-center relative z-10">
                <div className="relative p-1.5 inline-block">
                  <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#1E1815]" />
                  <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#1E1815]" />
                  <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#1E1815]" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#1E1815]" />

                  {qr?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr.image} alt="QR Code" className="w-24 h-24 mix-blend-multiply object-contain block" />
                  ) : (
                    <div className="w-24 h-24 bg-stone-100 flex items-center justify-center text-xs font-mono">QR</div>
                  )}
                </div>
                <div className="mt-1.5 text-center font-bold text-xs tracking-wider text-[#1E1815]">
                  {formatCustomerCode(qr?.code || "LP987867")}
                </div>
              </div>
            </div>

            <div className="text-xs text-white/70 space-y-1.5 px-0.5">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span><strong>iPhone Safari:</strong> Open in Safari to add your dynamic pass directly to Apple Wallet.</span>
              </div>
            </div>

            <div className="pt-1 flex gap-2">
              <a
                href={`/api/card/wallet/apple?code=${encodeURIComponent(qr?.code ? String(qr.code).replace(/\s+/g, "") : "")}`}
                download={`Levante-${qr?.code || "loyalty"}.pkpass`}
                className="flex-1 py-3 rounded-xl bg-white hover:bg-gray-100 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                <span>Download .pkpass</span>
                <Download className="w-3.5 h-3.5" />
              </a>
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

            {/* Unified Card matching Image 3 (100% same to same) */}
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-[#E8E2D7] relative overflow-hidden text-[#1E1815]">
              {/* Subtle Watermark */}
              <div className="absolute right-0 top-0 bottom-0 w-36 pointer-events-none select-none z-0 overflow-hidden flex items-center justify-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/watermark-top.png" alt="" className="h-[110%] w-auto object-contain opacity-90" />
              </div>

              {/* Header: LEVANTE */}
              <div className="flex flex-col items-start justify-center pt-0.5 mb-2.5 relative z-10">
                <div className="font-blossom tracking-[0.12em] text-xl font-normal text-[#1E1815] leading-none">
                  LEVANTE
                </div>
                <div className="text-[6.5px] tracking-[0.25em] uppercase text-[#7A6A68] mt-0.5 font-sans font-medium">
                  COFFEE • FLOWERS • CHOCOLATE
                </div>
              </div>

              {/* 5 Stamps Row */}
              <div className="relative z-10 my-2.5 flex items-center justify-between gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const isFilled = i < stampsEarned;
                  return (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-[1.5px] border-[#8E7E7C] flex items-center justify-center bg-transparent overflow-hidden shrink-0"
                    >
                      {isFilled && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src="/levante-stamp.png" alt="Stamp" className="w-7 h-7 object-contain" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Customer Details */}
              <div className="flex items-end justify-between gap-2 pt-1 pb-2 relative z-10">
                <div className="min-w-0 flex-1 pr-1">
                  <div className="text-[9px] font-medium text-[#7A6A68] leading-tight">Full Name</div>
                  <div className="text-[13px] font-bold text-[#1E1815] leading-snug tracking-tight truncate">
                    {customer?.name || "Bilal Chishty"}
                  </div>
                </div>
                <div className="text-right shrink-0 whitespace-nowrap">
                  <div className="text-[9px] font-bold text-[#1E1815] leading-tight">
                    Cupon: {couponDisplay}
                  </div>
                  <div className="text-[9px] font-bold text-[#1E1815] leading-tight mt-0.5">
                    Loyality Points: {customer?.pointsBalance ?? 0}
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="pt-1.5 flex flex-col items-center justify-center relative z-10">
                <div className="relative p-1.5 inline-block">
                  <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#1E1815]" />
                  <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#1E1815]" />
                  <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#1E1815]" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#1E1815]" />

                  {qr?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr.image} alt="QR Code" className="w-24 h-24 mix-blend-multiply object-contain block" />
                  ) : (
                    <div className="w-24 h-24 bg-stone-100 flex items-center justify-center text-xs font-mono">QR</div>
                  )}
                </div>
                <div className="mt-1.5 text-center font-bold text-xs tracking-wider text-[#1E1815]">
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
              {googleWalletSaveUrl ? (
                <a
                  href={googleWalletSaveUrl}
                  className="flex-1 py-3 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
                >
                  <GoogleWalletIcon className="w-4.5 h-4 shrink-0" />
                  <span>Save to Google Wallet</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleWallet}
                  className="flex-1 py-3 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                >
                  <GoogleWalletIcon className="w-4.5 h-4 shrink-0" />
                  <span>Save to Google Wallet</span>
                </button>
              )}
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
