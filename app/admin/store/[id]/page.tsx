"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Phone,
  Clock,
  MapPin,
  TrendingUp,
  Receipt,
  Users,
  Coins,
  Ticket,
  Percent,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  DollarSign,
  Search,
  ChevronRight,
  Store,
  Sparkles,
  AlertCircle,
  Copy,
  PartyPopper,
  UserCheck,
  X,
  Mail,
  Gift,
  QrCode,
  History,
  Award,
  Ban,
  User,
} from "lucide-react";

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

function formatMoney(cur: string, n: number): string {
  return `${cur} ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default function StoreCrmPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  // Active Store Tab
  const [activeTab, setActiveTab] = useState<"live" | "customers" | "transactions" | "staff" | "offers">("live");

  // Search in tables
  const [customerSearch, setCustomerSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [copiedBranchCode, setCopiedBranchCode] = useState(false);
  const [copiedCouponCode, setCopiedCouponCode] = useState(false);

  // Customer Detail Modal State
  const [selectedCustId, setSelectedCustId] = useState<string | null>(null);
  const [custDetail, setCustDetail] = useState<any | null>(null);
  const [loadingCustDetail, setLoadingCustDetail] = useState(false);
  const [custDetailTab, setCustDetailTab] = useState<"overview" | "transactions" | "rewards" | "visits" | "ledger">("overview");

  const fetchStoreData = useCallback(async (isRefresh = false) => {
    if (!storeId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/store/${encodeURIComponent(storeId)}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load store data.");
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load store data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  const handleCopyBranchCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedBranchCode(true);
    setTimeout(() => setCopiedBranchCode(false), 2000);
  };

  const handleCopyCoupon = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCouponCode(true);
    setTimeout(() => setCopiedCouponCode(false), 2000);
  };

  const openCustomerDetail = async (id: string) => {
    if (!id) return;
    setSelectedCustId(id);
    setLoadingCustDetail(true);
    setCustDetailTab("overview");

    // Check if customer exists in current store customers list as initial data
    const localCust = data?.customers?.find((c: any) => c.id === id);
    if (localCust) {
      setCustDetail(localCust);
    }

    try {
      const r = await fetch(`/api/admin/customers/${encodeURIComponent(id)}`);
      const d = await r.json();
      if (r.ok && d.customer) {
        setCustDetail(d.customer);
      }
    } catch {
      // Keep local data as fallback
    } finally {
      setLoadingCustDetail(false);
    }
  };

  const closeCustomerDetail = () => {
    setSelectedCustId(null);
    setCustDetail(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0DBDB] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-10 h-10 border-3 border-[#801313]/20 border-t-[#801313] rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#7A6E67] uppercase tracking-wider">
          Loading Store CRM Data…
        </p>
      </div>
    );
  }

  if (error || !data?.store) {
    return (
      <div className="min-h-screen bg-[#F0DBDB] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 mb-4 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-[#1E1815] mb-2">Store CRM Not Found</h2>
        <p className="text-xs text-[#7A6E67] max-w-sm mb-6 leading-relaxed">
          {error || "Could not retrieve store information for the selected branch."}
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#801313] hover:bg-[#6A0F0F] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Stores CRM</span>
        </Link>
      </div>
    );
  }

  const { store, metrics, staff, offers, customers, transactions, visits, birthdays, currency } = data;

  // Filtered lists
  const filteredCustomers = customers.filter((c: any) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.mobile?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  const filteredTransactions = transactions.filter((t: any) => {
    if (!transactionSearch.trim()) return true;
    const q = transactionSearch.toLowerCase();
    return (
      t.invoiceNumber?.toLowerCase().includes(q) ||
      t.customerName?.toLowerCase().includes(q) ||
      t.customerMobile?.includes(q) ||
      t.staffName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F0DBDB] text-[#1E1815] flex flex-col font-sans selection:bg-[#801313] selection:text-white pb-16">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ===================== TOP BREADCRUMB & BACK ===================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#EAE3DC] hover:border-[#801313]/40 text-[#5C504A] hover:text-[#801313] text-xs font-black shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Stores CRM</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchStoreData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#DCD3CB] bg-white hover:bg-[#FAF7F4] text-xs font-bold text-[#4A3F39] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#801313]" : ""}`} />
              <span>Refresh Store</span>
            </button>

            <Link
              href={`/outlet?code=${encodeURIComponent(store.code || store.id)}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#801313] hover:bg-[#6A0F0F] text-white text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Launch {store.name} POS</span>
            </Link>
          </div>
        </div>

        {/* ===================== STORE HERO BANNER ===================== */}
        <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 shadow-sm mb-6 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Store Identity */}
            <div className="flex items-start sm:items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bc-roundel.png"
                alt="Bombay Chowpatty"
                className="w-16 h-16 sm:w-18 sm:h-18 object-contain shrink-0 drop-shadow-sm"
              />

              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF5EE] border border-[#C8E6D3] text-[#1E7A4D] text-[11px] font-black tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E7A4D] animate-pulse" />
                    ONLINE · POS ACTIVE
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F4] border border-[#EAE3DC] text-[#7A6E67] font-mono text-[11px] font-black">
                    Branch Code #{store.code}
                  </span>
                  <span className="text-xs text-[#7A6E67] font-bold">
                    {store.city || "Dubai"}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-display font-black text-[#1E1815] tracking-tight">
                  {store.name} CRM
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7A6E67] font-medium mt-1">
                  {store.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#801313]" />
                      <span>{store.address}</span>
                    </span>
                  )}
                  {store.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#801313]" />
                      <span>{store.phone}</span>
                    </span>
                  )}
                  {store.hours && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#801313]" />
                      <span>{store.hours}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Codes Cards (Branch Code + 24H Coupon) */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 1. Branch Outlet Code */}
              <div className="bg-[#FAF7F4] border border-[#EAE3DC] p-3.5 rounded-2xl flex items-center justify-between gap-4 min-w-[200px] shadow-2xs">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#801313] flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    <span>Branch Outlet Code</span>
                  </div>
                  <div className="font-mono font-black text-lg text-[#1E1815] tracking-wider mt-0.5">
                    {store.code}
                  </div>
                  <div className="text-[10px] text-[#7A6E67]">
                    Tap to copy POS code
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyBranchCode(store.code)}
                  className="p-2.5 rounded-xl bg-white hover:bg-[#FAF7F4] border border-[#DCD3CB] text-[#1E1815] transition-all cursor-pointer shadow-2xs"
                  title="Copy Branch Outlet Code"
                >
                  {copiedBranchCode ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#7A6E67]" />
                  )}
                </button>
              </div>

              {/* 2. Daily 24H Visit Coupon */}
              {store.dailyCode && (
                <div className="bg-[#FAF7F4] border border-[#EAE3DC] p-3.5 rounded-2xl flex items-center justify-between gap-4 min-w-[220px] shadow-2xs">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-[#801313] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>24H Visit Coupon</span>
                    </div>
                    <div className="font-mono font-black text-lg text-[#1E1815] tracking-wider mt-0.5">
                      {store.dailyCode}
                    </div>
                    <div className="text-[10px] text-[#7A6E67]">
                      Tap to copy check-in code
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCoupon(store.dailyCode)}
                    className="p-2.5 rounded-xl bg-white hover:bg-[#FAF7F4] border border-[#DCD3CB] text-[#1E1815] transition-all cursor-pointer shadow-2xs"
                    title="Copy 24H Coupon Code"
                  >
                    {copiedCouponCode ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#7A6E67]" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===================== KEY STORE METRICS GRID ===================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
          {/* Total Revenue */}
          <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4.5 shadow-2xs">
            <div className="text-[10.5px] uppercase tracking-wider text-[#7A6E67] font-black mb-1 flex items-center justify-between">
              <span>Total Revenue</span>
              <DollarSign className="w-3.5 h-3.5 text-[#801313]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#1E1815] tracking-tight">
              {formatMoney(currency, metrics.totalRevenue)}
            </div>
            <div className="text-[11px] text-[#1E7A4D] font-bold mt-1">
              +{formatMoney(currency, metrics.todayRevenue)} today
            </div>
          </div>

          {/* Total Visits */}
          <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4.5 shadow-2xs">
            <div className="text-[10.5px] uppercase tracking-wider text-[#7A6E67] font-black mb-1 flex items-center justify-between">
              <span>Total Visits</span>
              <Receipt className="w-3.5 h-3.5 text-[#801313]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#1E1815] tracking-tight">
              {metrics.totalVisits.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#1E7A4D] font-bold mt-1">
              +{metrics.todayVisits} visits today
            </div>
          </div>

          {/* Registered Members */}
          <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4.5 shadow-2xs">
            <div className="text-[10.5px] uppercase tracking-wider text-[#7A6E67] font-black mb-1 flex items-center justify-between">
              <span>Store Members</span>
              <Users className="w-3.5 h-3.5 text-[#801313]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#1E1815] tracking-tight">
              {metrics.registeredCustomers.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#7A6E67] font-bold mt-1">
              Active local club
            </div>
          </div>

          {/* Points Awarded */}
          <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4.5 shadow-2xs">
            <div className="text-[10.5px] uppercase tracking-wider text-[#7A6E67] font-black mb-1 flex items-center justify-between">
              <span>Points Issued</span>
              <Coins className="w-3.5 h-3.5 text-[#801313]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#1E1815] tracking-tight">
              {metrics.totalPointsEarned.toLocaleString()} <span className="text-xs">pts</span>
            </div>
            <div className="text-[11px] text-[#1E7A4D] font-bold mt-1">
              +{metrics.todayPoints} pts today
            </div>
          </div>

          {/* Average Bill */}
          <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4.5 shadow-2xs">
            <div className="text-[10.5px] uppercase tracking-wider text-[#7A6E67] font-black mb-1 flex items-center justify-between">
              <span>Avg Bill</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#801313]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#1E1815] tracking-tight">
              {formatMoney(currency, metrics.avgBill)}
            </div>
            <div className="text-[11px] text-[#7A6E67] font-bold mt-1">
              Per order average
            </div>
          </div>

          {/* Discounts Given */}
          <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4.5 shadow-2xs">
            <div className="text-[10.5px] uppercase tracking-wider text-[#7A6E67] font-black mb-1 flex items-center justify-between">
              <span>Discounts Saved</span>
              <Percent className="w-3.5 h-3.5 text-[#801313]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#1E1815] tracking-tight">
              {formatMoney(currency, metrics.totalDiscounts)}
            </div>
            <div className="text-[11px] text-[#7A6E67] font-bold mt-1">
              Member savings
            </div>
          </div>
        </div>

        {/* ===================== STORE NAVIGATION TABS ===================== */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-[#EAE3DC]">
          <button
            type="button"
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === "live"
                ? "bg-[#801313] text-white shadow-xs"
                : "bg-white text-[#5C504A] hover:bg-[#FAF7F4] border border-[#EAE3DC]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Today&apos;s Activity &amp; Stream ({transactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("customers")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === "customers"
                ? "bg-[#801313] text-white shadow-xs"
                : "bg-white text-[#5C504A] hover:bg-[#FAF7F4] border border-[#EAE3DC]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Store Members ({customers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === "transactions"
                ? "bg-[#801313] text-white shadow-xs"
                : "bg-white text-[#5C504A] hover:bg-[#FAF7F4] border border-[#EAE3DC]"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Sales Ledger ({transactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === "staff"
                ? "bg-[#801313] text-white shadow-xs"
                : "bg-white text-[#5C504A] hover:bg-[#FAF7F4] border border-[#EAE3DC]"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Staff Tills ({staff.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("offers")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === "offers"
                ? "bg-[#801313] text-white shadow-xs"
                : "bg-white text-[#5C504A] hover:bg-[#FAF7F4] border border-[#EAE3DC]"
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Offers &amp; Campaigns ({offers.length})</span>
          </button>
        </div>

        {/* ===================== TAB 1: TODAY'S LIVE STREAM & ACTIVITY ===================== */}
        {activeTab === "live" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Feed List (2 Cols) */}
            <div className="lg:col-span-2 bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1E7A4D] animate-ping" />
                    Live Store Stream &amp; Sales
                  </h2>
                  <p className="text-xs text-[#7A6E67] mt-0.5">
                    Real-time transaction feed processed at {store.name} (Tap any member to view profile)
                  </p>
                </div>
                <span className="text-xs font-bold text-[#801313]">
                  {transactions.length} orders recorded
                </span>
              </div>

              {transactions.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF7F4] rounded-2xl border border-dashed border-[#EAE3DC]">
                  <Receipt className="w-8 h-8 text-[#7A6E67] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-[#7A6E67]">
                    No transactions recorded at this store yet today.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 15).map((t: any) => (
                    <div
                      key={t.id}
                      onClick={() => t.customerId && openCustomerDetail(t.customerId)}
                      className="p-4 rounded-2xl bg-[#FAF7F4] hover:bg-white border border-[#EAE3DC] hover:border-[#801313]/30 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#EAE3DC] group-hover:border-[#801313]/30 flex items-center justify-center font-bold text-xs text-[#801313] shrink-0 shadow-2xs">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-[#1E1815] group-hover:text-[#801313] flex items-center gap-2 transition-colors">
                            <span>{t.customerName}</span>
                            <span className="text-[11px] font-mono text-[#7A6E67]">
                              {t.customerMobile}
                            </span>
                          </div>
                          <div className="text-xs text-[#7A6E67] flex items-center gap-2 mt-0.5">
                            <span>Inv #{t.invoiceNumber}</span>
                            <span>•</span>
                            <span>By: {t.staffName}</span>
                            <span>•</span>
                            <span>{formatRelativeTime(t.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-[#EAE3DC]/60">
                        <div className="font-black text-sm text-[#1E1815]">
                          {formatMoney(currency, t.amount)}
                        </div>
                        <div className="text-xs font-black text-[#1E7A4D]">
                          +{t.pointsEarned} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Store Summary & Birthdays */}
            <div className="space-y-6">
              {/* Today's Stats Summary Card */}
              <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-sm text-[#1E1815] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#801313]" />
                  <span>Performance Summary</span>
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-[#EAE3DC]/60">
                    <span className="text-[#7A6E67] font-medium">Today&apos;s Revenue:</span>
                    <span className="font-black text-[#1E1815] font-mono">{formatMoney(currency, metrics.todayRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#EAE3DC]/60">
                    <span className="text-[#7A6E67] font-medium">Past 7 Days Sales:</span>
                    <span className="font-black text-[#1E1815] font-mono">{formatMoney(currency, metrics.past7Revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#EAE3DC]/60">
                    <span className="text-[#7A6E67] font-medium">Past 30 Days Sales:</span>
                    <span className="font-black text-[#1E1815] font-mono">{formatMoney(currency, metrics.past30Revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#EAE3DC]/60">
                    <span className="text-[#7A6E67] font-medium">Total Store Check-ins:</span>
                    <span className="font-black text-[#1E1815] font-mono">{visits.length} logged</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-[#7A6E67] font-medium">Active POS Tills:</span>
                    <span className="font-black text-[#1E7A4D] font-mono">{staff.filter((s: any) => s.isActive).length} active</span>
                  </div>
                </div>
              </div>

              {/* Upcoming Birthdays at this store */}
              <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-sm text-[#1E1815] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-[#801313]" />
                  <span>Store Birthdays ({birthdays.length})</span>
                </h3>
                <p className="text-xs text-[#7A6E67] mb-4">
                  Members registered at {store.name} celebrating this month.
                </p>

                {birthdays.length === 0 ? (
                  <p className="text-xs text-[#7A6E67] italic">No birthdays this month.</p>
                ) : (
                  <div className="space-y-2.5">
                    {birthdays.map((b: any) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => openCustomerDetail(b.id)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F4] hover:bg-[#801313]/5 border border-[#EAE3DC] text-xs transition-colors cursor-pointer text-left"
                      >
                        <div className="font-bold text-[#1E1815] hover:text-[#801313]">{b.name}</div>
                        <div className="font-black text-[#801313] font-mono">Day {b.day}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: STORE CUSTOMERS ===================== */}
        {activeTab === "customers" && (
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#801313]" />
                  Store Members &amp; Loyalty Accounts ({filteredCustomers.length})
                </h2>
                <p className="text-xs text-[#7A6E67] mt-0.5">
                  Customers registered with home branch {store.name} or transacted here. (Click any row to open full member profile)
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search name, mobile, email…"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1E1815] focus:outline-none focus:border-[#801313]"
                />
                <Search className="w-4 h-4 text-[#7A6E67] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF7F4] rounded-2xl border border-dashed border-[#EAE3DC]">
                <p className="text-xs font-bold text-[#7A6E67]">
                  No matching members found for this store.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EAE3DC] text-[#7A6E67] font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Member Name</th>
                      <th className="py-3 px-3">Mobile</th>
                      <th className="py-3 px-3">Points Balance</th>
                      <th className="py-3 px-3">Total Visits</th>
                      <th className="py-3 px-3">Total Spend</th>
                      <th className="py-3 px-3">Last Visit</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DC]/60">
                    {filteredCustomers.map((c: any) => (
                      <tr
                        key={c.id}
                        onClick={() => openCustomerDetail(c.id)}
                        className="hover:bg-[#801313]/5 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-3 font-bold text-[#1E1815] group-hover:text-[#801313] transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#801313]/10 text-[#801313] flex items-center justify-center font-black text-[11px] shrink-0">
                              {c.name ? c.name.slice(0, 1).toUpperCase() : "M"}
                            </div>
                            <span>{c.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-[#7A6E67]">
                          {c.mobile}
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-[#801313]">
                          {c.pointsBalance} pts
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#1E1815]">
                          {c.visitCount}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#1E1815]">
                          {formatMoney(currency, Number(c.totalSpend || 0))}
                        </td>
                        <td className="py-3 px-3 text-[#7A6E67]">
                          {formatRelativeTime(c.lastVisitAt)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white group-hover:bg-[#801313] group-hover:text-white border border-[#EAE3DC] text-[11px] font-bold text-[#801313] shadow-2xs transition-all">
                            <span>Details</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: TRANSACTIONS LEDGER ===================== */}
        {activeTab === "transactions" && (
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#801313]" />
                  Sales &amp; Transaction Ledger ({filteredTransactions.length})
                </h2>
                <p className="text-xs text-[#7A6E67] mt-0.5">
                  Complete invoice history stamped at {store.name} (Click customer to open profile)
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search invoice, customer, cashier…"
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1E1815] focus:outline-none focus:border-[#801313]"
                />
                <Search className="w-4 h-4 text-[#7A6E67] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF7F4] rounded-2xl border border-dashed border-[#EAE3DC]">
                <p className="text-xs font-bold text-[#7A6E67]">
                  No matching transactions found for this store.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EAE3DC] text-[#7A6E67] font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Invoice #</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Mobile</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Points Earned</th>
                      <th className="py-3 px-3">Cashier</th>
                      <th className="py-3 px-3">Date / Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DC]/60">
                    {filteredTransactions.map((t: any) => (
                      <tr
                        key={t.id}
                        onClick={() => t.customerId && openCustomerDetail(t.customerId)}
                        className="hover:bg-[#801313]/5 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-[#1E1815]">
                          #{t.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#1E1815] group-hover:text-[#801313] transition-colors">
                          {t.customerName}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#7A6E67]">
                          {t.customerMobile}
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-[#1E1815]">
                          {formatMoney(currency, t.amount)}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#1E7A4D]">
                          +{t.pointsEarned} pts
                        </td>
                        <td className="py-3 px-3 text-[#7A6E67]">
                          {t.staffName}
                        </td>
                        <td className="py-3 px-3 text-[#7A6E67]">
                          {new Date(t.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 4: STAFF & TILLS ===================== */}
        {activeTab === "staff" && (
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
            <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-[#801313]" />
              Store POS Cashiers &amp; Accounts ({staff.length})
            </h2>
            <p className="text-xs text-[#7A6E67] mb-6">
              Assigned till accounts authorized for {store.name}
            </p>

            {staff.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF7F4] rounded-2xl border border-dashed border-[#EAE3DC]">
                <p className="text-xs font-bold text-[#7A6E67]">
                  No staff accounts specifically mapped to this branch. (General admin access applies).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {staff.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-4.5 rounded-2xl border border-[#EAE3DC] bg-[#FAF7F4] hover:bg-white transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#801313]/10 text-[#801313] font-bold text-xs flex items-center justify-center">
                        {s.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          s.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {s.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>

                    <div className="font-extrabold text-sm text-[#1E1815]">{s.name}</div>
                    <div className="text-xs text-[#7A6E67] font-mono">@{s.username}</div>
                    <div className="text-[11px] text-[#7A6E67] mt-2 pt-2 border-t border-[#EAE3DC]/60 flex justify-between">
                      <span>Role: {s.role}</span>
                      <span>Last Login: {formatRelativeTime(s.lastLogin)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 5: STORE OFFERS ===================== */}
        {activeTab === "offers" && (
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
            <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2 mb-1">
              <Ticket className="w-4 h-4 text-[#801313]" />
              Promotions &amp; Offers for {store.name} ({offers.length})
            </h2>
            <p className="text-xs text-[#7A6E67] mb-6">
              Marketing campaigns and targeted discounts applicable at this location.
            </p>

            {offers.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF7F4] rounded-2xl border border-dashed border-[#EAE3DC]">
                <p className="text-xs font-bold text-[#7A6E67]">
                  No targeted campaigns configured for this store. Standard UAE rewards apply.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {offers.map((o: any) => (
                  <div
                    key={o.id}
                    className="p-5 rounded-2xl border border-[#EAE3DC] bg-[#FAF7F4] hover:bg-white transition-all shadow-2xs"
                  >
                    <div className="font-black text-sm text-[#1E1815] mb-1">{o.name}</div>
                    <p className="text-xs text-[#7A6E67] mb-3">{o.description}</p>
                    <div className="text-xs font-bold text-[#801313]">
                      Value: {o.isPercent ? `${o.value}% OFF` : `${currency} ${o.value} OFF`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ===================== CUSTOMER DETAIL MODAL ===================== */}
      {selectedCustId && custDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl sm:rounded-4xl border border-[#EAE3DC] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#EAE3DC] flex items-center justify-between bg-[#FAF7F4] shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#801313] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                  {custDetail.name ? custDetail.name.slice(0, 2).toUpperCase() : "CU"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-[#1E1815]">
                      {custDetail.name}
                    </h2>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        custDetail.isBlocked
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {custDetail.isBlocked ? "BLOCKED" : "ACTIVE MEMBER"}
                    </span>
                  </div>
                  <div className="text-xs text-[#7A6E67] flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 font-medium">
                    <span className="font-mono">{custDetail.mobile}</span>
                    {custDetail.email && <span>• {custDetail.email}</span>}
                    <span>• Registered: {new Date(custDetail.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCustomerDetail}
                className="p-2 rounded-xl bg-white hover:bg-[#EFE9E2] border border-[#EAE3DC] text-[#7A6E67] hover:text-[#1E1815] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Quick Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:p-6 bg-white border-b border-[#EAE3DC] shrink-0">
              <div className="p-3 bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#7A6E67]">
                  Points Balance
                </div>
                <div className="text-lg font-black text-[#801313] mt-0.5">
                  {custDetail.pointsBalance} <span className="text-xs font-bold">pts</span>
                </div>
                <div className="text-[10.5px] text-[#7A6E67]">
                  ≈ {formatMoney(currency, (custDetail.pointsBalance / 100) * 5)} value
                </div>
              </div>

              <div className="p-3 bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#7A6E67]">
                  Total Visits
                </div>
                <div className="text-lg font-black text-[#1E1815] mt-0.5">
                  {custDetail.visitCount} visits
                </div>
                <div className="text-[10.5px] text-[#7A6E67]">
                  Last: {formatRelativeTime(custDetail.lastVisitAt)}
                </div>
              </div>

              <div className="p-3 bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#7A6E67]">
                  Total Spend
                </div>
                <div className="text-lg font-black text-[#1E1815] mt-0.5">
                  {formatMoney(currency, Number(custDetail.totalSpend || 0))}
                </div>
                <div className="text-[10.5px] text-[#7A6E67]">
                  Lifetime sales
                </div>
              </div>

              <div className="p-3 bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#7A6E67]">
                  Home Store
                </div>
                <div className="text-sm font-black text-[#1E1815] truncate mt-1">
                  {custDetail.homeBranch?.name || store.name}
                </div>
                <div className="text-[10.5px] text-[#7A6E67]">
                  {custDetail.homeBranch?.city || store.city || "Dubai"}
                </div>
              </div>
            </div>

            {/* Modal Nav Tabs */}
            <div className="px-6 pt-3 flex items-center gap-2 border-b border-[#EAE3DC] bg-white shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setCustDetailTab("overview")}
                className={`px-3.5 py-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  custDetailTab === "overview"
                    ? "border-[#801313] text-[#801313]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                }`}
              >
                Profile Overview
              </button>

              <button
                type="button"
                onClick={() => setCustDetailTab("transactions")}
                className={`px-3.5 py-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  custDetailTab === "transactions"
                    ? "border-[#801313] text-[#801313]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                }`}
              >
                Invoices &amp; Purchases ({custDetail.transactions?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setCustDetailTab("rewards")}
                className={`px-3.5 py-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  custDetailTab === "rewards"
                    ? "border-[#801313] text-[#801313]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                }`}
              >
                Vouchers &amp; Gifts ({custDetail.rewards?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setCustDetailTab("visits")}
                className={`px-3.5 py-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  custDetailTab === "visits"
                    ? "border-[#801313] text-[#801313]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                }`}
              >
                Check-ins ({custDetail.visits?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setCustDetailTab("ledger")}
                className={`px-3.5 py-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  custDetailTab === "ledger"
                    ? "border-[#801313] text-[#801313]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                }`}
              >
                Points Audit ({custDetail.ledger?.length || 0})
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {loadingCustDetail ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-3 border-[#801313]/20 border-t-[#801313] rounded-full animate-spin mb-3" />
                  <p className="text-xs font-bold text-[#7A6E67]">Loading full member history…</p>
                </div>
              ) : (
                <>
                  {/* SUB-TAB 1: Overview */}
                  {custDetailTab === "overview" && (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl space-y-2">
                          <div className="font-extrabold text-xs text-[#1E1815] mb-2 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-[#801313]" />
                            <span>Contact &amp; Account Details</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                            <span className="text-[#7A6E67]">Full Name:</span>
                            <span className="font-bold text-[#1E1815]">{custDetail.name}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                            <span className="text-[#7A6E67]">Phone Number:</span>
                            <span className="font-mono font-bold text-[#1E1815]">{custDetail.mobile}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                            <span className="text-[#7A6E67]">Email Address:</span>
                            <span className="font-medium text-[#1E1815]">{custDetail.email || "—"}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-[#7A6E67]">Birthday:</span>
                            <span className="font-bold text-[#1E1815]">
                              {custDetail.birthday ? new Date(custDetail.birthday).toLocaleDateString() : "—"}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl space-y-2">
                          <div className="font-extrabold text-xs text-[#1E1815] mb-2 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-[#801313]" />
                            <span>Loyalty Activity Summary</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                            <span className="text-[#7A6E67]">Home Location:</span>
                            <span className="font-bold text-[#1E1815]">{custDetail.homeBranch?.name || store.name}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                            <span className="text-[#7A6E67]">Member Since:</span>
                            <span className="font-medium text-[#1E1815]">
                              {new Date(custDetail.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                            <span className="text-[#7A6E67]">Total Stamped Visits:</span>
                            <span className="font-bold text-[#1E1815]">{custDetail.visitCount} visits</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-[#7A6E67]">Card QR Token:</span>
                            <span className="font-mono font-black text-[#801313]">
                              {custDetail.cardCode || "ACTIVE"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: Transactions */}
                  {custDetailTab === "transactions" && (
                    <div className="space-y-3">
                      {(!custDetail.transactions || custDetail.transactions.length === 0) ? (
                        <p className="text-xs text-[#7A6E67] italic text-center py-6">
                          No transaction history available.
                        </p>
                      ) : (
                        custDetail.transactions.map((t: any) => (
                          <div
                            key={t.id}
                            className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-[#1E1815]">
                                Inv #{t.invoiceNumber}
                                <span className="font-normal text-[#7A6E67] ml-2">
                                  {t.branch?.name || store.name}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#7A6E67] mt-0.5">
                                {new Date(t.createdAt).toLocaleString()} • Staff: {t.staffName || "Cashier"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-sm text-[#1E1815]">
                                {formatMoney(currency, t.amount)}
                              </div>
                              <div className="font-black text-xs text-[#1E7A4D]">
                                +{t.pointsEarned} pts
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* SUB-TAB 3: Rewards */}
                  {custDetailTab === "rewards" && (
                    <div className="space-y-3">
                      {(!custDetail.rewards || custDetail.rewards.length === 0) ? (
                        <p className="text-xs text-[#7A6E67] italic text-center py-6">
                          No reward vouchers issued yet.
                        </p>
                      ) : (
                        custDetail.rewards.map((r: any) => (
                          <div
                            key={r.id}
                            className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#801313]/10 text-[#801313] flex items-center justify-center shrink-0">
                                <Gift className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-[#1E1815]">{r.name}</div>
                                <div className="text-[11px] text-[#7A6E67] mt-0.5">
                                  Issued: {new Date(r.issuedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                  r.status === "REDEEMED"
                                    ? "bg-gray-200 text-gray-700"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {r.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* SUB-TAB 4: Check-in Visits */}
                  {custDetailTab === "visits" && (
                    <div className="space-y-2.5">
                      {(!custDetail.visits || custDetail.visits.length === 0) ? (
                        <p className="text-xs text-[#7A6E67] italic text-center py-6">
                          No daily visit check-ins recorded.
                        </p>
                      ) : (
                        custDetail.visits.map((v: any) => (
                          <div
                            key={v.id}
                            className="p-3 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC] flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-[#1E1815]">
                                {v.branch?.name || store.name} Check-in
                              </div>
                              <div className="text-[11px] text-[#7A6E67]">
                                {new Date(v.createdAt).toLocaleString()} • Method: {v.checkInMethod || "QR"}
                              </div>
                            </div>
                            <div className="font-mono font-bold text-[#1E7A4D]">
                              +{v.pointsEarned || 1} pt
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* SUB-TAB 5: Points Audit Ledger */}
                  {custDetailTab === "ledger" && (
                    <div className="space-y-2.5">
                      {(!custDetail.ledger || custDetail.ledger.length === 0) ? (
                        <p className="text-xs text-[#7A6E67] italic text-center py-6">
                          No points ledger events recorded.
                        </p>
                      ) : (
                        custDetail.ledger.map((l: any) => (
                          <div
                            key={l.id}
                            className="p-3 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC] flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-[#1E1815] capitalize">
                                {l.reason?.replace(/_/g, " ") || "Points Event"}
                              </div>
                              <div className="text-[11px] text-[#7A6E67]">
                                {new Date(l.createdAt).toLocaleString()} {l.note ? `• ${l.note}` : ""}
                              </div>
                            </div>
                            <div
                              className={`font-mono font-black text-sm ${
                                l.delta > 0 ? "text-[#1E7A4D]" : "text-[#801313]"
                              }`}
                            >
                              {l.delta > 0 ? `+${l.delta}` : l.delta} pts
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
