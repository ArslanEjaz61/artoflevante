"use client";

import React, { useState } from "react";
import { Search, Filter, ChevronRight, Download, Loader2 } from "lucide-react";
import { formatRelativeTime, formatMoney } from "../adminUtils";

interface CustomersTabProps {
  cust: any;
  q: string;
  setQ: (q: string) => void;
  filter: string;
  setFilter: (f: string) => void;
  openCustomerDetail: (c: any) => void;
  cur?: string;
}

export default function CustomersTab({
  cust,
  q,
  setQ,
  filter,
  setFilter,
  openCustomerDetail,
  cur = "AED",
}: CustomersTabProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const url = `/api/admin/customers/export?q=${encodeURIComponent(q)}&filter=${encodeURIComponent(filter)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const today = new Date().toISOString().split("T")[0];
      a.download = `levante_customers_${today}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Failed to export customers:", err);
      alert("Failed to export customers. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-[#EAE3DC] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#7A6E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by name, mobile, email…"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#143F26]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                    <Filter className="w-4 h-4 text-[#7A6E67] shrink-0" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="w-full sm:w-auto px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#143F26]"
                    >
                      <option value="all">All Members</option>
                      <option value="recent">Active Recently</option>
                      <option value="highSpend">Top Spenders</option>
                      <option value="highPoints">Top Points Balance</option>
                    </select>
                  </div>

                  {/* Export Customers Button */}
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#143F26] hover:bg-[#0c2a19] text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    title="Export customer list as CSV"
                  >
                    {exporting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{exporting ? "Exporting…" : "Export Customers"}</span>
                  </button>
                </div>
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto w-full custom-scrollbar rounded-2xl border border-[#EAE3DC]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F4] border-b border-[#EAE3DC] text-[#7A6E67] uppercase tracking-wider font-bold text-[11px]">
                    <tr>
                      <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Member</th>
                      <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Mobile &amp; Email</th>
                      <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Home Branch</th>
                      <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Points</th>
                      <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Visits</th>
                      <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Total Spend</th>
                      <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Last Visit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE8E1] bg-white">
                    {cust?.customers && cust.customers.length > 0 ? (
                      cust.customers.map((c: any) => (
                        <tr
                          key={c.id}
                          onClick={() => openCustomerDetail(c.id)}
                          className="hover:bg-[#FAF7F4] transition-all cursor-pointer group"
                        >
                          <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#143F26] to-[#0A2617] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
                                {c.name ? c.name.slice(0, 2).toUpperCase() : "MB"}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-[#1E1815] group-hover:text-[#143F26] transition-colors flex items-center gap-1.5">
                                  <span>{c.name}</span>
                                  {c.isBlocked && (
                                    <span className="px-1.5 py-0.5 rounded bg-[#143F26]/10 text-[#143F26] text-[9px] font-black uppercase">
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
                          <td className="py-3.5 px-3.5 sm:px-4 font-mono text-[#4A3F39] whitespace-nowrap">
                            <div>{c.mobile}</div>
                            {c.email && <div className="text-[10px] text-[#7A6E67] truncate max-w-[170px]">{c.email}</div>}
                          </td>
                          <td className="py-3.5 px-3.5 sm:px-4 text-[#7A6E67] font-medium whitespace-nowrap">{c.homeBranch?.name || c.branch || "—"}</td>
                          <td className="py-3.5 px-3.5 sm:px-4 font-black text-[#143F26] whitespace-nowrap">{c.pointsBalance ?? c.points ?? 0} pts</td>
                          <td className="py-3.5 px-3.5 sm:px-4 font-bold text-[#1E1815] whitespace-nowrap">{c.visitCount ?? c.visits ?? 0} visits</td>
                          <td className="py-3.5 px-3.5 sm:px-4 font-bold text-[#1E1815] whitespace-nowrap">
                            {formatMoney(cur, c.totalSpend ?? c.spend ?? 0)}
                          </td>
                          <td className="py-3.5 px-3.5 sm:px-4 text-[#7A6E67] whitespace-nowrap">
                            <div className="flex items-center justify-between">
                              <span>{formatRelativeTime(c.lastVisitAt)}</span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#143F26] font-bold text-[11px] flex items-center gap-0.5 ml-2">
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
    </>
  );
}
