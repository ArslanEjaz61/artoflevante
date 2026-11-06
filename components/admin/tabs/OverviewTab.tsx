"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Receipt,
  TrendingUp,
  Sparkles,
  UserCheck,
  Gift,
  CheckCircle2,
  CreditCard,
  Calendar,
  Clock,
  Store,
  ExternalLink,
  Repeat,
  ArrowRight,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import { formatMoney, formatRelativeTime, DEFAULT_BRANCHES } from "../adminUtils";

interface OverviewTabProps {
  data: any;
  allBranches: any[];
  overviewBranchFilter: string;
  setOverviewBranchFilter: (b: string) => void;
  overviewDateFilter: string;
  setOverviewDateFilter: (d: string) => void;
  setTab: (t: any) => void;
  handleOpenStoreCrm: (b: any) => void;
  cur?: string;
  openCustomerDetail?: (id: string) => void;
}

export default function OverviewTab({
  data,
  allBranches,
  overviewBranchFilter,
  setOverviewBranchFilter,
  overviewDateFilter,
  setOverviewDateFilter,
  setTab,
  handleOpenStoreCrm,
  cur = "AED",
  openCustomerDetail,
}: OverviewTabProps) {
    const metrics = data?.metrics || data?.kpis || {};
  const branchesList = allBranches.length > 0 ? allBranches : DEFAULT_BRANCHES;

  return (
    <>
      <>
              {/* Hero snapshot */}
              {(() => {
                const hour = new Date().getHours();
                const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
                const branchName =
                  overviewBranchFilter !== "all"
                    ? allBranches.find((b: any) => b.id === overviewBranchFilter)?.name
                    : null;
                const claimed = Number(metrics.rewardsClaimed ?? metrics.rewardsRedeemed ?? 0);
                const issued = Number(metrics.rewardsIssued ?? 0);
                const claimRate = issued ? Math.min(100, Math.round((claimed / issued) * 100)) : 0;
                return (
                  <section className="bc-hero" aria-label="Loyalty snapshot">
                    <svg className="bc-hero-lines" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
                      <path d="M0 150 C60 120 90 170 150 130 S250 60 300 110 S370 90 400 60" />
                      <path d="M0 175 C70 150 110 190 170 155 S270 100 320 140 S380 125 400 105" />
                      <path d="M0 120 C50 95 100 140 160 100 S260 30 310 80 S380 60 400 30" />
                    </svg>
                    <div className="bc-hero-top">
                      <span className="bc-hero-pill">
                        <Building2 className="w-3.5 h-3.5" />
                        {branchName || "All outlets"}
                      </span>
                      <span className="bc-hero-pill bc-hero-pill-ghost">
                        {new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <h2 className="bc-hero-greet">
                      {greeting} <span aria-hidden="true">👋</span>
                    </h2>
                    <p className="bc-hero-note">Here&apos;s your loyalty snapshot{branchName ? ` for ${branchName}` : " across all outlets"}.</p>
                    <div className="bc-hero-label">Tracked revenue</div>
                    <div className="bc-hero-value">{formatMoney(cur, metrics.totalRevenue || 0)}</div>
                    <div className="bc-hero-meter" aria-hidden="true">
                      <div style={{ width: `${claimRate}%` }} />
                    </div>
                    <div className="bc-hero-meter-row">
                      <span>
                        {claimed.toLocaleString()} of {issued.toLocaleString()} rewards claimed
                      </span>
                      <b>{claimRate}% claim rate</b>
                    </div>
                    <div className="bc-hero-stats">
                      <div>
                        <span>Members</span>
                        <b>{Number(metrics.totalMembers ?? metrics.totalCustomers ?? 0).toLocaleString()}</b>
                      </div>
                      <div>
                        <span>Visits</span>
                        <b>{Number(metrics.totalVisits ?? 0).toLocaleString()}</b>
                      </div>
                      <div>
                        <span>Avg bill</span>
                        <b>{formatMoney(cur, metrics.avgBill || metrics.avgTransaction || 0)}</b>
                      </div>
                    </div>
                  </section>
                );
              })()}

              {/* Quick Shortcuts Bar (Customer & Stores) */}
              <div className="bg-white border border-[#EAE3DC] rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-wrap items-center gap-2.5">
                {/* Customer Shortcut */}
                <Link
                  href="/crm"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF7F4] hover:bg-[#0E331E] text-[#1E1815] hover:text-white border border-[#EAE3DC] hover:border-[#0E331E] text-xs font-black transition-all shadow-2xs cursor-pointer group"
                  title="Customer Portal"
                >
                  <Users className="w-4 h-4 text-[#0E331E] group-hover:text-white transition-colors" />
                  <span>Customer</span>
                </Link>

                {/* Stores Shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("store-dashboards-grid");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" });
                    } else {
                      setTab("branches");
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E331E]/10 hover:bg-[#0E331E] text-[#0E331E] hover:text-white border border-[#0E331E]/30 text-xs font-black transition-all shadow-2xs cursor-pointer group"
                  title="Store Dashboards"
                >
                  <Building2 className="w-4 h-4 text-[#0E331E] group-hover:text-white transition-colors" />
                  <span>Stores</span>
                </button>
              </div>

              {/* Overview Filter Bar */}
              <div className="bg-white border border-[#EAE3DC] rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Building2 className="w-4 h-4 text-[#143F26] shrink-0" />
                    <span className="text-xs font-bold text-[#7A6E67] uppercase tracking-wider shrink-0">Branch:</span>
                    <select
                      value={overviewBranchFilter}
                      onChange={(e) => setOverviewBranchFilter(e.target.value)}
                      className="w-full sm:w-auto px-3 py-1.5 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] font-bold focus:outline-none focus:border-[#143F26]"
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

                <div className="flex items-center gap-1 sm:gap-1.5 bg-[#FAF7F4] border border-[#EAE3DC] p-1 rounded-xl overflow-x-auto w-full md:w-auto max-w-full custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => setOverviewDateFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${overviewDateFilter === "all"
                        ? "bg-[#0E331E] text-white shadow-xs"
                        : "text-[#7A6E67] hover:text-[#1E1815]"
                      }`}
                  >
                    All Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverviewDateFilter("today")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${overviewDateFilter === "today"
                        ? "bg-[#0E331E] text-white shadow-xs"
                        : "text-[#7A6E67] hover:text-[#1E1815]"
                      }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverviewDateFilter("7days")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${overviewDateFilter === "7days"
                        ? "bg-[#0E331E] text-white shadow-xs"
                        : "text-[#7A6E67] hover:text-[#1E1815]"
                      }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverviewDateFilter("30days")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${overviewDateFilter === "30days"
                        ? "bg-[#0E331E] text-white shadow-xs"
                        : "text-[#7A6E67] hover:text-[#1E1815]"
                      }`}
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>

              {/* Top Executive KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* Metric 1: Total Revenue */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#143F26]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between text-[#7A6E67] mb-2 text-xs font-bold uppercase tracking-wider">
                    <span>Tracked Revenue</span>
                    <Receipt className="w-4 h-4 text-[#143F26]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#1E1815] tracking-tight">
                    {formatMoney(cur, metrics.totalRevenue || 0)}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#1E7A4D] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Avg Bill: {formatMoney(cur, metrics.avgBill || metrics.avgTransaction || 0)}</span>
                  </div>
                </div>

                {/* Metric 2: Total Members */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#C68A1E]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between text-[#7A6E67] mb-2 text-xs font-bold uppercase tracking-wider">
                    <span>Total Members</span>
                    <Users className="w-4 h-4 text-[#C68A1E]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#1E1815] tracking-tight">
                    {metrics.totalMembers ?? metrics.totalCustomers ?? 0}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#1E7A4D] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+{metrics.newMembersLast30Days ?? metrics.newLast30 ?? 0} new (last 30d)</span>
                  </div>
                </div>

                {/* Metric 3: Total Store Visits */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#1E7A4D]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between text-[#7A6E67] mb-2 text-xs font-bold uppercase tracking-wider">
                    <span>Total Visits</span>
                    <UserCheck className="w-4 h-4 text-[#1E7A4D]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#1E1815] tracking-tight">
                    {metrics.totalVisits ?? 0}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#7A6E67]">
                    Repeat Customer Rate:{" "}
                    <span className="font-bold text-[#1E1815]">
                      {metrics.repeatRate ?? metrics.returnRate ?? 0}%
                    </span>
                  </div>
                </div>

                {/* Metric 4: Returning Customers (Repeat Visitors) */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#143F26]/15 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between text-[#7A6E67] mb-2 text-xs font-bold uppercase tracking-wider">
                    <span>Returning Members</span>
                    <Repeat className="w-4 h-4 text-[#143F26]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#143F26] tracking-tight">
                    {metrics.returningCustomers ?? 0}
                  </div>
                  <div className="mt-2 text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{metrics.repeatRate ?? metrics.returnRate ?? 0}% Repeat Visit Rate</span>
                  </div>
                </div>

                {/* Metric 5: Rewards Claimed */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#8B5CF6]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between text-[#7A6E67] mb-2 text-xs font-bold uppercase tracking-wider">
                    <span>Rewards Claimed</span>
                    <Gift className="w-4 h-4 text-[#8B5CF6]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#1E1815] tracking-tight">
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
                      <CreditCard className="w-4 h-4 text-[#143F26]" />
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
                        <div className="text-xl font-black text-[#143F26] mt-0.5">
                          -{Number(metrics.pointsRedeemed || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#143F26]/10 text-[#143F26] flex items-center justify-center font-bold">
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
                      <span className="px-2.5 py-1 rounded-lg bg-[#143F26] text-white font-black text-[10px] uppercase tracking-wider">
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
                            <span className="text-xs font-bold text-[#E5A93C] bg-[#0E331E]/60 px-2.5 py-1 rounded-lg shrink-0 border border-[#D4AF37]/30">
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
                          <div className="w-9 h-9 rounded-xl bg-white border border-[#E5DDD5] flex items-center justify-center font-bold text-xs text-[#143F26] shrink-0">
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

              {/* Returning Customers (Repeat Visitors) Table */}
              <div className="bg-white border border-[#EAE3DC] rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-[#143F26]" />
                        Returning Members Directory
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                        {data?.returningCustomers?.length ?? metrics.returningCustomers ?? 0} Repeat Visitors
                      </span>
                    </div>
                    <p className="text-xs text-[#7A6E67] mt-0.5">
                      Loyal members who have visited Levante 2 or more times. Click on any member to view full visit history.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab("customers")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF7F4] hover:bg-[#143F26] text-[#1E1815] hover:text-white border border-[#EAE3DC] hover:border-[#143F26] text-xs font-bold transition-all shadow-2xs cursor-pointer w-fit"
                  >
                    <span>View All Members</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto w-full custom-scrollbar rounded-2xl border border-[#EAE3DC]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F4] border-b border-[#EAE3DC] text-[#7A6E67] uppercase tracking-wider font-bold text-[11px]">
                      <tr>
                        <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Member</th>
                        <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Mobile &amp; Email</th>
                        <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Total Visits</th>
                        <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Total Spend</th>
                        <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Points Balance</th>
                        <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Home Outlet</th>
                        <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Last Visit</th>
                        <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE8E1] bg-white">
                      {data?.returningCustomers && data.returningCustomers.length > 0 ? (
                        data.returningCustomers.map((c: any) => (
                          <tr
                            key={c.id}
                            onClick={() => openCustomerDetail && openCustomerDetail(c.id)}
                            className="hover:bg-[#FAF7F4] transition-all cursor-pointer group"
                          >
                            <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#143F26]/10 text-[#143F26] font-black text-xs flex items-center justify-center shrink-0">
                                  {c.name ? c.name.charAt(0).toUpperCase() : "M"}
                                </div>
                                <div>
                                  <div className="font-bold text-[#1E1815] group-hover:text-[#143F26] transition-colors">
                                    {c.name || "Member"}
                                  </div>
                                  {c.cardCode && (
                                    <div className="text-[10px] font-mono text-[#8C7F78]">
                                      ID: {c.cardCode}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap font-mono text-xs">
                              <div className="text-[#1E1815] font-bold">{c.mobile || "—"}</div>
                              {c.email && c.email !== "—" && (
                                <div className="text-[10px] text-[#7A6E67] font-sans truncate max-w-[160px]">{c.email}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold font-mono text-xs">
                                <UserCheck className="w-3 h-3 text-emerald-600" />
                                {c.visitCount} visits
                              </span>
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap font-bold text-[#1E1815]">
                              {formatMoney(cur, c.totalSpend)}
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                              <span className="font-black text-[#1E7A4D]">
                                +{c.pointsBalance} pts
                              </span>
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap text-[#7A6E67]">
                              <span className="px-2 py-0.5 rounded-lg bg-[#FAF7F4] border border-[#EAE3DC] font-semibold text-[11px] text-[#4A3F39]">
                                {c.branch || "All Outlets"}
                              </span>
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap text-[#7A6E67] text-[11px]">
                              {formatRelativeTime(c.lastVisitAt)}
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap text-right">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#143F26] group-hover:underline">
                                <span>View Details</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-xs text-[#7A6E67]">
                            No returning members with 2+ visits recorded yet. As customers revisit outlets, they will be listed here.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* All Stores Grid */}
              <div id="store-dashboards-grid" className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm scroll-mt-20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#0E331E]" />
                      All Stores
                    </h2>
                    <p className="text-xs text-[#7A6E67] mt-0.5">
                      Select any branch to launch store CRM or view branch performance.
                    </p>
                  </div>
                  {overviewBranchFilter !== "all" && (
                    <button
                      onClick={() => setOverviewBranchFilter("all")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E331E]/10 text-[#0E331E] hover:bg-[#0E331E] hover:text-white font-bold text-xs transition-all cursor-pointer w-fit"
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
                        onClick={() => handleOpenStoreCrm(b)}
                        className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${isSelected
                            ? "bg-gradient-to-br from-[#0E331E] to-[#0E331E] text-white border-[#0E331E] shadow-md ring-2 ring-[#0E331E]/30"
                            : "bg-[#FAF7F4] hover:bg-white text-[#1E1815] border-[#EAE3DC] hover:border-[#0E331E]/40 hover:shadow-sm"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${isSelected
                                ? "bg-white/20 text-white"
                                : "bg-[#0E331E]/10 text-[#0E331E] group-hover:bg-[#0E331E] group-hover:text-white"
                              }`}
                          >
                            <Store className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${b.crmUrl
                                ? "bg-[#1E7A4D]/10 text-[#1E7A4D]"
                                : "bg-amber-500/10 text-amber-700"
                              }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${b.crmUrl ? "bg-[#1E7A4D]" : "bg-amber-500"}`} />
                            {b.crmUrl ? "CRM Ready" : "Coming Soon"}
                          </span>
                        </div>

                        <div className={`font-black text-sm leading-snug tracking-tight mb-1 ${isSelected ? "text-white" : "text-[#1E1815]"}`}>
                          {b.name}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/10 text-[11px]">
                          <span className={isSelected ? "text-white/80" : "text-[#7A6E67]"}>
                            {b.city || "Dubai"} • #{b.code || b.id}
                          </span>
                          <span className={`font-bold text-[10px] flex items-center gap-1 ${isSelected ? "text-[#F5EFE0]" : "text-[#0E331E]"}`}>
                            {b.crmUrl ? (
                              <>
                                <span>Open CRM</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </>
                            ) : (
                              <>
                                <span>Coming Soon</span>
                                <Clock className="w-2.5 h-2.5 text-amber-600" />
                              </>
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
    </>
  );
}
