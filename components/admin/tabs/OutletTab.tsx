"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import jsQR from "jsqr";
import {
  CreditCard,
  Store,
  Building2,
  RotateCcw,
  Phone,
  Scan,
  Camera,
  AlertCircle,
  User,
  Coins,
  Gift,
  CheckCircle2,
  DollarSign,
  Check,
  History,
  Clock,
  Tag,
  Receipt,
  X,
  UserX,
} from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY, findCountry, normalizeMobile } from "@/lib/mobile";
import { CountryCodePicker } from "@/components/CountryCodePicker";
import { formatMoney, DEFAULT_BRANCHES } from "../adminUtils";
import { formatFullInvoice, getBranchInvoicePrefix } from "@/lib/receiptUtils";

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
      <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
    </svg>
  );
}

interface OutletTabProps {
  allBranches: any[];
  branchesData?: any;
  data?: any;
  loadOverview?: () => void;
  loadVisits?: () => void;
  cur?: string;
}

export default function OutletTab({
  allBranches,
  branchesData,
  data,
  loadOverview,
  loadVisits,
  cur = "AED",
}: OutletTabProps) {
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
  const [outletNotFoundTarget, setOutletNotFoundTarget] = useState<string | null>(null);
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
  const [adminConfirmingReward, setAdminConfirmingReward] = useState<any | null>(null);
  const [adminRewardModalInvoice, setAdminRewardModalInvoice] = useState("");
  const [adminRewardModalBillAmount, setAdminRewardModalBillAmount] = useState("");
  const [adminRewardModalErr, setAdminRewardModalErr] = useState("");

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

      if (outletSearchTab === "phone" && !overrideToken) {
        const country = findCountry(outletCountryCode) || { min: 9, max: 9, name: "UAE" };
        const validE164 = normalizeMobile(outletMobileInput, outletCountryCode);
        if (!validE164) {
          const cleanDigits = outletMobileInput.replace(/\D/g, "");
          setOutletSearchErr(
            outletCountryCode === "971" && !cleanDigits.startsWith("5")
              ? "UAE numbers must start with 5 (e.g. 50 123 4567)."
              : `Please enter a complete ${country.max}-digit mobile number without country code.`
          );
          return;
        }
      }

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
        if (!res.ok) throw new Error(d.error || "No registered customer found with this mobile number.");

        setOutletCustomer(d.customer);
        setOutletNotFoundTarget(null);
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
        setOutletCustomer(null);
        setOutletAvailableRewards([]);
        setOutletRecentTransactions([]);
        const targetDesc = outletSearchTab === "phone" ? `+${outletCountryCode} ${outletMobileInput}` : (tokenToSearch || "scanned QR");
        setOutletNotFoundTarget(targetDesc);
        setOutletSearchErr(err.message || "No registered customer found.");
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
          invoiceNumber: formatFullInvoice(outletInvoiceNumber, allBranches.find((b: any) => b.id === chosenBranchId)?.invoicePrefix || allBranches.find((b: any) => b.id === chosenBranchId)?.code),
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

      loadOverview?.();
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
      loadOverview?.();
      loadVisits?.();
    } catch (err: any) {
      setOutletVisitErr(err.message || "Failed to stamp visit.");
    } finally {
      setOutletSubmittingVisit(false);
    }
  };

  const handleAdminRedeemReward = async (rewardId: string, invoice?: string) => {
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
          invoiceNumber: invoice ? formatFullInvoice(invoice, allBranches.find((b: any) => b.id === chosenBranchId)?.invoicePrefix || allBranches.find((b: any) => b.id === chosenBranchId)?.code) : undefined,
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
            visitCount: d.customer.visitCount !== undefined ? d.customer.visitCount : prev.visitCount,
          }
          : null
      );
      setOutletAvailableRewards(d.availableRewards || []);
      loadOverview?.();
    } catch (err: any) {
      setOutletRewardErr(err.message || "Failed to redeem reward.");
      throw err;
    } finally {
      setOutletRedeemingRewardId(null);
    }
  };

  const handleAdminRedeemDiscountWithBill = async (rewardId: string, invoice: string, amount: number) => {
    if (!outletCustomer) return;
    const availableBranchesList = branchesData?.branches || data?.branches || data?.branchLeaderboard || [];
    const chosenBranchId = outletBranchId || availableBranchesList[0]?.id;
    if (!chosenBranchId) {
      setOutletRewardErr("Please select a branch to apply this discount.");
      return;
    }

    setOutletRedeemingRewardId(rewardId);
    setOutletRewardErr("");
    setOutletRewardSuccessReceipt(null);

    try {
      const res = await fetch("/api/outlet/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: outletCustomer.id,
          branchId: chosenBranchId,
          invoiceNumber: formatFullInvoice(invoice, allBranches.find((b: any) => b.id === chosenBranchId)?.invoicePrefix || allBranches.find((b: any) => b.id === chosenBranchId)?.code),
          amount: amount,
          redeemRewardId: rewardId,
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to apply discount and record transaction.");

      setOutletSuccessReceipt(d);
      setOutletCustomer((prev: any) =>
        prev
          ? {
            ...prev,
            pointsBalance: d.customer.pointsBalance,
            visitCount: d.customer.visitCount,
            totalSpend: (prev.totalSpend || 0) + amount,
          }
          : null
      );
      if (d.availableRewards) {
        setOutletAvailableRewards(d.availableRewards);
      } else {
        setOutletAvailableRewards((prev: any) => prev.filter((r: any) => r.id !== rewardId));
      }
      if (d.transaction) {
        const chosenBranchName = allBranches.find((b: any) => b.id === chosenBranchId)?.name || "Branch Visit";
        setOutletRecentTransactions((prev: any) => [
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
      loadOverview?.();
    } catch (err: any) {
      setOutletRewardErr(err.message || "Failed to apply discount.");
      throw err;
    } finally {
      setOutletRedeemingRewardId(null);
    }
  };

  

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

  

  const selectedAdminBranch =
              allBranches.find((b: any) => b.id === (outletBranchId || allBranches[0]?.id)) ||
              allBranches[0];
  const adminDynamicInvoicePrefix = getBranchInvoicePrefix(
    selectedAdminBranch?.invoicePrefix || selectedAdminBranch?.code || "BC"
  );

            return (
              <div className="space-y-6">
                {/* 1. Branch Selector Top Bar */}
                <div className="bg-white border border-[#EAE3DC] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0E331E] to-[#0A2617] text-white flex items-center justify-center font-bold shadow-md shadow-[#0E331E]/20 shrink-0">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black tracking-widest text-[#0E331E] uppercase flex items-center gap-1.5">
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
                      <Building2 className="w-4 h-4 text-[#0E331E] shrink-0 ml-1" />
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
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white text-xs font-black shadow-sm transition-all cursor-pointer shrink-0"
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
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:text-[#0E331E] hover:border-[#0E331E]/40 shadow-2xs transition-colors cursor-pointer"
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
                          ? "bg-[#FAF7F4] border-[#0E331E] shadow-xs ring-1 ring-[#0E331E]"
                          : "bg-white border-[#EAE3DC] hover:border-[#B5AAA2] hover:bg-[#FAF7F4]/50"
                        }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${outletSearchTab === "phone" ? "bg-[#0E331E]/10 text-[#0E331E]" : "bg-[#FAF7F4] text-[#7A6E67]"
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
                          ? "bg-[#FAF7F4] border-[#0E331E] shadow-xs ring-1 ring-[#0E331E]"
                          : "bg-white border-[#EAE3DC] hover:border-[#B5AAA2] hover:bg-[#FAF7F4]/50"
                        }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${outletSearchTab === "qr" ? "bg-[#0E331E]/10 text-[#0E331E]" : "bg-[#FAF7F4] text-[#7A6E67]"
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
                  {outletSearchTab === "phone" && (() => {
                    const adminCountry = findCountry(outletCountryCode) || { min: 9, max: 9, name: "UAE" };
                    const cleanDigits = outletMobileInput.replace(/\D/g, "");
                    const isAdminMobileValid = Boolean(normalizeMobile(outletMobileInput, outletCountryCode));

                    return (
                      <form onSubmit={handleAdminLookupCustomer} className="animate-in fade-in duration-150">
                        <label className="block text-xs font-black text-[#1E1815] mb-2" htmlFor="admin-pos-phone">
                          Mobile number
                        </label>

                        <div className="flex gap-2.5 items-center">
                          <CountryCodePicker
                            value={outletCountryCode}
                            onChange={(val) => {
                              setOutletCountryCode(val);
                              if (outletSearchErr) setOutletSearchErr("");
                            }}
                            disabled={outletSearchBusy}
                          />

                          <input
                            id="admin-pos-phone"
                            type="tel"
                            placeholder={adminCountry.placeholder || `Enter ${adminCountry.max}-digit number`}
                            value={outletMobileInput}
                            maxLength={adminCountry.max}
                            onChange={(e) => {
                              let raw = e.target.value.replace(/\D/g, "");
                              if (raw.startsWith("00")) raw = raw.slice(2);
                              if (raw.startsWith(outletCountryCode) && raw.length > adminCountry.max) {
                                raw = raw.slice(outletCountryCode.length);
                              }
                              if (raw.startsWith("0")) raw = raw.replace(/^0+/, "");
                              setOutletMobileInput(raw.slice(0, adminCountry.max));
                              if (!raw) {
                                setOutletSearchErr("");
                                setOutletNotFoundTarget(null);
                              }
                            }}
                            autoFocus
                            required
                            className="flex-1 min-w-0 px-4 h-11 bg-white border border-[#EAE3DC] rounded-xl text-base font-bold text-[#1E1815] placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#0E331E] shadow-2xs"
                          />

                          <button
                            type="submit"
                            disabled={!isAdminMobileValid || outletSearchBusy}
                            title={!isAdminMobileValid ? `Please enter complete ${adminCountry.max}-digit number` : "Open Customer Profile"}
                            className="py-3 px-6 h-11 rounded-xl bg-[#092015] hover:bg-[#092015] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-2"
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
                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#7A6E67] font-medium">
                          <span>
                            Enter number without country code{" "}
                            <strong className="text-[#092015]">
                              ({outletCountryCode === "971" ? "e.g. 50 123 4567" : `${adminCountry.max} digits`})
                            </strong>
                          </span>
                          <span className={`font-mono font-bold ${isAdminMobileValid ? "text-emerald-700" : "text-[#092015]"}`}>
                            {cleanDigits.length}/{adminCountry.max}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#7A6E67] font-medium mt-2.5">
                          Choose the country code and enter the complete number without the first zero. Half or incomplete numbers cannot be opened.
                        </div>
                      </form>
                    );
                  })()}

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
                            className="w-full px-4 py-3.5 bg-white border border-[#EAE3DC] rounded-xl font-mono text-sm font-bold text-[#1E1815] uppercase placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#0E331E] shadow-2xs"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={!outletQrInput.trim() || outletSearchBusy}
                          className="py-3.5 px-7 rounded-xl bg-[#092015] hover:bg-[#092015] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
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
                          <Camera className="w-4 h-4 text-[#0E331E]" />
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
                      <button onClick={() => { setOutletSearchErr(""); setOutletNotFoundTarget(null); }} className="cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* NOT FOUND CARD (IN PLACE OF THE PREVIOUS CUSTOMER) */}
              {!outletCustomer && outletNotFoundTarget && (
                <div className="bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-10 border border-[#EAE3DC] shadow-sm text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="w-16 h-16 rounded-full bg-[#0E331E]/10 text-[#0E331E] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <UserX className="w-8 h-8 text-[#0E331E]" />
                  </div>
                  <h3 className="font-display font-black text-lg sm:text-xl text-[#1E1815]">
                    Customer Not Found
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7A6E67] font-medium mt-1 max-w-md mx-auto">
                    No registered member found for{" "}
                    <strong className="text-[#1E1815] font-mono font-bold">
                      {outletNotFoundTarget}
                    </strong>
                    .
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC] text-[11px] text-[#7A6E67] font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 text-[#0E331E] shrink-0" />
                    <span>Please double-check the entered number or scan customer's membership QR card.</span>
                  </div>
                </div>
              )}

              {/* 3. Active Customer POS Processing Desk */}
              {outletCustomer && (
                <div className="bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-8 border border-[#EAE3DC] shadow-md space-y-6">
                  {/* Top Customer Summary Header Card (Exact image design) */}
                  <div className="bg-[#FAF5F0] rounded-2xl p-4.5 sm:p-5 border border-[#EFE8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Circular Avatar Icon */}
                      <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full border-2 border-[#0E331E] flex items-center justify-center text-[#0E331E] shrink-0 bg-white shadow-2xs">
                        <User className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8] text-[#0E331E]" />
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
                          Invoice # + bill amount
                        </p>
                      </div>
                      {outletActionMode === "points" && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#0E331E]" />
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
                          ? "bg-[#FAF7F4] border-[#0E331E] shadow-sm ring-2 ring-[#0E331E]/20"
                          : "bg-white border-[#EAE3DC] hover:border-[#0E331E]/50 hover:bg-[#FAF7F4]/40"
                        }`}
                    >
                      <div className="text-[#0E331E] mb-3">
                        <Coins className="w-7 h-7 text-[#0E331E]" />
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
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#0E331E]" />
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
                          ? "bg-[#FAF7F4] border-[#0E331E] shadow-sm ring-2 ring-[#0E331E]/20"
                          : "bg-white border-[#EAE3DC] hover:border-[#0E331E]/50 hover:bg-[#FAF7F4]/40"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3 text-[#0E331E]">
                        <Gift className="w-7 h-7 text-[#0E331E] stroke-[1.8]" />
                        {outletAvailableRewards.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0E331E]/10 text-[#0E331E] text-[9px] font-black uppercase">
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
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#0E331E]" />
                      )}
                    </button>
                  </div>

                  {/* ACTION PANEL 1: GIVE POINTS */}
                  {outletActionMode === "points" && (
                    <div className="pt-2 animate-in fade-in duration-200">
                      {!outletSuccessReceipt ? (
                        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#FAF7F4] border border-[#EAE3DC] space-y-5">
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#1E1815]">Give Loyalty Points on Dine-in Bill</h4>
                            <p className="text-xs text-[#7A6E67] mt-0.5">
                              Enter invoice # and bill amount to award points and stamp visit.
                            </p>
                          </div>

                          <form onSubmit={handleAdminRecordSale} className="space-y-4 pt-2 border-t border-[#EAE3DC]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                              <div>
                                <label className="block text-xs font-black text-[#1E1815] mb-2" htmlFor="admin-inv-input">
                                  Invoice / Receipt #
                                </label>
                                <div className="flex rounded-xl border border-[#EAE3DC] overflow-hidden focus-within:border-[#0E331E] bg-white shadow-2xs">
                                  <span className="inline-flex items-center px-3 sm:px-3.5 bg-[#FAF7F4] border-r border-[#EAE3DC] text-xs sm:text-sm font-mono font-black text-[#0E331E] select-none tracking-wider whitespace-nowrap">
                                    {adminDynamicInvoicePrefix}
                                  </span>
                                  <input
                                    id="admin-inv-input"
                                    type="text"
                                    placeholder="88280"
                                    value={outletInvoiceNumber}
                                    onChange={(e) => setOutletInvoiceNumber(e.target.value.replace(/[^0-9a-zA-Z-]/g, '').toUpperCase())}
                                    required
                                    className="flex-1 px-3.5 sm:px-4 py-2.5 sm:py-3.5 bg-transparent font-mono text-sm font-bold text-[#1E1815] placeholder:text-[#B5AAA2] focus:outline-none"
                                  />
                                </div>
                                <p className="text-[10px] text-[#7A6E67] font-mono mt-1">
                                  Branch prefix is auto-fixed. Enter receipt serial (e.g. 88280).
                                </p>
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
                                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3.5 bg-white border border-[#EAE3DC] rounded-xl text-base font-bold text-[#1E1815] placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#0E331E] shadow-2xs"
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
                                  <span className="font-black font-mono text-base text-[#0E331E]">
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
                                className="flex-1 py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl bg-[#092015] hover:bg-[#092015] text-white font-black text-xs uppercase tracking-wider sm:tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-center"
                              >
                                {outletSubmittingBill ? (
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
                              <span className="font-black text-sm text-[#0E331E] font-mono">{outletSuccessReceipt.customer?.pointsBalance} pts</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setOutletCustomer(null);
                              setOutletSuccessReceipt(null);
                              setOutletMobileInput("");
                              setOutletQrInput("");
                            }}
                            className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-xl bg-[#092015] hover:bg-[#092015] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer"
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
                        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#FFFBF0] border border-[#E5A93C]/40 space-y-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5A93C]/30">
                            <div className="flex items-start sm:items-center gap-2.5">
                              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-[#C68A1E] shrink-0 mt-0.5 sm:mt-0" />
                              <div>
                                <h4 className="font-extrabold text-sm sm:text-base text-[#1E1815] leading-tight">Redeem Points for Direct Cash Discount</h4>
                                <p className="text-xs text-[#7A6E67] font-medium mt-0.5">
                                  Customer currently has <strong className="text-[#0E331E] font-bold">{outletCustomer.pointsBalance} points</strong> available.
                                </p>
                              </div>
                            </div>
                            <span className="self-start sm:self-auto px-3 py-1 rounded-lg bg-[#E5A93C]/20 text-[#0E331E] text-xs font-black shrink-0">
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
                                            ? "bg-[#0E331E] text-white border-[#0E331E] shadow-xs ring-2 ring-[#0E331E]/20"
                                            : "bg-white text-[#1E1815] border-[#EAE3DC] hover:border-[#0E331E]"
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
                                            : "bg-white text-[#0E331E] border-[#EAE3DC] hover:border-[#0E331E]"
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
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2">
                                <label className="text-xs text-[#7A6E67] font-semibold shrink-0">Custom Points:</label>
                                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
                                    className="w-full sm:w-48 px-3.5 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                                  />
                                  {outletPointsToRedeem > 0 && (
                                    <span className="text-xs font-bold text-emerald-800 shrink-0">
                                      = -{outletLoyaltyRules.currency} {outletDirectPointsDiscount.toFixed(2)} discount
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Bill inputs */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-3 border-t border-[#E5A93C]/30">
                                <div>
                                  <label className="block text-xs font-black text-[#1E1815] mb-2" htmlFor="admin-redeem-inv-input">
                                    Invoice / Receipt #
                                  </label>
                                  <div className="flex rounded-xl border border-[#EAE3DC] overflow-hidden focus-within:border-[#0E331E] bg-white shadow-2xs">
                                    <span className="inline-flex items-center px-3 sm:px-3.5 bg-[#FAF7F4] border-r border-[#EAE3DC] text-xs sm:text-sm font-mono font-black text-[#0E331E] select-none tracking-wider whitespace-nowrap">
                                      {adminDynamicInvoicePrefix}
                                    </span>
                                    <input
                                      id="admin-redeem-inv-input"
                                      type="text"
                                      placeholder="88280"
                                      value={outletInvoiceNumber}
                                      onChange={(e) => setOutletInvoiceNumber(e.target.value.replace(/[^0-9a-zA-Z-]/g, '').toUpperCase())}
                                      required
                                      className="flex-1 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-transparent font-mono text-sm font-bold text-[#1E1815] placeholder:text-[#B5AAA2] focus:outline-none"
                                    />
                                  </div>
                                  <p className="text-[10px] text-[#7A6E67] font-mono mt-1">
                                    Prefix is auto-fixed. Cashier only enters receipt serial (e.g. 88280).
                                  </p>
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
                                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white border border-[#EAE3DC] rounded-xl text-base font-bold text-[#1E1815] placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#0E331E] shadow-2xs"
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
                                    <span className="font-black text-base text-[#0E331E] font-mono">
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
                                className="w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl bg-[#092015] hover:bg-[#092015] text-white font-black text-xs uppercase tracking-wider sm:tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-center"
                              >
                                {outletSubmittingBill ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                                    <span>REDEEMING POINTS…</span>
                                  </>
                                ) : (
                                  <>
                                    <Coins className="w-4 h-4 shrink-0" />
                                    <span className="break-words">CONFIRM POINT REDEMPTION ({outletPointsToRedeem} PTS = -{outletLoyaltyRules.currency} {outletDirectPointsDiscount.toFixed(2)})</span>
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
                                Customer currently has <strong className="text-[#0E331E]">{outletCustomer.pointsBalance} points</strong>. A minimum of <strong className="text-[#1E1815]">{outletLoyaltyRules.pointsRequiredForRedemption} points</strong> is required to unlock direct bill cash discount redemption.
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
                              <span className="font-black text-sm text-[#0E331E] font-mono">{outletSuccessReceipt.customer?.pointsBalance} pts</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setOutletCustomer(null);
                              setOutletSuccessReceipt(null);
                              setOutletMobileInput("");
                              setOutletQrInput("");
                            }}
                            className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-xl bg-[#092015] hover:bg-[#092015] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer"
                          >
                            NEXT CUSTOMER
                          </button>
                        </div>
                      )}
                    </div>
                  )}



                  {/* ACTION PANEL 3: REDEEM VISIT OFFER */}
                  {outletActionMode === "reward" && (
                    <div className="pt-2 animate-in fade-in duration-200 space-y-4 sm:space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                        <div className="text-xs font-black tracking-wider uppercase text-[#0E331E] flex items-center gap-2">
                          <Gift className="w-4 h-4 text-[#0E331E] shrink-0" />
                          <span>UNLOCKED VISIT OFFERS &amp; MEMBER GIFTS</span>
                        </div>
                        <span className="text-xs font-bold text-[#7A6E67]">
                          {outletAvailableRewards.length} Offer{outletAvailableRewards.length !== 1 ? "s" : ""} Available
                        </span>
                      </div>

                      {outletRewardSuccessReceipt && (
                        <div className="p-4 sm:p-4.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between text-xs font-medium animate-in fade-in">
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
                                className="p-4 sm:p-4.5 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] flex flex-col justify-between gap-3 shadow-2xs hover:border-[#0E331E]/40 transition-colors"
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
                                          ? `${outletLoyaltyRules.currency} ${reward.value} Value`
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
                                    onClick={() => {
                                      setAdminConfirmingReward(reward);
                                      setAdminRewardModalInvoice("");
                                      setAdminRewardModalBillAmount("");
                                      setAdminRewardModalErr("");
                                    }}
                                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#092015] hover:bg-[#092015] text-white font-black text-xs uppercase tracking-wider shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
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
                                  <span>Discount: -{outletLoyaltyRules.currency} {Number(t.discountGiven).toFixed(2)}</span>
                                  {t.redeemedRewards && t.redeemedRewards.length > 0 && (
                                    <span className="text-[#0E331E] font-sans text-[10px]">({t.redeemedRewards.join(", ")})</span>
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
                        <span className="font-black text-xs text-[#0E331E]">Customer Paid (Net):</span>
                        <span className="font-black text-sm text-[#0E331E] font-mono">
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
                      className="w-full py-3 px-6 rounded-xl bg-[#092015] hover:bg-[#092015] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99] cursor-pointer"
                    >
                      CLOSE RECEIPT
                    </button>
                  </div>
                </div>
              )}

              {/* Admin Gift / Voucher Redemption Modal */}
              {adminConfirmingReward && outletCustomer && (() => {
                const availableBranchesList: any[] = branchesData?.branches || data?.branches || data?.branchLeaderboard || [];
                const chosenBranchId = outletBranchId || availableBranchesList[0]?.id;
                const activeBranchObj = availableBranchesList.find((b: any) => b.id === chosenBranchId) || { name: "Selected Outlet" };
                const isDiscount = Boolean(adminConfirmingReward.isPercent || (adminConfirmingReward.value && adminConfirmingReward.value > 0));
                const parsedBill = parseFloat(adminRewardModalBillAmount) || 0;
                const calculatedDiscount = isDiscount
                  ? adminConfirmingReward.isPercent
                    ? Math.round(parsedBill * (adminConfirmingReward.value / 100) * 100) / 100
                    : Math.min(parsedBill, adminConfirmingReward.value)
                  : 0;
                const netPayable = Math.max(0, parsedBill - calculatedDiscount);
                const ptsEarned =
                  outletLoyaltyRules.spendAedForPoints > 0
                    ? Math.floor((parsedBill / outletLoyaltyRules.spendAedForPoints) * (outletLoyaltyRules.pointsEarnedPerSpend || 1))
                    : 0;
                const isBusy = outletRedeemingRewardId === adminConfirmingReward.id;

                return (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl border border-[#EAE3DC] space-y-4 sm:space-y-5 animate-in zoom-in-95 duration-200 relative max-h-[92vh] overflow-y-auto">
                      {/* Close Button */}
                      <button
                        type="button"
                        onClick={() => setAdminConfirmingReward(null)}
                        disabled={isBusy}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF7F4] hover:bg-[#F3EDE6] text-[#7A6E67] flex items-center justify-center transition-colors cursor-pointer"
                        title="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Icon Header */}
                      <div className="text-center space-y-1.5">
                        <div className="w-12 h-12 rounded-full bg-[#0E331E]/10 text-[#0E331E] flex items-center justify-center mx-auto shadow-xs">
                          {isDiscount ? <Tag className="w-6 h-6 text-[#0E331E]" /> : <Gift className="w-6 h-6 text-[#0E331E]" />}
                        </div>

                        <div>
                          <div className="text-[10px] font-black tracking-widest text-[#0E331E] uppercase">
                            {isDiscount ? "REDEEM DISCOUNT VOUCHER" : "CONFIRM GIFT REDEMPTION"}
                          </div>
                          <h3 className="font-display font-black text-xl text-[#1E1815] mt-0.5">
                            {isDiscount ? "Apply Discount to Bill" : "Redeem & Deliver Gift"}
                          </h3>
                          <p className="text-xs text-[#7A6E67] font-medium mt-1">
                            {isDiscount
                              ? `Apply discount to member order at ${activeBranchObj.name}.`
                              : `Hand over complimentary treat to member ${outletCustomer.name}.`}
                          </p>
                        </div>
                      </div>

                      {/* Reward Snapshot Card */}
                      <div className="bg-[#FAF7F4] rounded-2xl p-4 border border-[#EAE3DC] text-xs text-left space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
                            {isDiscount ? (adminConfirmingReward.isPercent ? `${adminConfirmingReward.value}% OFF` : `${outletLoyaltyRules.currency} ${adminConfirmingReward.value} OFF`) : "COMPLIMENTARY GIFT"}
                          </span>
                          <span className="font-mono text-[11px] text-[#7A6E67]">
                            {adminConfirmingReward.expiresAt ? `Exp: ${new Date(adminConfirmingReward.expiresAt).toLocaleDateString()}` : "No expiry"}
                          </span>
                        </div>

                        <div>
                          <div className="font-extrabold text-sm text-[#1E1815]">{adminConfirmingReward.name}</div>
                          {adminConfirmingReward.description && (
                            <div className="text-[11px] text-[#7A6E67] mt-0.5 font-medium">{adminConfirmingReward.description}</div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-[#EAE3DC] flex items-center justify-between text-[11px]">
                          <span className="text-[#7A6E67]">Recipient Member:</span>
                          <span className="font-bold text-[#1E1815]">{outletCustomer.name} ({outletCustomer.mobile})</span>
                        </div>
                      </div>

                      {/* Form Section */}
                      {isDiscount ? (
                        <div className="space-y-3.5 text-left">
                          <div>
                            <label className="block text-[11px] font-bold text-[#1E1815] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                              <Receipt className="w-3.5 h-3.5 text-[#0E331E]" />
                              <span>Invoice / Bill Number <strong className="text-[#0E331E]">*</strong></span>
                            </label>
                            <div className="flex rounded-xl border border-[#EAE3DC] overflow-hidden focus-within:border-[#0E331E] bg-white shadow-2xs">
                              <span className="inline-flex items-center px-3 bg-[#FAF7F4] border-r border-[#EAE3DC] text-xs font-mono font-black text-[#0E331E] select-none tracking-wider whitespace-nowrap">
                                {adminDynamicInvoicePrefix}
                              </span>
                              <input
                                type="text"
                                value={adminRewardModalInvoice}
                                onChange={(e) => {
                                  setAdminRewardModalInvoice(e.target.value.replace(/[^0-9a-zA-Z-]/g, '').toUpperCase());
                                  setAdminRewardModalErr("");
                                }}
                                placeholder="88280"
                                className="flex-1 px-3.5 py-2.5 bg-transparent text-xs font-mono font-bold text-[#1E1815] focus:outline-none placeholder:text-[#BDB0A4]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#1E1815] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-[#0E331E]" />
                              <span>Total Gross Bill ({outletLoyaltyRules.currency}) <strong className="text-[#0E331E]">*</strong></span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={adminRewardModalBillAmount}
                              onChange={(e) => {
                                setAdminRewardModalBillAmount(e.target.value);
                                setAdminRewardModalErr("");
                              }}
                              placeholder="e.g. 150.00"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE3DC] bg-white text-xs font-mono font-bold text-[#1E1815] focus:border-[#0E331E] focus:ring-2 focus:ring-[#0E331E]/15 outline-none transition-all placeholder:text-[#BDB0A4]"
                            />
                          </div>

                          {/* Live Calculation Preview */}
                          {parsedBill > 0 ? (
                            <div className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#0E331E]/20 shadow-xs space-y-2 text-xs">
                              <div className="flex justify-between items-center text-[#7A6E67]">
                                <span>Gross Bill:</span>
                                <span className="font-mono font-bold text-[#1E1815]">{outletLoyaltyRules.currency} {parsedBill.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[#0E331E] font-bold">
                                <span>Discount ({adminConfirmingReward.isPercent ? `${adminConfirmingReward.value}%` : `${outletLoyaltyRules.currency} ${adminConfirmingReward.value}`}):</span>
                                <span className="font-mono">-{outletLoyaltyRules.currency} {calculatedDiscount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-[#EAE3DC] font-black text-sm">
                                <span className="text-[#1E1815]">Customer Net Payable:</span>
                                <span className="font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">{outletLoyaltyRules.currency} {netPayable.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center pt-1 text-[11px] text-emerald-800 font-bold">
                                <span>Points to Earn (Gross Bill):</span>
                                <span className="font-mono">+{ptsEarned} pts</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC] text-center text-[11px] text-[#7A6E67]">
                              Enter bill amount above to see live discounted payable total.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3.5 text-left">
                          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-medium space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-amber-900">
                              <Gift className="w-4 h-4 text-amber-700" />
                              <span>Complimentary Gift Handover</span>
                            </div>
                            <p className="text-[11px] text-amber-900 leading-relaxed">
                              Confirming this handover will mark the gift as redeemed for <strong>{outletCustomer.name}</strong> and advance their visit cycle.
                            </p>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#1E1815] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                              <Receipt className="w-3.5 h-3.5 text-[#7A6E67]" />
                              <span>Invoice / Order Reference # (Optional)</span>
                            </label>
                            <div className="flex rounded-xl border border-[#EAE3DC] overflow-hidden focus-within:border-[#0E331E] bg-white shadow-2xs">
                              <span className="inline-flex items-center px-3 bg-[#FAF7F4] border-r border-[#EAE3DC] text-xs font-mono font-black text-[#0E331E] select-none tracking-wider whitespace-nowrap">
                                {adminDynamicInvoicePrefix}
                              </span>
                              <input
                                type="text"
                                value={adminRewardModalInvoice}
                                onChange={(e) => {
                                  setAdminRewardModalInvoice(e.target.value.replace(/[^0-9a-zA-Z-]/g, '').toUpperCase());
                                  setAdminRewardModalErr("");
                                }}
                                placeholder="88280 (optional)"
                                className="flex-1 px-3.5 py-2.5 bg-transparent text-xs font-mono font-bold text-[#1E1815] focus:outline-none placeholder:text-[#BDB0A4]"
                              />
                            </div>
                            <p className="text-[10px] text-[#7A6E67] font-mono mt-1">
                              Prefix is auto-fixed ({adminDynamicInvoicePrefix}). Enter receipt serial if applicable.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {(adminRewardModalErr || outletRewardErr) && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 text-left">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>{adminRewardModalErr || outletRewardErr}</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2.5 sm:gap-3 pt-1">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setAdminConfirmingReward(null)}
                          className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-[#FAF7F4] border border-[#EAE3DC] text-[#7A6E67] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          CANCEL
                        </button>

                        <button
                          type="button"
                          disabled={isBusy || (isDiscount && (!adminRewardModalInvoice.trim() || parsedBill <= 0))}
                          onClick={async () => {
                            setAdminRewardModalErr("");
                            if (isDiscount) {
                              if (!adminRewardModalInvoice.trim()) {
                                setAdminRewardModalErr("Please enter the invoice number.");
                                return;
                              }
                              if (parsedBill <= 0) {
                                setAdminRewardModalErr("Please enter a valid bill amount greater than 0.");
                                return;
                              }
                              try {
                                await handleAdminRedeemDiscountWithBill(adminConfirmingReward.id, adminRewardModalInvoice.trim(), parsedBill);
                                setAdminConfirmingReward(null);
                                setOutletActionMode("points");
                              } catch (e: any) {
                                setAdminRewardModalErr(e.message || "Failed to record discounted transaction.");
                              }
                            } else {
                              try {
                                await handleAdminRedeemReward(adminConfirmingReward.id, adminRewardModalInvoice.trim() ? formatFullInvoice(adminRewardModalInvoice.trim(), selectedAdminBranch?.invoicePrefix || selectedAdminBranch?.code) : undefined);
                                setAdminConfirmingReward(null);
                              } catch (e: any) {
                                setAdminRewardModalErr(e.message || "Failed to deliver gift.");
                              }
                            }
                          }}
                          className="flex-1 py-3 px-4 rounded-xl bg-[#092015] hover:bg-[#092015] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {isBusy ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                              <span>PROCESSING…</span>
                            </>
                          ) : isDiscount ? (
                            <>
                              <Check className="w-4 h-4 stroke-[2.5]" />
                              <span>{parsedBill > 0 ? `CONFIRM & PAY ${outletLoyaltyRules.currency} ${netPayable.toFixed(2)}` : "CONFIRM & APPLY"}</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 stroke-[2.5]" />
                              <span>YES, CONFIRM &amp; DELIVER</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
}
