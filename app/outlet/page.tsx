"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Phone,
  QrCode,
  Scan,
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  Receipt,
  Gift,
  Coins,
  ChevronDown,
  Building,
  User,
  History,
  RotateCcw,
  Check,
  Zap,
  Tag,
  CreditCard,
  Sliders,
  DollarSign,
  Award,
  Clock,
  PartyPopper,
  LogOut,
  Building2,
} from "lucide-react";
import jsQR from "jsqr";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/mobile";
import { CrmTopHeader } from "@/components/CrmTopHeader";
import { CountryCodePicker } from "@/components/CountryCodePicker";

interface Branch {
  id: string;
  code: string;
  name: string;
  city?: string;
  address?: string;
  hours?: string;
}

interface CustomerData {
  id: string;
  name: string;
  mobile: string;
  pointsBalance: number;
  visitCount: number;
  totalSpend: number;
  lastVisitAt?: string;
  homeBranch?: { name: string; city?: string };
  memberSince?: string;
}

interface RewardItem {
  id: string;
  rewardId?: string;
  name: string;
  description?: string;
  value: number;
  isPercent: boolean;
  type: string;
  threshold?: number;
  expiresAt?: string;
}

interface LoyaltyRules {
  currency: string;
  spendAedForPoints: number;
  pointsEarnedPerSpend: number;
  pointsRequiredForRedemption: number;
  currencyValuePerRedemptionPoints: number;
}

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

function OutletContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams
    ? searchParams.get("code") || searchParams.get("branch") || searchParams.get("branchId")
    : null;

  // Screen state: "entry" (Screen 1) | "ready" (Screen 2: loyalty search) | "customer" (Screen 2: customer profile desk)
  const [screen, setScreen] = useState<"entry" | "ready" | "customer">("entry");
  const [loadingSession, setLoadingSession] = useState(true);

  // Branch Info
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const [sampleBranch, setSampleBranch] = useState<Branch | null>(null);

  // Screen 1: Outlet Code Input
  const [outletCodeInput, setOutletCodeInput] = useState("");
  const [outletAuthBusy, setOutletAuthBusy] = useState(false);
  const [outletAuthErr, setOutletAuthErr] = useState("");

  // Screen 2: Search Tabs & Inputs
  const [searchTab, setSearchTab] = useState<"phone" | "qr">("phone");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY);
  const [mobileInput, setMobileInput] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchErr, setSearchErr] = useState("");

  // Camera Scanner for QR tab
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraHint, setCameraHint] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<NodeJS.Timeout | null>(null);
  const qrInputRef = useRef<HTMLInputElement | null>(null);

  // Screen 2: Active Customer Profile & Desk State
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [availableRewards, setAvailableRewards] = useState<RewardItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loyaltyRules, setLoyaltyRules] = useState<LoyaltyRules>({
    currency: "AED",
    spendAedForPoints: 10,
    pointsEarnedPerSpend: 1,
    pointsRequiredForRedemption: 100,
    currencyValuePerRedemptionPoints: 5,
  });

  // Action Mode Selection: "points" | "visit" | "reward" | "redeem_points"
  const [actionMode, setActionMode] = useState<"points" | "visit" | "reward" | "redeem_points">("points");

  // Bill & Points awarding state
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [pointsToRedeemInput, setPointsToRedeemInput] = useState<number>(0);
  const [customRedeemInput, setCustomRedeemInput] = useState<string>("");
  const [submittingBill, setSubmittingBill] = useState(false);
  const [billErr, setBillErr] = useState("");
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  // Visit stamp action state
  const [submittingVisit, setSubmittingVisit] = useState(false);
  const [visitSuccessReceipt, setVisitSuccessReceipt] = useState<any | null>(null);
  const [visitErr, setVisitErr] = useState("");

  // Reward / Gift redemption state
  const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);
  const [rewardSuccessReceipt, setRewardSuccessReceipt] = useState<any | null>(null);
  const [rewardErr, setRewardErr] = useState("");

  // Detailed History Receipt Modal
  const [selectedHistoryReceipt, setSelectedHistoryReceipt] = useState<any | null>(null);

  // 1. Initial Load: Direct code from URL or show Branch Code Entry screen
  useEffect(() => {
    async function initOutletSession() {
      if (codeParam) {
        try {
          const res = await fetch("/api/outlet/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: codeParam.trim() }),
          });
          const data = await res.json();
          if (res.ok && data.branch) {
            setActiveBranch(data.branch);
            setScreen("ready");
            setLoadingSession(false);
            return;
          }
        } catch {}
      }

      // If refreshed or no code in URL: show Screen 1 (Branch Code Entry)
      fetch("/api/outlet/auth?sampleOnly=true")
        .then((r) => r.json())
        .then((data) => {
          if (data.sampleBranch) {
            setSampleBranch(data.sampleBranch);
          }
          setScreen("entry");
        })
        .catch(() => setScreen("entry"))
        .finally(() => setLoadingSession(false));
    }

    initOutletSession();
  }, [codeParam]);

  // 2. Handle Screen 1: Submit Outlet Code
  async function handleOpenOutlet(e: React.FormEvent) {
    e.preventDefault();
    if (!outletCodeInput.trim()) return;

    setOutletAuthBusy(true);
    setOutletAuthErr("");

    try {
      const res = await fetch("/api/outlet/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: outletCodeInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Outlet code not recognized.");
      }

      setActiveBranch(data.branch);
      setScreen("ready");
      setOutletCodeInput("");
    } catch (err: any) {
      setOutletAuthErr(err.message || "Failed to authenticate outlet.");
    } finally {
      setOutletAuthBusy(false);
    }
  }

  // 3. Handle Switch / Change Outlet
  async function handleSwitchOutlet() {
    stopCamera();
    try {
      await fetch("/api/outlet/auth", { method: "DELETE" });
    } catch {}
    setActiveBranch(null);
    setCustomer(null);
    setSuccessReceipt(null);
    setVisitSuccessReceipt(null);
    setRewardSuccessReceipt(null);
    setScreen("entry");
  }

  // 4. Handle Customer Lookup (By Mobile or QR)
  const handleLookupCustomer = useCallback(
    async (e?: React.FormEvent, overrideToken?: string) => {
      e?.preventDefault();
      const tokenToSearch = overrideToken || (searchTab === "qr" ? qrInput.trim() : "");
      const mobileToSearch = searchTab === "phone" ? mobileInput.trim() : "";

      if (!tokenToSearch && !mobileToSearch) return;

      setSearchBusy(true);
      setSearchErr("");

      try {
        const res = await fetch("/api/outlet/customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile: mobileToSearch || undefined,
            countryCode: searchTab === "phone" ? countryCode : undefined,
            token: tokenToSearch || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Customer not found.");
        }

        setCustomer(data.customer);
        setAvailableRewards(data.availableRewards || []);
        setRecentTransactions(data.recentTransactions || []);
        if (data.loyaltyRules) {
          setLoyaltyRules(data.loyaltyRules);
        }

        // Reset states for fresh customer session
        setInvoiceNumber("");
        setBillAmount("");
        setSelectedRewardId(null);
        setPointsToRedeemInput(0);
        setCustomRedeemInput("");
        setBillErr("");
        setSuccessReceipt(null);
        setVisitSuccessReceipt(null);
        setVisitErr("");
        setRewardSuccessReceipt(null);
        setRewardErr("");
        setActionMode("points");

        // Stop camera if was active
        stopCamera();

        setScreen("customer");
      } catch (err: any) {
        setSearchErr(err.message || "Could not find customer profile.");
      } finally {
        setSearchBusy(false);
      }
    },
    [searchTab, qrInput, mobileInput, countryCode]
  );

  // USB Barcode scanner listener on QR tab
  useEffect(() => {
    if (screen === "ready" && searchTab === "qr" && qrInputRef.current) {
      qrInputRef.current.focus();
    }
  }, [screen, searchTab]);

  // Camera Scanning Handlers
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
    setIsCameraActive(false);
    setCameraHint("");
  }

  async function startCamera() {
    setSearchErr("");
    setCameraHint("Starting camera stream…");
    setIsCameraActive(true);

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
        setCameraHint("Tap video to start scanning");
      }

      setCameraHint("Point camera at customer's membership QR");

      loopRef.current = setInterval(async () => {
        const v = videoRef.current;
        if (!v || v.readyState < 2 || !v.videoWidth) return;

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
          if (found && found.data) {
            stopCamera();
            setQrInput(found.data);
            handleLookupCustomer(undefined, found.data);
          }
        } catch {}
      }, 250);
    } catch (e: any) {
      setSearchErr("Could not access camera. Please allow camera permissions or enter membership code manually.");
      stopCamera();
    }
  }

  // 5. Handle Action 1: "Give points" (Record Sale + Auto Visit + Earn Points + Direct Points/Voucher Discount)
  async function handleRecordSale(e: React.FormEvent) {
    e.preventDefault();
    if (!customer || !activeBranch) return;

    const val = parseFloat(billAmount);
    if (!invoiceNumber.trim()) {
      setBillErr("Please enter the invoice / bill receipt number.");
      return;
    }
    if (!val || val <= 0) {
      setBillErr("Please enter a valid bill amount greater than 0.");
      return;
    }

    if (pointsToRedeemInput > customer.pointsBalance) {
      setBillErr(`Customer only has ${customer.pointsBalance} points available to redeem.`);
      return;
    }

    setSubmittingBill(true);
    setBillErr("");

    try {
      const res = await fetch("/api/outlet/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          branchId: activeBranch.id,
          invoiceNumber: invoiceNumber.trim(),
          amount: val,
          redeemRewardId: selectedRewardId || undefined,
          pointsToRedeem: pointsToRedeemInput > 0 ? pointsToRedeemInput : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record sale.");
      }

      setSuccessReceipt(data);
      setInvoiceNumber("");
      setBillAmount("");
      setPointsToRedeemInput(0);
      setSelectedRewardId(null);
      setCustomRedeemInput("");
      // Update customer local stats (both points and automatic visit increment!)
      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              pointsBalance: data.customer.pointsBalance,
              visitCount: data.customer.visitCount,
              totalSpend: prev.totalSpend + val,
            }
          : null
      );

      // Immediately sync remaining available rewards
      if (data.availableRewards) {
        setAvailableRewards(data.availableRewards);
      } else if (selectedRewardId) {
        setAvailableRewards((prev) => prev.filter((r) => r.id !== selectedRewardId));
      }

      // Prepend new transaction to recent history
      if (data.transaction) {
        setRecentTransactions((prev) => [
          {
            id: data.transaction.id,
            invoiceNumber: data.transaction.invoiceNumber,
            amount: data.transaction.amount,
            pointsEarned: data.transaction.pointsEarned,
            discountGiven: data.transaction.discountGiven || 0,
            redeemedRewards: data.redeemedVoucher ? [data.redeemedVoucher.name] : [],
            branchName: activeBranch.name,
            createdAt: data.transaction.createdAt || new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      setBillErr(err.message || "Failed to record transaction.");
    } finally {
      setSubmittingBill(false);
    }
  }

  // 6. Handle Action 2: "Give visit" (Direct 1-Click Visit Check-in)
  async function handleGiveVisit() {
    if (!customer || !activeBranch) return;

    setSubmittingVisit(true);
    setVisitErr("");
    setVisitSuccessReceipt(null);

    try {
      const res = await fetch("/api/outlet/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          branchId: activeBranch.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register visit check-in.");
      }

      setVisitSuccessReceipt(data);
      // Update customer local stats
      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              visitCount: data.customer.visitCount,
              pointsBalance: data.customer.pointsBalance,
            }
          : null
      );

      // If new rewards were unlocked by this visit, append them to available rewards
      if (data.newlyIssuedRewards && data.newlyIssuedRewards.length > 0) {
        setAvailableRewards((prev) => [
          ...prev,
          ...data.newlyIssuedRewards.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            value: 0,
            isPercent: false,
            type: "VISITS",
          })),
        ]);
      }
    } catch (err: any) {
      setVisitErr(err.message || "Failed to stamp visit.");
    } finally {
      setSubmittingVisit(false);
    }
  }

  // 7. Handle Action 3: "Redeem visit offer / Gifts & Discounts" (Direct 1-Click Deliver/Redeem)
  async function handleRedeemReward(rewardId: string) {
    if (!customer || !activeBranch) return;

    setRedeemingRewardId(rewardId);
    setRewardErr("");
    setRewardSuccessReceipt(null);

    try {
      const res = await fetch("/api/outlet/redeem-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          customerRewardId: rewardId,
          branchId: activeBranch.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to redeem reward offer.");
      }

      setRewardSuccessReceipt(data);
      // Update customer local stats and remaining rewards
      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              pointsBalance: data.customer.pointsBalance,
            }
          : null
      );
      setAvailableRewards(data.availableRewards || []);
    } catch (err: any) {
      setRewardErr(err.message || "Failed to redeem offer.");
    } finally {
      setRedeemingRewardId(null);
    }
  }

  // Live preview metrics calculations for Give Points
  const parsedAmount = parseFloat(billAmount) || 0;
  const selectedReward = availableRewards.find((r) => r.id === selectedRewardId);
  const voucherDiscount = selectedReward
    ? selectedReward.isPercent
      ? Math.round(parsedAmount * (selectedReward.value / 100) * 100) / 100
      : selectedReward.value
    : 0;

  const pointsRedemptionUnit = loyaltyRules.pointsRequiredForRedemption || 100;
  const currencyPerUnit = loyaltyRules.currencyValuePerRedemptionPoints || 5;
  const directPointsDiscount =
    pointsToRedeemInput > 0 && pointsRedemptionUnit > 0
      ? Math.round(((pointsToRedeemInput / pointsRedemptionUnit) * currencyPerUnit) * 100) / 100
      : 0;

  const totalDiscount = Math.min(parsedAmount, voucherDiscount + directPointsDiscount);
  const netPayable = Math.max(0, parsedAmount - totalDiscount);
  const estimatedPointsToEarn =
    loyaltyRules.spendAedForPoints > 0
      ? Math.floor((parsedAmount / loyaltyRules.spendAedForPoints) * loyaltyRules.pointsEarnedPerSpend)
      : 0;

  // Render Loading Screen
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex flex-col font-sans">
        <CrmTopHeader activeTab="outlet" />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-10 h-10 border-3 border-[#0E331E]/20 border-t-[#0E331E] rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[#7A6E67] uppercase tracking-wider">Loading Outlet Terminal…</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 1: OUTLET ENTRY (Branch Code Entry)
  // =========================================================================
  if (screen === "entry" || !activeBranch) {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex flex-col font-sans selection:bg-[#0E331E] selection:text-white">
        <CrmTopHeader activeTab="outlet" />
        <div className="flex-1 flex flex-col items-center justify-center p-3.5 sm:p-6">
          <div className="max-w-md w-full bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-10 shadow-sm border border-[#EAE3DC] text-center relative animate-in fade-in zoom-in duration-200">
          {/* Brand mark */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bc-roundel.png"
            alt="Levante"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto mb-3 sm:mb-4"
          />

          {/* Subtitle */}
          <div className="text-[11px] font-black tracking-widest text-[#0E331E] uppercase mb-1.5">
            OUTLET ENTRY
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#1E1815] mb-2.5">
            Enter outlet code
          </h1>

          {/* Description */}
          <p className="text-xs text-[#7A6E67] font-medium leading-relaxed max-w-xs mx-auto mb-7">
            The code identifies the outlet and opens its cashier loyalty window.
          </p>

          {/* Form */}
          <form onSubmit={handleOpenOutlet} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-black text-[#1E1815] mb-2" htmlFor="outlet-code-input">
                Outlet code
              </label>
              <input
                id="outlet-code-input"
                type="text"
                placeholder="ENTER OUTLET CODE"
                value={outletCodeInput}
                onChange={(e) => setOutletCodeInput(e.target.value.toUpperCase())}
                autoFocus
                required
                className="w-full px-4 py-3.5 bg-white border border-[#EAE3DC] rounded-xl font-mono text-sm font-black text-[#1E1815] uppercase tracking-wider placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#0E331E] shadow-2xs transition-colors"
              />
            </div>

            {outletAuthErr && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 text-left animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{outletAuthErr}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!outletCodeInput.trim() || outletAuthBusy}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {outletAuthBusy ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>VERIFYING OUTLET…</span>
                </>
              ) : (
                <span>OPEN OUTLET</span>
              )}
            </button>
          </form>

          {/* Helper Sample Code Hint */}
          <div className="mt-7 text-[11.5px] text-[#7A6E67] font-medium">
            {sampleBranch ? (
              <>
                {sampleBranch.name} code:{" "}
                <button
                  type="button"
                  onClick={() => setOutletCodeInput(sampleBranch.code)}
                  className="font-bold font-mono text-[#1E1815] hover:text-[#0E331E] underline cursor-pointer"
                >
                  {sampleBranch.code}
                </button>
              </>
            ) : (
              "Enter your 4-digit branch code (e.g. 1005 for Dubai Festival City)"
            )}
          </div>
        </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 2: OUTLET LOYALTY DESK
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F5EFE0] flex flex-col font-sans selection:bg-[#0E331E] selection:text-white">
      <CrmTopHeader activeTab="outlet" />
      <div className="flex-1 py-4 sm:py-6 px-3 sm:px-6">
        <div className="max-w-4xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 mb-5 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bc-roundel.png"
              alt="Levante"
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain shrink-0"
            />
            <div className="min-w-0">
              {/* Highlighted Branch Badge */}
              <div className="inline-flex items-center flex-wrap gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#0E331E]/10 border border-[#0E331E]/25 text-[#0E331E] text-[11px] sm:text-xs font-black tracking-wide mb-1 shadow-2xs max-w-full truncate">
                <Building2 className="w-3.5 h-3.5 text-[#0E331E] shrink-0" />
                <span className="font-extrabold uppercase truncate">{activeBranch.name}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#0E331E] text-white text-[10px] font-mono font-bold shrink-0">
                  #{activeBranch.code}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-[#1E1815] leading-tight">
                Outlet loyalty entry
              </h1>
              <p className="text-xs sm:text-sm text-[#7A6E67] font-medium mt-0.5">
                Open customer profile by mobile or membership QR.
              </p>
            </div>
          </div>

          <button
            onClick={handleSwitchOutlet}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#EAE3DC] hover:border-[#0E331E]/50 hover:bg-[#FAF7F4] text-xs font-black text-[#0E331E] shadow-2xs transition-all cursor-pointer group shrink-0"
            title="Exit this branch and login to another branch"
          >
            <LogOut className="w-4 h-4 text-[#0E331E] group-hover:-translate-x-0.5 transition-transform shrink-0" />
            <span>Switch Branch</span>
          </button>
        </div>

        {/* Main Search Card */}
        <div className="bg-white rounded-3xl sm:rounded-4xl p-4.5 sm:p-8 border border-[#EAE3DC] shadow-sm mb-5 sm:mb-6">
          {/* Two Top Toggle Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
            {/* Tab 1: Enter mobile number */}
            <button
              type="button"
              onClick={() => {
                setSearchTab("phone");
                stopCamera();
                setSearchErr("");
              }}
              className={`p-4.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                searchTab === "phone"
                  ? "bg-[#FAF7F4] border-[#0E331E] shadow-xs ring-1 ring-[#0E331E]"
                  : "bg-white border-[#EAE3DC] hover:border-[#B5AAA2] hover:bg-[#FAF7F4]/50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  searchTab === "phone" ? "bg-[#0E331E]/10 text-[#0E331E]" : "bg-[#FAF7F4] text-[#7A6E67]"
                }`}
              >
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-[#1E1815]">Enter mobile number</div>
                <div className="text-xs text-[#7A6E67] font-medium">Find a registered customer</div>
              </div>
            </button>

            {/* Tab 2: Scan membership QR */}
            <button
              type="button"
              onClick={() => {
                setSearchTab("qr");
                setSearchErr("");
                setTimeout(() => qrInputRef.current?.focus(), 50);
              }}
              className={`p-4.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                searchTab === "qr"
                  ? "bg-[#FAF7F4] border-[#0E331E] shadow-xs ring-1 ring-[#0E331E]"
                  : "bg-white border-[#EAE3DC] hover:border-[#B5AAA2] hover:bg-[#FAF7F4]/50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  searchTab === "qr" ? "bg-[#0E331E]/10 text-[#0E331E]" : "bg-[#FAF7F4] text-[#7A6E67]"
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

          {/* TAB 1: Mobile Search */}
          {searchTab === "phone" && (
            <form onSubmit={handleLookupCustomer} className="animate-in fade-in duration-150">
              <label className="block text-xs font-black text-[#1E1815] mb-2" htmlFor="cust-phone-input">
                Mobile number
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                <CountryCodePicker
                  value={countryCode}
                  onChange={setCountryCode}
                  disabled={searchBusy}
                />

                <input
                  id="cust-phone-input"
                  type="tel"
                  placeholder="50 123 4567"
                  value={mobileInput}
                  onChange={(e) => setMobileInput(e.target.value.replace(/[^\d\s]/g, ""))}
                  autoFocus
                  required
                  className="flex-1 px-4 py-3.5 bg-white border border-[#EAE3DC] rounded-xl text-base font-bold text-[#1E1815] placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#0E331E] shadow-2xs transition-colors"
                />

                <button
                  type="submit"
                  disabled={!mobileInput.trim() || searchBusy}
                  className="py-3.5 px-7 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
                >
                  {searchBusy ? (
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

          {/* TAB 2: QR Scanner Search */}
          {searchTab === "qr" && (
            <div className="animate-in fade-in duration-150 space-y-4">
              <form onSubmit={handleLookupCustomer} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                <div className="relative flex-1">
                  <input
                    ref={qrInputRef}
                    type="text"
                    placeholder="Scan QR or enter token e.g. 7K9A..."
                    value={qrInput}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setQrInput(val);
                      if (val.length >= 8 && !val.includes(" ")) {
                        handleLookupCustomer(undefined, val);
                      }
                    }}
                    autoFocus
                    className="w-full px-4 py-3.5 bg-white border border-[#EAE3DC] rounded-xl font-mono text-sm font-bold text-[#1E1815] uppercase placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#0E331E] shadow-2xs"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!qrInput.trim() || searchBusy}
                  className="py-3.5 px-7 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
                >
                  {searchBusy ? "FINDING…" : "LOOKUP QR"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isCameraActive) stopCamera();
                    else startCamera();
                  }}
                  className="py-3.5 px-4 rounded-xl bg-[#FAF7F4] hover:bg-[#EAE3DC] border border-[#EAE3DC] text-[#1E1815] font-bold text-xs flex items-center justify-center gap-2 shrink-0 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-[#0E331E]" />
                  <span>{isCameraActive ? "Stop Camera" : "Camera Scan"}</span>
                </button>
              </form>

              {isCameraActive && (
                <div className="mt-4 p-4 rounded-2xl bg-[#1E1815] text-white text-center relative overflow-hidden">
                  <div className="relative aspect-video max-w-sm mx-auto rounded-xl overflow-hidden bg-black border-2 border-white/20">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-8 border-2 border-dashed border-[#CC8820] rounded-lg pointer-events-none animate-pulse" />
                  </div>
                  <p className="text-xs text-white/80 font-medium mt-3">{cameraHint}</p>
                </div>
              )}

              <div className="text-[11px] text-[#7A6E67] font-medium flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#CC8820]" />
                <span>USB &amp; Handheld Barcode Scanners will automatically detect customer QR codes immediately.</span>
              </div>
            </div>
          )}

          {/* Search Error Toast */}
          {searchErr && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{searchErr}</span>
              </div>
              <button onClick={() => setSearchErr("")} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* SCREEN 2 (EXTENDED): CUSTOMER PROFILE & 3 ACTION MODE DESK     */}
        {/* ============================================================== */}
        {screen === "customer" && customer && (
          <div className="bg-white rounded-3xl sm:rounded-4xl p-4.5 sm:p-8 border border-[#EAE3DC] shadow-md animate-in fade-in slide-in-from-bottom-3 duration-200 space-y-5 sm:space-y-6">
            
            {/* 1. TOP CUSTOMER HEADER CARD */}
            <div className="bg-[#FAF5F0] rounded-2xl p-4 sm:p-5 border border-[#EFE8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                {/* Circular Avatar Icon */}
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-[#0E331E] flex items-center justify-center text-[#0E331E] shrink-0 bg-white shadow-2xs">
                  <User className="w-5 h-5 sm:w-7 sm:h-7 stroke-[1.8] text-[#0E331E]" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display font-black text-lg sm:text-2xl text-[#1E1815] leading-tight truncate">
                    {customer.name}
                  </h2>
                  <p className="text-xs text-[#7A6E67] font-medium mt-0.5 truncate">
                    {activeBranch.name}
                  </p>
                </div>
              </div>

              {/* Stat Columns with Divider */}
              <div className="w-full sm:w-auto flex items-center justify-around sm:justify-start gap-4 sm:gap-6 bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-[#EAE3DC] shrink-0">
                <div className="text-center px-2 sm:px-4">
                  <div className="font-display font-black text-xl sm:text-2xl text-[#1E1815] leading-none">
                    {customer.pointsBalance}
                  </div>
                  <div className="text-[11px] font-semibold text-[#7A6E67] mt-1">
                    Points
                  </div>
                </div>

                <div className="w-[1px] h-8 bg-[#E5DDD5]" />

                <div className="text-center px-2 sm:px-4">
                  <div className="font-display font-black text-xl sm:text-2xl text-[#1E1815] leading-none">
                    {customer.visitCount}
                  </div>
                  <div className="text-[11px] font-semibold text-[#7A6E67] mt-1">
                    Visits
                  </div>
                </div>
              </div>
            </div>

            {/* 2. THREE PROMINENT ACTION MODE CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
              {/* Card 1: Give loyalty points */}
              <button
                type="button"
                onClick={() => {
                  setActionMode("points");
                  setBillErr("");
                }}
                className={`p-4.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                  actionMode === "points"
                    ? "bg-[#FAF7F4] border-[#0E331E] shadow-sm ring-2 ring-[#0E331E]/20"
                    : "bg-white border-[#EAE3DC] hover:border-[#0E331E]/50 hover:bg-[#FAF7F4]/40"
                }`}
              >
                <div className="text-[#0E331E] mb-3">
                  <RibbonIcon className="w-7 h-7 text-[#0E331E]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1E1815] leading-snug">
                    Give loyalty points
                  </h3>
                  <p className="text-[11px] text-[#7A6E67] font-medium mt-1">
                    Invoice number + bill amount
                  </p>
                </div>
                {actionMode === "points" && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#0E331E]" />
                )}
              </button>

              {/* Card 2: Redeem points for cash discount */}
              <button
                type="button"
                onClick={() => {
                  setActionMode("redeem_points");
                  setBillErr("");
                }}
                className={`p-4.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                  actionMode === "redeem_points"
                    ? "bg-[#FAF7F4] border-[#0E331E] shadow-sm ring-2 ring-[#0E331E]/20"
                    : "bg-white border-[#EAE3DC] hover:border-[#0E331E]/50 hover:bg-[#FAF7F4]/40"
                }`}
              >
                <div className="text-[#CC8820] mb-3">
                  <Coins className="w-7 h-7 text-[#CC8820]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1E1815] leading-snug">
                    Redeem points
                  </h3>
                  <p className="text-[11px] text-[#7A6E67] font-medium mt-1">
                    Direct cash discount on bill
                  </p>
                </div>
                {actionMode === "redeem_points" && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#0E331E]" />
                )}
              </button>

              {/* Card 3: Redeem visit offer */}
              <button
                type="button"
                onClick={() => {
                  setActionMode("reward");
                  setRewardErr("");
                  setRewardSuccessReceipt(null);
                }}
                className={`p-4.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                  actionMode === "reward"
                    ? "bg-[#FAF7F4] border-[#0E331E] shadow-sm ring-2 ring-[#0E331E]/20"
                    : "bg-white border-[#EAE3DC] hover:border-[#0E331E]/50 hover:bg-[#FAF7F4]/40"
                }`}
              >
                <div className="flex items-center justify-between mb-3 text-[#0E331E]">
                  <Gift className="w-7 h-7 text-[#0E331E] stroke-[1.8]" />
                  {availableRewards.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#0E331E]/10 text-[#0E331E] text-[9px] font-black uppercase">
                      {availableRewards.length} AVAILABLE
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1E1815] leading-snug">
                    Redeem visit offer
                  </h3>
                  <p className="text-[11px] text-[#7A6E67] font-medium mt-1">
                    Unlocked member vouchers &amp; gifts
                  </p>
                </div>
                {actionMode === "reward" && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#0E331E]" />
                )}
              </button>
            </div>

            {/* ============================================================== */}
            {/* ACTION PANEL 1: GIVE LOYALTY POINTS                            */}
            {/* ============================================================== */}
            {actionMode === "points" && (
              <div className="pt-2 animate-in fade-in duration-200">
                {!successReceipt ? (
                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#FAF7F4] border border-[#EAE3DC] space-y-5">
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-[#1E1815]">Give Loyalty Points on Dine-in Bill</h4>
                      <p className="text-xs text-[#7A6E67] mt-0.5">
                        Enter invoice # and bill amount to award points and stamp visit.
                      </p>
                    </div>

                    <form onSubmit={handleRecordSale} className="space-y-4 pt-2 border-t border-[#EAE3DC]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                        <div>
                          <label className="block text-xs font-black text-[#1E1815] mb-2" htmlFor="outlet-inv-input">
                            Invoice / Receipt #
                          </label>
                          <input
                            id="outlet-inv-input"
                            type="text"
                            placeholder="E.G. INV-10982"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                            required
                            className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3.5 bg-white border border-[#EAE3DC] rounded-xl font-mono text-sm font-bold text-[#1E1815] uppercase placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#0E331E] shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black text-[#1E1815] mb-2" htmlFor="outlet-amount-input">
                            Bill Amount ({loyaltyRules.currency})
                          </label>
                          <input
                            id="outlet-amount-input"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={billAmount}
                            onChange={(e) => setBillAmount(e.target.value)}
                            required
                            className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3.5 bg-white border border-[#EAE3DC] rounded-xl text-base font-bold text-[#1E1815] placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#0E331E] shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="text-[11px] text-[#7A6E67] font-medium leading-relaxed">
                        {loyaltyRules.currency} {loyaltyRules.spendAedForPoints} = {loyaltyRules.pointsEarnedPerSpend} point(s). Minimum spend {loyaltyRules.currency} 1. Duplicate invoices are blocked.
                      </div>

                      {/* Dynamic Points Calculation Breakdown */}
                      {parsedAmount > 0 && (
                        <div className="p-4 rounded-2xl bg-white border border-[#EAE3DC] space-y-2 text-xs shadow-2xs">
                          <div className="flex justify-between items-center text-[#7A6E67]">
                            <span>Gross Bill Amount:</span>
                            <span className="font-bold text-[#1E1815]">
                              {loyaltyRules.currency} {parsedAmount.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-emerald-800 font-medium">
                            <span>Points Calculation ({loyaltyRules.currency} {loyaltyRules.spendAedForPoints} = {loyaltyRules.pointsEarnedPerSpend} pt):</span>
                            <span className="font-mono text-emerald-700 font-extrabold text-sm">+{estimatedPointsToEarn} pts</span>
                          </div>

                          <div className="flex justify-between items-center text-blue-900 font-medium">
                            <span>Visit Stamp:</span>
                            <span className="font-bold font-mono text-blue-700">+1 visit</span>
                          </div>

                          <div className="pt-2 border-t border-[#EAE3DC] flex justify-between items-center">
                            <span className="font-bold text-[#1E1815]">Customer New Total Balance:</span>
                            <span className="font-black font-mono text-base text-[#0E331E]">
                              {customer.pointsBalance + estimatedPointsToEarn} pts
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Auto Visit Notice */}
                      <div className="p-3.5 rounded-xl bg-white border border-[#EAE3DC] flex items-center justify-between text-xs font-medium text-[#7A6E67]">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Recording this bill will automatically credit <strong className="text-[#1E1815]">+{estimatedPointsToEarn} points</strong> and stamp <strong className="text-[#1E1815]">+1 visit</strong> for {customer.name}.
                          </span>
                        </div>
                      </div>

                      {billErr && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>{billErr}</span>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={submittingBill || !invoiceNumber.trim() || !billAmount.trim()}
                          className="flex-1 py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-black text-xs uppercase tracking-wider sm:tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-center"
                        >
                          {submittingBill ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                              <span>RECORDING TRANSACTION…</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 shrink-0" />
                              <span>RECORD SALE &amp; AWARD POINTS</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : null}
              </div>
            )}

            {/* ============================================================== */}
            {/* ACTION PANEL 2: REDEEM POINTS FOR CASH DISCOUNT               */}
            {/* ============================================================== */}
            {actionMode === "redeem_points" && (
              <div className="pt-2 animate-in fade-in duration-200">
                {!successReceipt ? (
                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#FFFBF0] border border-[#CC8820]/40 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#CC8820]/30">
                      <div className="flex items-start sm:items-center gap-2.5">
                        <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-[#CC8820] shrink-0 mt-0.5 sm:mt-0" />
                        <div>
                          <h4 className="font-extrabold text-sm sm:text-base text-[#1E1815] leading-tight">Redeem Points for Direct Cash Discount</h4>
                          <p className="text-xs text-[#7A6E67] font-medium mt-0.5">
                            Customer currently has <strong className="text-[#0E331E] font-bold">{customer.pointsBalance} points</strong> available.
                          </p>
                        </div>
                      </div>
                      <span className="self-start sm:self-auto px-3 py-1 rounded-lg bg-[#CC8820]/20 text-[#0E331E] text-xs font-black shrink-0">
                        {loyaltyRules.pointsRequiredForRedemption} pts = {loyaltyRules.currency} {loyaltyRules.currencyValuePerRedemptionPoints} off
                      </span>
                    </div>

                    {customer.pointsBalance >= loyaltyRules.pointsRequiredForRedemption ? (
                      <form onSubmit={handleRecordSale} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-[#1E1815] mb-2">
                            Select Points to Redeem:
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            {[100, 200, 500].map((pts) => {
                              if (customer.pointsBalance < pts) return null;
                              const isSelected = pointsToRedeemInput === pts;
                              const offVal = ((pts / loyaltyRules.pointsRequiredForRedemption) * loyaltyRules.currencyValuePerRedemptionPoints).toFixed(2);
                              return (
                                <button
                                  key={pts}
                                  type="button"
                                  onClick={() => {
                                    setPointsToRedeemInput(isSelected ? 0 : pts);
                                    setCustomRedeemInput("");
                                  }}
                                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-[#0E331E] text-white border-[#0E331E] shadow-xs ring-2 ring-[#0E331E]/20"
                                      : "bg-white text-[#1E1815] border-[#EAE3DC] hover:border-[#0E331E]"
                                  }`}
                                >
                                  {pts} pts (-{loyaltyRules.currency} {offVal})
                                </button>
                              );
                            })}

                            {/* Redeem Max Available */}
                            {(() => {
                              const maxRedeemableUnits = Math.floor(customer.pointsBalance / loyaltyRules.pointsRequiredForRedemption);
                              const maxPts = maxRedeemableUnits * loyaltyRules.pointsRequiredForRedemption;
                              if (maxPts <= 0) return null;
                              const isMaxSelected = pointsToRedeemInput === maxPts;
                              const maxOff = ((maxPts / loyaltyRules.pointsRequiredForRedemption) * loyaltyRules.currencyValuePerRedemptionPoints).toFixed(2);
                              return (
                                <button
                                  key="max"
                                  type="button"
                                  onClick={() => {
                                    setPointsToRedeemInput(isMaxSelected ? 0 : maxPts);
                                    setCustomRedeemInput("");
                                  }}
                                  className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                    isMaxSelected
                                      ? "bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-700/20"
                                      : "bg-white text-[#0E331E] border-[#EAE3DC] hover:border-[#0E331E]"
                                  }`}
                                >
                                  Redeem Max ({maxPts} pts = -{loyaltyRules.currency} {maxOff})
                                </button>
                              );
                            })()}

                            {pointsToRedeemInput > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPointsToRedeemInput(0);
                                  setCustomRedeemInput("");
                                }}
                                className="px-3 py-2 rounded-xl text-xs font-bold text-[#7A6E67] hover:text-red-700 cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Custom Points Input */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2">
                          <label className="text-xs text-[#7A6E67] font-semibold shrink-0">Custom Points:</label>
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <input
                              type="number"
                              step={loyaltyRules.pointsRequiredForRedemption}
                              max={customer.pointsBalance}
                              min={0}
                              placeholder={`Multiples of ${loyaltyRules.pointsRequiredForRedemption}`}
                              value={customRedeemInput}
                              onChange={(e) => {
                                const v = e.target.value;
                                setCustomRedeemInput(v);
                                const num = parseInt(v) || 0;
                                if (num <= customer.pointsBalance && num >= 0) {
                                  setPointsToRedeemInput(num);
                                }
                              }}
                              className="w-full sm:w-48 px-3.5 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                            />
                            {pointsToRedeemInput > 0 && (
                              <span className="text-xs font-bold text-emerald-800 shrink-0">
                                = -{loyaltyRules.currency} {directPointsDiscount.toFixed(2)} discount
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bill inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-3 border-t border-[#CC8820]/30">
                          <div>
                            <label className="block text-xs font-black text-[#1E1815] mb-2" htmlFor="redeem-inv-input">
                              Invoice / Receipt #
                            </label>
                            <input
                              id="redeem-inv-input"
                              type="text"
                              placeholder="E.G. INV-10982"
                              value={invoiceNumber}
                              onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                              required
                              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white border border-[#EAE3DC] rounded-xl font-mono text-sm font-bold text-[#1E1815] uppercase placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#0E331E] shadow-2xs"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-black text-[#1E1815] mb-2" htmlFor="redeem-amount-input">
                              Gross Bill Amount ({loyaltyRules.currency})
                            </label>
                            <input
                              id="redeem-amount-input"
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="0.00"
                              value={billAmount}
                              onChange={(e) => setBillAmount(e.target.value)}
                              required
                              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white border border-[#EAE3DC] rounded-xl text-base font-bold text-[#1E1815] placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#0E331E] shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Calculation Breakdown Summary */}
                        {parsedAmount > 0 && (
                          <div className="p-4 rounded-2xl bg-white border border-[#EAE3DC] space-y-2 text-xs">
                            <div className="flex justify-between items-center text-[#7A6E67]">
                              <span>Gross Bill Amount:</span>
                              <span className="font-bold text-[#1E1815]">{loyaltyRules.currency} {parsedAmount.toFixed(2)}</span>
                            </div>

                            {directPointsDiscount > 0 && (
                              <div className="flex justify-between items-center text-red-700">
                                <span>Points Redeemed ({pointsToRedeemInput} pts):</span>
                                <span className="font-bold font-mono">-{loyaltyRules.currency} {directPointsDiscount.toFixed(2)}</span>
                              </div>
                            )}

                            <div className="flex justify-between items-center text-emerald-800">
                              <span>Points Customer Will Earn on Bill:</span>
                              <span className="font-black font-mono">+{estimatedPointsToEarn} pts</span>
                            </div>

                            <div className="pt-2 border-t border-[#EAE3DC] flex justify-between items-center">
                              <span className="font-black text-sm text-[#1E1815]">Net Payable by Customer:</span>
                              <span className="font-black text-base text-[#0E331E] font-mono">
                                {loyaltyRules.currency} {netPayable.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}

                        {billErr && (
                          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                            <span>{billErr}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={submittingBill || !invoiceNumber.trim() || !billAmount.trim() || pointsToRedeemInput <= 0}
                          className="w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-black text-xs uppercase tracking-wider sm:tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-center"
                        >
                          {submittingBill ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                              <span>REDEEMING POINTS…</span>
                            </>
                          ) : (
                            <>
                              <Coins className="w-4 h-4 shrink-0" />
                              <span className="break-words">CONFIRM POINT REDEMPTION ({pointsToRedeemInput} PTS = -{loyaltyRules.currency} {directPointsDiscount.toFixed(2)})</span>
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
                          Customer currently has <strong className="text-[#0E331E]">{customer.pointsBalance} points</strong>. A minimum of <strong className="text-[#1E1815]">{loyaltyRules.pointsRequiredForRedemption} points</strong> is required to unlock direct bill cash discount redemption.
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* ============================================================== */}
            {/* ACTION PANEL 4: GIVE VISIT (Direct 1-Click Visit Check-in)     */}
            {/* ============================================================== */}
            {actionMode === "visit" && (
              <div className="pt-2 animate-in fade-in duration-200">
                {!visitSuccessReceipt ? (
                  <div className="p-6 rounded-3xl bg-[#FAF7F4] border border-[#EAE3DC] space-y-6 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#0E331E]/10 text-[#0E331E] flex items-center justify-center shrink-0">
                        <StampIcon className="w-7 h-7 text-[#0E331E]" />
                      </div>
                      <div>
                        <div className="text-[11px] font-black tracking-widest text-[#0E331E] uppercase">
                          OUTLET VISIT CHECK-IN
                        </div>
                        <h3 className="text-xl font-display font-black text-[#1E1815]">
                          Stamp 1 physical visit at {activeBranch.name}
                        </h3>
                        <p className="text-xs text-[#7A6E67] font-medium mt-1">
                          Adds one verified branch visit stamp for {customer.name}. Automatically checks and unlocks any visit-path milestone rewards (e.g. 5th visit free treat).
                        </p>
                      </div>
                    </div>

                    {/* Visits Counter Card */}
                    <div className="p-4 rounded-2xl bg-white border border-[#EAE3DC] flex items-center justify-around text-center shadow-2xs">
                      <div>
                        <div className="text-[10px] font-bold text-[#7A6E67] uppercase">Current Visits</div>
                        <div className="font-display font-black text-2xl text-[#1E1815] mt-0.5">
                          {customer.visitCount}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#0E331E]" />
                      <div>
                        <div className="text-[10px] font-bold text-[#0E331E] uppercase">New Visit Count</div>
                        <div className="font-display font-black text-2xl text-[#0E331E] mt-0.5">
                          {customer.visitCount + 1}
                        </div>
                      </div>
                    </div>

                    {visitErr && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{visitErr}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleGiveVisit}
                        disabled={submittingVisit}
                        className="flex-1 py-4 px-6 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submittingVisit ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>STAMPING VISIT…</span>
                          </>
                        ) : (
                          <>
                            <StampIcon className="w-4 h-4" />
                            <span>CONFIRM VISIT STAMP (+1 VISIT)</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActionMode("points")}
                        className="py-4 px-8 rounded-xl bg-white hover:bg-[#FAF7F4] border border-[#EAE3DC] text-[#7A6E67] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        BACK
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Visit Success Card */
                  <div className="p-7 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-5 animate-in fade-in zoom-in duration-200">
                    <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                      <Check className="w-7 h-7 stroke-[3]" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-2xl text-emerald-950">Visit Stamped Successfully!</h3>
                      <p className="text-xs text-emerald-800 font-medium mt-1">
                        Visit #{visitSuccessReceipt.customer?.visitCount} registered for {customer.name} at {activeBranch.name}.
                      </p>
                    </div>

                    {visitSuccessReceipt.newlyIssuedRewards && visitSuccessReceipt.newlyIssuedRewards.length > 0 && (
                      <div className="max-w-md mx-auto p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left space-y-1.5 animate-in fade-in">
                        <div className="font-black flex items-center gap-1.5 text-amber-950">
                          <PartyPopper className="w-4 h-4 text-amber-600" />
                          <span>Milestone Reward Unlocked!</span>
                        </div>
                        {visitSuccessReceipt.newlyIssuedRewards.map((r: any) => (
                          <div key={r.id} className="font-bold pl-5">
                            • {r.name} - {r.description || "Unlocked and ready to redeem!"}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                      <button
                        onClick={() => {
                          setVisitSuccessReceipt(null);
                          setActionMode("points");
                        }}
                        className="flex-1 py-3.5 px-6 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        GIVE POINTS ON BILL
                      </button>
                      <button
                        onClick={() => {
                          setCustomer(null);
                          setVisitSuccessReceipt(null);
                          setMobileInput("");
                          setQrInput("");
                          setScreen("ready");
                        }}
                        className="flex-1 py-3.5 px-6 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer"
                      >
                        NEXT CUSTOMER
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* ACTION PANEL 3: REDEEM VISIT OFFER (1-Click Deliver/Redeem)    */}
            {/* ============================================================== */}
            {actionMode === "reward" && (
              <div className="pt-2 animate-in fade-in duration-200 space-y-4 sm:space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                  <div className="text-xs font-black tracking-wider uppercase text-[#0E331E] flex items-center gap-2">
                    <Gift className="w-4 h-4 text-[#0E331E] shrink-0" />
                    <span>UNLOCKED VISIT OFFERS &amp; MEMBER GIFTS</span>
                  </div>
                  <span className="text-xs font-bold text-[#7A6E67]">
                    {availableRewards.length} Offer{availableRewards.length !== 1 ? "s" : ""} Available
                  </span>
                </div>

                {rewardSuccessReceipt && (
                  <div className="p-4 sm:p-4.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between text-xs font-medium animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <strong>{rewardSuccessReceipt.message}</strong>
                        <div className="text-[11px] text-emerald-800 mt-0.5">
                          Gift handed over to customer. Updated balance: {rewardSuccessReceipt.customer?.pointsBalance} pts.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setRewardSuccessReceipt(null)}
                      className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {rewardErr && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{rewardErr}</span>
                  </div>
                )}

                {availableRewards.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {availableRewards.map((reward) => {
                      const isBusy = redeemingRewardId === reward.id;
                      return (
                        <div
                          key={reward.id}
                          className="p-4 sm:p-4.5 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] flex flex-col justify-between gap-3.5 shadow-2xs hover:border-[#0E331E]/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-sm sm:text-base text-[#1E1815] leading-snug break-words">{reward.name}</h4>
                              </div>
                              {reward.description && (
                                <p className="text-xs text-[#7A6E67] font-medium mt-1 leading-relaxed">
                                  {reward.description}
                                </p>
                              )}
                              <div className="text-[11px] text-[#0E331E] font-bold mt-1">
                                {reward.isPercent
                                  ? `${reward.value}% Discount Offer`
                                  : reward.value > 0
                                  ? `${loyaltyRules.currency} ${reward.value} Value`
                                  : "Complimentary Item / Milestone Gift"}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase shrink-0">
                              READY
                            </span>
                          </div>

                          <div className="pt-2.5 border-t border-[#EAE3DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <span className="text-[11px] text-[#7A6E67] font-mono">
                              {reward.expiresAt ? `Valid till ${new Date(reward.expiresAt).toLocaleDateString()}` : "No expiry date"}
                            </span>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleRedeemReward(reward.id)}
                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-black text-xs uppercase tracking-wider shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {isBusy ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                                  <span>REDEEMING…</span>
                                </>
                              ) : (
                                <>
                                  <Gift className="w-3.5 h-3.5 shrink-0" />
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
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F4] border border-[#EAE3DC] text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-white border border-[#EAE3DC] flex items-center justify-center mx-auto text-[#7A6E67]">
                      <Gift className="w-6 h-6 text-[#7A6E67]" />
                    </div>
                    <div className="font-bold text-sm text-[#1E1815]">No Unlocked Visit Offers Available</div>
                    <p className="text-xs text-[#7A6E67] max-w-sm mx-auto">
                      {customer.name} currently has no pending visit-path gifts or vouchers. Giving visits or points will unlock upcoming tier treats!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Customer Recent Activity Log */}
            {recentTransactions.length > 0 && (
              <div className="pt-4 border-t border-[#EAE3DC]">
                <div className="text-xs font-black uppercase tracking-wider text-[#7A6E67] mb-2.5 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  <span>Customer Recent Visits &amp; Transactions</span>
                </div>
                <div className="space-y-2">
                  {recentTransactions.slice(0, 10).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedHistoryReceipt(t)}
                      className="p-3.5 rounded-xl bg-[#FAF7F4] hover:bg-[#F3EDE6] border border-[#EAE3DC] hover:border-[#D6CCC2] flex items-center justify-between text-xs gap-3 cursor-pointer transition-all active:scale-[0.99] group"
                      role="button"
                      tabIndex={0}
                      title="Click to view detailed receipt breakdown"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[#1E1815] group-hover:text-[#0E331E] transition-colors flex items-center gap-1.5 flex-wrap">
                          <span>{t.branchName || "Branch Visit"}</span>
                          <span className="font-mono text-[11px] text-[#7A6E67]">#{t.invoiceNumber}</span>
                          <span className="text-[10px] text-[#A0938C] font-normal group-hover:text-[#0E331E]">›</span>
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
                            <span>Discount: -{loyaltyRules.currency} {Number(t.discountGiven).toFixed(2)}</span>
                            {t.redeemedRewards && t.redeemedRewards.length > 0 && (
                              <span className="text-[#0E331E] font-sans text-[10px]">({t.redeemedRewards.join(", ")})</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-[#1E1815]">{loyaltyRules.currency} {Number(t.amount || 0).toFixed(2)}</div>
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
      </div>

      {/* History Receipt Details Modal */}
      {selectedHistoryReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-emerald-200 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200 relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedHistoryReceipt(null)}
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
              <h3 className="font-display font-black text-2xl text-emerald-950">Sale &amp; Points Receipt</h3>
              <p className="text-xs text-emerald-800 font-medium mt-1">
                Invoice #{selectedHistoryReceipt.invoiceNumber} recorded at {selectedHistoryReceipt.branchName || activeBranch?.name || "Outlet"}.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-900 text-[11px] font-medium mt-2">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {new Date(selectedHistoryReceipt.createdAt).toLocaleString("en-US", {
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
                  {loyaltyRules.currency} {Number(selectedHistoryReceipt.grossBill ?? selectedHistoryReceipt.amount ?? 0).toFixed(2)}
                </span>
              </div>

              {Number(selectedHistoryReceipt.discountGiven || 0) > 0 && (
                <div className="flex justify-between items-start text-red-700">
                  <span>
                    Total Discount:
                    {selectedHistoryReceipt.redeemedRewards && selectedHistoryReceipt.redeemedRewards.length > 0 && (
                      <span className="block text-[10px] text-red-600 font-normal">
                        ({selectedHistoryReceipt.redeemedRewards.join(", ")})
                      </span>
                    )}
                  </span>
                  <span className="font-bold font-mono">
                    -{loyaltyRules.currency} {Number(selectedHistoryReceipt.discountGiven).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-[#1E1815] pt-1.5 border-t border-[#EAE3DC]">
                <span className="font-black text-xs text-[#0E331E]">Customer Paid (Net):</span>
                <span className="font-black text-sm text-[#0E331E] font-mono">
                  {loyaltyRules.currency} {Number(
                    selectedHistoryReceipt.amountPaid ??
                    Math.max(0, Number(selectedHistoryReceipt.amount || 0) - Number(selectedHistoryReceipt.discountGiven || 0))
                  ).toFixed(2)}
                </span>
              </div>

              {Number(selectedHistoryReceipt.pointsRedeemed || 0) > 0 && (
                <div className="flex justify-between items-center text-red-700 pt-1.5 border-t border-[#EAE3DC]/60">
                  <span>Points Redeemed:</span>
                  <span className="font-bold font-mono">-{selectedHistoryReceipt.pointsRedeemed} pts</span>
                </div>
              )}

              {Number(selectedHistoryReceipt.pointsEarned || 0) > 0 && (
                <div className="flex justify-between items-center text-emerald-800">
                  <span>Points Awarded:</span>
                  <span className="font-black font-mono">+{selectedHistoryReceipt.pointsEarned} pts</span>
                </div>
              )}

              <div className="flex justify-between items-center text-blue-800 pt-1.5 border-t border-[#EAE3DC]/60">
                <span>Transaction Status:</span>
                <span className="font-black font-mono">Completed &amp; Stamped ✓</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedHistoryReceipt(null)}
              className="w-full py-3 px-6 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              CLOSE RECEIPT
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function OutletPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5EFE0] flex flex-col font-sans">
          <CrmTopHeader activeTab="outlet" />
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-10 h-10 border-3 border-[#0E331E]/20 border-t-[#0E331E] rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-[#7A6E67] uppercase tracking-wider">
              Loading Outlet Terminal…
            </p>
          </div>
        </div>
      }
    >
      <OutletContent />
    </Suspense>
  );
}
