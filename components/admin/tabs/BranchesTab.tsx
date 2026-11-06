"use client";

import Link from "next/link";

import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Building2,
  Plus,
  Search,
  Filter,
  Store,
  LayoutDashboard,
  ExternalLink,
  Clock,
  Ticket,
  Copy,
  RotateCw,
  MapPin,
  Phone,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { formatExpiryTime, generateRandomCouponCode, toDatetimeLocal, formatMoney } from "../adminUtils";

interface BranchesTabProps {
  branchMsg: { type: string; text: string } | null;
  setBranchMsg: (v: any) => void;
  allBranches: any[];
  branchSearch: string;
  setBranchSearch: (s: string) => void;
  branchCityFilter: string;
  setBranchCityFilter: (s: string) => void;
  setShowCreateBranchModal: (v: boolean) => void;
  setBranchForm: React.Dispatch<React.SetStateAction<any>>;
  rotatingBranchId: string | null;
  copiedCode: string | null;
  handleOpenStoreCrm: (b: any) => void;
  copyToClipboard: (text: string) => void;
  handleRotateBranchCode: (id: string) => void;
  handleToggleBranch: (b: any) => void;
  openEditBranch: (b: any) => void;
  openDeleteBranch: (b: any) => void;
  data?: any;
  cur?: string;
}

