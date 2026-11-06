"use client";

import React from "react";
import { Check, AlertCircle, Search, Store, X } from "lucide-react";

interface VisitsTabProps {
  visitsData: any;
  visitMetrics: any;
  visitSearch: string;
  setVisitSearch: (s: string) => void;
  visitBranchFilter: string;
  setVisitBranchFilter: (b: string) => void;
  visitDateFilter: string;
  setVisitDateFilter: (d: string) => void;
  visitMsg: { type: string; text: string } | null;
  setVisitMsg: (v: any) => void;
  allBranches: any[];
}

export default function VisitsTab({
  visitsData,
  visitMetrics,
  visitSearch,
  setVisitSearch,
  visitBranchFilter,
  setVisitBranchFilter,
  visitDateFilter,
  setVisitDateFilter,
  visitMsg,
  setVisitMsg,
  allBranches,
}: VisitsTabProps) {
  return (
    <>
      <div className="space-y-4 sm:space-y-6">
              {visitMsg && (
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${visitMsg.type === "ok"
                    ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                    : "bg-[#143F26]/10 text-[#143F26] border border-[#143F26]/30"
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
                  <div className="text-[10px] sm:text-[11px] font-bold text-[#7A6E67] uppercase tracking-wider">
                    Total Visits
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#1E1815] mt-1">
                    {visitMetrics.totalVisits ?? 0}
                  </div>
                  <div className="text-[10px] text-[#1E7A4D] font-semibold mt-1">
                    Verified Check-ins
                  </div>
                </div>

                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
                  <div className="text-[10px] sm:text-[11px] font-bold text-[#7A6E67] uppercase tracking-wider">
                    Today&apos;s Check-ins
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#143F26] mt-1">
                    {visitMetrics.todayVisits ?? 0}
                  </div>
                  <div className="text-[10px] text-[#7A6E67] font-semibold mt-1">
                    Since Midnight
                  </div>
                </div>

                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
                  <div className="text-[10px] sm:text-[11px] font-bold text-[#7A6E67] uppercase tracking-wider">
                    Unique Customers Today
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#C68A1E] mt-1">
                    {visitMetrics.uniqueCustomersToday ?? 0}
                  </div>
                  <div className="text-[10px] text-[#7A6E67] font-semibold mt-1">
                    Individual Diners
                  </div>
                </div>

                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
                  <div className="text-[10px] sm:text-[11px] font-bold text-[#7A6E67] uppercase tracking-wider">
                    Top Visited Outlet
                  </div>
                  <div className="text-xs sm:text-sm font-black text-[#1E1815] mt-2 truncate">
                    {visitMetrics.topBranchName || "None"}
                  </div>
                  <div className="text-[10px] text-[#7A6E67] font-semibold mt-1">
                    Leading Foot Traffic
                  </div>
                </div>
              </div>

              {/* Customer Visits Ledger Card */}
              <div className="bg-white border border-[#EAE3DC] rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm space-y-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-3 border-t border-[#EAE3DC]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search customer, phone, branch, or code…"
                      value={visitSearch}
                      onChange={(e) => setVisitSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#143F26]"
                    />
                    <Search className="w-4 h-4 text-[#8C7F78] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div>
                    <select
                      value={visitBranchFilter}
                      onChange={(e) => setVisitBranchFilter(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#143F26]"
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
                      className="w-full px-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#143F26]"
                    >
                      <option value="all">All Dates History</option>
                      <option value="today">Today Only (Since 00:00)</option>
                      <option value="7days">Past 7 Days</option>
                      <option value="30days">Past 30 Days</option>
                    </select>
                  </div>
                </div>

                {/* Visits Table */}
                <div className="overflow-x-auto w-full custom-scrollbar rounded-2xl border border-[#EAE3DC] mt-2">
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
                        visitsData.map((v: any) => (
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
                                <Store className="w-3.5 h-3.5 text-[#143F26]" />
                                <span className="font-bold text-xs text-[#1E1815]">
                                  {v.branch?.name}
                                </span>
                                <span className="text-[10px] font-mono text-[#8C7F78]">
                                  ({v.branch?.code})
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F4] border border-[#EAE3DC] font-mono font-bold text-[11px] text-[#143F26]">
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
                              ) : v.checkInMethod === "RECEIPT_SCAN" ? (
                                <span className="px-2 py-0.5 rounded-full bg-[#B45309]/10 text-[#B45309] border border-[#B45309]/20 text-[10px] font-black uppercase">
                                  Receipt Scan
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
    </>
  );
}
