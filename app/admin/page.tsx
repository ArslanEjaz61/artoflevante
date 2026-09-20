"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Tag,
  Building2,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Search,
  Plus,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Receipt,
  UserCheck,
  TrendingUp,
  CreditCard,
  Gift,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Menu,
  X,
  Store,
  Layers,
  Percent,
  Settings,
  Edit2,
  Trash2,
  Power,
  Sliders,
  Phone,
  MapPin,
  HelpCircle,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Hash,
  Calculator,
  ArrowRight,
  Coins,
  DollarSign,
  Wallet,
  Zap,
  Lock,
  KeyRound,
  Key,
  UserPlus,
  Ticket,
  Copy,
  RotateCw,
  Mail,
  Award,
  Ban,
  QrCode,
  Share2,
  Camera,
  ChevronDown,
  Scan,
  History,
  User,
  PartyPopper,
} from "lucide-react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/mobile";
import { CountryCodePicker } from "@/components/CountryCodePicker";

function StampIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 21h14" />
      <path d="M19 17v4" />
      <path d="M5 17v4" />
      <path d="M5 17h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-6 0v2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z" />
    </svg>
  );
}

function RibbonIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
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

function toDatetimeLocal(isoOrDate?: string | Date | null): string {
  let d = isoOrDate ? new Date(isoOrDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (isNaN(d.getTime())) {
    d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${mins}`;
}

function formatExpiryTime(iso?: string | null): string {
  if (!iso) return "24h Active";
  const target = new Date(iso).getTime();
  if (isNaN(target)) return "Active";
  const now = Date.now();
  const diffMs = target - now;
  if (diffMs <= 0) return "Expired (Auto-Rotating)";
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `Expires in ${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  const remMins = diffMins % 60;
  if (diffHours < 24) return `Expires in ${diffHours}h ${remMins}m`;
  const diffDays = Math.floor(diffHours / 24);
  return `Expires in ${diffDays}d ${diffHours % 24}h`;
}

function formatMoney(cur: string, n: number): string {
  return `${cur} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const DEFAULT_BRANCHES = [
  { id: "1001", code: "1001", name: "The Dubai Mall", city: "Dubai" },
  { id: "1002", code: "1002", name: "Dubai Hills Mall", city: "Dubai" },
  { id: "1003", code: "1003", name: "Mall of the Emirates", city: "Dubai" },
  { id: "1004", code: "1004", name: "Ibn Battuta Mall", city: "Dubai" },
  { id: "1005", code: "1005", name: "Dubai Festival City", city: "Dubai" },
  { id: "1006", code: "1006", name: "City Centre Deira", city: "Dubai" },
  { id: "1007", code: "1007", name: "City Centre Mirdif", city: "Dubai" },
  { id: "1008", code: "1008", name: "City Centre Shindagha", city: "Dubai" },
  { id: "1009", code: "1009", name: "BurJuman Centre", city: "Dubai" },
  { id: "1010", code: "1010", name: "Arabian Centre", city: "Dubai" },
  { id: "1011", code: "1011", name: "Oasis Mall", city: "Dubai" },
  { id: "1012", code: "1012", name: "City Centre Sharjah", city: "Sharjah" },
  { id: "1013", code: "1013", name: "City Centre Al Zahia", city: "Sharjah" },
  { id: "1014", code: "1014", name: "City Centre Ajman", city: "Ajman" },
];

export default function AdminPage() {
  const router = useRouter();
  const [hubPortalTab, setHubPortalTab] = useState<"master" | "customer" | "outlet">("master");
  const [session, setSession] = useState<any>(null);
  const [login, setLogin] = useState({ username: "", pin: "" });
  const [tab, setTab] = useState<"overview" | "customers" | "offers" | "branches" | "staff" | "visits" | "outlet" | "audit" | "settings">("overview");
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Outlet POS Terminal Tab States
  const [outletBranchId, setOutletBranchId] = useState<string>("");
  const [outletSearchTab, setOutletSearchTab] = useState<"phone" | "qr">("phone");
  const [outletCountryCode, setOutletCountryCode] = useState(DEFAULT_COUNTRY);
  const [outletMobileInput, setOutletMobileInput] = useState("");
  const [outletQrInput, setOutletQrInput] = useState("");
  const [outletCustomer, setOutletCustomer] = useState<any | null>(null);
  const [outletAvailableRewards, setOutletAvailableRewards] = useState<any[]>([]);
  const [outletRecentTransactions, setOutletRecentTransactions] = useState<any[]>([]);
  const [outletLoyaltyRules, setOutletLoyaltyRules] = useState<any>({
    currency: "AED",
    spendAedForPoints: 10,
    pointsEarnedPerSpend: 1,
    pointsRequiredForRedemption: 100,
    currencyValuePerRedemptionPoints: 5,
  });
  const [outletActionView, setOutletActionView] = useState<"all" | "points" | "redeem" | "vouchers">("all");
  const [outletActionMode, setOutletActionMode] = useState<"points" | "reward" | "redeem_points">("points");
  const [outletInvoiceNumber, setOutletInvoiceNumber] = useState("");
  const [outletBillAmount, setOutletBillAmount] = useState("");
  const [outletSelectedRewardId, setOutletSelectedRewardId] = useState<string | null>(null);
  const [outletPointsToRedeem, setOutletPointsToRedeem] = useState<number>(0);
  const [outletCustomRedeem, setOutletCustomRedeem] = useState<string>("");
  const [outletSearchBusy, setOutletSearchBusy] = useState(false);
  const [outletSearchErr, setOutletSearchErr] = useState("");
  const [outletSubmittingBill, setOutletSubmittingBill] = useState(false);
  const [outletBillErr, setOutletBillErr] = useState("");
  const [outletSuccessReceipt, setOutletSuccessReceipt] = useState<any | null>(null);

  // Visit & Reward states for admin outlet POS
  const [outletSubmittingVisit, setOutletSubmittingVisit] = useState(false);
  const [outletVisitSuccessReceipt, setOutletVisitSuccessReceipt] = useState<any | null>(null);
  const [outletVisitErr, setOutletVisitErr] = useState("");
  const [outletRedeemingRewardId, setOutletRedeemingRewardId] = useState<string | null>(null);
  const [outletRewardSuccessReceipt, setOutletRewardSuccessReceipt] = useState<any | null>(null);
  const [outletRewardErr, setOutletRewardErr] = useState("");
  const [adminSelectedReceipt, setAdminSelectedReceipt] = useState<any | null>(null);

  // Admin Outlet Camera Scanner
  const [isOutletCameraActive, setIsOutletCameraActive] = useState(false);
  const [outletCameraHint, setOutletCameraHint] = useState("");
  const outletVideoRef = useRef<HTMLVideoElement | null>(null);
  const outletCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outletStreamRef = useRef<MediaStream | null>(null);
  const outletLoopRef = useRef<NodeJS.Timeout | null>(null);
  const outletQrInputRef = useRef<HTMLInputElement | null>(null);

  function stopOutletCamera() {
    if (outletLoopRef.current) {
      clearInterval(outletLoopRef.current);
      outletLoopRef.current = null;
    }
    if (outletStreamRef.current) {
      outletStreamRef.current.getTracks().forEach((t) => t.stop());
      outletStreamRef.current = null;
    }
    if (outletVideoRef.current) outletVideoRef.current.srcObject = null;
    setIsOutletCameraActive(false);
    setOutletCameraHint("");
  }

  const handleAdminLookupCustomer = useCallback(
    async (e?: React.FormEvent, overrideToken?: string) => {
      e?.preventDefault();
      const tokenToSearch = overrideToken || (outletSearchTab === "qr" ? outletQrInput.trim() : "");
      const mobileToSearch = outletSearchTab === "phone" ? outletMobileInput.trim() : "";

      if (!tokenToSearch && !mobileToSearch) return;

      setOutletSearchBusy(true);
      setOutletSearchErr("");

      try {
        const res = await fetch("/api/outlet/customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile: mobileToSearch || undefined,
            countryCode: outletSearchTab === "phone" ? outletCountryCode : undefined,
            token: tokenToSearch || undefined,
          }),
        });

        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Customer not found.");

        setOutletCustomer(d.customer);
        setOutletAvailableRewards(d.availableRewards || []);
        setOutletRecentTransactions(d.recentTransactions || []);
        if (d.loyaltyRules) setOutletLoyaltyRules(d.loyaltyRules);

        setOutletInvoiceNumber("");
        setOutletBillAmount("");
        setOutletSelectedRewardId(null);
        setOutletPointsToRedeem(0);
        setOutletCustomRedeem("");
        setOutletBillErr("");
        setOutletSuccessReceipt(null);
        setOutletVisitSuccessReceipt(null);
        setOutletVisitErr("");
        setOutletRewardSuccessReceipt(null);
        setOutletRewardErr("");
        setOutletActionMode("points");
        setOutletActionView("all");

        stopOutletCamera();
      } catch (err: any) {
        setOutletSearchErr(err.message || "Could not find customer profile.");
      } finally {
        setOutletSearchBusy(false);
      }
    },
    [outletSearchTab, outletQrInput, outletMobileInput, outletCountryCode]
  );

  async function startOutletCamera() {
    setOutletSearchErr("");
    setOutletCameraHint("Starting camera stream…");
    setIsOutletCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      outletStreamRef.current = stream;

      const video = outletVideoRef.current;
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
        setOutletCameraHint("Tap video to start scanning");
      }

      setOutletCameraHint("Point camera at customer's membership QR");

      outletLoopRef.current = setInterval(async () => {
        const v = outletVideoRef.current;
        if (!v || v.readyState < 2 || !v.videoWidth) return;

        const canvas = outletCanvasRef.current;
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
          if (found && found.data) {
            stopOutletCamera();
            setOutletQrInput(found.data);
            handleAdminLookupCustomer(undefined, found.data);
          }
        } catch { }
      }, 250);
    } catch (e: any) {
      setOutletSearchErr("Could not access camera. Please allow camera permissions or enter membership code manually.");
      stopOutletCamera();
    }
  }

  const handleAdminRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outletCustomer) return;

    const availableBranchesList = branchesData?.branches || data?.branches || data?.branchLeaderboard || [];
    const chosenBranchId = outletBranchId || availableBranchesList[0]?.id;
    if (!chosenBranchId) {
      setOutletBillErr("Please select a branch to record this transaction.");
      return;
    }

    const val = parseFloat(outletBillAmount);
    if (!outletInvoiceNumber.trim()) {
      setOutletBillErr("Please enter the invoice / bill receipt number.");
      return;
    }
    if (!val || val <= 0) {
      setOutletBillErr("Please enter a valid bill amount greater than 0.");
      return;
    }

    if (outletPointsToRedeem > outletCustomer.pointsBalance) {
      setOutletBillErr(`Customer only has ${outletCustomer.pointsBalance} points available to redeem.`);
      return;
    }

    setOutletSubmittingBill(true);
    setOutletBillErr("");

    try {
      const res = await fetch("/api/outlet/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: outletCustomer.id,
          branchId: chosenBranchId,
          invoiceNumber: outletInvoiceNumber.trim(),
          amount: val,
          redeemRewardId: outletSelectedRewardId || undefined,
          pointsToRedeem: outletPointsToRedeem > 0 ? outletPointsToRedeem : undefined,
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to record transaction.");

      setOutletSuccessReceipt(d);
      setOutletCustomer((prev: any) =>
        prev
          ? {
            ...prev,
            pointsBalance: d.customer.pointsBalance,
            visitCount: d.customer.visitCount,
            totalSpend: (prev.totalSpend || 0) + val,
          }
          : null
      );

      // Immediately sync remaining available rewards
      if (d.availableRewards) {
        setOutletAvailableRewards(d.availableRewards);
      } else if (outletSelectedRewardId) {
        setOutletAvailableRewards((prev) => prev.filter((r) => r.id !== outletSelectedRewardId));
      }

      // Prepend new transaction to recent history
      if (d.transaction) {
        const chosenBranchName = allBranches.find((b: any) => b.id === chosenBranchId)?.name || "Branch Visit";
        setOutletRecentTransactions((prev) => [
          {
            id: d.transaction.id,
            invoiceNumber: d.transaction.invoiceNumber,
            amount: d.transaction.amount,
            pointsEarned: d.transaction.pointsEarned,
            discountGiven: d.transaction.discountGiven || 0,
            redeemedRewards: d.redeemedVoucher ? [d.redeemedVoucher.name] : [],
            branchName: chosenBranchName,
            createdAt: d.transaction.createdAt || new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      loadOverview();
    } catch (err: any) {
      setOutletBillErr(err.message || "Failed to record transaction.");
    } finally {
      setOutletSubmittingBill(false);
    }
  };

  const handleAdminGiveVisit = async () => {
    if (!outletCustomer) return;
    const availableBranchesList = branchesData?.branches || data?.branches || data?.branchLeaderboard || [];
    const chosenBranchId = outletBranchId || availableBranchesList[0]?.id;
    if (!chosenBranchId) {
      setOutletVisitErr("Please select a branch to stamp this visit.");
      return;
    }

    setOutletSubmittingVisit(true);
    setOutletVisitErr("");
    setOutletVisitSuccessReceipt(null);

    try {
      const res = await fetch("/api/outlet/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: outletCustomer.id,
          branchId: chosenBranchId,
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to stamp visit.");

      setOutletVisitSuccessReceipt(d);
      setOutletCustomer((prev: any) =>
        prev
          ? {
            ...prev,
            visitCount: d.customer.visitCount,
            pointsBalance: d.customer.pointsBalance,
          }
          : null
      );
      if (d.newlyIssuedRewards && d.newlyIssuedRewards.length > 0) {
        setOutletAvailableRewards((prev) => [
          ...prev,
          ...d.newlyIssuedRewards.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            value: 0,
            isPercent: false,
            type: "VISITS",
          })),
        ]);
      }
      loadOverview();
      loadVisits();
    } catch (err: any) {
      setOutletVisitErr(err.message || "Failed to stamp visit.");
    } finally {
      setOutletSubmittingVisit(false);
    }
  };

  const handleAdminRedeemReward = async (rewardId: string) => {
    if (!outletCustomer) return;
    const availableBranchesList = branchesData?.branches || data?.branches || data?.branchLeaderboard || [];
    const chosenBranchId = outletBranchId || availableBranchesList[0]?.id;
    if (!chosenBranchId) {
      setOutletRewardErr("Please select a branch to redeem this offer.");
      return;
    }

    setOutletRedeemingRewardId(rewardId);
    setOutletRewardErr("");
    setOutletRewardSuccessReceipt(null);

    try {
      const res = await fetch("/api/outlet/redeem-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: outletCustomer.id,
          customerRewardId: rewardId,
          branchId: chosenBranchId,
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to redeem reward.");

      setOutletRewardSuccessReceipt(d);
      setOutletCustomer((prev: any) =>
        prev
          ? {
            ...prev,
            pointsBalance: d.customer.pointsBalance,
          }
          : null
      );
      setOutletAvailableRewards(d.availableRewards || []);
      loadOverview();
    } catch (err: any) {
      setOutletRewardErr(err.message || "Failed to redeem reward.");
    } finally {
      setOutletRedeemingRewardId(null);
    }
  };

  // Customers tab
  const [cust, setCust] = useState<any>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Audit tab
  const [audit, setAudit] = useState<any>(null);

  // Offers tab
  const [offers, setOffers] = useState<any>(null);
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [newOffer, setNewOffer] = useState<{
    name: string;
    description: string;
    value: string;
    isPercent: boolean;
    branchIds: string[];
    startsAt: string;
    endsAt: string;
  }>({
    name: "",
    description: "",
    value: "",
    isPercent: true,
    branchIds: [],
    startsAt: "",
    endsAt: "",
  });
  const [offerMsg, setOfferMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Branches tab & CRUD
  const [branchesData, setBranchesData] = useState<any>(null);
  const [branchSearch, setBranchSearch] = useState("");
  const [branchCityFilter, setBranchCityFilter] = useState("all");
  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);
  const [showEditBranchModal, setShowEditBranchModal] = useState(false);
  const [showDeleteBranchModal, setShowDeleteBranchModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<any>(null);
  const [branchForm, setBranchForm] = useState<{
    id?: string;
    code: string;
    name: string;
    nameAr: string;
    city: string;
    address: string;
    addressAr: string;
    phone: string;
    hours: string;
    isActive: boolean;
    dailyCode: string;
    dailyCodeExpiresAt: string;
  }>({
    code: "",
    name: "",
    nameAr: "",
    city: "Dubai",
    address: "",
    addressAr: "",
    phone: "",
    hours: "10:00 AM – 11:00 PM",
    isActive: true,
    dailyCode: "",
    dailyCodeExpiresAt: "",
  });
  const [branchMsg, setBranchMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Settings tab & Calculator Simulator
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({
    spend_aed_for_points: "10",
    points_earned_per_spend: "1",
    points_required_for_redemption: "100",
    currency_value_per_redemption_points: "5",
    currency: "AED",
  });
  const [settingsCategory, setSettingsCategory] = useState<"general" | "loyalty" | "security" | "password">("general");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Admin PIN change states
  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });
  const [pinSaving, setPinSaving] = useState(false);
  const [pinMsg, setPinMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Staff tab & CRUD
  const [staffData, setStaffData] = useState<any[]>([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("all");
  const [staffBranchFilter, setStaffBranchFilter] = useState("all");
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [showDeleteStaffModal, setShowDeleteStaffModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any>(null);
  const [staffForm, setStaffForm] = useState<{
    id?: string;
    username: string;
    name: string;
    pin: string;
    role: string;
    branchId: string;
    isActive: boolean;
  }>({
    username: "",
    name: "",
    pin: "",
    role: "CASHIER",
    branchId: "",
    isActive: true,
  });
  const [staffMsg, setStaffMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Visits tab & 24h Daily Codes
  const [visitsData, setVisitsData] = useState<any[]>([]);
  const [branchCodes, setBranchCodes] = useState<any[]>([]);
  const [visitMetrics, setVisitMetrics] = useState<any>({
    totalVisits: 0,
    todayVisits: 0,
    uniqueCustomersToday: 0,
    topBranchName: "None",
  });
  const [visitSearch, setVisitSearch] = useState("");
  const [visitBranchFilter, setVisitBranchFilter] = useState("all");
  const [visitDateFilter, setVisitDateFilter] = useState("all");
  const [visitMsg, setVisitMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [rotatingBranchId, setRotatingBranchId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Overview Tab Filters
  const [overviewBranchFilter, setOverviewBranchFilter] = useState("all");
  const [overviewDateFilter, setOverviewDateFilter] = useState("all");

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
          dark: "#721424",
          light: "#FFFFFF",
        },
      })
        .then((dataUrl) => setPortalQrDataUrl(dataUrl))
        .catch(() => { });
    }
  }, []);

  const handleSharePortalLink = async () => {
    const url = portalUrl || (typeof window !== "undefined" ? window.location.origin : "");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Bombay Chowpatty Loyalty",
          text: "Scan or tap to register and open your Bombay Chowpatty Loyalty account!",
          url: url,
        });
      } catch { }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedPortalLink(true);
      setTimeout(() => setCopiedPortalLink(false), 3000);
    }
  };

  // Simulator Test Inputs
  const [simBillAmount, setSimBillAmount] = useState("250");
  const [simPointsBalance, setSimPointsBalance] = useState("500");

  // Visit Milestone Rewards state (Kitny visit pr kya free mily ga)
  const [visitRewardsList, setVisitRewardsList] = useState<any[]>([]);
  const [showVisitRewardModal, setShowVisitRewardModal] = useState(false);
  const [showDeleteVisitRewardModal, setShowDeleteVisitRewardModal] = useState(false);
  const [visitRewardToDelete, setVisitRewardToDelete] = useState<any>(null);
  const [editingVisitRewardId, setEditingVisitRewardId] = useState<string | null>(null);
  const [visitRewardForm, setVisitRewardForm] = useState<{
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    threshold: number | string;
    validDays: number | string;
    isActive: boolean;
  }>({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    threshold: 5,
    validDays: 30,
    isActive: true,
  });
  const [visitRewardSaving, setVisitRewardSaving] = useState(false);
  const [visitRewardMsg, setVisitRewardMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Customer Details Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerData, setSelectedCustomerData] = useState<any>(null);
  const [loadingCustomerDetail, setLoadingCustomerDetail] = useState(false);
  const [customerDetailTab, setCustomerDetailTab] = useState<"overview" | "transactions" | "rewards" | "visits" | "ledger">("overview");
  const [customerDetailMsg, setCustomerDetailMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/admin/customers?q=${encodeURIComponent(q)}&page=${page}&filter=${filter}`
      );
      const d = await r.json();
      if (r.ok) setCust(d);
    } catch { }
  }, [q, page, filter]);

  const openCustomerDetail = useCallback(async (id: string) => {
    setSelectedCustomerId(id);
    setSelectedCustomerData(null);
    setLoadingCustomerDetail(true);
    setCustomerDetailTab("overview");
    setCustomerDetailMsg(null);
    try {
      const r = await fetch(`/api/admin/customers/${id}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not load customer profile.");
      setSelectedCustomerData(d.customer);
    } catch (e: any) {
      setCustomerDetailMsg({ type: "err", text: String(e.message || e) });
    } finally {
      setLoadingCustomerDetail(false);
    }
  }, []);

  const toggleCustomerBlock = useCallback(async (id: string, isBlocked: boolean) => {
    try {
      const r = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not update customer status.");
      setSelectedCustomerData((prev: any) => (prev ? { ...prev, isBlocked } : prev));
      setCustomerDetailMsg({
        type: "ok",
        text: isBlocked ? "Customer account has been blocked." : "Customer account unblocked & active.",
      });
      loadCustomers();
    } catch (e: any) {
      setCustomerDetailMsg({ type: "err", text: String(e.message || e) });
    }
  }, [loadCustomers]);

  const loadOverview = useCallback(async () => {
    setErr("");
    setRefreshing(true);
    try {
      const r = await fetch(
        `/api/admin/overview?branchId=${encodeURIComponent(overviewBranchFilter)}&dateRange=${encodeURIComponent(
          overviewDateFilter
        )}`
      );
      if (r.status === 401 || r.status === 403) {
        router.push("/admin/login");
        return;
      }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not load admin overview.");
      setData(d);
      setSession(d.scope);
    } catch (e: any) {
      setErr(String(e.message || e));
    } finally {
      setRefreshing(false);
    }
  }, [overviewBranchFilter, overviewDateFilter, router]);

  const loadAudit = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/audit");
      const d = await r.json();
      if (r.ok) setAudit(d);
    } catch { }
  }, []);

  const loadOffers = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/offers");
      const d = await r.json();
      if (r.ok) setOffers(d);
    } catch { }
  }, []);

  const loadBranches = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/branches");
      const d = await r.json();
      if (r.ok) setBranchesData(d);
    } catch { }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/settings");
      const d = await r.json();
      if (r.ok && d.settings) {
        setSettingsList(d.settings);
        const map: Record<string, string> = {};
        d.settings.forEach((s: any) => {
          map[s.key] = s.value;
        });
        setSettingsForm((prev) => ({ ...prev, ...map }));
      }
    } catch { }
  }, []);

  const loadVisitRewards = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/visit-rewards");
      const d = await r.json();
      if (r.ok && d.rewards) {
        setVisitRewardsList(d.rewards);
      }
    } catch { }
  }, []);

  const loadStaff = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/staff");
      const d = await r.json();
      if (r.ok && d.staff) {
        setStaffData(d.staff);
      }
    } catch { }
  }, []);

  const loadVisits = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/admin/visits?branchId=${encodeURIComponent(visitBranchFilter)}&dateRange=${encodeURIComponent(
          visitDateFilter
        )}&q=${encodeURIComponent(visitSearch)}`
      );
      const d = await r.json();
      if (r.ok) {
        if (d.visits) setVisitsData(d.visits);
        if (d.branchCodes) setBranchCodes(d.branchCodes);
        if (d.metrics) setVisitMetrics(d.metrics);
      }
    } catch { }
  }, [visitBranchFilter, visitDateFilter, visitSearch]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (session && tab === "customers") loadCustomers();
    if (session && tab === "audit") loadAudit();
    if (session && tab === "offers") loadOffers();
    if (session && tab === "branches") loadBranches();
    if (session && tab === "settings") {
      loadSettings();
      loadVisitRewards();
    }
    if (session && tab === "staff") {
      loadStaff();
      loadBranches();
    }
    if (session && tab === "visits") {
      loadVisits();
      loadBranches();
    }
  }, [session, tab, loadCustomers, loadAudit, loadOffers, loadBranches, loadSettings, loadVisitRewards, loadStaff, loadVisits]);

  // Branch Coupon Generator Helper
  function generateRandomCouponCode(prefix: string) {
    const cleanPrefix = String(prefix || "VISIT").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let suffix = "";
    for (let i = 0; i < 4; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${cleanPrefix}-${suffix}`;
  }

  // Branch CRUD Handlers
  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setBranchMsg(null);
    try {
      const r = await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branchForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to create branch.");
      setBranchMsg({ type: "ok", text: `Branch '${d.branch.name}' created successfully with 24H Coupon '${d.branch.dailyCode}'!` });
      setShowCreateBranchModal(false);
      setBranchForm({
        code: "",
        name: "",
        nameAr: "",
        city: "Dubai",
        address: "",
        addressAr: "",
        phone: "",
        hours: "10:00 AM – 11:00 PM",
        isActive: true,
        dailyCode: "",
        dailyCodeExpiresAt: "",
      });
      loadBranches();
      loadOverview();
    } catch (err2: any) {
      setBranchMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!branchForm.id) return;
    setBusy(true);
    setBranchMsg(null);
    try {
      const r = await fetch("/api/admin/branches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branchForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to update branch.");
      setBranchMsg({ type: "ok", text: `Branch '${d.branch.name}' updated successfully!` });
      setShowEditBranchModal(false);
      loadBranches();
      loadOverview();
    } catch (err2: any) {
      setBranchMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteBranch() {
    if (!branchToDelete) return;
    setBusy(true);
    setBranchMsg(null);
    try {
      const r = await fetch(`/api/admin/branches?id=${branchToDelete.id}`, {
        method: "DELETE",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to delete branch.");
      setBranchMsg({ type: "ok", text: d.message || "Branch deleted successfully." });
      setShowDeleteBranchModal(false);
      setBranchToDelete(null);
      loadBranches();
      loadOverview();
    } catch (err2: any) {
      setBranchMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleBranch(branch: any) {
    try {
      const r = await fetch("/api/admin/branches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: branch.id,
          isActive: !branch.isActive,
        }),
      });
      if (r.ok) {
        loadBranches();
        loadOverview();
      }
    } catch { }
  }

  function openEditBranch(b: any) {
    setBranchForm({
      id: b.id,
      code: b.code || "",
      name: b.name || "",
      nameAr: b.nameAr || "",
      city: b.city || "Dubai",
      address: b.address || "",
      addressAr: b.addressAr || "",
      phone: b.phone || "",
      hours: b.hours || "",
      isActive: b.isActive,
      dailyCode: b.dailyCode || "",
      dailyCodeExpiresAt: b.dailyCodeExpiresAt ? toDatetimeLocal(b.dailyCodeExpiresAt) : toDatetimeLocal(),
    });
    setBranchMsg(null);
    setShowEditBranchModal(true);
  }

  function openDeleteBranch(b: any) {
    setBranchToDelete(b);
    setBranchMsg(null);
    setShowDeleteBranchModal(true);
  }

  // Settings Handlers
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMsg(null);
    try {
      const r = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsForm }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to update configuration.");
      setSettingsMsg({ type: "ok", text: "Loyalty conversion rules and system configuration saved live!" });
      loadSettings();
      loadOverview();
    } catch (err2: any) {
      setSettingsMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleUpdatePin(e: React.FormEvent) {
    e.preventDefault();
    setPinSaving(true);
    setPinMsg(null);
    try {
      const r = await fetch("/api/admin/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pinForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to update admin security PIN.");
      setPinMsg({ type: "ok", text: d.message || "Admin security PIN updated successfully!" });
      setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
    } catch (err2: any) {
      setPinMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setPinSaving(false);
    }
  }

  // Visit Milestone Rewards Handlers (Kitny visit pr kya free mily ga)
  async function handleSaveVisitReward(e: React.FormEvent) {
    e.preventDefault();
    setVisitRewardSaving(true);
    setVisitRewardMsg(null);
    try {
      const method = editingVisitRewardId ? "PATCH" : "POST";
      const payload = editingVisitRewardId
        ? { id: editingVisitRewardId, ...visitRewardForm }
        : visitRewardForm;

      const r = await fetch("/api/admin/visit-rewards", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to save visit milestone reward.");

      setVisitRewardMsg({ type: "ok", text: d.message || "Visit milestone reward rule saved live!" });
      setShowVisitRewardModal(false);
      setEditingVisitRewardId(null);
      setVisitRewardForm({
        name: "",
        nameAr: "",
        description: "",
        descriptionAr: "",
        threshold: 5,
        validDays: 30,
        isActive: true,
      });
      loadVisitRewards();
      loadOverview();
    } catch (err2: any) {
      setVisitRewardMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setVisitRewardSaving(false);
    }
  }

  async function handleToggleVisitReward(reward: any) {
    try {
      const r = await fetch("/api/admin/visit-rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reward.id,
          isActive: !reward.isActive,
        }),
      });
      if (r.ok) {
        loadVisitRewards();
      }
    } catch { }
  }

  async function handleDeleteVisitReward() {
    if (!visitRewardToDelete) return;
    setBusy(true);
    setVisitRewardMsg(null);
    try {
      const r = await fetch(`/api/admin/visit-rewards?id=${visitRewardToDelete.id}`, {
        method: "DELETE",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to delete visit milestone reward.");
      setVisitRewardMsg({ type: "ok", text: d.message || "Visit milestone removed successfully." });
      setShowDeleteVisitRewardModal(false);
      setVisitRewardToDelete(null);
      loadVisitRewards();
      loadOverview();
    } catch (err2: any) {
      setVisitRewardMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  function openCreateVisitReward() {
    setEditingVisitRewardId(null);
    setVisitRewardForm({
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      threshold: 5,
      validDays: 30,
      isActive: true,
    });
    setVisitRewardMsg(null);
    setShowVisitRewardModal(true);
  }

  function openEditVisitReward(item: any) {
    setEditingVisitRewardId(item.id);
    setVisitRewardForm({
      name: item.name || "",
      nameAr: item.nameAr || "",
      description: item.description || "",
      descriptionAr: item.descriptionAr || "",
      threshold: item.threshold || 5,
      validDays: item.validDays || 30,
      isActive: item.isActive !== undefined ? item.isActive : true,
    });
    setVisitRewardMsg(null);
    setShowVisitRewardModal(true);
  }

  function openDeleteVisitReward(item: any) {
    setVisitRewardToDelete(item);
    setVisitRewardMsg(null);
    setShowDeleteVisitRewardModal(true);
  }

  // Staff CRUD Handlers
  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStaffMsg(null);
    try {
      const r = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to create staff account.");
      setStaffMsg({ type: "ok", text: d.message || `Staff account '${d.staff.name}' created successfully!` });
      setShowCreateStaffModal(false);
      setStaffForm({
        username: "",
        name: "",
        pin: "",
        role: "CASHIER",
        branchId: "",
        isActive: true,
      });
      loadStaff();
      loadOverview();
    } catch (err2: any) {
      setStaffMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!staffForm.id) return;
    setBusy(true);
    setStaffMsg(null);
    try {
      const r = await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to update staff account.");
      setStaffMsg({ type: "ok", text: d.message || `Staff account '${d.staff.name}' updated successfully!` });
      setShowEditStaffModal(false);
      loadStaff();
      loadOverview();
    } catch (err2: any) {
      setStaffMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteStaff() {
    if (!staffToDelete) return;
    setBusy(true);
    setStaffMsg(null);
    try {
      const r = await fetch(`/api/admin/staff?id=${staffToDelete.id}`, {
        method: "DELETE",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to remove staff account.");
      setStaffMsg({ type: "ok", text: d.message || "Staff account removed successfully." });
      setShowDeleteStaffModal(false);
      setStaffToDelete(null);
      loadStaff();
      loadOverview();
    } catch (err2: any) {
      setStaffMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleStaff(staff: any) {
    try {
      const r = await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: staff.id,
          isActive: !staff.isActive,
        }),
      });
      if (r.ok) {
        loadStaff();
        loadOverview();
      }
    } catch { }
  }

  function openEditStaff(s: any) {
    setStaffForm({
      id: s.id,
      username: s.username || "",
      name: s.name || "",
      pin: "",
      role: s.role || "CASHIER",
      branchId: s.branchId || "",
      isActive: s.isActive,
    });
    setStaffMsg(null);
    setShowEditStaffModal(true);
  }

  function openDeleteStaff(s: any) {
    setStaffToDelete(s);
    setStaffMsg(null);
    setShowDeleteStaffModal(true);
  }

  // Visit & Coupon Code Handlers
  async function handleRotateBranchCode(branchId: string) {
    setRotatingBranchId(branchId);
    setVisitMsg(null);
    setBranchMsg(null);
    try {
      const r = await fetch("/api/admin/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, action: "rotate" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to rotate code.");
      const successText = d.message || "24-Hour Coupon Code rotated successfully.";
      setVisitMsg({ type: "ok", text: successText });
      setBranchMsg({ type: "ok", text: successText });
      loadVisits();
      loadBranches();
    } catch (err2: any) {
      const errText = String(err2.message || err2);
      setVisitMsg({ type: "err", text: errText });
      setBranchMsg({ type: "err", text: errText });
    } finally {
      setRotatingBranchId(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2500);
  }

  async function createOffer(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setOfferMsg(null);
    try {
      const r = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOffer),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not create offer.");
      setOfferMsg({ type: "ok", text: "Campaign offer created successfully." });
      setNewOffer({ name: "", description: "", value: "", isPercent: true, branchIds: [], startsAt: "", endsAt: "" });
      setShowCreateOfferModal(false);
      loadOffers();
    } catch (e2: any) {
      setOfferMsg({ type: "err", text: String(e2.message || e2) });
    } finally {
      setBusy(false);
    }
  }

  async function toggleOffer(id: string, isActive: boolean) {
    try {
      const r = await fetch("/api/admin/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      if (r.ok) loadOffers();
    } catch { }
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
      if (d.staff.role === "CASHIER") {
        throw new Error("Cashier accounts cannot access the admin management dashboard.");
      }
      await loadOverview();
    } catch (e2: any) {
      setErr(String(e2.message || e2));
    } finally {
      setBusy(false);
    }
  }

  // ===================== SIGNED OUT LOGIN VIEW =====================
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#120F0E] via-[#1B1716] to-[#251D1A] text-white">
        <div className="w-8 h-8 border-3 border-[#C0392B]/30 border-t-[#C0392B] rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#B8ADA6]">Connecting to Executive Control…</p>
      </div>
    );
  }

  // ===================== SIGNED IN EXECUTIVE DASHBOARD =====================
  const cur = settingsForm.currency || data?.currency || "AED";
  const metrics = data?.metrics || data?.kpis || {};

  // Filtered branches for Branches Tab
  const allBranches = branchesData?.branches || data?.branches || data?.branchLeaderboard || data?.branchPerformance || [];
  const branchesList = allBranches.length > 0 ? allBranches : DEFAULT_BRANCHES;
  const cities: string[] = Array.from(
    new Set(allBranches.map((b: any) => String(b.city || "").trim()).filter(Boolean))
  );
  const filteredBranches = allBranches.filter((b: any) => {
    const matchQ =
      !branchSearch ||
      b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
      b.code.toLowerCase().includes(branchSearch.toLowerCase()) ||
      (b.city && b.city.toLowerCase().includes(branchSearch.toLowerCase()));
    const matchCity = branchCityFilter === "all" || b.city === branchCityFilter;
    return matchQ && matchCity;
  });

  // Filtered staff for Staff Tab
  const filteredStaff = staffData.filter((s: any) => {
    const qLower = staffSearch.toLowerCase();
    const matchQ =
      !staffSearch ||
      s.name.toLowerCase().includes(qLower) ||
      s.username.toLowerCase().includes(qLower) ||
      (s.branch?.name && s.branch.name.toLowerCase().includes(qLower)) ||
      s.role.toLowerCase().includes(qLower);
    const matchRole = staffRoleFilter === "all" || s.role === staffRoleFilter;
    const matchBranch =
      staffBranchFilter === "all" ||
      (staffBranchFilter === "hq" && !s.branchId) ||
      s.branchId === staffBranchFilter;
    return matchQ && matchRole && matchBranch;
  });

  // Conversion keys configured in top calculator widget
  const conversionKeys = [
    "spend_aed_for_points",
    "points_earned_per_spend",
    "points_required_for_redemption",
    "currency_value_per_redemption_points",
  ];

  // Filtered settings for Settings Tab (exclude conversion keys from bottom cards)
  const filteredSettings = settingsList.filter((s) => {
    if (conversionKeys.includes(s.key)) return false;
    return s.category === settingsCategory;
  });

  // Calculator Math Calculations
  const spendStep = Number(settingsForm.spend_aed_for_points) || 10;
  const pointsPerSpend = Number(settingsForm.points_earned_per_spend) || 1;
  const reqPoints = Number(settingsForm.points_required_for_redemption) || 100;
  const aedRedemptionVal = Number(settingsForm.currency_value_per_redemption_points) || 5;

  // Simulator results
  const testBill = Number(simBillAmount) || 0;
  const calculatedPointsEarned = spendStep > 0 ? Math.floor((testBill / spendStep) * pointsPerSpend) : 0;
  const testPts = Number(simPointsBalance) || 0;
  const calculatedAedValue = reqPoints > 0 ? ((testPts / reqPoints) * aedRedemptionVal).toFixed(2) : "0.00";
  const singlePointAedVal = reqPoints > 0 ? (aedRedemptionVal / reqPoints).toFixed(4) : "0.0000";
  const singlePointFils = reqPoints > 0 ? ((aedRedemptionVal / reqPoints) * 100).toFixed(1) : "0.0";
  const cashbackPercent =
    spendStep > 0 && reqPoints > 0
      ? (((pointsPerSpend * (aedRedemptionVal / reqPoints)) / spendStep) * 100).toFixed(1)
      : "0.0";

  // Outlet POS calculations
  const outletParsedAmount = parseFloat(outletBillAmount) || 0;
  const outletSelectedReward = outletAvailableRewards.find((r) => r.id === outletSelectedRewardId);
  const outletVoucherDiscount = outletSelectedReward
    ? outletSelectedReward.isPercent
      ? Math.round(outletParsedAmount * (outletSelectedReward.value / 100) * 100) / 100
      : outletSelectedReward.value
    : 0;

  const outletRedemptionUnit = outletLoyaltyRules.pointsRequiredForRedemption || 100;
  const outletCurrencyPerUnit = outletLoyaltyRules.currencyValuePerRedemptionPoints || 5;
  const outletDirectPointsDiscount =
    outletPointsToRedeem > 0 && outletRedemptionUnit > 0
      ? Math.round(((outletPointsToRedeem / outletRedemptionUnit) * outletCurrencyPerUnit) * 100) / 100
      : 0;

  const outletTotalDiscount = Math.min(outletParsedAmount, outletVoucherDiscount + outletDirectPointsDiscount);
  const outletNetPayable = Math.max(0, outletParsedAmount - outletTotalDiscount);
  const outletEstimatedPointsToEarn =
    outletLoyaltyRules.spendAedForPoints > 0
      ? Math.floor((outletParsedAmount / outletLoyaltyRules.spendAedForPoints) * outletLoyaltyRules.pointsEarnedPerSpend)
      : 0;

  return (
    <div className="h-screen overflow-hidden bg-[#F0DBDB] text-[#221C1A] flex flex-col md:flex-row relative">
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* ===================== SIDEBAR NAVIGATION ===================== */}
      {/* Fixed drawer sliding from left on mobile, permanent left sidebar on desktop */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 h-full bg-[#FAF7F4] text-[#1E1815] flex-shrink-0 flex flex-col border-r border-[#EAE3DC] shadow-xl md:shadow-none transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-[#EAE3DC]">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bc-roundel.png"
              alt="Bombay Chowpatty"
              className="w-11 h-11 object-contain shrink-0 drop-shadow-sm"
            />
            <div>
              <div className="font-extrabold text-sm tracking-tight leading-tight text-[#1E1815]">Bombay Chowpatty</div>
              <div className="text-[9.5px] text-[#8C7F78] uppercase tracking-widest font-bold mt-0.5">
                Admin Control
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-2 rounded-xl bg-[#EFE9E2] text-[#7A6E67] hover:text-[#1E1815] hover:bg-[#E5DDD4] transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1 flex-1 overflow-y-auto">
          <button
            onClick={() => {
              setTab("overview");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "overview"
              ? "bg-[#801313] text-white shadow-xs"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => {
              setTab("customers");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "customers"
              ? "bg-[#801313] text-white shadow-xs"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers</span>
          </button>

          <button
            onClick={() => {
              setTab("offers");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "offers"
              ? "bg-[#801313] text-white shadow-xs"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <Tag className="w-4 h-4" />
            <span>Promotions & Offers</span>
          </button>

          <button
            onClick={() => {
              setTab("branches");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "branches"
              ? "bg-[#801313] text-white shadow-xs"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Branches</span>
          </button>

          <button
            onClick={() => {
              setTab("staff");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "staff"
              ? "bg-[#801313] text-white shadow-xs"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <Store className="w-4 h-4" />
            <span>Staff</span>
          </button>

          <button
            onClick={() => {
              setTab("visits");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "visits"
              ? "bg-[#801313] text-white shadow-xs"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Branch visitors</span>
          </button>

          <button
            onClick={() => {
              setTab("outlet");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "outlet"
              ? "bg-[#801313] text-white shadow-xs"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Outlet POS Terminal</span>
          </button>

          <button
            onClick={() => {
              setTab("settings");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "settings"
              ? "bg-[#801313] text-white shadow-xs"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => {
              setTab("audit");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "audit"
              ? "bg-[#801313] text-white shadow-xs"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Security & Audit</span>
          </button>
        </div>

        {/* User Card & Sign Out */}
        <div className="p-4 border-t border-[#EAE3DC] bg-[#FAF7F4]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#801313]/10 border border-[#801313]/20 flex items-center justify-center font-bold text-xs text-[#801313]">
              {session.name ? session.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs text-[#1E1815] truncate">{session.name}</div>
              <div className="text-[10px] text-[#7A6E67] truncate font-medium">{session.role}</div>
            </div>
            <a
              href="/api/admin/logout"
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#7A6E67] hover:text-[#801313] hover:bg-[#EFE9E2] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </a>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT AREA ===================== */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Top Navbar */}
        <header className="bg-white border-b border-[#EAE3DC] px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC] text-[#1E1815] hover:bg-[#F2ECE6] transition-colors cursor-pointer shrink-0"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black tracking-tight text-[#1E1815] capitalize flex items-center gap-2 truncate">
                {tab === "overview" && (
                  overviewBranchFilter !== "all" && allBranches.find((b: any) => b.id === overviewBranchFilter)
                    ? `${allBranches.find((b: any) => b.id === overviewBranchFilter)?.name} Overview`
                    : "Executive Overview"
                )}
                {tab === "customers" && "Member Directory"}
                {tab === "offers" && "Promotions & Campaign Engine"}
                {tab === "branches" && "Branch Management"}
                {tab === "staff" && "Staff POS Accounts & Tills"}
                {tab === "visits" && "Branch Visitors"}
                {tab === "outlet" && "Outlet Cashier POS Terminal"}
                {tab === "settings" && "System & Loyalty Points Engine"}
                {tab === "audit" && "Security & Activity Audit Log"}
              </h1>
              <p className="text-[11px] sm:text-xs text-[#7A6E67] mt-0.5 truncate">
                {tab === "overview" && overviewBranchFilter !== "all" && allBranches.find((b: any) => b.id === overviewBranchFilter)
                  ? `${allBranches.find((b: any) => b.id === overviewBranchFilter)?.name} (${allBranches.find((b: any) => b.id === overviewBranchFilter)?.city || "UAE"}) • Live sync active`
                  : session.branchName
                    ? `${session.branchName} • Live sync active`
                    : "All 14 UAE Locations • Live sync active"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tab === "branches" && (
              <button
                onClick={() => {
                  const initialCode = generateRandomCouponCode("1015");
                  setBranchForm({
                    code: "",
                    name: "",
                    nameAr: "",
                    city: "Dubai",
                    address: "",
                    addressAr: "",
                    phone: "",
                    hours: "10:00 AM – 11:00 PM",
                    isActive: true,
                    dailyCode: initialCode,
                    dailyCodeExpiresAt: "",
                  });
                  setBranchMsg(null);
                  setShowCreateBranchModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Branch</span>
              </button>
            )}

            {tab === "offers" && (
              <button
                onClick={() => {
                  setNewOffer({ name: "", description: "", value: "", isPercent: true, branchIds: [], startsAt: "", endsAt: "" });
                  setOfferMsg(null);
                  setShowCreateOfferModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Campaign</span>
              </button>
            )}

            {/* Customer Portal Link */}
            <Link
              href="/"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#DCD3CB] bg-white hover:bg-[#FAF7F4] text-xs font-bold text-[#801313] shadow-2xs transition-all cursor-pointer"
              title="Open Customer Portal"
            >
              <Users className="w-3.5 h-3.5 text-[#801313]" />
              <span className="hidden sm:inline">Customer Portal</span>
            </Link>

            <button
              onClick={() => {
                loadOverview();
                if (tab === "customers") loadCustomers();
                if (tab === "audit") loadAudit();
                if (tab === "offers") loadOffers();
                if (tab === "branches") loadBranches();
                if (tab === "settings") loadSettings();
              }}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#DCD3CB] bg-white hover:bg-[#FAF7F4] text-xs font-bold text-[#4A3F39] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#C0392B]" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {err && (
          <div className="mx-6 mt-4 p-4 bg-[#C0392B]/10 border border-[#C0392B]/30 rounded-2xl text-xs font-semibold text-[#C0392B] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4" />
              <span>{err}</span>
            </div>
            <button onClick={() => setErr("")} className="hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* ============================================================== */}
          {/* TAB 1: OVERVIEW & KPIS                                          */}
          {/* ============================================================== */}
          {tab === "overview" && (
            <>
              {/* Overview Filter Bar */}
              <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#C0392B]" />
                    <span className="text-xs font-bold text-[#7A6E67] uppercase tracking-wider">Branch:</span>
                    <select
                      value={overviewBranchFilter}
                      onChange={(e) => setOverviewBranchFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] font-bold focus:outline-none focus:border-[#C0392B]"
                    >
                      <option value="all">All Branches (All UAE Outlets)</option>
                      {allBranches.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.city || "Dubai"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-[#FAF7F4] border border-[#EAE3DC] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setOverviewDateFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${overviewDateFilter === "all"
                        ? "bg-[#C0392B] text-white shadow-xs"
                        : "text-[#7A6E67] hover:text-[#1E1815]"
                      }`}
                  >
                    All Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverviewDateFilter("today")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${overviewDateFilter === "today"
                        ? "bg-[#C0392B] text-white shadow-xs"
                        : "text-[#7A6E67] hover:text-[#1E1815]"
                      }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverviewDateFilter("7days")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${overviewDateFilter === "7days"
                        ? "bg-[#C0392B] text-white shadow-xs"
                        : "text-[#7A6E67] hover:text-[#1E1815]"
                      }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverviewDateFilter("30days")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${overviewDateFilter === "30days"
                        ? "bg-[#C0392B] text-white shadow-xs"
                        : "text-[#7A6E67] hover:text-[#1E1815]"
                      }`}
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>

              {/* Top Executive KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Total Revenue */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#C0392B]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between text-[#7A6E67] mb-2 text-xs font-bold uppercase tracking-wider">
                    <span>Tracked Revenue</span>
                    <Receipt className="w-4 h-4 text-[#C0392B]" />
                  </div>
                  <div className="text-2xl font-black text-[#1E1815] tracking-tight">
                    {formatMoney(cur, metrics.totalRevenue || 0)}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#1E7A4D] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Avg Bill: {formatMoney(cur, metrics.avgBill || metrics.avgTransaction || 0)}</span>
                  </div>
                </div>

                {/* Metric 2: Total Members */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#C68A1E]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between text-[#7A6E67] mb-2 text-xs font-bold uppercase tracking-wider">
                    <span>Total Members</span>
                    <Users className="w-4 h-4 text-[#C68A1E]" />
                  </div>
                  <div className="text-2xl font-black text-[#1E1815] tracking-tight">
                    {metrics.totalMembers ?? metrics.totalCustomers ?? 0}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#1E7A4D] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+{metrics.newMembersLast30Days ?? metrics.newLast30 ?? 0} new (last 30d)</span>
                  </div>
                </div>

                {/* Metric 3: Total Store Visits */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#1E7A4D]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between text-[#7A6E67] mb-2 text-xs font-bold uppercase tracking-wider">
                    <span>Total Visits</span>
                    <UserCheck className="w-4 h-4 text-[#1E7A4D]" />
                  </div>
                  <div className="text-2xl font-black text-[#1E1815] tracking-tight">
                    {metrics.totalVisits ?? 0}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#7A6E67]">
                    Repeat Customer Rate:{" "}
                    <span className="font-bold text-[#1E1815]">
                      {metrics.repeatRate ?? metrics.returnRate ?? 0}%
                    </span>
                  </div>
                </div>

                {/* Metric 4: Rewards Claimed */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#8B5CF6]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between text-[#7A6E67] mb-2 text-xs font-bold uppercase tracking-wider">
                    <span>Rewards Claimed</span>
                    <Gift className="w-4 h-4 text-[#8B5CF6]" />
                  </div>
                  <div className="text-2xl font-black text-[#1E1815] tracking-tight">
                    {metrics.rewardsClaimed ?? metrics.rewardsRedeemed ?? 0}
                    <span className="text-xs font-normal text-[#7A6E67] ml-1">
                      / {metrics.rewardsIssued ?? 0} issued
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#1E7A4D] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {metrics.rewardsIssued ? Math.round(((metrics.rewardsClaimed ?? metrics.rewardsRedeemed ?? 0) / metrics.rewardsIssued) * 100) : 0}% claim rate
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Section: Economy & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Points Economy Breakdown */}
                <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#C0392B]" />
                      Points Economy
                    </h2>
                    <span className="text-xs font-semibold text-[#7A6E67]">Live Ledger</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EFE8E1]">
                      <div>
                        <div className="text-xs font-bold text-[#7A6E67] uppercase">Awarded (All Time)</div>
                        <div className="text-xl font-black text-[#1E7A4D] mt-0.5">
                          +{Number(metrics.pointsAwarded ?? metrics.pointsIssued ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#1E7A4D]/10 text-[#1E7A4D] flex items-center justify-center font-bold">
                        pts
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EFE8E1]">
                      <div>
                        <div className="text-xs font-bold text-[#7A6E67] uppercase">Redeemed / Spent</div>
                        <div className="text-xl font-black text-[#C0392B] mt-0.5">
                          -{Number(metrics.pointsRedeemed || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#C0392B]/10 text-[#C0392B] flex items-center justify-center font-bold">
                        pts
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#C68A1E]/10 to-[#FAF7F4] border border-[#C68A1E]/20">
                      <div>
                        <div className="text-xs font-bold text-[#7A6E67] uppercase">Active Member Wallet Float</div>
                        <div className="text-xl font-black text-[#C68A1E] mt-0.5">
                          {Number(metrics.activeMemberWalletFloat ?? metrics.walletFloat ?? metrics.activePointsFloat ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#C68A1E]/20 text-[#C68A1E] flex items-center justify-center font-bold">
                        pts
                      </div>
                    </div>
                  </div>
                </div>

                {/* Popular Rewards Distribution */}
                <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#C68A1E]" />
                      Top Reward Redemptions
                    </h2>
                    <span className="text-xs font-semibold text-[#7A6E67]">Campaigns</span>
                  </div>
                  <div className="space-y-3">
                    {(data?.topRewards || data?.rewardBreakdown) && (data?.topRewards || data?.rewardBreakdown).length > 0 ? (
                      (data?.topRewards || data?.rewardBreakdown).map((r: any, rIdx: number) => (
                        <div
                          key={r.id || rIdx}
                          className="p-3 rounded-2xl border border-[#EAE3DC] bg-[#FAF7F4] flex items-center justify-between hover:border-[#D0C6BE] transition-colors"
                        >
                          <div className="min-w-0 flex-1 mr-3">
                            <div className="font-bold text-xs text-[#1E1815] truncate">{r.name}</div>
                            <div className="text-[11px] text-[#7A6E67] uppercase tracking-wider font-semibold">
                              {r.type || "Reward Voucher"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-sm text-[#1E1815]">{r.count ?? r.claimedCount ?? 0} claims</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-[#7A6E67] text-center py-8">No reward redemptions yet.</div>
                    )}
                  </div>
                </div>

                {/* Birthday Spotlight */}
                <div className="bg-gradient-to-br from-[#1F1917] to-[#2B221E] text-white rounded-3xl p-6 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-1 rounded-lg bg-[#C0392B] text-white font-black text-[10px] uppercase tracking-wider">
                        Automated Loyalty
                      </span>
                      <Calendar className="w-4 h-4 text-[#C68A1E]" />
                    </div>
                    <h3 className="font-black text-lg text-white">This Month&apos;s Birthdays</h3>
                    <p className="text-xs text-[#B8ADA6] mt-1">
                      VIP members receiving complimentary birthday dining gifts and vouchers.
                    </p>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">{data?.birthdays?.length ?? data?.birthdaysThisMonth ?? 0}</span>
                      <span className="text-xs text-[#C68A1E] font-bold">Celebrations this month</span>
                    </div>

                    {/* Member Birthday List */}
                    {data?.birthdays && data.birthdays.length > 0 ? (
                      <div className="mt-4 space-y-2 max-h-44 overflow-y-auto pr-1">
                        {data.birthdays.map((b: any, idx: number) => (
                          <div
                            key={b.id || idx}
                            className="flex items-center justify-between bg-white/10 hover:bg-white/15 transition-colors rounded-xl px-3 py-2 text-xs border border-white/5"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{b.name || "Member"}</p>
                              <p className="text-[10px] text-[#B8ADA6] truncate">{b.mobile || ""}</p>
                            </div>
                            <span className="text-xs font-bold text-[#E5A93C] bg-[#801313]/60 px-2.5 py-1 rounded-lg shrink-0 border border-[#D4AF37]/30">
                              {b.day ? `Day ${b.day}` : "This Month"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#B8ADA6] mt-3 bg-white/5 rounded-xl p-3 text-center">
                        No upcoming member birthdays this month.
                      </p>
                    )}
                  </div>
                  <div className="mt-5 pt-3 border-t border-[#3E3430] flex items-center justify-between text-xs text-[#B8ADA6]">
                    <span>Automated Trigger: Active</span>
                    <span className="text-white font-bold">VIP Tier 1</span>
                  </div>
                </div>
              </div>

              {/* Recent Live Transactions */}
              <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1E7A4D]" />
                    Live Sales & Points Stream
                  </h2>
                  <span className="text-[11px] font-semibold text-[#1E7A4D] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#1E7A4D] animate-ping" />
                    Live
                  </span>
                </div>
                <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                  {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                    data.recentTransactions.map((t: any) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-2xl border border-[#EAE3DC] bg-[#FAF7F4] flex items-center justify-between hover:border-[#D0C6BE] hover:bg-white transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white border border-[#E5DDD5] flex items-center justify-center font-bold text-xs text-[#C0392B] shrink-0">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#1E1815] truncate">
                              {t.customer?.name || t.customer || "Member"} • Inv #{t.invoiceNumber}
                            </div>
                            <div className="text-[11px] text-[#7A6E67] truncate">
                              {t.branch?.name || t.branch || "Branch"} • {formatRelativeTime(t.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-black text-xs text-[#1E1815]">
                            {formatMoney(cur, t.amount)}
                          </div>
                          <div className="text-[10px] font-bold text-[#1E7A4D]">
                            +{t.pointsEarned ?? t.points ?? 0} pts
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#7A6E67] text-center py-8">
                      No transactions registered yet. Scan cards or record visits!
                    </div>
                  )}
                </div>
              </div>

              {/* All Store CRM Grid */}
              <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#801313]" />
                      Loyalty Points Dashboard
                    </h2>
                    <p className="text-xs text-[#7A6E67] mt-0.5">
                      Select any branch to view store-level loyalty points, active members, revenue, and tills.
                    </p>
                  </div>
                  {overviewBranchFilter !== "all" && (
                    <button
                      onClick={() => setOverviewBranchFilter("all")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#801313]/10 text-[#801313] hover:bg-[#801313] hover:text-white font-bold text-xs transition-all cursor-pointer w-fit"
                    >
                      <span>Show All Branches Overview</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {branchesList.map((b: any) => {
                    const isSelected = overviewBranchFilter === b.id || overviewBranchFilter === b.code;
                    return (
                      <button
                        key={b.id || b.code}
                        type="button"
                        onClick={() => {
                          router.push(`/admin/store/${b.id || b.code}`);
                        }}
                        className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${isSelected
                            ? "bg-gradient-to-br from-[#801313] to-[#590D0D] text-white border-[#801313] shadow-md ring-2 ring-[#801313]/30"
                            : "bg-[#FAF7F4] hover:bg-white text-[#1E1815] border-[#EAE3DC] hover:border-[#801313]/40 hover:shadow-sm"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${isSelected
                                ? "bg-white/20 text-white"
                                : "bg-[#801313]/10 text-[#801313] group-hover:bg-[#801313] group-hover:text-white"
                              } transition-colors`}
                          >
                            <Store className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${isSelected
                                ? "bg-[#D4AF37] text-[#1E1815]"
                                : "bg-[#1E7A4D]/10 text-[#1E7A4D]"
                              }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#1E1815]" : "bg-[#1E7A4D]"}`} />
                            {isSelected ? "Active View" : "Online"}
                          </span>
                        </div>

                        <div className={`font-black text-sm leading-snug tracking-tight mb-1 ${isSelected ? "text-white" : "text-[#1E1815]"}`}>
                          {b.name} CRM
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/10 text-[11px]">
                          <span className={isSelected ? "text-white/80" : "text-[#7A6E67]"}>
                            {b.city || "Dubai"} • #{b.code || b.id}
                          </span>
                          <span className={`font-bold text-[10px] flex items-center gap-0.5 ${isSelected ? "text-[#FEF7C5]" : "text-[#801313]"}`}>
                            {isSelected ? "Selected" : "Open CRM →"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* TAB 2: MEMBER DIRECTORY (CUSTOMERS)                            */}
          {/* ============================================================== */}
          {tab === "customers" && (
            <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm space-y-5">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#7A6E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by name, mobile, email…"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-[#7A6E67]" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#C0392B]"
                  >
                    <option value="all">All Members</option>
                    <option value="recent">Active Recently</option>
                    <option value="highSpend">Top Spenders</option>
                    <option value="highPoints">Top Points Balance</option>
                  </select>
                </div>
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#EAE3DC] text-[#7A6E67] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="pb-3 px-3">Member</th>
                      <th className="pb-3 px-3">Mobile & Email</th>
                      <th className="pb-3 px-3">Home Branch</th>
                      <th className="pb-3 px-3">Points</th>
                      <th className="pb-3 px-3">Visits</th>
                      <th className="pb-3 px-3">Total Spend</th>
                      <th className="pb-3 px-3">Last Visit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE8E1]">
                    {cust?.customers && cust.customers.length > 0 ? (
                      cust.customers.map((c: any) => (
                        <tr
                          key={c.id}
                          onClick={() => openCustomerDetail(c.id)}
                          className="hover:bg-[#FAF7F4] transition-all cursor-pointer group"
                        >
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C0392B] to-[#96291D] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
                                {c.name ? c.name.slice(0, 2).toUpperCase() : "MB"}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-[#1E1815] group-hover:text-[#C0392B] transition-colors flex items-center gap-1.5">
                                  <span>{c.name}</span>
                                  {c.isBlocked && (
                                    <span className="px-1.5 py-0.5 rounded bg-[#C0392B]/10 text-[#C0392B] text-[9px] font-black uppercase">
                                      Blocked
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-[#7A6E67]">
                                  Joined {c.createdAt || c.joinedAt ? new Date(c.createdAt || c.joinedAt).toLocaleDateString() : "—"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-[#4A3F39]">
                            <div>{c.mobile}</div>
                            {c.email && <div className="text-[10px] text-[#7A6E67] truncate max-w-[170px]">{c.email}</div>}
                          </td>
                          <td className="py-3.5 px-3 text-[#7A6E67] font-medium">{c.homeBranch?.name || c.branch || "—"}</td>
                          <td className="py-3.5 px-3 font-black text-[#C0392B]">{c.pointsBalance ?? c.points ?? 0} pts</td>
                          <td className="py-3.5 px-3 font-bold text-[#1E1815]">{c.visitCount ?? c.visits ?? 0} visits</td>
                          <td className="py-3.5 px-3 font-bold text-[#1E1815]">
                            {formatMoney(cur, c.totalSpend ?? c.spend ?? 0)}
                          </td>
                          <td className="py-3.5 px-3 text-[#7A6E67]">
                            <div className="flex items-center justify-between">
                              <span>{formatRelativeTime(c.lastVisitAt)}</span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#C0392B] font-bold text-[11px] flex items-center gap-0.5 ml-2">
                                Details <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-xs text-[#7A6E67]">
                          No members matching query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: PROMOTIONS & OFFERS                                     */}
          {/* ============================================================== */}
          {tab === "offers" && (
            <div className="space-y-6">
              {offerMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${offerMsg.type === "ok"
                    ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                    : "bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/30"
                    }`}
                >
                  <span>{offerMsg.text}</span>
                  <button onClick={() => setOfferMsg(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {offers?.offers && offers.offers.length > 0 ? (
                  offers.offers.map((o: any) => (
                    <div
                      key={o.id}
                      className="bg-white border border-[#EAE3DC] rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#C0392B]/10 to-transparent rounded-bl-full pointer-events-none" />
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${o.isActive
                              ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                              : "bg-[#7A6E67]/10 text-[#7A6E67]"
                              }`}
                          >
                            {o.isActive ? "Active Campaign" : "Disabled"}
                          </span>
                          <div className="font-black text-lg text-[#C0392B]">
                            {o.isPercent ? `${o.value}% OFF` : `AED ${o.value} OFF`}
                          </div>
                        </div>

                        <h3 className="font-black text-base text-[#1E1815]">{o.name}</h3>
                        <p className="text-xs text-[#7A6E67] mt-1 leading-relaxed">
                          {o.description || "Applicable on eligible menu items across UAE branches."}
                        </p>

                        <div className="mt-4 pt-3 border-t border-[#EFE8E1] space-y-1.5 text-xs text-[#7A6E67]">
                          <div className="flex items-center justify-between">
                            <span>Locations:</span>
                            <span className="font-bold text-[#1E1815]">
                              {o.branches?.length ? `${o.branches.length} Branches` : "All Branches"}
                            </span>
                          </div>
                          {(o.startsAt || o.endsAt) && (
                            <div className="flex items-center justify-between">
                              <span>Schedule:</span>
                              <span className="font-medium text-[#1E1815]">
                                {o.startsAt ? new Date(o.startsAt).toLocaleDateString() : "Now"} –{" "}
                                {o.endsAt ? new Date(o.endsAt).toLocaleDateString() : "Ongoing"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-[#EFE8E1] flex items-center justify-between">
                        <span className="text-[10px] text-[#7A6E67]">
                          Created {new Date(o.createdAt).toLocaleDateString()}
                        </span>
                        {offers.canEdit && (
                          <button
                            onClick={() => toggleOffer(o.id, !o.isActive)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${o.isActive
                              ? "bg-[#C0392B]/10 hover:bg-[#C0392B]/20 text-[#C0392B]"
                              : "bg-[#1E7A4D]/10 hover:bg-[#1E7A4D]/20 text-[#1E7A4D]"
                              }`}
                          >
                            {o.isActive ? "Pause Campaign" : "Activate Campaign"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full bg-white border border-[#EAE3DC] rounded-3xl p-12 text-center text-xs text-[#7A6E67]">
                    No active offers configured. Click "+ New Campaign" to launch a promotion.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: BRANCH OUTLETS & CRUD                                   */}
          {/* ============================================================== */}
          {tab === "branches" && (
            <div className="space-y-6">
              {branchMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm ${branchMsg.type === "ok"
                    ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                    : "bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/30"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {branchMsg.type === "ok" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{branchMsg.text}</span>
                  </div>
                  <button onClick={() => setBranchMsg(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Branch Management Header */}
              <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C0392B] to-[#96291D] flex items-center justify-center font-bold text-white shadow-md shadow-[#C0392B]/30 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#1E1815] flex items-center gap-2">
                        Branch Locations & Outlets
                      </h2>
                      <p className="text-xs text-[#7A6E67] mt-0.5">
                        Manage network outlets, operating hours, staff allocations, and branch details.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const initialCode = generateRandomCouponCode("1015");
                        setBranchForm({
                          code: "",
                          name: "",
                          nameAr: "",
                          city: "Dubai",
                          address: "",
                          addressAr: "",
                          phone: "",
                          hours: "10:00 AM – 11:00 PM",
                          isActive: true,
                          dailyCode: initialCode,
                          dailyCodeExpiresAt: toDatetimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
                        });
                        setBranchMsg(null);
                        setShowCreateBranchModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Branch</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Branch Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-sm">
                  <div className="text-xs font-bold text-[#7A6E67] uppercase">Total Outlets</div>
                  <div className="text-2xl font-black text-[#1E1815] mt-1">{allBranches.length}</div>
                </div>
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-sm">
                  <div className="text-xs font-bold text-[#7A6E67] uppercase">Active Locations</div>
                  <div className="text-2xl font-black text-[#1E7A4D] mt-1">
                    {allBranches.filter((b: any) => b.isActive !== false).length}
                  </div>
                </div>
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-sm">
                  <div className="text-xs font-bold text-[#7A6E67] uppercase">Cities Covered</div>
                  <div className="text-2xl font-black text-[#C68A1E] mt-1">{cities.length || 3}</div>
                </div>
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-sm">
                  <div className="text-xs font-bold text-[#7A6E67] uppercase">Total Network Revenue</div>
                  <div className="text-2xl font-black text-[#C0392B] mt-1">
                    {formatMoney(cur, allBranches.reduce((acc: number, b: any) => acc + (b.totalRevenue || b.revenue || 0), 0))}
                  </div>
                </div>
              </div>

              {/* Search and City Filter */}
              <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-[#7A6E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={branchSearch}
                      onChange={(e) => setBranchSearch(e.target.value)}
                      placeholder="Search branches by code, name, city, coupon…"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#C0392B]"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-[#7A6E67]" />
                    <select
                      value={branchCityFilter}
                      onChange={(e) => setBranchCityFilter(e.target.value)}
                      className="px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#C0392B]"
                    >
                      <option value="all">All Cities</option>
                      {cities.map((city: string) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Branches Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#EAE3DC] text-[#7A6E67] uppercase tracking-wider font-bold">
                      <tr>
                        <th className="pb-3 px-3">Code</th>
                        <th className="pb-3 px-3">Branch Name</th>
                        <th className="pb-3 px-3">24H Visit Coupon</th>
                        <th className="pb-3 px-3">City & Address</th>
                        <th className="pb-3 px-3">Contact & Hours</th>
                        <th className="pb-3 px-3">Status</th>
                        <th className="pb-3 px-3">Staff / Visits</th>
                        <th className="pb-3 px-3">Revenue</th>
                        <th className="pb-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE8E1]">
                      {filteredBranches.length > 0 ? (
                        filteredBranches.map((b: any) => {
                          const isCopied = copiedCode === b.dailyCode;
                          const isRotating = rotatingBranchId === b.id;

                          return (
                            <tr key={b.id || b.code} className="hover:bg-[#FAF7F4] transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-[#C0392B]">
                                <span className="px-2 py-1 rounded-lg bg-[#C0392B]/10 border border-[#C0392B]/20">
                                  {b.code}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-extrabold text-[#1E1815]">{b.name}</div>
                                {b.nameAr && <div className="text-[11px] text-[#7A6E67]">{b.nameAr}</div>}
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  <Link
                                    href={`/outlet?code=${encodeURIComponent(b.code || b.id)}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#801313]/10 hover:bg-[#801313] text-[#801313] hover:text-white text-[10px] font-black tracking-wide transition-all cursor-pointer shadow-2xs"
                                    title={`Launch ${b.name} Outlet POS Terminal`}
                                  >
                                    <Store className="w-2.5 h-2.5" />
                                    <span>Launch Outlet POS</span>
                                  </Link>
                                  <Link
                                    href={`/admin/store/${encodeURIComponent(b.id || b.code)}`}
                                    className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#7A6E67] hover:text-[#801313] transition-colors"
                                    title={`Open ${b.name} Store CRM`}
                                  >
                                    <span>Store CRM</span>
                                    <ChevronRight className="w-2.5 h-2.5" />
                                  </Link>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                {b.dailyCode ? (
                                  <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 p-1 px-2 rounded-xl bg-[#FAF7F4] border border-[#E0D7CF]">
                                      <Ticket className="w-3.5 h-3.5 text-[#C0392B] shrink-0" />
                                      <span className="font-mono font-black text-xs text-[#C0392B] tracking-wider">
                                        {b.dailyCode}
                                      </span>
                                      <button
                                        onClick={() => copyToClipboard(b.dailyCode)}
                                        title="Copy Coupon Code"
                                        className="p-1 rounded hover:bg-white text-[#7A6E67] hover:text-[#C0392B] transition-colors cursor-pointer ml-1"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleRotateBranchCode(b.id)}
                                        disabled={isRotating}
                                        title="Rotate Code Now"
                                        className="p-1 rounded hover:bg-white text-[#7A6E67] hover:text-[#C0392B] transition-colors cursor-pointer"
                                      >
                                        <RotateCw className={`w-3 h-3 ${isRotating ? "animate-spin text-[#C0392B]" : ""}`} />
                                      </button>
                                      {isCopied && (
                                        <span className="text-[9px] font-bold text-[#1E7A4D] bg-[#1E7A4D]/10 px-1.5 py-0.5 rounded">
                                          Copied!
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-[#7A6E67]">
                                      <Clock className="w-2.5 h-2.5 text-[#C68A1E]" />
                                      <span>{formatExpiryTime(b.dailyCodeExpiresAt)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[#7A6E67] text-[11px]">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-[#1E1815] flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#C68A1E]" />
                                  <span>{b.city || "Dubai"}</span>
                                </div>
                                <div className="text-[11px] text-[#7A6E67] truncate max-w-[180px]">
                                  {b.address || "—"}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-[11px] text-[#7A6E67]">
                                {b.phone && (
                                  <div className="flex items-center gap-1 font-mono">
                                    <Phone className="w-3 h-3 text-[#7A6E67]" />
                                    <span>{b.phone}</span>
                                  </div>
                                )}
                                <div>{b.hours || "10:00 AM – 11:00 PM"}</div>
                              </td>
                              <td className="py-3 px-3">
                                <button
                                  onClick={() => handleToggleBranch(b)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-all ${b.isActive !== false
                                    ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30 hover:bg-[#1E7A4D]/20"
                                    : "bg-[#7A6E67]/10 text-[#7A6E67] border border-[#7A6E67]/30 hover:bg-[#7A6E67]/20"
                                    }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${b.isActive !== false ? "bg-[#1E7A4D]" : "bg-[#7A6E67]"
                                      }`}
                                  />
                                  <span>{b.isActive !== false ? "Active" : "Inactive"}</span>
                                </button>
                              </td>
                              <td className="py-3 px-3 text-[#7A6E67]">
                                <div className="font-semibold text-[#1E1815]">
                                  {b.staffCount ?? b.staff ?? 0} Staff
                                </div>
                                <div className="text-[10px]">
                                  {b.visitCount ?? b.visits ?? b.transactionCount ?? 0} Visits / Txs
                                </div>
                              </td>
                              <td className="py-3 px-3 font-black text-[#C0392B]">
                                {formatMoney(cur, b.totalRevenue || b.revenue || 0)}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <Link
                                    href={`/outlet?code=${encodeURIComponent(b.code || b.id)}`}
                                    target="_blank"
                                    title={`Launch ${b.name} Outlet POS Terminal`}
                                    className="p-1.5 rounded-lg border border-[#801313]/30 bg-[#801313]/10 hover:bg-[#801313] text-[#801313] hover:text-white transition-all cursor-pointer"
                                  >
                                    <Store className="w-3.5 h-3.5" />
                                  </Link>
                                  <button
                                    onClick={() => openEditBranch(b)}
                                    title="Edit Branch Details"
                                    className="p-1.5 rounded-lg border border-[#EAE3DC] bg-white hover:bg-[#FAF7F4] text-[#4A3F39] hover:text-[#C0392B] transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => openDeleteBranch(b)}
                                    title="Delete / Deactivate Branch"
                                    className="p-1.5 rounded-lg border border-[#EAE3DC] bg-white hover:bg-[#C0392B]/10 text-[#4A3F39] hover:text-[#C0392B] transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="text-center py-8 text-xs text-[#7A6E67]">
                            No branches found matching search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: STAFF & POS TILL ACCOUNTS                               */}
          {/* ============================================================== */}
          {tab === "staff" && (
            <div className="space-y-6">
              {staffMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${staffMsg.type === "ok"
                    ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                    : "bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/30"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {staffMsg.type === "ok" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{staffMsg.text}</span>
                  </div>
                  <button onClick={() => setStaffMsg(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Staff Management Header Card */}
              <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C0392B] to-[#96291D] flex items-center justify-center font-bold text-white shadow-md shadow-[#C0392B]/30 shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-[#1E1815]">
                        Staff & Terminal POS Accounts
                      </h2>
                      <p className="text-xs text-[#7A6E67] mt-0.5">
                        Manage cashier till logins, store managers, assigned outlet branches, and security PIN credentials.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setStaffForm({
                          username: "",
                          name: "",
                          pin: "",
                          role: "CASHIER",
                          branchId: "",
                          isActive: true,
                        });
                        setStaffMsg(null);
                        setShowCreateStaffModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 transition-all cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Staff Account</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Toolbar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-[#EAE3DC]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, username, branch, or role…"
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#C0392B]"
                    />
                    <Search className="w-4 h-4 text-[#8C7F78] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div>
                    <select
                      value={staffRoleFilter}
                      onChange={(e) => setStaffRoleFilter(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#C0392B]"
                    >
                      <option value="all">All System Roles</option>
                      <option value="CASHIER">Cashiers (POS Front Tills)</option>
                      <option value="BRANCH_MANAGER">Branch Managers</option>
                      <option value="COMPANY_ADMIN">Company Admins</option>
                      <option value="SUPER_ADMIN">Super Administrators</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={staffBranchFilter}
                      onChange={(e) => setStaffBranchFilter(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#C0392B]"
                    >
                      <option value="all">All Outlet Assignments</option>
                      <option value="hq">🏢 Corporate Head Office (All Outlets)</option>
                      {allBranches.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code}) - {b.city || "Dubai"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Staff Data Table */}
                <div className="mt-5 overflow-x-auto rounded-2xl border border-[#EAE3DC]">
                  <table className="w-full text-left text-xs text-[#1E1815]">
                    <thead className="bg-[#FAF7F4] border-b border-[#EAE3DC] text-[11px] uppercase tracking-wider text-[#7A6E67] font-bold">
                      <tr>
                        <th className="py-3 px-4">Staff Member</th>
                        <th className="py-3 px-4">Login Username</th>
                        <th className="py-3 px-4">Assigned Branch / Outlet</th>
                        <th className="py-3 px-4">System Role</th>
                        <th className="py-3 px-4">Till Activity</th>
                        <th className="py-3 px-4">Account Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE8E1] bg-white">
                      {filteredStaff.length > 0 ? (
                        filteredStaff.map((s) => (
                          <tr key={s.id} className="hover:bg-[#FAF7F4]/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EAE3DC] to-[#DCD3CB] flex items-center justify-center font-bold text-[#4A3F39] text-xs shrink-0">
                                  {s.name ? s.name.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div>
                                  <div className="font-extrabold text-xs text-[#1E1815]">{s.name}</div>
                                  <div className="text-[10px] text-[#7A6E67]">
                                    Joined {new Date(s.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#4A3F39]">
                              @{s.username}
                            </td>
                            <td className="py-3.5 px-4">
                              {s.branch ? (
                                <div className="flex items-center gap-1.5">
                                  <Store className="w-3.5 h-3.5 text-[#C0392B]" />
                                  <span className="font-bold text-xs text-[#1E1815]">
                                    {s.branch.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#8C7F78]">
                                    ({s.branch.code})
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[#7A6E67]">
                                  <Building2 className="w-3.5 h-3.5 text-[#C68A1E]" />
                                  <span className="font-semibold text-xs text-[#7A6E67]">
                                    Corporate / All Outlets
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {s.role === "SUPER_ADMIN" && (
                                <span className="px-2.5 py-1 rounded-full bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/20 text-[10px] font-black uppercase tracking-wider">
                                  SUPER ADMIN
                                </span>
                              )}
                              {s.role === "COMPANY_ADMIN" && (
                                <span className="px-2.5 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 text-[10px] font-black uppercase tracking-wider">
                                  COMPANY ADMIN
                                </span>
                              )}
                              {s.role === "BRANCH_MANAGER" && (
                                <span className="px-2.5 py-1 rounded-full bg-[#C68A1E]/10 text-[#9E690B] border border-[#C68A1E]/20 text-[10px] font-black uppercase tracking-wider">
                                  BRANCH MANAGER
                                </span>
                              )}
                              {s.role === "CASHIER" && (
                                <span className="px-2.5 py-1 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 text-[10px] font-black uppercase tracking-wider">
                                  CASHIER (POS TILL)
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-xs text-[#4A3F39]">
                              <span className="px-2 py-0.5 rounded-lg bg-[#FAF7F4] border border-[#EAE3DC] font-mono text-[11px]">
                                {s.transactionCount ?? 0} txs
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleStaff(s)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition-colors ${s.isActive
                                  ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 hover:bg-[#1E7A4D]/20"
                                  : "bg-[#7A6E67]/10 text-[#7A6E67] border border-[#7A6E67]/20 hover:bg-[#7A6E67]/20"
                                  }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${s.isActive ? "bg-[#1E7A4D]" : "bg-[#7A6E67]"
                                    }`}
                                />
                                <span>{s.isActive ? "ACTIVE" : "INACTIVE"}</span>
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditStaff(s)}
                                  className="p-1.5 rounded-lg text-[#7A6E67] hover:text-[#1E1815] hover:bg-[#FAF7F4] transition-colors cursor-pointer"
                                  title="Edit staff details & reset PIN"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteStaff(s)}
                                  className="p-1.5 rounded-lg text-[#C0392B] hover:bg-[#C0392B]/10 transition-colors cursor-pointer"
                                  title="Delete / Deactivate staff account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-xs text-[#7A6E67]">
                            No staff accounts found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: BRANCH VISITS & 24-HOUR DAILY COUPON PASSCODES            */}
          {/* ============================================================== */}
          {tab === "visits" && (
            <div className="space-y-6">
              {visitMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${visitMsg.type === "ok"
                    ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                    : "bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/30"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {visitMsg.type === "ok" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{visitMsg.text}</span>
                  </div>
                  <button onClick={() => setVisitMsg(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Visit Metrics KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-2xs">
                  <div className="text-[11px] font-bold text-[#7A6E67] uppercase tracking-wider">
                    Total Visits (All Time)
                  </div>
                  <div className="text-2xl font-black text-[#1E1815] mt-1">
                    {visitMetrics.totalVisits ?? 0}
                  </div>
                  <div className="text-[10px] text-[#1E7A4D] font-semibold mt-1">
                    Verified Customer Check-ins
                  </div>
                </div>

                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-2xs">
                  <div className="text-[11px] font-bold text-[#7A6E67] uppercase tracking-wider">
                    Today&apos;s Check-ins
                  </div>
                  <div className="text-2xl font-black text-[#C0392B] mt-1">
                    {visitMetrics.todayVisits ?? 0}
                  </div>
                  <div className="text-[10px] text-[#7A6E67] font-semibold mt-1">
                    Since Midnight
                  </div>
                </div>

                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-2xs">
                  <div className="text-[11px] font-bold text-[#7A6E67] uppercase tracking-wider">
                    Unique Customers Today
                  </div>
                  <div className="text-2xl font-black text-[#C68A1E] mt-1">
                    {visitMetrics.uniqueCustomersToday ?? 0}
                  </div>
                  <div className="text-[10px] text-[#7A6E67] font-semibold mt-1">
                    Individual Diners
                  </div>
                </div>

                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-2xs">
                  <div className="text-[11px] font-bold text-[#7A6E67] uppercase tracking-wider">
                    Top Visited Outlet
                  </div>
                  <div className="text-sm font-black text-[#1E1815] mt-2 truncate">
                    {visitMetrics.topBranchName || "None"}
                  </div>
                  <div className="text-[10px] text-[#7A6E67] font-semibold mt-1">
                    Leading Foot Traffic
                  </div>
                </div>
              </div>

              {/* Customer Visits Ledger Card */}
              <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-base text-[#1E1815]">Customer Visit Check-in Ledger</h3>
                    <p className="text-xs text-[#7A6E67]">
                      Real-time log of customer outlet visits recorded via coupon codes and till scans.
                    </p>
                  </div>
                  <span className="text-xs text-[#7A6E67] font-semibold">{visitsData.length} Records Loaded</span>
                </div>

                {/* Filter Toolbar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#EAE3DC]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search customer, phone, branch, or code…"
                      value={visitSearch}
                      onChange={(e) => setVisitSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#C0392B]"
                    />
                    <Search className="w-4 h-4 text-[#8C7F78] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div>
                    <select
                      value={visitBranchFilter}
                      onChange={(e) => setVisitBranchFilter(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#C0392B]"
                    >
                      <option value="all">All Outlet Branches</option>
                      {allBranches.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code}) - {b.city || "Dubai"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={visitDateFilter}
                      onChange={(e) => setVisitDateFilter(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#C0392B]"
                    >
                      <option value="all">All Dates History</option>
                      <option value="today">Today Only (Since 00:00)</option>
                      <option value="7days">Past 7 Days</option>
                      <option value="30days">Past 30 Days</option>
                    </select>
                  </div>
                </div>

                {/* Visits Table */}
                <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC] mt-2">
                  <table className="w-full text-left text-xs text-[#1E1815]">
                    <thead className="bg-[#FAF7F4] border-b border-[#EAE3DC] text-[11px] uppercase tracking-wider text-[#7A6E67] font-bold">
                      <tr>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Branch Visited</th>
                        <th className="py-3 px-4">Coupon Passcode</th>
                        <th className="py-3 px-4">Check-in Method</th>
                        <th className="py-3 px-4">Visit #</th>
                        <th className="py-3 px-4">Points</th>
                        <th className="py-3 px-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE8E1] bg-white">
                      {visitsData.length > 0 ? (
                        visitsData.map((v) => (
                          <tr key={v.id} className="hover:bg-[#FAF7F4]/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EAE3DC] to-[#DCD3CB] flex items-center justify-center font-bold text-[#4A3F39] text-xs shrink-0">
                                  {v.customer?.name ? v.customer.name.charAt(0).toUpperCase() : "C"}
                                </div>
                                <div>
                                  <div className="font-extrabold text-xs text-[#1E1815]">
                                    {v.customer?.name || "Member"}
                                  </div>
                                  <div className="font-mono text-[10px] text-[#7A6E67]">
                                    {v.customer?.mobile}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <Store className="w-3.5 h-3.5 text-[#C0392B]" />
                                <span className="font-bold text-xs text-[#1E1815]">
                                  {v.branch?.name}
                                </span>
                                <span className="text-[10px] font-mono text-[#8C7F78]">
                                  ({v.branch?.code})
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F4] border border-[#EAE3DC] font-mono font-bold text-[11px] text-[#C0392B]">
                                {v.couponCode}
                              </span>
                              {v.note && (
                                <div className="text-[10px] font-mono text-[#4A3F39] mt-1 font-semibold">
                                  {v.note}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {v.checkInMethod === "CUSTOMER_PORTAL" ? (
                                <span className="px-2 py-0.5 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 text-[10px] font-black uppercase">
                                  Self Check-in
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 text-[10px] font-black uppercase">
                                  Staff POS
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#4A3F39]">
                              Visit #{v.customer?.visitCount ?? 1}
                            </td>
                            <td className="py-3.5 px-4">
                              {v.pointsEarned > 0 ? (
                                <span className="font-bold text-xs text-[#1E7A4D]">
                                  +{v.pointsEarned} pts
                                </span>
                              ) : (
                                <span className="text-[#7A6E67] text-[11px]">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="font-mono text-xs text-[#1E1815]">
                                {new Date(v.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                              <div className="text-[10px] text-[#7A6E67]">
                                {new Date(v.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-xs text-[#7A6E67]">
                            No customer visits recorded yet matching your filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: OUTLET POS / CASHIER TERMINAL                             */}
          {/* ============================================================== */}
          {tab === "outlet" && (() => {
            const selectedAdminBranch =
              allBranches.find((b: any) => b.id === (outletBranchId || allBranches[0]?.id)) ||
              allBranches[0];

            return (
              <div className="space-y-6">
                {/* 1. Branch Selector Top Bar */}
                <div className="bg-white border border-[#EAE3DC] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#801313] to-[#550B0B] text-white flex items-center justify-center font-bold shadow-md shadow-[#801313]/20 shrink-0">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black tracking-widest text-[#801313] uppercase flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5" />
                        <span>
                          {selectedAdminBranch
                            ? `${selectedAdminBranch.name.toUpperCase()} · #${selectedAdminBranch.code}`
                            : "EXECUTIVE CASHIER DESK"}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-serif font-black text-[#1E1815]">
                        {selectedAdminBranch ? `${selectedAdminBranch.name} Cashier Desk` : "Outlet POS Terminal"}
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#FAF7F4] border border-[#EAE3DC] p-2 rounded-2xl">
                      <Building2 className="w-4 h-4 text-[#801313] shrink-0 ml-1" />
                      <span className="text-xs font-bold text-[#7A6E67] uppercase shrink-0">Till Outlet:</span>
                      <select
                        value={outletBranchId || (allBranches[0]?.id || "")}
                        onChange={(e) => {
                          setOutletBranchId(e.target.value);
                          setOutletCustomer(null);
                          setOutletSuccessReceipt(null);
                        }}
                        className="bg-transparent text-xs font-bold text-[#1E1815] focus:outline-none cursor-pointer pr-2"
                      >
                        {allBranches.map((b: any) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code}) - {b.city || "Dubai"}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedAdminBranch && (
                      <Link
                        href={`/outlet?code=${encodeURIComponent(selectedAdminBranch.code || selectedAdminBranch.id)}`}
                        target="_blank"
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#801313] hover:bg-[#680F0F] text-white text-xs font-black shadow-sm transition-all cursor-pointer shrink-0"
                        title={`Open ${selectedAdminBranch.name} in Dedicated POS Screen`}
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Open POS Screen</span>
                      </Link>
                    )}

                  {outletCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        setOutletCustomer(null);
                        setOutletSuccessReceipt(null);
                        setOutletMobileInput("");
                        setOutletQrInput("");
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:text-[#801313] hover:border-[#801313]/40 shadow-2xs transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Switch Customer</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Customer Lookup Card (When no customer is currently active) */}
              {!outletCustomer && !outletSuccessReceipt && (
                <div className="bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-8 border border-[#EAE3DC] shadow-sm space-y-6">
                  {/* Two Search Tabs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOutletSearchTab("phone");
                        stopOutletCamera();
                        setOutletSearchErr("");
                      }}
                      className={`p-4.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${outletSearchTab === "phone"
                          ? "bg-[#FAF7F4] border-[#801313] shadow-xs ring-1 ring-[#801313]"
                          : "bg-white border-[#EAE3DC] hover:border-[#B5AAA2] hover:bg-[#FAF7F4]/50"
                        }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${outletSearchTab === "phone" ? "bg-[#801313]/10 text-[#801313]" : "bg-[#FAF7F4] text-[#7A6E67]"
                          }`}
                      >
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-[#1E1815]">Enter mobile number</div>
                        <div className="text-xs text-[#7A6E67] font-medium">Find a registered customer</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOutletSearchTab("qr");
                        setOutletSearchErr("");
                        setTimeout(() => outletQrInputRef.current?.focus(), 50);
                      }}
                      className={`p-4.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${outletSearchTab === "qr"
                          ? "bg-[#FAF7F4] border-[#801313] shadow-xs ring-1 ring-[#801313]"
                          : "bg-white border-[#EAE3DC] hover:border-[#B5AAA2] hover:bg-[#FAF7F4]/50"
                        }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${outletSearchTab === "qr" ? "bg-[#801313]/10 text-[#801313]" : "bg-[#FAF7F4] text-[#7A6E67]"
                          }`}
                      >
                        <Scan className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-[#1E1815]">Scan membership QR</div>
                        <div className="text-xs text-[#7A6E67] font-medium">Use POS or USB scanner</div>
                      </div>
                    </button>
                  </div>

                  {/* TAB 1: Mobile Search Form */}
                  {outletSearchTab === "phone" && (
                    <form onSubmit={handleAdminLookupCustomer} className="animate-in fade-in duration-150">
                      <label className="block text-xs font-black text-[#1E1815] mb-2" htmlFor="admin-pos-phone">
                        Mobile number
                      </label>

                      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                        <CountryCodePicker
                          value={outletCountryCode}
                          onChange={setOutletCountryCode}
                          disabled={outletSearchBusy}
                        />

                        <input
                          id="admin-pos-phone"
                          type="tel"
                          placeholder="50 123 4567"
                          value={outletMobileInput}
                          onChange={(e) => setOutletMobileInput(e.target.value.replace(/[^\d\s]/g, ""))}
                          autoFocus
                          required
                          className="flex-1 px-4 py-3.5 bg-white border border-[#EAE3DC] rounded-xl text-base font-bold text-[#1E1815] placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#801313] shadow-2xs"
                        />

                        <button
                          type="submit"
                          disabled={!outletMobileInput.trim() || outletSearchBusy}
                          className="py-3.5 px-7 rounded-xl bg-[#681421] hover:bg-[#520F1A] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
                        >
                          {outletSearchBusy ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>FINDING…</span>
                            </>
                          ) : (
                            <span>OPEN CUSTOMER</span>
                          )}
                        </button>
                      </div>

                      <div className="text-[11px] text-[#7A6E67] font-medium mt-2.5">
                        Choose the country code and enter the number without the first zero.
                      </div>
                    </form>
                  )}

                  {/* TAB 2: QR Scanner Search Form */}
                  {outletSearchTab === "qr" && (
                    <div className="animate-in fade-in duration-150 space-y-4">
                      <form onSubmit={handleAdminLookupCustomer} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                        <div className="relative flex-1">
                          <input
                            ref={outletQrInputRef}
                            type="text"
                            placeholder="Scan QR or enter token e.g. 7K9A..."
                            value={outletQrInput}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setOutletQrInput(val);
                              if (val.length >= 8 && !val.includes(" ")) {
                                handleAdminLookupCustomer(undefined, val);
                              }
                            }}
                            autoFocus
                            className="w-full px-4 py-3.5 bg-white border border-[#EAE3DC] rounded-xl font-mono text-sm font-bold text-[#1E1815] uppercase placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#801313] shadow-2xs"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={!outletQrInput.trim() || outletSearchBusy}
                          className="py-3.5 px-7 rounded-xl bg-[#681421] hover:bg-[#520F1A] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
                        >
                          {outletSearchBusy ? "FINDING…" : "LOOKUP QR"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isOutletCameraActive) stopOutletCamera();
                            else startOutletCamera();
                          }}
                          className="py-3.5 px-4 rounded-xl bg-[#FAF7F4] hover:bg-[#EAE3DC] border border-[#EAE3DC] text-[#1E1815] font-bold text-xs flex items-center justify-center gap-2 shrink-0 transition-colors cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-[#801313]" />
                          <span>{isOutletCameraActive ? "Stop Camera" : "Camera Scan"}</span>
                        </button>
                      </form>

                      {isOutletCameraActive && (
                        <div className="mt-4 p-4 rounded-2xl bg-[#1E1815] text-white text-center relative overflow-hidden">
                          <div className="relative aspect-video max-w-sm mx-auto rounded-xl overflow-hidden bg-black border-2 border-white/20">
                            <video ref={outletVideoRef} className="w-full h-full object-cover" />
                            <canvas ref={outletCanvasRef} className="hidden" />
                            <div className="absolute inset-8 border-2 border-dashed border-[#E5A93C] rounded-lg pointer-events-none animate-pulse" />
                          </div>
                          <p className="text-xs text-white/80 font-medium mt-3">{outletCameraHint}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {outletSearchErr && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{outletSearchErr}</span>
                      </div>
                      <button onClick={() => setOutletSearchErr("")} className="cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Active Customer POS Processing Desk */}
              {outletCustomer && (
                <div className="bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-8 border border-[#EAE3DC] shadow-md space-y-6">
                  {/* Top Customer Summary Header Card (Exact image design) */}
                  <div className="bg-[#FAF5F0] rounded-2xl p-4.5 sm:p-5 border border-[#EFE8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Circular Avatar Icon */}
                      <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full border-2 border-[#801313] flex items-center justify-center text-[#801313] shrink-0 bg-white shadow-2xs">
                        <User className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8] text-[#801313]" />
                      </div>
                      <div>
                        <h2 className="font-serif font-black text-xl sm:text-2xl text-[#1E1815] leading-tight">
                          {outletCustomer.name}
                        </h2>
                        <p className="text-xs text-[#7A6E67] font-medium mt-0.5">
                          Repeat visits: {allBranches.find((b: any) => b.id === outletBranchId)?.name || outletCustomer.homeBranch?.name || "Dubai Festival City"}
                        </p>
                      </div>
                    </div>

                    {/* Stat Columns with Divider */}
                    <div className="flex items-center gap-4 sm:gap-6 self-start sm:self-center bg-white/70 sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-[#EAE3DC]">
                      <div className="text-center px-2 sm:px-4">
                        <div className="font-serif font-black text-xl sm:text-2xl text-[#1E1815] leading-none">
                          {outletCustomer.pointsBalance}
                        </div>
                        <div className="text-[11px] font-semibold text-[#7A6E67] mt-1">
                          Points
                        </div>
                      </div>

                      <div className="w-[1px] h-9 bg-[#E5DDD5]" />

                      <div className="text-center px-2 sm:px-4">
                        <div className="font-serif font-black text-xl sm:text-2xl text-[#1E1815] leading-none">
                          {outletCustomer.visitCount}
                        </div>
                        <div className="text-[11px] font-semibold text-[#7A6E67] mt-1">
                          Visits
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3 Action Mode Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Card 1: Give loyalty points */}
                    <button
                      type="button"
                      onClick={() => {
                        setOutletActionMode("points");
                        setOutletBillErr("");
                      }}
                      className={`p-4.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${outletActionMode === "points"
                          ? "bg-[#FAF7F4] border-[#801313] shadow-sm ring-2 ring-[#801313]/20"
                          : "bg-white border-[#EAE3DC] hover:border-[#801313]/50 hover:bg-[#FAF7F4]/40"
                        }`}
                    >
                      <div className="text-[#801313] mb-3">
                        <RibbonIcon className="w-7 h-7 text-[#801313]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-[#1E1815] leading-snug">
                          Give loyalty points
                        </h3>
                        <p className="text-[11px] text-[#7A6E67] font-medium mt-1">
                          Invoice # + bill amount
                        </p>
                      </div>
                      {outletActionMode === "points" && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#801313]" />
                      )}
                    </button>

                    {/* Card 2: Redeem points */}
                    <button
                      type="button"
                      onClick={() => {
                        setOutletActionMode("redeem_points");
                        setOutletBillErr("");
                      }}
                      className={`p-4.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${outletActionMode === "redeem_points"
                          ? "bg-[#FAF7F4] border-[#801313] shadow-sm ring-2 ring-[#801313]/20"
                          : "bg-white border-[#EAE3DC] hover:border-[#801313]/50 hover:bg-[#FAF7F4]/40"
                        }`}
                    >
                      <div className="text-[#801313] mb-3">
                        <Coins className="w-7 h-7 text-[#801313]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-[#1E1815] leading-snug">
                          Redeem points
                        </h3>
                        <p className="text-[11px] text-[#7A6E67] font-medium mt-1">
                          Direct cash bill discount
                        </p>
                      </div>
                      {outletActionMode === "redeem_points" && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#801313]" />
                      )}
                    </button>

                    {/* Card 3: Redeem visit offer */}
                    <button
                      type="button"
                      onClick={() => {
                        setOutletActionMode("reward");
                        setOutletRewardErr("");
                        setOutletRewardSuccessReceipt(null);
                      }}
                      className={`p-4.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${outletActionMode === "reward"
                          ? "bg-[#FAF7F4] border-[#801313] shadow-sm ring-2 ring-[#801313]/20"
                          : "bg-white border-[#EAE3DC] hover:border-[#801313]/50 hover:bg-[#FAF7F4]/40"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3 text-[#801313]">
                        <Gift className="w-7 h-7 text-[#801313] stroke-[1.8]" />
                        {outletAvailableRewards.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#801313]/10 text-[#801313] text-[9px] font-black uppercase">
                            {outletAvailableRewards.length} AVAILABLE
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-[#1E1815] leading-snug">
                          Redeem visit offer
                        </h3>
                        <p className="text-[11px] text-[#7A6E67] font-medium mt-1">
                          Unlocked member vouchers & gifts
                        </p>
                      </div>
                      {outletActionMode === "reward" && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#801313]" />
                      )}
                    </button>
                  </div>

                  {/* ACTION PANEL 1: GIVE POINTS */}
                  {outletActionMode === "points" && (
                    <div className="pt-2 animate-in fade-in duration-200">
                      {!outletSuccessReceipt ? (
                        <div className="p-6 rounded-3xl bg-[#FAF7F4] border border-[#EAE3DC] space-y-5">
                          <div>
                            <h4 className="font-extrabold text-base text-[#1E1815]">Give Loyalty Points on Dine-in Bill</h4>
                            <p className="text-xs text-[#7A6E67] mt-0.5">
                              Enter invoice # and bill amount to award points and stamp visit.
                            </p>
                          </div>

                          <form onSubmit={handleAdminRecordSale} className="space-y-4 pt-2 border-t border-[#EAE3DC]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-black text-[#1E1815] mb-2" htmlFor="admin-inv-input">
                                  Invoice / Receipt #
                                </label>
                                <input
                                  id="admin-inv-input"
                                  type="text"
                                  placeholder="E.G. INV-10982"
                                  value={outletInvoiceNumber}
                                  onChange={(e) => setOutletInvoiceNumber(e.target.value.toUpperCase())}
                                  required
                                  className="w-full px-4 py-3.5 bg-white border border-[#EAE3DC] rounded-xl font-mono text-sm font-bold text-[#1E1815] uppercase placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#801313] shadow-2xs"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-black text-[#1E1815] mb-2" htmlFor="admin-amount-input">
                                  Bill Amount ({outletLoyaltyRules.currency})
                                </label>
                                <input
                                  id="admin-amount-input"
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  placeholder="0.00"
                                  value={outletBillAmount}
                                  onChange={(e) => setOutletBillAmount(e.target.value)}
                                  required
                                  className="w-full px-4 py-3.5 bg-white border border-[#EAE3DC] rounded-xl text-base font-bold text-[#1E1815] placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#801313] shadow-2xs"
                                />
                              </div>
                            </div>

                            <div className="text-[11px] text-[#7A6E67] font-medium leading-relaxed">
                              {outletLoyaltyRules.currency} {outletLoyaltyRules.spendAedForPoints} = {outletLoyaltyRules.pointsEarnedPerSpend} point(s). Minimum spend {outletLoyaltyRules.currency} 1. Duplicate invoices are blocked.
                            </div>

                            {/* Dynamic Points Calculation Breakdown */}
                            {outletParsedAmount > 0 && (
                              <div className="p-4 rounded-2xl bg-white border border-[#EAE3DC] space-y-2 text-xs shadow-2xs">
                                <div className="flex justify-between items-center text-[#7A6E67]">
                                  <span>Gross Bill Amount:</span>
                                  <span className="font-bold text-[#1E1815]">
                                    {outletLoyaltyRules.currency} {outletParsedAmount.toFixed(2)}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center text-emerald-800 font-medium">
                                  <span>Points Calculation ({outletLoyaltyRules.currency} {outletLoyaltyRules.spendAedForPoints} = {outletLoyaltyRules.pointsEarnedPerSpend} pt):</span>
                                  <span className="font-mono text-emerald-700 font-extrabold text-sm">+{outletEstimatedPointsToEarn} pts</span>
                                </div>

                                <div className="flex justify-between items-center text-blue-900 font-medium">
                                  <span>Visit Stamp:</span>
                                  <span className="font-bold font-mono text-blue-700">+1 visit</span>
                                </div>

                                <div className="pt-2 border-t border-[#EAE3DC] flex justify-between items-center">
                                  <span className="font-bold text-[#1E1815]">Customer New Total Balance:</span>
                                  <span className="font-black font-mono text-base text-[#801313]">
                                    {outletCustomer.pointsBalance + outletEstimatedPointsToEarn} pts
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Auto Visit Notice */}
                            <div className="p-3.5 rounded-xl bg-white border border-[#EAE3DC] flex items-center justify-between text-xs font-medium text-[#7A6E67]">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>
                                  Recording this bill will automatically credit <strong className="text-[#1E1815]">+{outletEstimatedPointsToEarn} points</strong> and stamp <strong className="text-[#1E1815]">+1 visit</strong> for {outletCustomer.name}.
                                </span>
                              </div>
                            </div>

                            {outletBillErr && (
                              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                                <span>{outletBillErr}</span>
                              </div>
                            )}

                            <div className="flex gap-3 pt-2">
                              <button
                                type="submit"
                                disabled={outletSubmittingBill || !outletInvoiceNumber.trim() || !outletBillAmount.trim()}
                                className="flex-1 py-4 px-6 rounded-xl bg-[#681421] hover:bg-[#520F1A] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {outletSubmittingBill ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>RECORDING TRANSACTION…</span>
                                  </>
                                ) : (
                                  <>
                                    <DollarSign className="w-4 h-4" />
                                    <span>RECORD SALE &amp; AWARD POINTS</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        /* Success Receipt Modal */
                        <div className="p-7 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-5 animate-in fade-in zoom-in duration-200">
                          <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                            <Check className="w-7 h-7 stroke-[3]" />
                          </div>
                          <div>
                            <h3 className="font-serif font-black text-2xl text-emerald-950">Sale &amp; Points Succeeded!</h3>
                            <p className="text-xs text-emerald-800 font-medium mt-1">
                              Invoice #{outletSuccessReceipt.transaction?.invoiceNumber} recorded successfully.
                            </p>
                          </div>

                          <div className="max-w-sm mx-auto bg-white rounded-2xl p-4.5 border border-emerald-200 text-xs text-left space-y-2 font-medium shadow-sm">
                            <div className="flex justify-between">
                              <span className="text-[#7A6E67]">Gross Bill:</span>
                              <span className="font-bold">{outletLoyaltyRules.currency} {Number(outletSuccessReceipt.transaction?.amount || 0).toFixed(2)}</span>
                            </div>

                            {outletSuccessReceipt.transaction?.discountGiven > 0 && (
                              <div className="flex justify-between text-red-700">
                                <span>Total Discount:</span>
                                <span className="font-bold font-mono">-{outletLoyaltyRules.currency} {Number(outletSuccessReceipt.transaction.discountGiven).toFixed(2)}</span>
                              </div>
                            )}

                            {outletSuccessReceipt.pointsRedeemed && (
                              <div className="flex justify-between text-red-700">
                                <span>Points Redeemed:</span>
                                <span className="font-bold font-mono">-{outletSuccessReceipt.pointsRedeemed.points} pts</span>
                              </div>
                            )}

                            <div className="flex justify-between text-emerald-800">
                              <span>Points Awarded:</span>
                              <span className="font-black font-mono">+{outletSuccessReceipt.transaction?.pointsEarned || 0} pts</span>
                            </div>

                            <div className="flex justify-between text-blue-800">
                              <span>Visit Count:</span>
                              <span className="font-black font-mono">Visit #{outletSuccessReceipt.customer?.visitCount} (Stamped)</span>
                            </div>

                            <div className="flex justify-between pt-2 border-t border-[#EAE3DC]">
                              <span className="text-[#7A6E67]">Customer New Balance:</span>
                              <span className="font-black text-sm text-[#801313] font-mono">{outletSuccessReceipt.customer?.pointsBalance} pts</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setOutletCustomer(null);
                              setOutletSuccessReceipt(null);
                              setOutletMobileInput("");
                              setOutletQrInput("");
                            }}
                            className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-xl bg-[#681421] hover:bg-[#520F1A] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer"
                          >
                            NEXT CUSTOMER
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ACTION PANEL 2: REDEEM POINTS FOR CASH DISCOUNT */}
                  {outletActionMode === "redeem_points" && (
                    <div className="pt-2 animate-in fade-in duration-200">
                      {!outletSuccessReceipt ? (
                        <div className="p-6 rounded-3xl bg-[#FFFBF0] border border-[#E5A93C]/40 space-y-5">
                          <div className="flex items-center justify-between pb-3 border-b border-[#E5A93C]/30">
                            <div className="flex items-center gap-2.5">
                              <Coins className="w-6 h-6 text-[#C68A1E]" />
                              <div>
                                <h4 className="font-extrabold text-base text-[#1E1815]">Redeem Points for Direct Cash Discount</h4>
                                <p className="text-xs text-[#7A6E67] font-medium">
                                  Customer currently has <strong className="text-[#801313] font-bold">{outletCustomer.pointsBalance} points</strong> available.
                                </p>
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-lg bg-[#E5A93C]/20 text-[#801313] text-xs font-black">
                              {outletLoyaltyRules.pointsRequiredForRedemption} pts = {outletLoyaltyRules.currency} {outletLoyaltyRules.currencyValuePerRedemptionPoints} off
                            </span>
                          </div>

                          {outletCustomer.pointsBalance >= outletLoyaltyRules.pointsRequiredForRedemption ? (
                            <form onSubmit={handleAdminRecordSale} className="space-y-4">
                              <div>
                                <label className="block text-xs font-bold text-[#1E1815] mb-2">
                                  Select Points to Redeem:
                                </label>
                                <div className="flex flex-wrap items-center gap-2">
                                  {[100, 200, 500].map((pts) => {
                                    if (outletCustomer.pointsBalance < pts) return null;
                                    const isSelected = outletPointsToRedeem === pts;
                                    const offVal = ((pts / outletLoyaltyRules.pointsRequiredForRedemption) * outletLoyaltyRules.currencyValuePerRedemptionPoints).toFixed(2);
                                    return (
                                      <button
                                        key={pts}
                                        type="button"
                                        onClick={() => {
                                          setOutletPointsToRedeem(isSelected ? 0 : pts);
                                          setOutletCustomRedeem("");
                                        }}
                                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isSelected
                                            ? "bg-[#801313] text-white border-[#801313] shadow-xs ring-2 ring-[#801313]/20"
                                            : "bg-white text-[#1E1815] border-[#EAE3DC] hover:border-[#801313]"
                                          }`}
                                      >
                                        {pts} pts (-{outletLoyaltyRules.currency} {offVal})
                                      </button>
                                    );
                                  })}

                                  {/* Redeem Max Available */}
                                  {(() => {
                                    const maxUnits = Math.floor(outletCustomer.pointsBalance / outletLoyaltyRules.pointsRequiredForRedemption);
                                    const maxPts = maxUnits * outletLoyaltyRules.pointsRequiredForRedemption;
                                    if (maxPts <= 0) return null;
                                    const isMaxSelected = outletPointsToRedeem === maxPts;
                                    const maxOff = ((maxPts / outletLoyaltyRules.pointsRequiredForRedemption) * outletLoyaltyRules.currencyValuePerRedemptionPoints).toFixed(2);
                                    return (
                                      <button
                                        key="max"
                                        type="button"
                                        onClick={() => {
                                          setOutletPointsToRedeem(isMaxSelected ? 0 : maxPts);
                                          setOutletCustomRedeem("");
                                        }}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${isMaxSelected
                                            ? "bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-700/20"
                                            : "bg-white text-[#801313] border-[#EAE3DC] hover:border-[#801313]"
                                          }`}
                                      >
                                        Redeem Max ({maxPts} pts = -{outletLoyaltyRules.currency} {maxOff})
                                      </button>
                                    );
                                  })()}

                                  {outletPointsToRedeem > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOutletPointsToRedeem(0);
                                        setOutletCustomRedeem("");
                                      }}
                                      className="px-3 py-2 rounded-xl text-xs font-bold text-[#7A6E67] hover:text-red-700 cursor-pointer"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Custom Points Input */}
                              <div className="flex items-center gap-2 pt-2">
                                <label className="text-xs text-[#7A6E67] font-semibold shrink-0">Custom Points:</label>
                                <input
                                  type="number"
                                  step={outletLoyaltyRules.pointsRequiredForRedemption}
                                  max={outletCustomer.pointsBalance}
                                  min={0}
                                  placeholder={`Multiples of ${outletLoyaltyRules.pointsRequiredForRedemption}`}
                                  value={outletCustomRedeem}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setOutletCustomRedeem(v);
                                    const num = parseInt(v) || 0;
                                    if (num <= outletCustomer.pointsBalance && num >= 0) {
                                      setOutletPointsToRedeem(num);
                                    }
                                  }}
                                  className="w-48 px-3.5 py-2 bg-white border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1E1815] focus:outline-none focus:border-[#801313]"
                                />
                                {outletPointsToRedeem > 0 && (
                                  <span className="text-xs font-bold text-emerald-800">
                                    = -{outletLoyaltyRules.currency} {outletDirectPointsDiscount.toFixed(2)} discount
                                  </span>
                                )}
                              </div>

                              {/* Bill inputs */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E5A93C]/30">
                                <div>
                                  <label className="block text-xs font-black text-[#1E1815] mb-2" htmlFor="admin-redeem-inv-input">
                                    Invoice / Receipt #
                                  </label>
                                  <input
                                    id="admin-redeem-inv-input"
                                    type="text"
                                    placeholder="E.G. INV-10982"
                                    value={outletInvoiceNumber}
                                    onChange={(e) => setOutletInvoiceNumber(e.target.value.toUpperCase())}
                                    required
                                    className="w-full px-4 py-3 bg-white border border-[#EAE3DC] rounded-xl font-mono text-sm font-bold text-[#1E1815] uppercase placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#801313] shadow-2xs"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-black text-[#1E1815] mb-2" htmlFor="admin-redeem-amount-input">
                                    Gross Bill Amount ({outletLoyaltyRules.currency})
                                  </label>
                                  <input
                                    id="admin-redeem-amount-input"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="0.00"
                                    value={outletBillAmount}
                                    onChange={(e) => setOutletBillAmount(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white border border-[#EAE3DC] rounded-xl text-base font-bold text-[#1E1815] placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#801313] shadow-2xs"
                                  />
                                </div>
                              </div>

                              {/* Calculation Breakdown Summary */}
                              {outletParsedAmount > 0 && (
                                <div className="p-4 rounded-2xl bg-white border border-[#EAE3DC] space-y-2 text-xs">
                                  <div className="flex justify-between items-center text-[#7A6E67]">
                                    <span>Gross Bill Amount:</span>
                                    <span className="font-bold text-[#1E1815]">{outletLoyaltyRules.currency} {outletParsedAmount.toFixed(2)}</span>
                                  </div>

                                  {outletDirectPointsDiscount > 0 && (
                                    <div className="flex justify-between items-center text-red-700">
                                      <span>Points Redeemed ({outletPointsToRedeem} pts):</span>
                                      <span className="font-bold font-mono">-{outletLoyaltyRules.currency} {outletDirectPointsDiscount.toFixed(2)}</span>
                                    </div>
                                  )}

                                  <div className="flex justify-between items-center text-emerald-800">
                                    <span>Points Customer Will Earn on Bill:</span>
                                    <span className="font-black font-mono">+{outletEstimatedPointsToEarn} pts</span>
                                  </div>

                                  <div className="pt-2 border-t border-[#EAE3DC] flex justify-between items-center">
                                    <span className="font-black text-sm text-[#1E1815]">Net Payable by Customer:</span>
                                    <span className="font-black text-base text-[#801313] font-mono">
                                      {outletLoyaltyRules.currency} {outletNetPayable.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {outletBillErr && (
                                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                                  <span>{outletBillErr}</span>
                                </div>
                              )}

                              <button
                                type="submit"
                                disabled={outletSubmittingBill || !outletInvoiceNumber.trim() || !outletBillAmount.trim() || outletPointsToRedeem <= 0}
                                className="w-full py-4 px-6 rounded-xl bg-[#681421] hover:bg-[#520F1A] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {outletSubmittingBill ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>REDEEMING POINTS…</span>
                                  </>
                                ) : (
                                  <>
                                    <Coins className="w-4 h-4" />
                                    <span>CONFIRM POINT REDEMPTION ({outletPointsToRedeem} PTS = -{outletLoyaltyRules.currency} {outletDirectPointsDiscount.toFixed(2)})</span>
                                  </>
                                )}
                              </button>
                            </form>
                          ) : (
                            <div className="p-4.5 rounded-2xl bg-white border border-[#EAE3DC] text-center sm:text-left space-y-1">
                              <div className="font-bold text-xs text-[#1E1815]">
                                Points Threshold Not Reached
                              </div>
                              <p className="text-xs text-[#7A6E67]">
                                Customer currently has <strong className="text-[#801313]">{outletCustomer.pointsBalance} points</strong>. A minimum of <strong className="text-[#1E1815]">{outletLoyaltyRules.pointsRequiredForRedemption} points</strong> is required to unlock direct bill cash discount redemption.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Success Receipt Modal */
                        <div className="p-7 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-5 animate-in fade-in zoom-in duration-200">
                          <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                            <Check className="w-7 h-7 stroke-[3]" />
                          </div>
                          <div>
                            <h3 className="font-serif font-black text-2xl text-emerald-950">Sale &amp; Points Succeeded!</h3>
                            <p className="text-xs text-emerald-800 font-medium mt-1">
                              Invoice #{outletSuccessReceipt.transaction?.invoiceNumber} recorded successfully.
                            </p>
                          </div>

                          <div className="max-w-sm mx-auto bg-white rounded-2xl p-4.5 border border-emerald-200 text-xs text-left space-y-2 font-medium shadow-sm">
                            <div className="flex justify-between">
                              <span className="text-[#7A6E67]">Gross Bill:</span>
                              <span className="font-bold">{outletLoyaltyRules.currency} {Number(outletSuccessReceipt.transaction?.amount || 0).toFixed(2)}</span>
                            </div>

                            {outletSuccessReceipt.transaction?.discountGiven > 0 && (
                              <div className="flex justify-between text-red-700">
                                <span>Total Discount:</span>
                                <span className="font-bold font-mono">-{outletLoyaltyRules.currency} {Number(outletSuccessReceipt.transaction.discountGiven).toFixed(2)}</span>
                              </div>
                            )}

                            {outletSuccessReceipt.pointsRedeemed && (
                              <div className="flex justify-between text-red-700">
                                <span>Points Redeemed:</span>
                                <span className="font-bold font-mono">-{outletSuccessReceipt.pointsRedeemed.points} pts</span>
                              </div>
                            )}

                            <div className="flex justify-between text-emerald-800">
                              <span>Points Awarded:</span>
                              <span className="font-black font-mono">+{outletSuccessReceipt.transaction?.pointsEarned || 0} pts</span>
                            </div>

                            <div className="flex justify-between text-blue-800">
                              <span>Visit Count:</span>
                              <span className="font-black font-mono">Visit #{outletSuccessReceipt.customer?.visitCount} (Stamped)</span>
                            </div>

                            <div className="flex justify-between pt-2 border-t border-[#EAE3DC]">
                              <span className="text-[#7A6E67]">Customer New Balance:</span>
                              <span className="font-black text-sm text-[#801313] font-mono">{outletSuccessReceipt.customer?.pointsBalance} pts</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setOutletCustomer(null);
                              setOutletSuccessReceipt(null);
                              setOutletMobileInput("");
                              setOutletQrInput("");
                            }}
                            className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-xl bg-[#681421] hover:bg-[#520F1A] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer"
                          >
                            NEXT CUSTOMER
                          </button>
                        </div>
                      )}
                    </div>
                  )}



                  {/* ACTION PANEL 3: REDEEM VISIT OFFER */}
                  {outletActionMode === "reward" && (
                    <div className="pt-2 animate-in fade-in duration-200 space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-black tracking-wider uppercase text-[#801313] flex items-center gap-2">
                          <Gift className="w-4 h-4 text-[#801313]" />
                          <span>UNLOCKED VISIT OFFERS &amp; MEMBER GIFTS</span>
                        </div>
                        <span className="text-xs font-bold text-[#7A6E67]">
                          {outletAvailableRewards.length} Offer{outletAvailableRewards.length !== 1 ? "s" : ""} Available
                        </span>
                      </div>

                      {outletRewardSuccessReceipt && (
                        <div className="p-4.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between text-xs font-medium animate-in fade-in">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <strong>{outletRewardSuccessReceipt.message}</strong>
                              <div className="text-[11px] text-emerald-800 mt-0.5">
                                Gift handed over to customer. Updated balance: {outletRewardSuccessReceipt.customer?.pointsBalance} pts.
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setOutletRewardSuccessReceipt(null)}
                            className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {outletRewardErr && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>{outletRewardErr}</span>
                        </div>
                      )}

                      {outletAvailableRewards.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {outletAvailableRewards.map((reward) => {
                            const isBusy = outletRedeemingRewardId === reward.id;
                            return (
                              <div
                                key={reward.id}
                                className="p-4.5 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] flex flex-col justify-between gap-3.5 shadow-2xs hover:border-[#801313]/40 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-extrabold text-sm text-[#1E1815]">{reward.name}</h4>
                                    </div>
                                    {reward.description && (
                                      <p className="text-xs text-[#7A6E67] font-medium mt-1">
                                        {reward.description}
                                      </p>
                                    )}
                                    <div className="text-[11px] text-[#801313] font-bold mt-1">
                                      {reward.isPercent
                                        ? `${reward.value}% Discount Offer`
                                        : reward.value > 0
                                          ? `${outletLoyaltyRules.currency} ${reward.value} Value`
                                          : "Complimentary Item / Milestone Gift"}
                                    </div>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase shrink-0">
                                    READY
                                  </span>
                                </div>

                                <div className="pt-2 border-t border-[#EAE3DC] flex items-center justify-between">
                                  <span className="text-[10px] text-[#7A6E67] font-mono">
                                    {reward.expiresAt ? `Valid till ${new Date(reward.expiresAt).toLocaleDateString()}` : "No expiry date"}
                                  </span>

                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleAdminRedeemReward(reward.id)}
                                    className="px-4 py-2 rounded-xl bg-[#681421] hover:bg-[#520F1A] text-white font-black text-xs uppercase tracking-wider shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                  >
                                    {isBusy ? (
                                      <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>REDEEMING…</span>
                                      </>
                                    ) : (
                                      <>
                                        <Gift className="w-3.5 h-3.5" />
                                        <span>REDEEM &amp; DELIVER</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 rounded-3xl bg-[#FAF7F4] border border-[#EAE3DC] text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-white border border-[#EAE3DC] flex items-center justify-center mx-auto text-[#7A6E67]">
                            <Gift className="w-6 h-6 text-[#7A6E67]" />
                          </div>
                          <div className="font-bold text-sm text-[#1E1815]">No Unlocked Visit Offers Available</div>
                          <p className="text-xs text-[#7A6E67] max-w-sm mx-auto">
                            {outletCustomer.name} currently has no pending visit-path gifts or vouchers. Giving visits or points will unlock upcoming tier treats!
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer Recent Visits */}
                  {outletRecentTransactions.length > 0 && (
                    <div className="pt-4 border-t border-[#EAE3DC]">
                      <div className="text-xs font-black uppercase tracking-wider text-[#7A6E67] mb-2.5 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" />
                        <span>Customer Recent Visits &amp; Transactions</span>
                      </div>
                      <div className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto pr-1">
                        {outletRecentTransactions.slice(0, 10).map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setAdminSelectedReceipt(t)}
                            className="p-3.5 rounded-xl bg-[#FAF7F4] hover:bg-[#F3EDE6] border border-[#EAE3DC] hover:border-[#D6CCC2] flex items-center justify-between text-xs gap-3 cursor-pointer transition-all active:scale-[0.99] group"
                            role="button"
                            tabIndex={0}
                            title="Click to view detailed receipt breakdown"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-[#1E1815] group-hover:text-[#801313] transition-colors flex items-center gap-1.5 flex-wrap">
                                <span>{t.branchName || "Branch Visit"}</span>
                                <span className="font-mono text-[11px] text-[#7A6E67]">#{t.invoiceNumber}</span>
                                <span className="text-[10px] text-[#A0938C] font-normal group-hover:text-[#801313]">›</span>
                              </div>
                              <div className="text-[10px] text-[#7A6E67] mt-0.5 flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-[#A0938C]" />
                                <span>
                                  {new Date(t.createdAt).toLocaleString("en-US", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                              {t.discountGiven > 0 && (
                                <div className="text-[11px] font-bold text-red-700 font-mono mt-1 flex items-center gap-1 flex-wrap">
                                  <span>Discount: -{outletLoyaltyRules.currency} {Number(t.discountGiven).toFixed(2)}</span>
                                  {t.redeemedRewards && t.redeemedRewards.length > 0 && (
                                    <span className="text-[#801313] font-sans text-[10px]">({t.redeemedRewards.join(", ")})</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-black text-[#1E1815]">{outletLoyaltyRules.currency} {Number(t.amount || 0).toFixed(2)}</div>
                              {t.pointsEarned > 0 && (
                                <div className="text-[10px] font-bold text-emerald-700">+{t.pointsEarned} pts</div>
                              )}
                              {t.pointsRedeemed > 0 && (
                                <div className="text-[10px] font-bold text-red-700">-{t.pointsRedeemed} pts</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Outlet Receipt Details Modal */}
              {adminSelectedReceipt && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-emerald-200 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200 relative">
                    {/* Close Button */}
                    <button
                      onClick={() => setAdminSelectedReceipt(null)}
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
                      <h3 className="font-serif font-black text-2xl text-emerald-950">Sale &amp; Points Receipt</h3>
                      <p className="text-xs text-emerald-800 font-medium mt-1">
                        Invoice #{adminSelectedReceipt.invoiceNumber} recorded at {adminSelectedReceipt.branchName || "Outlet"}.
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-900 text-[11px] font-medium mt-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>
                          {new Date(adminSelectedReceipt.createdAt).toLocaleString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Card */}
                    <div className="bg-[#FAF7F4] rounded-2xl p-4.5 border border-emerald-200/80 text-xs text-left space-y-2.5 font-medium shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[#7A6E67]">Gross Bill:</span>
                        <span className="font-bold text-[#1E1815] font-mono">
                          {outletLoyaltyRules.currency} {Number(adminSelectedReceipt.grossBill ?? adminSelectedReceipt.amount ?? 0).toFixed(2)}
                        </span>
                      </div>

                      {Number(adminSelectedReceipt.discountGiven || 0) > 0 && (
                        <div className="flex justify-between items-start text-red-700">
                          <span>
                            Total Discount:
                            {adminSelectedReceipt.redeemedRewards && adminSelectedReceipt.redeemedRewards.length > 0 && (
                              <span className="block text-[10px] text-red-600 font-normal">
                                ({adminSelectedReceipt.redeemedRewards.join(", ")})
                              </span>
                            )}
                          </span>
                          <span className="font-bold font-mono">
                            -{outletLoyaltyRules.currency} {Number(adminSelectedReceipt.discountGiven).toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[#1E1815] pt-1.5 border-t border-[#EAE3DC]">
                        <span className="font-black text-xs text-[#801313]">Customer Paid (Net):</span>
                        <span className="font-black text-sm text-[#801313] font-mono">
                          {outletLoyaltyRules.currency} {Number(
                            adminSelectedReceipt.amountPaid ??
                            Math.max(0, Number(adminSelectedReceipt.amount || 0) - Number(adminSelectedReceipt.discountGiven || 0))
                          ).toFixed(2)}
                        </span>
                      </div>

                      {Number(adminSelectedReceipt.pointsRedeemed || 0) > 0 && (
                        <div className="flex justify-between items-center text-red-700 pt-1.5 border-t border-[#EAE3DC]/60">
                          <span>Points Redeemed:</span>
                          <span className="font-bold font-mono">-{adminSelectedReceipt.pointsRedeemed} pts</span>
                        </div>
                      )}

                      {Number(adminSelectedReceipt.pointsEarned || 0) > 0 && (
                        <div className="flex justify-between items-center text-emerald-800">
                          <span>Points Awarded:</span>
                          <span className="font-black font-mono">+{adminSelectedReceipt.pointsEarned} pts</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-blue-800 pt-1.5 border-t border-[#EAE3DC]/60">
                        <span>Transaction Status:</span>
                        <span className="font-black font-mono">Completed &amp; Stamped ✓</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setAdminSelectedReceipt(null)}
                      className="w-full py-3 px-6 rounded-xl bg-[#681421] hover:bg-[#520F1A] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer"
                    >
                      CLOSE RECEIPT
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

          {/* ============================================================== */}
          {/* TAB 6: PROGRAM SETTINGS & CONVERSION CALCULATOR                */}
          {/* ============================================================== */}
          {tab === "settings" && (
            <div className="space-y-6">
              {settingsMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${settingsMsg.type === "ok"
                    ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                    : "bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/30"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{settingsMsg.text}</span>
                  </div>
                  <button onClick={() => setSettingsMsg(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Settings Category Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-[#EAE3DC] pb-3">
                <button
                  type="button"
                  onClick={() => setSettingsCategory("general")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${settingsCategory === "general"
                    ? "bg-[#C0392B] text-white shadow-md shadow-[#C0392B]/20"
                    : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  ⚙️ General Settings
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsCategory("loyalty")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${settingsCategory === "loyalty"
                    ? "bg-[#C0392B] text-white shadow-md shadow-[#C0392B]/20"
                    : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  🪙 Loyalty & Points Engine
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsCategory("security")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${settingsCategory === "security"
                    ? "bg-[#C0392B] text-white shadow-md shadow-[#C0392B]/20"
                    : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  🛡️ Security & Anti-Fraud
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsCategory("password")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${settingsCategory === "password"
                    ? "bg-[#C0392B] text-white shadow-md shadow-[#C0392B]/20"
                    : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  🔑 Admin PIN & Password
                </button>
              </div>

              {/* ========================================================= */}
              {/* TAB CONTENT: ADMIN PIN / PASSWORD UPDATE                 */}
              {/* ========================================================= */}
              {settingsCategory === "password" && (
                <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C0392B] to-[#96291D] flex items-center justify-center font-bold text-white shadow-md shadow-[#C0392B]/30 shrink-0">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight text-[#1E1815] flex items-center gap-2">
                          <span>Admin Security PIN & Login Access</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 text-[10px] font-black uppercase tracking-wider">
                            scrypt Hashed
                          </span>
                        </h3>
                        <p className="text-xs text-[#7A6E67] mt-0.5">
                          Update the master administrative PIN code used to access the executive dashboard.
                        </p>
                      </div>
                    </div>
                  </div>

                  {pinMsg && (
                    <div
                      className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${pinMsg.type === "ok"
                        ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                        : "bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/30"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {pinMsg.type === "ok" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{pinMsg.text}</span>
                      </div>
                      <button onClick={() => setPinMsg(null)}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleUpdatePin} className="max-w-xl space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5" htmlFor="currPin">
                        Current Master PIN *
                      </label>
                      <div className="relative">
                        <input
                          id="currPin"
                          type="password"
                          inputMode="numeric"
                          required
                          value={pinForm.currentPin}
                          onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value })}
                          placeholder="Enter your current 6-digit PIN"
                          className="w-full px-4 py-3 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-mono tracking-widest text-sm focus:outline-none focus:border-[#C0392B]"
                        />
                        <Lock className="w-4 h-4 text-[#8C7F78] absolute right-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5" htmlFor="nPin">
                          New Security PIN *
                        </label>
                        <div className="relative">
                          <input
                            id="nPin"
                            type="password"
                            inputMode="numeric"
                            required
                            minLength={4}
                            value={pinForm.newPin}
                            onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
                            placeholder="Min 4 digits"
                            className="w-full px-4 py-3 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-mono tracking-widest text-sm focus:outline-none focus:border-[#C0392B]"
                          />
                          <Key className="w-4 h-4 text-[#8C7F78] absolute right-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5" htmlFor="cPin">
                          Confirm New PIN *
                        </label>
                        <div className="relative">
                          <input
                            id="cPin"
                            type="password"
                            inputMode="numeric"
                            required
                            minLength={4}
                            value={pinForm.confirmPin}
                            onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                            placeholder="Re-enter new PIN"
                            className="w-full px-4 py-3 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-mono tracking-widest text-sm focus:outline-none focus:border-[#C0392B]"
                          />
                          <Key className="w-4 h-4 text-[#8C7F78] absolute right-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#FAF7F4] border border-[#EFE8E1] rounded-2xl text-xs text-[#7A6E67] leading-relaxed space-y-1">
                      <div className="font-bold text-[#1E1815] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#1E7A4D]" />
                        <span>Security Policy & Audit Protection</span>
                      </div>
                      <p>
                        Your PIN is protected with high-workfactor cryptographic hashing. Changing your PIN will create an immutable audit record and require this new PIN for future executive logins.
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={pinSaving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{pinSaving ? "Updating PIN…" : "Update Security PIN"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ========================================================= */}
              {/* HERO: INTERACTIVE LOYALTY POINTS & AED CONVERSION CALCULATOR */}
              {/* ========================================================= */}
              {settingsCategory === "loyalty" && (
                <div className="bg-white text-[#1E1815] rounded-3xl p-6 sm:p-7 border border-[#EAE3DC] shadow-sm relative overflow-hidden space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C0392B] to-[#96291D] flex items-center justify-center font-bold text-white shadow-md shadow-[#C0392B]/30 shrink-0">
                        <Calculator className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight text-[#1E1815] flex items-center gap-2">
                          <span>Loyalty Points & AED Conversion Engine</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#C68A1E]/15 text-[#9E690B] border border-[#C68A1E]/30 text-[10px] font-black uppercase tracking-wider">
                            Live Calculator
                          </span>
                        </h3>
                        <p className="text-xs text-[#7A6E67] mt-0.5">
                          Configure how many AED earn loyalty points and how many points equal AED cash discount value.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC] font-mono text-[#4A3F39]">
                        Effective Cashback: <strong className="text-[#1E7A4D] font-black text-sm">{cashbackPercent}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* Dual Rules Configuration Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Rule 1: AED to Points (Earning) */}
                    <div className="bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-[#C68A1E]" />
                          <h4 className="font-extrabold text-sm text-[#1E1815]">1. Earning Rule (AED ➔ Points)</h4>
                        </div>
                        <span className="text-[10px] font-black text-[#C68A1E] uppercase tracking-wider bg-[#C68A1E]/10 px-2.5 py-0.5 rounded-full border border-[#C68A1E]/20">
                          Bill Checkout
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6E67] mb-1">
                            Every (Spend Amount)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={settingsForm.spend_aed_for_points ?? "10"}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, spend_aed_for_points: e.target.value })
                              }
                              className="w-full px-3 py-2.5 bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-black text-sm focus:outline-none focus:border-[#C0392B]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              {cur}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6E67] mb-1">
                            Awards (Points)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={settingsForm.points_earned_per_spend ?? "1"}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, points_earned_per_spend: e.target.value })
                              }
                              className="w-full px-3 py-2.5 bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-black text-sm focus:outline-none focus:border-[#C0392B]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              pts
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rule Summary & Quick Presets */}
                      <div className="pt-2 border-t border-[#EAE3DC] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-[#7A6E67] text-[11px]">
                          Rate: <strong className="text-[#1E1815]">{(pointsPerSpend / spendStep).toFixed(2)} pts per 1 {cur}</strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({ ...settingsForm, spend_aed_for_points: "10", points_earned_per_spend: "1" })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#DCD3CB] hover:bg-[#FAF7F4] text-[10px] text-[#4A3F39] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            10 AED = 1 pt
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({ ...settingsForm, spend_aed_for_points: "1", points_earned_per_spend: "1" })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#DCD3CB] hover:bg-[#FAF7F4] text-[10px] text-[#4A3F39] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            1 AED = 1 pt
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Rule 2: Points to AED (Redemption) */}
                    <div className="bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-[#1E7A4D]" />
                          <h4 className="font-extrabold text-sm text-[#1E1815]">2. Redemption Rule (Points ➔ AED)</h4>
                        </div>
                        <span className="text-[10px] font-black text-[#1E7A4D] uppercase tracking-wider bg-[#1E7A4D]/10 px-2.5 py-0.5 rounded-full border border-[#1E7A4D]/20">
                          Wallet Discount
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6E67] mb-1">
                            Every (Points)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={settingsForm.points_required_for_redemption ?? "100"}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, points_required_for_redemption: e.target.value })
                              }
                              className="w-full px-3 py-2.5 bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-black text-sm focus:outline-none focus:border-[#C0392B]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              pts
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6E67] mb-1">
                            Is Worth ({cur} Discount)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0.1"
                              step="0.5"
                              value={settingsForm.currency_value_per_redemption_points ?? "5"}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, currency_value_per_redemption_points: e.target.value })
                              }
                              className="w-full px-3 py-2.5 bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-black text-sm focus:outline-none focus:border-[#C0392B]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              {cur}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rule Summary & Quick Presets */}
                      <div className="pt-2 border-t border-[#EAE3DC] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-[#7A6E67] text-[11px]">
                          Unit Value: <strong className="text-[#1E1815]">1 pt = {singlePointAedVal} {cur} ({singlePointFils} Fils)</strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({ ...settingsForm, points_required_for_redemption: "100", currency_value_per_redemption_points: "5" })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#DCD3CB] hover:bg-[#FAF7F4] text-[10px] text-[#4A3F39] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            100 pts = 5 AED
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({ ...settingsForm, points_required_for_redemption: "100", currency_value_per_redemption_points: "10" })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#DCD3CB] hover:bg-[#FAF7F4] text-[10px] text-[#4A3F39] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            100 pts = 10 AED
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* LIVE SIMULATOR SANDBOX TESTER                             */}
                  {/* ========================================================= */}
                  <div className="bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4 text-[#C0392B]" />
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#1E1815]">
                        Live Calculator Simulator & Scenario Tester
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Simulator 1: Spend Bill Test */}
                      <div className="p-4 rounded-xl bg-white border border-[#EAE3DC] flex flex-col justify-between space-y-3 shadow-2xs">
                        <div>
                          <label className="block text-[11px] font-bold text-[#7A6E67] uppercase mb-1">
                            Test Bill Amount:
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={simBillAmount}
                              onChange={(e) => setSimBillAmount(e.target.value)}
                              className="w-full px-3 py-2 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-bold text-sm focus:outline-none focus:border-[#C0392B]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              {cur}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-[#FAF7F4] border border-[#EAE3DC] flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#7A6E67]">Customer Receives:</span>
                          <span className="text-base font-black text-[#1E7A4D]">
                            +{calculatedPointsEarned} Points
                          </span>
                        </div>
                      </div>

                      {/* Simulator 2: Wallet Redemption Test */}
                      <div className="p-4 rounded-xl bg-white border border-[#EAE3DC] flex flex-col justify-between space-y-3 shadow-2xs">
                        <div>
                          <label className="block text-[11px] font-bold text-[#7A6E67] uppercase mb-1">
                            Test Member Points Balance:
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={simPointsBalance}
                              onChange={(e) => setSimPointsBalance(e.target.value)}
                              className="w-full px-3 py-2 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-bold text-sm focus:outline-none focus:border-[#C0392B]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              pts
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-[#FAF7F4] border border-[#EAE3DC] flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#7A6E67]">Wallet Cash Discount:</span>
                          <span className="text-base font-black text-[#C68A1E]">
                            {cur} {calculatedAedValue}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* VISIT MILESTONES & FREE REWARDS ENGINE                    */}
              {/* (Kitny visit pr kiya free mily ga - Admin Control)       */}
              {/* ========================================================= */}
              {settingsCategory === "loyalty" && (
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAE3DC] shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE3DC] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C0392B] to-[#96291D] flex items-center justify-center font-bold text-white shadow-md shadow-[#C0392B]/30 shrink-0">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight text-[#1E1815] flex items-center gap-2">
                          <span>Visit Milestone & Free Perks Engine</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 text-[10px] font-black uppercase tracking-wider">
                            {visitRewardsList.length} Milestones Configured
                          </span>
                        </h3>
                        <p className="text-xs text-[#7A6E67] mt-0.5">
                          Admin Rule: Kitny visit par customer ko kya free mily ga (Automated reward unlocks on dining check-in).
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={openCreateVisitReward}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Visit Milestone</span>
                    </button>
                  </div>

                  {visitRewardMsg && (
                    <div
                      className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between ${visitRewardMsg.type === "ok"
                          ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                          : "bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/30"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {visitRewardMsg.type === "ok" ? (
                          <Check className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{visitRewardMsg.text}</span>
                      </div>
                      <button onClick={() => setVisitRewardMsg(null)}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Milestone Cards Grid */}
                  {visitRewardsList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {visitRewardsList.map((reward, index) => (
                        <div
                          key={reward.id}
                          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${reward.isActive
                              ? "bg-[#FAF7F4] border-[#EAE3DC] shadow-2xs hover:shadow-md"
                              : "bg-[#F5F2EF]/60 border-[#E5DDD6] opacity-70"
                            }`}
                        >
                          {/* Top Badge & Actions */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] text-white font-black text-xs tracking-wider shadow-xs flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>{reward.threshold} VISITS</span>
                                </span>
                                <span className="text-[10px] font-bold text-[#7A6E67] uppercase tracking-wider">
                                  Tier #{index + 1}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditVisitReward(reward)}
                                  className="p-1.5 rounded-lg text-[#7A6E67] hover:text-[#1E1815] hover:bg-white transition-colors cursor-pointer"
                                  title="Edit Milestone"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteVisitReward(reward)}
                                  className="p-1.5 rounded-lg text-[#C0392B] hover:bg-[#C0392B]/10 transition-colors cursor-pointer"
                                  title="Delete Milestone"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h4 className="font-extrabold text-sm text-[#1E1815] mb-1">
                              {reward.name}
                            </h4>
                            {reward.nameAr && (
                              <div className="text-xs text-[#7A6E67] font-semibold mb-2" dir="rtl">
                                {reward.nameAr}
                              </div>
                            )}
                            <p className="text-xs text-[#7A6E67] leading-relaxed mb-4">
                              {reward.description || `Unlocked automatically when diner hits visit #${reward.threshold}.`}
                            </p>
                          </div>

                          {/* Bottom Meta & Status */}
                          <div className="pt-3 border-t border-[#EAE3DC] space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[#7A6E67] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#C68A1E]" />
                                <span>Valid for {reward.validDays || 30} days</span>
                              </span>
                              <span className="font-mono font-bold text-[#1E7A4D]">
                                {reward.claimCount || 0} Claimed
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-[#8C7F78] uppercase font-bold tracking-wider">
                                Status
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleVisitReward(reward)}
                                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-colors ${reward.isActive
                                    ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 hover:bg-[#1E7A4D]/20"
                                    : "bg-[#7A6E67]/10 text-[#7A6E67] border border-[#7A6E67]/20 hover:bg-[#7A6E67]/20"
                                  }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${reward.isActive ? "bg-[#1E7A4D]" : "bg-[#7A6E67]"
                                    }`}
                                />
                                <span>{reward.isActive ? "ACTIVE" : "PAUSED"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl p-6">
                      <Gift className="w-10 h-10 text-[#C0392B]/40 mx-auto mb-2" />
                      <h4 className="font-bold text-sm text-[#1E1815]">No Visit Milestone Rules Configured</h4>
                      <p className="text-xs text-[#7A6E67] max-w-md mx-auto mt-1 mb-4">
                        Create visit milestones (e.g. 5 visits = Free Drink, 10 visits = Free Dessert) so diners automatically unlock rewards upon dining!
                      </p>
                      <button
                        type="button"
                        onClick={openCreateVisitReward}
                        className="px-4 py-2 bg-[#C0392B] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer hover:bg-[#A83226]"
                      >
                        Create First Milestone Reward
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* General / Category Settings Form */}
              {settingsCategory !== "password" && (
                <form onSubmit={handleSaveSettings} className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
                    <h3 className="font-extrabold text-base text-[#1E1815]">
                      {settingsCategory === "general" && "⚙️ General App & Brand Parameters"}
                      {settingsCategory === "loyalty" && "🪙 Additional Loyalty Rules & Policies"}
                      {settingsCategory === "security" && "🛡️ Security & Anti-Fraud Thresholds"}
                    </h3>
                    <span className="text-xs text-[#7A6E67] font-semibold">{filteredSettings.length} Parameters</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredSettings.map((item) => (
                      <div
                        key={item.key}
                        className="p-4 rounded-2xl border border-[#EFE8E1] bg-[#FAF7F4] flex flex-col justify-between"
                      >
                        <div className="mb-3">
                          <label className="block text-xs font-bold text-[#1E1815] mb-1" htmlFor={item.key}>
                            {item.label}
                          </label>
                          <p className="text-[11px] text-[#7A6E67] leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <div>
                          <input
                            id={item.key}
                            type={item.type === "number" ? "number" : "text"}
                            value={settingsForm[item.key] ?? ""}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, [item.key]: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#C0392B]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#EAE3DC] flex items-center justify-between">
                    <div className="text-xs text-[#7A6E67]">
                      Changes will take effect immediately across all customer and staff apps.
                    </div>
                    <button
                      type="submit"
                      disabled={settingsSaving}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{settingsSaving ? "Saving Config…" : "Save Settings"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 7: SECURITY & AUDIT LOG                                    */}
          {/* ============================================================== */}
          {tab === "audit" && (
            <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-base text-[#1E1815]">Security Audit Log</h2>
                  <p className="text-xs text-[#7A6E67]">
                    Immutable audit trail of management logins, billings, reverse transactions, and branch updates.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] font-bold text-xs">
                  Encrypted Ledger
                </span>
              </div>

              <div className="divide-y divide-[#EFE8E1]">
                {audit?.logs && audit.logs.length > 0 ? (
                  audit.logs.map((l: any) => (
                    <div key={l.id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-bold text-xs text-[#1E1815] flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#FAF7F4] border border-[#EAE3DC] font-mono text-[10px]">
                            {l.action}
                          </span>
                          <span>{l.staff?.name || "System"}</span>
                        </div>
                        {l.reason && (
                          <div className="text-[11px] text-[#C0392B] font-medium mt-0.5">
                            Reason: {l.reason}
                          </div>
                        )}
                        {l.metadata && (
                          <pre className="text-[10px] text-[#7A6E67] font-mono mt-1 bg-[#FAF7F4] p-1.5 rounded-lg max-w-lg overflow-x-auto">
                            {JSON.stringify(l.metadata)}
                          </pre>
                        )}
                      </div>
                      <div className="text-[10px] text-[#7A6E67] font-mono whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-[#7A6E67]">No security events logged yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ============================================================== */}
      {/* MODAL: CREATE BRANCH                                            */}
      {/* ============================================================== */}
      {showCreateBranchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-[#1E1815] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#C0392B]" />
                Add New Outlet Branch
              </h3>
              <button
                onClick={() => setShowCreateBranchModal(false)}
                className="p-1 rounded-lg text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {branchMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 ${branchMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#C0392B]/10 text-[#C0392B]"
                  }`}
              >
                {branchMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1015"
                    value={branchForm.code}
                    onChange={(e) => {
                      const newCode = e.target.value;
                      setBranchForm({
                        ...branchForm,
                        code: newCode,
                        dailyCode: branchForm.dailyCode || generateRandomCouponCode(newCode || "1015"),
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dubai, Abu Dhabi"
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Branch Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dubai Marina Mall"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Branch Name (Arabic)
                </label>
                <input
                  type="text"
                  placeholder="e.g. دبي مارينا مول"
                  dir="rtl"
                  value={branchForm.nameAr}
                  onChange={(e) => setBranchForm({ ...branchForm, nameAr: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              {/* 24-Hour Coupon Generator & Custom Validity Engine */}
              <div className="p-4 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[#C0392B]" />
                    <span className="font-extrabold text-xs text-[#1E1815]">
                      Visit Coupon Passcode & Expiry Settings
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E7A4D] animate-pulse" />
                    {formatExpiryTime(branchForm.dailyCodeExpiresAt)}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#7A6E67] uppercase mb-1">
                    Coupon Code
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="e.g. 1015-7K9A"
                        value={branchForm.dailyCode}
                        onChange={(e) => setBranchForm({ ...branchForm, dailyCode: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-[#E0D7CF] rounded-xl font-mono font-black text-[#C0392B] tracking-wider focus:outline-none focus:border-[#C0392B]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const fresh = generateRandomCouponCode(branchForm.code || "1015");
                        setBranchForm({ ...branchForm, dailyCode: fresh });
                      }}
                      title="Generate Fresh Coupon Code"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FAF0E6] text-xs font-bold text-[#4A3F39] hover:text-[#C0392B] transition-colors cursor-pointer shrink-0 shadow-2xs"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-[#C0392B]" />
                      <span>Generate</span>
                    </button>
                  </div>
                </div>

                {/* Expiry Date & Time Configuration */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#7A6E67] uppercase flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#C68A1E]" />
                      <span>Coupon Expiration Time (Admin Configurable)</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#7A6E67]">
                      {branchForm.dailyCodeExpiresAt ? new Date(branchForm.dailyCodeExpiresAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "24h Default"}
                    </span>
                  </div>

                  <input
                    type="datetime-local"
                    value={branchForm.dailyCodeExpiresAt}
                    onChange={(e) => setBranchForm({ ...branchForm, dailyCodeExpiresAt: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E0D7CF] rounded-xl font-mono text-[#1E1815] font-bold focus:outline-none focus:border-[#C0392B]"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-[#7A6E67] mr-1">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const future = new Date(Date.now() + 12 * 60 * 60 * 1000);
                        setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(future) });
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#C0392B] hover:text-[#C0392B] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
                    >
                      +12 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
                        setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(future) });
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-[#C0392B]/30 hover:border-[#C0392B] text-[10px] font-bold text-[#C0392B] transition-colors cursor-pointer"
                    >
                      +24 Hours (Standard)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const future = new Date(Date.now() + 48 * 60 * 60 * 1000);
                        setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(future) });
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#C0392B] hover:text-[#C0392B] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
                    >
                      +48 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                        setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(future) });
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#C0392B] hover:text-[#C0392B] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
                    >
                      +7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const endOfDay = new Date();
                        endOfDay.setHours(23, 59, 0, 0);
                        setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(endOfDay) });
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#C0392B] hover:text-[#C0392B] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
                    >
                      End of Today
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#7A6E67] pt-2 border-t border-[#EAE3DC]">
                  <div className="flex items-center gap-1 text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1E7A4D] shrink-0" />
                    <span>Auto-refreshes when expired</span>
                  </div>
                  <span className="text-[#C0392B] font-bold text-[10px]">
                    🚫 1-Time Use Per Customer
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Level 1, Near Food Court"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+971 4 123 4567"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    placeholder="10:00 AM – 11:00 PM"
                    value={branchForm.hours}
                    onChange={(e) => setBranchForm({ ...branchForm, hours: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bActive"
                  checked={branchForm.isActive}
                  onChange={(e) => setBranchForm({ ...branchForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#C0392B] focus:ring-[#C0392B]"
                />
                <label htmlFor="bActive" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                  Activate Outlet Immediately for POS Tills & Customer Cards
                </label>
              </div>

              <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBranchModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50"
                >
                  {busy ? "Creating…" : "Save & Register Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT BRANCH                                              */}
      {/* ============================================================== */}
      {showEditBranchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-[#1E1815] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#C0392B]" />
                Edit Branch Details
              </h3>
              <button
                onClick={() => setShowEditBranchModal(false)}
                className="p-1 rounded-lg text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {branchMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 ${branchMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#C0392B]/10 text-[#C0392B]"
                  }`}
              >
                {branchMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateBranch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    required
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Branch Name (English)
                </label>
                <input
                  type="text"
                  required
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Branch Name (Arabic)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={branchForm.nameAr}
                  onChange={(e) => setBranchForm({ ...branchForm, nameAr: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              {/* 24-Hour Coupon Generator & Custom Validity Engine in Edit */}
              <div className="p-4 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[#C0392B]" />
                    <span className="font-extrabold text-xs text-[#1E1815]">
                      Active Visit Coupon Passcode & Expiry Settings
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E7A4D] animate-pulse" />
                    {formatExpiryTime(branchForm.dailyCodeExpiresAt)}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#7A6E67] uppercase mb-1">
                    Coupon Code
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="e.g. 1015-7K9A"
                        value={branchForm.dailyCode}
                        onChange={(e) => setBranchForm({ ...branchForm, dailyCode: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-[#E0D7CF] rounded-xl font-mono font-black text-[#C0392B] tracking-wider focus:outline-none focus:border-[#C0392B]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const fresh = generateRandomCouponCode(branchForm.code || "1015");
                        setBranchForm({ ...branchForm, dailyCode: fresh });
                      }}
                      title="Regenerate Coupon Code"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FAF0E6] text-xs font-bold text-[#4A3F39] hover:text-[#C0392B] transition-colors cursor-pointer shrink-0 shadow-2xs"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-[#C0392B]" />
                      <span>Rotate Now</span>
                    </button>
                  </div>
                </div>

                {/* Expiry Date & Time Configuration */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#7A6E67] uppercase flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#C68A1E]" />
                      <span>Coupon Expiration Time (Admin Configurable)</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#7A6E67]">
                      {branchForm.dailyCodeExpiresAt ? new Date(branchForm.dailyCodeExpiresAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "24h Default"}
                    </span>
                  </div>

                  <input
                    type="datetime-local"
                    value={branchForm.dailyCodeExpiresAt}
                    onChange={(e) => setBranchForm({ ...branchForm, dailyCodeExpiresAt: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E0D7CF] rounded-xl font-mono text-[#1E1815] font-bold focus:outline-none focus:border-[#C0392B]"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-[#7A6E67] mr-1">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const future = new Date(Date.now() + 12 * 60 * 60 * 1000);
                        setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(future) });
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#C0392B] hover:text-[#C0392B] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
                    >
                      +12 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
                        setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(future) });
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-[#C0392B]/30 hover:border-[#C0392B] text-[10px] font-bold text-[#C0392B] transition-colors cursor-pointer"
                    >
                      +24 Hours (Standard)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const future = new Date(Date.now() + 48 * 60 * 60 * 1000);
                        setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(future) });
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#C0392B] hover:text-[#C0392B] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
                    >
                      +48 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                        setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(future) });
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#C0392B] hover:text-[#C0392B] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
                    >
                      +7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const endOfDay = new Date();
                        endOfDay.setHours(23, 59, 0, 0);
                        setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(endOfDay) });
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#C0392B] hover:text-[#C0392B] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
                    >
                      End of Today
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#7A6E67] pt-2 border-t border-[#EAE3DC]">
                  <div className="flex items-center gap-1 text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1E7A4D] shrink-0" />
                    <span>Auto-refreshes when expired</span>
                  </div>
                  <span className="text-[#C0392B] font-bold text-[10px]">
                    🚫 1-Time Use Per Customer
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">Address</label>
                <input
                  type="text"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={branchForm.hours}
                    onChange={(e) => setBranchForm({ ...branchForm, hours: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bActiveEdit"
                  checked={branchForm.isActive}
                  onChange={(e) => setBranchForm({ ...branchForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#C0392B] focus:ring-[#C0392B]"
                />
                <label htmlFor="bActiveEdit" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                  Outlet Is Active & Available for Operations
                </label>
              </div>

              <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditBranchModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50"
                >
                  {busy ? "Updating…" : "Update Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DELETE / DEACTIVATE CONFIRMATION                        */}
      {/* ============================================================== */}
      {showDeleteBranchModal && branchToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#C0392B]/10 text-[#C0392B] flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-black text-lg text-[#1E1815] mb-1">
              Delete Branch: {branchToDelete.name}?
            </h3>
            <p className="text-xs text-[#7A6E67] leading-relaxed mb-4">
              Are you sure you want to remove{" "}
              <strong className="text-[#1E1815]">{branchToDelete.name} ({branchToDelete.code})</strong>?
              If this branch has historical customer visits or revenue records, it will be safely deactivated to protect audit history.
            </p>

            <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteBranchModal(false);
                  setBranchToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBranch}
                disabled={busy}
                className="px-5 py-2 rounded-xl bg-[#C0392B] hover:bg-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50 cursor-pointer"
              >
                {busy ? "Processing…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE CAMPAIGN OFFER                                    */}
      {/* ============================================================== */}
      {showCreateOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-[#1E1815] flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#C0392B]" />
                Launch Promotional Campaign
              </h3>
              <button
                onClick={() => setShowCreateOfferModal(false)}
                className="p-1 rounded-lg text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {offerMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 ${offerMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#C0392B]/10 text-[#C0392B]"
                  }`}
              >
                {offerMsg.text}
              </div>
            )}

            <form onSubmit={createOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Family Brunch 20% Off"
                  value={newOffer.name}
                  onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Valid on all dine-in bills over AED 100 on Saturdays and Sundays."
                  value={newOffer.description}
                  onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 20"
                    value={newOffer.value}
                    onChange={(e) => setNewOffer({ ...newOffer, value: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Discount Type
                  </label>
                  <select
                    value={newOffer.isPercent ? "pct" : "flat"}
                    onChange={(e) => setNewOffer({ ...newOffer, isPercent: e.target.value === "pct" })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  >
                    <option value="pct">Percentage (% Off)</option>
                    <option value="flat">Flat Amount (AED Off)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newOffer.startsAt}
                    onChange={(e) => setNewOffer({ ...newOffer, startsAt: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newOffer.endsAt}
                    onChange={(e) => setNewOffer({ ...newOffer, endsAt: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateOfferModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50"
                >
                  {busy ? "Publishing…" : "Publish Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE STAFF ACCOUNT                                     */}
      {/* ============================================================== */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-[#1E1815] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#C0392B]" />
                Add New Staff Member
              </h3>
              <button
                onClick={() => setShowCreateStaffModal(false)}
                className="p-1 rounded-lg text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {staffMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 ${staffMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#C0392B]/10 text-[#C0392B]"
                  }`}
              >
                {staffMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Al Nuaimi"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Login Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. tariq_pos1"
                    value={staffForm.username}
                    onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Security PIN / Password *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    required
                    minLength={4}
                    placeholder="Min 4 digits"
                    value={staffForm.pin}
                    onChange={(e) => setStaffForm({ ...staffForm, pin: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    System Role *
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  >
                    <option value="CASHIER">Cashier (POS Till)</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="COMPANY_ADMIN">Company Administrator</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Assigned Outlet Branch *
                  </label>
                  <select
                    value={staffForm.branchId}
                    onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  >
                    <option value="">🏢 Corporate / All Outlets</option>
                    {allBranches.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="sActive"
                  checked={staffForm.isActive}
                  onChange={(e) => setStaffForm({ ...staffForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#C0392B] focus:ring-[#C0392B]"
                />
                <label htmlFor="sActive" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                  Account is Active & Allowed to Sign In to POS / Admin
                </label>
              </div>

              <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50 cursor-pointer"
                >
                  {busy ? "Creating…" : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT STAFF DETAILS & RESET PIN                           */}
      {/* ============================================================== */}
      {showEditStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-[#1E1815] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#C0392B]" />
                Edit Staff Member & Reset PIN
              </h3>
              <button
                onClick={() => setShowEditStaffModal(false)}
                className="p-1 rounded-lg text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {staffMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 ${staffMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#C0392B]/10 text-[#C0392B]"
                  }`}
              >
                {staffMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Login Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.username}
                    onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Reset PIN / Password (Optional)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    minLength={4}
                    placeholder="Leave blank to keep current"
                    value={staffForm.pin}
                    onChange={(e) => setStaffForm({ ...staffForm, pin: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    System Role *
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  >
                    <option value="CASHIER">Cashier (POS Till)</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="COMPANY_ADMIN">Company Administrator</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Assigned Outlet Branch *
                  </label>
                  <select
                    value={staffForm.branchId}
                    onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  >
                    <option value="">🏢 Corporate / All Outlets</option>
                    {allBranches.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="sActiveEdit"
                  checked={staffForm.isActive}
                  onChange={(e) => setStaffForm({ ...staffForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#C0392B] focus:ring-[#C0392B]"
                />
                <label htmlFor="sActiveEdit" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                  Account is Active & Allowed to Sign In
                </label>
              </div>

              <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditStaffModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50 cursor-pointer"
                >
                  {busy ? "Updating…" : "Update Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DELETE / DEACTIVATE STAFF CONFIRMATION                  */}
      {/* ============================================================== */}
      {showDeleteStaffModal && staffToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#C0392B]/10 text-[#C0392B] flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-black text-lg text-[#1E1815] mb-1">
              Delete Staff: {staffToDelete.name}?
            </h3>
            <p className="text-xs text-[#7A6E67] leading-relaxed mb-4">
              Are you sure you want to remove{" "}
              <strong className="text-[#1E1815]">{staffToDelete.name} (@{staffToDelete.username})</strong>?
              If this staff account has processed historical till transactions, it will be safely deactivated to preserve financial audit history.
            </p>

            <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteStaffModal(false);
                  setStaffToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                disabled={busy}
                className="px-5 py-2 rounded-xl bg-[#C0392B] hover:bg-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50 cursor-pointer"
              >
                {busy ? "Processing…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE / EDIT VISIT MILESTONE REWARD                    */}
      {/* ============================================================== */}
      {showVisitRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-[#1E1815] flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#C0392B]" />
                {editingVisitRewardId ? "Edit Visit Milestone Reward" : "Add New Visit Milestone Reward"}
              </h3>
              <button
                onClick={() => setShowVisitRewardModal(false)}
                className="p-1 rounded-lg text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVisitReward} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Visit Milestone Threshold *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={500}
                      value={visitRewardForm.threshold}
                      onChange={(e) => setVisitRewardForm({ ...visitRewardForm, threshold: e.target.value })}
                      placeholder="e.g. 5, 10, 20"
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                      Visits
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Validity (Days after unlock) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={365}
                      value={visitRewardForm.validDays}
                      onChange={(e) => setVisitRewardForm({ ...visitRewardForm, validDays: e.target.value })}
                      placeholder="e.g. 30"
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                      Days
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Free Reward / Item Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Signature Coffee / Beverage or Free Chef Dessert"
                  value={visitRewardForm.name}
                  onChange={(e) => setVisitRewardForm({ ...visitRewardForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] font-bold focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Free Reward / Item Name (Arabic - Optional)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  placeholder="مثال: مشروب مجاني مميز / حلوى مجانية"
                  value={visitRewardForm.nameAr}
                  onChange={(e) => setVisitRewardForm({ ...visitRewardForm, nameAr: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Customer Description / Wallet Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Enjoy any complimentary signature beverage on your 5th dining visit!"
                  value={visitRewardForm.description}
                  onChange={(e) => setVisitRewardForm({ ...visitRewardForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="vrActive"
                  checked={visitRewardForm.isActive}
                  onChange={(e) => setVisitRewardForm({ ...visitRewardForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#C0392B] focus:ring-[#C0392B]"
                />
                <label htmlFor="vrActive" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                  Milestone Rule is Active & Automatically Issued upon reaching visits
                </label>
              </div>

              <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVisitRewardModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={visitRewardSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50 cursor-pointer"
                >
                  {visitRewardSaving ? "Saving…" : editingVisitRewardId ? "Update Milestone" : "Save Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DELETE VISIT MILESTONE REWARD                           */}
      {/* ============================================================== */}
      {showDeleteVisitRewardModal && visitRewardToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#C0392B]/10 text-[#C0392B] flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-black text-lg text-[#1E1815] mb-1">
              Delete Milestone: {visitRewardToDelete.threshold} Visits?
            </h3>
            <p className="text-xs text-[#7A6E67] leading-relaxed mb-4">
              Are you sure you want to remove the <strong className="text-[#1E1815]">{visitRewardToDelete.name}</strong> milestone rule? Customers who have already unlocked their vouchers will keep them until expiry, but new visits will no longer trigger this rule.
            </p>

            <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteVisitRewardModal(false);
                  setVisitRewardToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteVisitReward}
                disabled={busy}
                className="px-5 py-2 rounded-xl bg-[#C0392B] hover:bg-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50 cursor-pointer"
              >
                {busy ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CUSTOMER FULL PROFILE & LOYALTY DATA                    */}
      {/* ============================================================== */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1E1815] via-[#2A211C] to-[#1E1815] p-5 sm:p-6 text-white relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerId(null);
                  setSelectedCustomerData(null);
                }}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pr-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C0392B] to-[#96291D] text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                  {selectedCustomerData?.name ? selectedCustomerData.name.slice(0, 2).toUpperCase() : "MB"}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-lg sm:text-xl font-black truncate">
                      {selectedCustomerData?.name || "Customer Profile"}
                    </h2>
                    {selectedCustomerData?.isBlocked ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#C0392B] text-white text-[10px] font-black uppercase tracking-wider">
                        Account Blocked
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active VIP Member
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#E5A93C]" />
                      <a href={`tel:${selectedCustomerData?.mobile}`} className="hover:underline hover:text-white">
                        {selectedCustomerData?.mobile || "—"}
                      </a>
                    </span>
                    {selectedCustomerData?.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#E5A93C]" />
                        <a href={`mailto:${selectedCustomerData.email}`} className="hover:underline hover:text-white truncate max-w-[220px]">
                          {selectedCustomerData.email}
                        </a>
                      </span>
                    )}
                    {selectedCustomerData?.homeBranch && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#E5A93C]" />
                        <span className="text-white/90">{selectedCustomerData.homeBranch.name}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* KPI Mini Bar */}
              {selectedCustomerData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-5 pt-4 border-t border-white/10">
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Coins className="w-3 h-3 text-[#E5A93C]" /> Points Wallet
                    </div>
                    <div className="text-base sm:text-lg font-black text-[#E5A93C] mt-0.5">
                      {selectedCustomerData.pointsBalance} <span className="text-[10px] text-white/70 font-normal">pts</span>
                    </div>
                    <div className="text-[9px] text-white/50">
                      ≈ {formatMoney(cur, selectedCustomerData.pointsCashValue || 0)}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-[#E5A93C]" /> Total Spend
                    </div>
                    <div className="text-base sm:text-lg font-black text-white mt-0.5">
                      {formatMoney(cur, selectedCustomerData.totalSpend || 0)}
                    </div>
                    <div className="text-[9px] text-white/50">Lifetime Invoiced</div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-[#E5A93C]" /> Total Visits
                    </div>
                    <div className="text-base sm:text-lg font-black text-white mt-0.5">
                      {selectedCustomerData.visitCount || 0} <span className="text-[10px] text-white/70 font-normal">visits</span>
                    </div>
                    <div className="text-[9px] text-white/50">
                      Last: {formatRelativeTime(selectedCustomerData.lastVisitAt)}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-[#E5A93C]" /> Loyalty Card
                    </div>
                    <div className="text-xs sm:text-sm font-mono font-black text-white mt-1 truncate">
                      {selectedCustomerData.cardCode || "Auto-Generated"}
                    </div>
                    <div className="text-[9px] text-white/50">Permanent ID</div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-1 sm:gap-2 px-5 sm:px-6 pt-3 border-b border-[#EAE3DC] bg-[#FAF7F4] overflow-x-auto text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setCustomerDetailTab("overview")}
                className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${customerDetailTab === "overview"
                    ? "border-[#C0392B] text-[#C0392B]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                  }`}
              >
                <Users className="w-3.5 h-3.5" /> Overview & Profile
              </button>
              <button
                type="button"
                onClick={() => setCustomerDetailTab("transactions")}
                className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${customerDetailTab === "transactions"
                    ? "border-[#C0392B] text-[#C0392B]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                  }`}
              >
                <Receipt className="w-3.5 h-3.5" /> Invoices ({selectedCustomerData?.transactions?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setCustomerDetailTab("rewards")}
                className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${customerDetailTab === "rewards"
                    ? "border-[#C0392B] text-[#C0392B]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                  }`}
              >
                <Gift className="w-3.5 h-3.5" /> Vouchers ({selectedCustomerData?.rewards?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setCustomerDetailTab("visits")}
                className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${customerDetailTab === "visits"
                    ? "border-[#C0392B] text-[#C0392B]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                  }`}
              >
                <MapPin className="w-3.5 h-3.5" /> Dine-In Check-ins ({selectedCustomerData?.visits?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setCustomerDetailTab("ledger")}
                className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${customerDetailTab === "ledger"
                    ? "border-[#C0392B] text-[#C0392B]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                  }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Points History ({selectedCustomerData?.ledger?.length || 0})
              </button>
            </div>

            {/* Modal Body / Tab Contents */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {loadingCustomerDetail ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#7A6E67] gap-3">
                  <RefreshCw className="w-7 h-7 animate-spin text-[#C0392B]" />
                  <p className="text-xs font-bold">Loading member profile and loyalty history…</p>
                </div>
              ) : !selectedCustomerData ? (
                <div className="text-center py-12 text-xs text-[#7A6E67]">
                  No customer data available.
                </div>
              ) : (
                <>
                  {/* Toast Alert */}
                  {customerDetailMsg && (
                    <div
                      className={`mb-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${customerDetailMsg.type === "ok"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                    >
                      {customerDetailMsg.type === "ok" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      <span>{customerDetailMsg.text}</span>
                    </div>
                  )}

                  {/* TAB 1: OVERVIEW & PROFILE */}
                  {customerDetailTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Personal Info Box */}
                      <div className="p-4 bg-[#FAF7F4] rounded-2xl border border-[#EAE3DC]">
                        <h4 className="text-xs font-black text-[#1E1815] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#C0392B]" /> Personal Information
                        </h4>
                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                            <span className="text-[#7A6E67]">Full Name</span>
                            <span className="font-bold text-[#1E1815]">{selectedCustomerData.name}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                            <span className="text-[#7A6E67]">Mobile Phone</span>
                            <span className="font-mono font-bold text-[#1E1815]">{selectedCustomerData.mobile}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                            <span className="text-[#7A6E67]">Email Address</span>
                            <span className="font-bold text-[#1E1815]">{selectedCustomerData.email || "—"}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                            <span className="text-[#7A6E67]">Date of Birth</span>
                            <span className="font-bold text-[#1E1815]">
                              {selectedCustomerData.birthday
                                ? new Date(selectedCustomerData.birthday).toLocaleDateString()
                                : "Not provided"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                            <span className="text-[#7A6E67]">Preferred Language</span>
                            <span className="font-bold text-[#1E1815] uppercase">{selectedCustomerData.language || "EN"}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-[#7A6E67]">Registration Date</span>
                            <span className="font-bold text-[#1E1815]">
                              {new Date(selectedCustomerData.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Loyalty & Account Status Box */}
                      <div className="space-y-4">
                        <div className="p-4 bg-[#FAF7F4] rounded-2xl border border-[#EAE3DC]">
                          <h4 className="text-xs font-black text-[#1E1815] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#C0392B]" /> Loyalty Status & Security
                          </h4>
                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                              <span className="text-[#7A6E67]">Account Status</span>
                              <span className={`font-bold ${selectedCustomerData.isBlocked ? "text-[#C0392B]" : "text-emerald-700"}`}>
                                {selectedCustomerData.isBlocked ? "Blocked / Suspended" : "Active & Verified"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                              <span className="text-[#7A6E67]">Home / Assigned Branch</span>
                              <span className="font-bold text-[#1E1815]">
                                {selectedCustomerData.homeBranch?.name || "All Branches"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                              <span className="text-[#7A6E67]">Permanent Card Token</span>
                              <span className="font-mono font-bold text-[#1E1815]">
                                {selectedCustomerData.cardCode || "Auto-Assigned"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-[#7A6E67]">Cashback Redemption Value</span>
                              <span className="font-black text-[#C0392B]">
                                {formatMoney(cur, selectedCustomerData.pointsCashValue || 0)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Action Box */}
                        <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-white flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-[#1E1815]">Account Controls</div>
                            <div className="text-[11px] text-[#7A6E67]">
                              {selectedCustomerData.isBlocked
                                ? "Restore this member's access to earn & redeem points."
                                : "Temporarily suspend points earning & vouchers for this customer."}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleCustomerBlock(selectedCustomerData.id, !selectedCustomerData.isBlocked)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${selectedCustomerData.isBlocked
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-[#C0392B]/10 hover:bg-[#C0392B]/20 text-[#C0392B]"
                              }`}
                          >
                            {selectedCustomerData.isBlocked ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Unblock Account
                              </>
                            ) : (
                              <>
                                <Ban className="w-3.5 h-3.5" /> Block Member
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: TRANSACTIONS / INVOICES */}
                  {customerDetailTab === "transactions" && (
                    <div className="overflow-x-auto">
                      {selectedCustomerData.transactions?.length > 0 ? (
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-[#EAE3DC] text-[#7A6E67] uppercase font-bold">
                            <tr>
                              <th className="pb-2.5 px-3">Invoice #</th>
                              <th className="pb-2.5 px-3">Date & Time</th>
                              <th className="pb-2.5 px-3">Branch</th>
                              <th className="pb-2.5 px-3">Staff</th>
                              <th className="pb-2.5 px-3 text-right">Bill Amount</th>
                              <th className="pb-2.5 px-3 text-right">Points Earned</th>
                              <th className="pb-2.5 px-3 text-right">Points Redeemed</th>
                              <th className="pb-2.5 px-3 text-right">Discount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EFE8E1]">
                            {selectedCustomerData.transactions.map((t: any) => (
                              <tr key={t.id} className="hover:bg-[#FAF7F4] transition-colors">
                                <td className="py-2.5 px-3 font-mono font-bold text-[#1E1815]">
                                  {t.invoiceNumber || "INV-" + t.id.slice(0, 6)}
                                </td>
                                <td className="py-2.5 px-3 text-[#7A6E67]">
                                  {new Date(t.createdAt).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-[#1E1815] font-semibold">
                                  {t.branch?.name || "—"}
                                </td>
                                <td className="py-2.5 px-3 text-[#7A6E67]">{t.staffName}</td>
                                <td className="py-2.5 px-3 font-black text-[#1E1815] text-right">
                                  {formatMoney(cur, t.amount)}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-emerald-700 text-right">
                                  {t.pointsEarned > 0 ? `+${t.pointsEarned} pts` : "—"}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-red-700 text-right">
                                  {t.pointsRedeemed > 0 ? `-${t.pointsRedeemed} pts` : "—"}
                                </td>
                                <td className="py-2.5 px-3 text-[#7A6E67] text-right">
                                  {t.discountGiven > 0 ? formatMoney(cur, t.discountGiven) : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center py-10 text-xs text-[#7A6E67]">
                          <Receipt className="w-8 h-8 text-[#C0392B]/40 mx-auto mb-2" />
                          No purchase transactions recorded yet for this customer.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: VOUCHERS & REWARDS */}
                  {customerDetailTab === "rewards" && (
                    <div className="space-y-3">
                      {selectedCustomerData.rewards?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedCustomerData.rewards.map((r: any) => (
                            <div
                              key={r.id}
                              className="p-3.5 bg-[#FAF7F4] rounded-2xl border border-[#EAE3DC] flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <h5 className="font-bold text-xs text-[#1E1815]">{r.name}</h5>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${r.status === "AVAILABLE"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : r.status === "REDEEMED"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-gray-100 text-gray-700"
                                      }`}
                                  >
                                    {r.status}
                                  </span>
                                </div>
                                {r.description && (
                                  <p className="text-[11px] text-[#7A6E67] mb-2">{r.description}</p>
                                )}
                              </div>
                              <div className="pt-2 border-t border-[#EAE3DC]/60 flex items-center justify-between text-[10px] text-[#7A6E67]">
                                <span>
                                  Value:{" "}
                                  <strong className="text-[#C0392B]">
                                    {r.isPercent ? `${r.value}% OFF` : formatMoney(cur, r.value)}
                                  </strong>
                                </span>
                                <span>
                                  {r.expiresAt ? `Expires: ${new Date(r.expiresAt).toLocaleDateString()}` : "No expiry"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-xs text-[#7A6E67]">
                          <Gift className="w-8 h-8 text-[#C0392B]/40 mx-auto mb-2" />
                          No vouchers or milestone rewards issued to this member yet.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: DINE-IN CHECK-INS */}
                  {customerDetailTab === "visits" && (
                    <div className="overflow-x-auto">
                      {selectedCustomerData.visits?.length > 0 ? (
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-[#EAE3DC] text-[#7A6E67] uppercase font-bold">
                            <tr>
                              <th className="pb-2.5 px-3">Date & Time</th>
                              <th className="pb-2.5 px-3">Branch</th>
                              <th className="pb-2.5 px-3">Daily Coupon / Token</th>
                              <th className="pb-2.5 px-3">Method</th>
                              <th className="pb-2.5 px-3 text-right">Points Added</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EFE8E1]">
                            {selectedCustomerData.visits.map((v: any) => (
                              <tr key={v.id} className="hover:bg-[#FAF7F4] transition-colors">
                                <td className="py-2.5 px-3 text-[#1E1815] font-semibold">
                                  {new Date(v.createdAt).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-[#7A6E67]">{v.branch?.name || "All Branches"}</td>
                                <td className="py-2.5 px-3 font-mono text-[#C0392B] font-bold">
                                  {v.couponCode || "DIRECT_QR"}
                                </td>
                                <td className="py-2.5 px-3 text-[#7A6E67] capitalize">
                                  {v.checkInMethod?.toLowerCase() || "dine_in"}
                                </td>
                                <td className="py-2.5 px-3 font-black text-emerald-700 text-right">
                                  +{v.pointsEarned} pts
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center py-10 text-xs text-[#7A6E67]">
                          <MapPin className="w-8 h-8 text-[#C0392B]/40 mx-auto mb-2" />
                          No dine-in check-in visits registered yet for this member.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 5: POINTS AUDIT TRAIL / LEDGER */}
                  {customerDetailTab === "ledger" && (
                    <div className="overflow-x-auto">
                      {selectedCustomerData.ledger?.length > 0 ? (
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-[#EAE3DC] text-[#7A6E67] uppercase font-bold">
                            <tr>
                              <th className="pb-2.5 px-3">Date & Time</th>
                              <th className="pb-2.5 px-3">Branch</th>
                              <th className="pb-2.5 px-3">Points Delta</th>
                              <th className="pb-2.5 px-3">Activity / Reason</th>
                              <th className="pb-2.5 px-3">Details / Reference</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EFE8E1]">
                            {selectedCustomerData.ledger.map((l: any) => (
                              <tr key={l.id} className="hover:bg-[#FAF7F4] transition-colors">
                                <td className="py-2.5 px-3 text-[#7A6E67]">
                                  {new Date(l.createdAt).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-[#1E1815]">
                                  {l.branch?.name || "—"}
                                </td>
                                <td
                                  className={`py-2.5 px-3 font-black ${l.delta >= 0 ? "text-emerald-700" : "text-[#C0392B]"
                                    }`}
                                >
                                  {l.delta >= 0 ? `+${l.delta}` : l.delta} pts
                                </td>
                                <td className="py-2.5 px-3 font-bold text-[#1E1815] capitalize">
                                  {l.reason.replace(/_/g, " ")}
                                </td>
                                <td className="py-2.5 px-3 text-[#7A6E67]">
                                  {l.note || (l.invoiceNumber ? `Invoice #${l.invoiceNumber}` : "—")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center py-10 text-xs text-[#7A6E67]">
                          <TrendingUp className="w-8 h-8 text-[#C0392B]/40 mx-auto mb-2" />
                          No points ledger events recorded yet.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-5 sm:px-6 bg-[#FAF7F4] border-t border-[#EAE3DC] flex items-center justify-between shrink-0">
              <div className="text-[11px] text-[#7A6E67] hidden sm:block">
                Customer ID: <span className="font-mono text-[#1E1815]">{selectedCustomerId}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerId(null);
                  setSelectedCustomerData(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#1E1815] hover:bg-[#2A211C] text-white font-bold text-xs transition-colors cursor-pointer ml-auto"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CUSTOMER PORTAL QR CODE MODAL (Matches Image 3)                 */}
      {/* ============================================================== */}
      {showPortalQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F4] border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative text-center animate-in fade-in zoom-in-95 duration-200">
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
              <h3 className="text-xl font-black text-[#1E1815] tracking-tight">
                Customer Portal QR Code
              </h3>
              <p className="text-xs text-[#7A6E67] mt-1">
                Guests can scan this code to register or open their loyalty account.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-3xl border border-[#EAE3DC] shadow-xs inline-block my-2">
              {portalQrDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={portalQrDataUrl}
                  alt="Customer Portal QR Code"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-[#801313]/20 border-t-[#801313] rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Subtext & URL Display */}
            <div className="my-3 space-y-1">
              <div className="text-xs font-semibold text-[#7A6E67]">
                Scan to join Bombay Chowpatty Loyalty
              </div>
              <div className="text-[11px] font-mono text-[#801313] break-all px-2 font-bold select-all bg-white/70 py-1.5 rounded-lg border border-[#EAE3DC]/60">
                {portalUrl || "https://bombaychowpatty.ae"}
              </div>
            </div>

            {/* Share Link Button */}
            <button
              onClick={handleSharePortalLink}
              className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-[#681421] hover:bg-[#520F1A] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#681421]/20 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedPortalLink ? "Link Copied to Clipboard!" : "SHARE LINK"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