export default function BranchesTab({
  branchMsg,
  setBranchMsg,
  allBranches,
  branchSearch,
  setBranchSearch,
  branchCityFilter,
  setBranchCityFilter,
  setShowCreateBranchModal,
  setBranchForm,
  rotatingBranchId,
  copiedCode,
  handleOpenStoreCrm,
  copyToClipboard,
  handleRotateBranchCode,
  handleToggleBranch,
  openEditBranch,
  openDeleteBranch,
  data,
  cur = "AED",
}: BranchesTabProps) {
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

  return (
    <>
      <div className="space-y-6">
              {branchMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm ${branchMsg.type === "ok"
                    ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                    : "bg-[#143F26]/10 text-[#143F26] border border-[#143F26]/30"
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
              <div className="bg-white border border-[#EAE3DC] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#143F26] to-[#0A2617] flex items-center justify-center font-bold text-white shadow-md shadow-[#143F26]/30 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#1E1815] flex items-center gap-2">
                        Branch Locations &amp; Outlets
                      </h2>
                      <p className="text-xs text-[#7A6E67] mt-0.5">
                        Manage network outlets, operating hours, staff allocations, and branch details.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const initialCode = generateRandomCouponCode();
                        setBranchForm({
                          code: "",
                          invoicePrefix: "",
                          name: "",
                          nameAr: "",
                          city: "Dubai",
                          address: "",
                          addressAr: "",
                          phone: "",
                          hours: "10:00 AM – 11:00 PM",
                          crmUrl: "",
                          isActive: true,
                          dailyCode: initialCode,
                          dailyCodeExpiresAt: toDatetimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
                        });
                        setBranchMsg(null);
                        setShowCreateBranchModal(true);
                      }}
                      className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#143F26] to-[#0A2617] hover:from-[#143F26] text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Branch</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Branch Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-3.5 sm:p-4 shadow-sm">
                  <div className="text-[11px] sm:text-xs font-bold text-[#7A6E67] uppercase">Total Outlets</div>
                  <div className="text-xl sm:text-2xl font-black text-[#1E1815] mt-1">{allBranches.length}</div>
                </div>
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-3.5 sm:p-4 shadow-sm">
                  <div className="text-[11px] sm:text-xs font-bold text-[#7A6E67] uppercase">Active Locations</div>
                  <div className="text-xl sm:text-2xl font-black text-[#1E7A4D] mt-1">
                    {allBranches.filter((b: any) => b.isActive !== false).length}
                  </div>
                </div>
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-3.5 sm:p-4 shadow-sm">
                  <div className="text-[11px] sm:text-xs font-bold text-[#7A6E67] uppercase">Cities Covered</div>
                  <div className="text-xl sm:text-2xl font-black text-[#C68A1E] mt-1">{cities.length || 3}</div>
                </div>
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-3.5 sm:p-4 shadow-sm">
                  <div className="text-[11px] sm:text-xs font-bold text-[#7A6E67] uppercase">Network Revenue</div>
                  <div className="text-xl sm:text-2xl font-black text-[#143F26] mt-1">
                    {formatMoney(cur, allBranches.reduce((acc: number, b: any) => acc + (b.totalRevenue || b.revenue || 0), 0))}
                  </div>
                </div>
              </div>

              {/* Search and City Filter */}
              <div className="bg-white border border-[#EAE3DC] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-[#7A6E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={branchSearch}
                      onChange={(e) => setBranchSearch(e.target.value)}
                      placeholder="Search branches by code, name, city, coupon…"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#143F26]"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-[#7A6E67] shrink-0" />
                    <select
                      value={branchCityFilter}
                      onChange={(e) => setBranchCityFilter(e.target.value)}
                      className="w-full sm:w-auto px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#143F26]"
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
                <div className="overflow-x-auto w-full custom-scrollbar rounded-2xl border border-[#EAE3DC]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F4] border-b border-[#EAE3DC] text-[#7A6E67] uppercase tracking-wider font-bold text-[11px]">
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
                              <td className="py-3 px-3 font-mono font-bold text-[#143F26]">
                                <span className="px-2 py-1 rounded-lg bg-[#143F26]/10 border border-[#143F26]/20">
                                  {b.code}
                                </span>
                                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#7A6E67] font-sans">
                                  <span className="font-semibold uppercase tracking-wider text-[9px] text-[#0E331E] bg-[#0E331E]/10 px-1 py-0.5 rounded">Prefix</span>
                                  <span className="font-mono font-bold text-[#1E1815]">{b.invoicePrefix || b.code}-{new Date().getFullYear().toString().slice(-2)}-</span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-extrabold text-[#1E1815]">{b.name}</div>
                                {b.nameAr && <div className="text-[11px] text-[#7A6E67]">{b.nameAr}</div>}
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  <Link
                                    href={`/outlet?code=${encodeURIComponent(b.code || b.id)}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0E331E]/10 hover:bg-[#0E331E] text-[#0E331E] hover:text-white text-[10px] font-black tracking-wide transition-all cursor-pointer shadow-2xs border border-[#0E331E]/20 group"
                                    title={`Launch ${b.name} Outlet POS Terminal`}
                                  >
                                    <Store className="w-3 h-3 text-[#0E331E] group-hover:text-white" />
                                    <span>Launch Outlet POS</span>
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenStoreCrm(b)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF7F4] hover:bg-[#0E331E] text-[#1E1815] hover:text-white text-[10px] font-black tracking-wide transition-all cursor-pointer shadow-2xs border border-[#EAE3DC] hover:border-[#0E331E] group"
                                    title={b.crmUrl ? `Open ${b.name} CRM Dashboard` : `CRM Dashboard Coming Soon for ${b.name}`}
                                  >
                                    <LayoutDashboard className="w-3 h-3 text-[#0E331E] group-hover:text-white" />
                                    <span>{b.crmUrl ? "CRM Dashboard" : "CRM (Coming Soon)"}</span>
                                    {b.crmUrl ? (
                                      <ExternalLink className="w-3 h-3 text-[#7A6E67] group-hover:text-white" />
                                    ) : (
                                      <Clock className="w-3 h-3 text-amber-600 group-hover:text-white" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                {b.dailyCode ? (
                                  <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 p-1 px-2 rounded-xl bg-[#FAF7F4] border border-[#E0D7CF]">
                                      <Ticket className="w-3.5 h-3.5 text-[#143F26] shrink-0" />
                                      <span className="font-mono font-black text-xs text-[#143F26] tracking-wider">
                                        {b.dailyCode}
                                      </span>
                                      <button
                                        onClick={() => copyToClipboard(b.dailyCode)}
                                        title="Copy Coupon Code"
                                        className="p-1 rounded hover:bg-white text-[#7A6E67] hover:text-[#143F26] transition-colors cursor-pointer ml-1"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleRotateBranchCode(b.id)}
                                        disabled={isRotating}
                                        title="Rotate Code Now"
                                        className="p-1 rounded hover:bg-white text-[#7A6E67] hover:text-[#143F26] transition-colors cursor-pointer"
                                      >
                                        <RotateCw className={`w-3 h-3 ${isRotating ? "animate-spin text-[#143F26]" : ""}`} />
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
                              <td className="py-3 px-3 font-black text-[#143F26]">
                                {formatMoney(cur, b.totalRevenue || b.revenue || 0)}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <Link
                                    href={`/outlet?code=${encodeURIComponent(b.code || b.id)}`}
                                    target="_blank"
                                    title={`Launch ${b.name} Outlet POS Terminal`}
                                    className="p-1.5 rounded-lg border border-[#0E331E]/30 bg-[#0E331E]/10 hover:bg-[#0E331E] text-[#0E331E] hover:text-white transition-all cursor-pointer"
                                  >
                                    <Store className="w-3.5 h-3.5" />
                                  </Link>
                                  <button
                                    onClick={() => openEditBranch(b)}
                                    title="Edit Branch Details"
                                    className="p-1.5 rounded-lg border border-[#EAE3DC] bg-white hover:bg-[#FAF7F4] text-[#4A3F39] hover:text-[#143F26] transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => openDeleteBranch(b)}
                                    title="Delete / Deactivate Branch"
                                    className="p-1.5 rounded-lg border border-[#EAE3DC] bg-white hover:bg-[#143F26]/10 text-[#4A3F39] hover:text-[#143F26] transition-colors cursor-pointer"
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
    </>
  );
}
