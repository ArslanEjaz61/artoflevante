"use client";

import React from "react";
import {
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Coins,
  Receipt,
  UserCheck,
  CreditCard,
  Users,
  Gift,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Check,
  Ban,
  X,
} from "lucide-react";
import { formatRelativeTime, formatMoney } from "../adminUtils";

interface CustomerDetailModalProps {
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  selectedCustomerData: any;
  setSelectedCustomerData: (data: any) => void;
  loadingCustomerDetail: boolean;
  customerDetailTab: any;
  setCustomerDetailTab: (tab: any) => void;
  customerDetailMsg: { type: string; text: string } | null;
  toggleCustomerBlock: (id: string, block: boolean) => void;
  cur?: string;
}

export default function CustomerDetailModal({
  selectedCustomerId,
  setSelectedCustomerId,
  selectedCustomerData,
  setSelectedCustomerData,
  loadingCustomerDetail,
  customerDetailTab,
  setCustomerDetailTab,
  customerDetailMsg,
  toggleCustomerBlock,
  cur = "AED",
}: CustomerDetailModalProps) {
  return (
    <>
{/* MODAL: CUSTOMER FULL PROFILE & LOYALTY DATA                    */}
      {/* ============================================================== */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
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
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#143F26] to-[#0A2617] text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                  {selectedCustomerData?.name ? selectedCustomerData.name.slice(0, 2).toUpperCase() : "MB"}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-lg sm:text-xl font-black truncate">
                      {selectedCustomerData?.name || "Customer Profile"}
                    </h2>
                    {selectedCustomerData?.isBlocked ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#143F26] text-white text-[10px] font-black uppercase tracking-wider">
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
                      <CreditCard className="w-3 h-3 text-[#E5A93C]" /> Customer ID
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
                    ? "border-[#143F26] text-[#143F26]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                  }`}
              >
                <Users className="w-3.5 h-3.5" /> Overview & Profile
              </button>
              <button
                type="button"
                onClick={() => setCustomerDetailTab("transactions")}
                className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${customerDetailTab === "transactions"
                    ? "border-[#143F26] text-[#143F26]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                  }`}
              >
                <Receipt className="w-3.5 h-3.5" /> Invoices ({selectedCustomerData?.transactions?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setCustomerDetailTab("rewards")}
                className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${customerDetailTab === "rewards"
                    ? "border-[#143F26] text-[#143F26]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                  }`}
              >
                <Gift className="w-3.5 h-3.5" /> Vouchers ({selectedCustomerData?.rewards?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setCustomerDetailTab("visits")}
                className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${customerDetailTab === "visits"
                    ? "border-[#143F26] text-[#143F26]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                  }`}
              >
                <MapPin className="w-3.5 h-3.5" /> Dine-In Check-ins ({selectedCustomerData?.visits?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setCustomerDetailTab("ledger")}
                className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${customerDetailTab === "ledger"
                    ? "border-[#143F26] text-[#143F26]"
                    : "border-transparent text-[#7A6E67] hover:text-[#1E1815]"
                  }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Points History ({selectedCustomerData?.ledger?.length || 0})
              </button>
            </div>

            {/* Modal Body / Tab Contents */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
              {loadingCustomerDetail ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#7A6E67] gap-3">
                  <RefreshCw className="w-7 h-7 animate-spin text-[#143F26]" />
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
                          <Users className="w-3.5 h-3.5 text-[#143F26]" /> Personal Information
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
                            <ShieldCheck className="w-3.5 h-3.5 text-[#143F26]" /> Loyalty Status & Security
                          </h4>
                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                              <span className="text-[#7A6E67]">Account Status</span>
                              <span className={`font-bold ${selectedCustomerData.isBlocked ? "text-[#143F26]" : "text-emerald-700"}`}>
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
                              <span className="text-[#7A6E67]">Total Store Visits</span>
                              <span className="font-bold text-[#143F26] bg-[#143F26]/10 px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-mono">
                                <UserCheck className="w-3 h-3 text-[#143F26]" />
                                {selectedCustomerData.visitCount || 0} visits
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                              <span className="text-[#7A6E67]">Customer ID</span>
                              <span className="font-mono font-bold text-[#1E1815]">
                                {selectedCustomerData.cardCode || "Auto-Assigned"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-[#7A6E67]">Cashback Redemption Value</span>
                              <span className="font-black text-[#143F26]">
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
                                : "bg-[#143F26]/10 hover:bg-[#143F26]/20 text-[#143F26]"
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
                          <Receipt className="w-8 h-8 text-[#143F26]/40 mx-auto mb-2" />
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
                                  <strong className="text-[#143F26]">
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
                          <Gift className="w-8 h-8 text-[#143F26]/40 mx-auto mb-2" />
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
                                <td className="py-2.5 px-3 font-mono text-[#143F26] font-bold">
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
                          <MapPin className="w-8 h-8 text-[#143F26]/40 mx-auto mb-2" />
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
                                  className={`py-2.5 px-3 font-black ${l.delta >= 0 ? "text-emerald-700" : "text-[#143F26]"
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
                          <TrendingUp className="w-8 h-8 text-[#143F26]/40 mx-auto mb-2" />
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
      
    </>
  );
}
