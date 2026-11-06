"use client";

import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Search,
  ChevronRight,
  LogIn,
  Laptop,
  Smartphone,
  Sparkles,
  Key,
} from "lucide-react";
import { formatRelativeTime } from "../adminUtils";

interface AuditTabProps {
  audit: any;
  auditSearch: string;
  setAuditSearch: (s: string) => void;
  auditActionFilter: string;
  setAuditActionFilter: (s: string) => void;
  loadingAudit: boolean;
  loadAudit: () => void;
  allBranches: any[];
}

export default function AuditTab({
  audit,
  auditSearch,
  setAuditSearch,
  auditActionFilter,
  setAuditActionFilter,
  loadingAudit,
  loadAudit,
  allBranches,
}: AuditTabProps) {
  const rawLogs: any[] = audit?.logs || audit?.entries || [];
  const filteredLogs = rawLogs.filter((l: any) => {
    if (auditSearch.trim()) {
      const s = auditSearch.toLowerCase();
      const matchAction = l.action?.toLowerCase().includes(s);
      const matchStaff =
        (typeof l.staff === "string" ? l.staff : l.staff?.name)?.toLowerCase().includes(s) ||
        l.staffUsername?.toLowerCase().includes(s);
      const matchReason = l.reason?.toLowerCase().includes(s);
      const matchEntity = l.entityType?.toLowerCase().includes(s) || l.entityId?.toLowerCase().includes(s);
      const matchMeta = l.metadata ? JSON.stringify(l.metadata).toLowerCase().includes(s) : false;
      if (!matchAction && !matchStaff && !matchReason && !matchEntity && !matchMeta) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Audit KPI & Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#7A6E67] text-xs font-bold uppercase tracking-wider">
            <span>Total Audit Records</span>
            <ShieldCheck className="w-4 h-4 text-[#0E331E]" />
          </div>
          <div className="text-2xl font-black text-[#1E1815] mt-1.5">
            {audit?.total ?? rawLogs.length}
          </div>
          <div className="text-[11px] font-semibold text-[#1E7A4D] mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Immutable Cryptographic Trail</span>
          </div>
        </div>

        <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#7A6E67] text-xs font-bold uppercase tracking-wider">
            <span>Fraud &amp; Duplicates Blocked</span>
            <AlertTriangle className="w-4 h-4 text-[#143F26]" />
          </div>
          <div className="text-2xl font-black text-[#143F26] mt-1.5">
            {audit?.duplicatesBlocked ?? 0}
          </div>
          <div className="text-[11px] font-semibold text-[#7A6E67] mt-0.5">
            Automatic Anti-Fraud Protection
          </div>
        </div>

        <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#7A6E67] text-xs font-bold uppercase tracking-wider">
            <span>Ledger Status</span>
            <Lock className="w-4 h-4 text-[#1E7A4D]" />
          </div>
          <div className="text-sm font-black text-[#1E7A4D] mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1E7A4D] animate-ping" />
            <span>Live Audit Sync Active</span>
          </div>
          <div className="text-[11px] font-semibold text-[#7A6E67] mt-0.5">
            All Manager &amp; Till Operations
          </div>
        </div>
      </div>

      {/* Audit Toolbar & Filter Header */}
      <div className="bg-white border border-[#EAE3DC] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <ShieldCheck className="w-5 h-5 text-[#0E331E] shrink-0" />
              <h2 className="font-extrabold text-base text-[#1E1815]">Security Audit Log</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0E331E]/10 text-[#0E331E] text-xs font-bold">
                {filteredLogs.length} Events Loaded
              </span>
            </div>
            <p className="text-xs text-[#7A6E67] mt-0.5">
              Immutable audit trail of management logins, coupon rotations, staff changes, rewards, and system settings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadAudit()}
              disabled={loadingAudit}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#DCD3CB] bg-[#FAF7F4] hover:bg-white text-xs font-bold text-[#1E1815] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? "animate-spin text-[#143F26]" : ""}`} />
              <span>Refresh Logs</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-3 border-t border-[#EAE3DC]">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6E67]" />
            <input
              type="text"
              placeholder="Search logs by staff name, username, action, reason, entity…"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#143F26]"
            />
          </div>

          {/* Action Category Filter */}
          <div>
            <select
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#143F26] cursor-pointer"
            >
              <option value="all">All Audit Action Categories</option>
              <option value="login">Sign-In &amp; Logins (admin, customer, staff)</option>
              <option value="customer">Members &amp; Accounts (customer.*)</option>
              <option value="staff">Staff &amp; POS Tills (staff.*)</option>
              <option value="pin">Master Security PIN (pin.*, staff.pin_*)</option>
              <option value="branch">Branch Locations &amp; Coupons (branch.*)</option>
              <option value="offer">Promotions &amp; Campaigns (offer.*)</option>
              <option value="settings">System &amp; Points Engine (settings.*)</option>
              <option value="visit-reward">Visit Milestones &amp; Perks (visit-reward.*)</option>
              <option value="transaction">Transactions &amp; Receipts (transaction.*)</option>
              <option value="blocked">Fraud &amp; Duplicates Blocked</option>
            </select>
          </div>
        </div>

        {/* Audit Event List */}
        <div className="divide-y divide-[#EFE8E1] pt-2">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((l: any) => {
              const isCustomerEvent = l.action?.startsWith("customer.");
              const isAdminLogin = l.action === "admin.login";
              const isStaffLogin = l.action === "staff.login";
              const isCustomerLogin = l.action === "customer.login";
              const isCustomerRegister = l.action === "customer.register";
              const isPinEvent = l.action?.includes("pin");

              // Resolve Customer Name for customer events or entity
              const resolvedCustomerName =
                l.entityName ||
                l.metadata?.customer ||
                l.metadata?.name ||
                (l.metadata?.mobile ? `+${l.metadata.mobile}` : null);

              const staffDisplayName = isCustomerEvent
                ? (resolvedCustomerName || (typeof l.staff === "string" && l.staff !== "System Admin" ? l.staff : "Customer Member"))
                : (typeof l.staff === "string" ? l.staff : l.staff?.name || "System Admin");

              const isDanger =
                l.action?.includes("delete") ||
                l.action?.includes("block") ||
                l.action?.includes("failed");
              const isWarning =
                l.action?.includes("update") ||
                l.action?.includes("change") ||
                l.action?.includes("rotate");
              const isSuccess =
                l.action?.includes("create") ||
                l.action?.includes("login") ||
                l.action?.includes("claim") ||
                l.action?.includes("redeem");

              return (
                <div
                  key={l.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-4 hover:bg-[#FAF7F4] -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        isDanger
                          ? "bg-[#143F26]/10 text-[#143F26]"
                          : isWarning
                          ? "bg-[#E5A93C]/15 text-[#9E6A1B]"
                          : isSuccess
                          ? "bg-[#1E7A4D]/10 text-[#1E7A4D]"
                          : "bg-[#8C7F78]/10 text-[#8C7F78]"
                      }`}
                    >
                      {isAdminLogin ? (
                        <Laptop className="w-4 h-4 text-[#143F26]" />
                      ) : isStaffLogin ? (
                        <LogIn className="w-4 h-4 text-[#0E331E]" />
                      ) : isCustomerLogin || isCustomerRegister ? (
                        <Smartphone className="w-4 h-4 text-[#1E7A4D]" />
                      ) : isCustomerEvent ? (
                        <Sparkles className="w-4 h-4 text-[#E5A93C]" />
                      ) : isPinEvent ? (
                        <Key className="w-4 h-4 text-[#0E331E]" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-[#0E331E]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#1E1815] bg-[#FAF7F4] border border-[#EAE3DC] px-2 py-0.5 rounded-md">
                          {l.action}
                        </span>
                        {l.reason && (
                          <span className="text-[11px] font-semibold text-[#7A6E67] bg-[#EFE8E1] px-2 py-0.5 rounded-md">
                            {l.reason}
                          </span>
                        )}
                        {l.entityType && (
                          <span className="text-[10.5px] font-bold text-[#8C7F78] uppercase tracking-wider">
                            {l.entityType}
                            {l.entityId ? ` #${l.entityId.slice(0, 8)}` : ""}
                          </span>
                        )}
                      </div>

                      {/* Metadata Details preview */}
                      {l.metadata && Object.keys(l.metadata).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                          {/* Branch resolved name */}
                          {(l.metadata.branchName || l.metadata.branchId) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0E331E]/5 text-[#0E331E] font-medium border border-[#0E331E]/15">
                              Branch: {l.metadata.branchName || allBranches.find((b: any) => b.id === l.metadata.branchId)?.name || l.metadata.branchId}
                            </span>
                          )}

                          {/* Customer Name / Phone */}
                          {(l.metadata.customerName || l.metadata.customer || l.metadata.name) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1E7A4D]/5 text-[#1E7A4D] font-medium border border-[#1E7A4D]/15">
                              Customer: {l.metadata.customerName || l.metadata.customer || l.metadata.name}
                            </span>
                          )}

                          {/* Mobile */}
                          {l.metadata.mobile && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono font-medium">
                              +{l.metadata.mobile}
                            </span>
                          )}

                          {/* Points delta */}
                          {l.metadata.points !== undefined && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold font-mono ${
                              Number(l.metadata.points) >= 0 ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#143F26]/10 text-[#143F26]"
                            }`}>
                              {Number(l.metadata.points) >= 0 ? `+${l.metadata.points}` : l.metadata.points} pts
                            </span>
                          )}

                          {/* Bill amount */}
                          {l.metadata.amount !== undefined && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200/60">
                              Bill: AED {Number(l.metadata.amount).toFixed(2)}
                            </span>
                          )}

                          {/* Invoice # */}
                          {l.metadata.invoiceNumber && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 font-mono font-bold border border-sky-200/60">
                              Inv: #{l.metadata.invoiceNumber}
                            </span>
                          )}

                          {/* Staff name if different */}
                          {l.metadata.staffName && l.metadata.staffName !== staffDisplayName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                              By: {l.metadata.staffName}
                            </span>
                          )}

                          {/* Coupon Code */}
                          {l.metadata.couponCode && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0E331E]/10 text-[#0E331E] font-mono font-bold">
                              Code: {l.metadata.couponCode}
                            </span>
                          )}

                          {/* Target branch / role */}
                          {l.metadata.targetBranchId && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                              Target Outlet: {allBranches.find((b: any) => b.id === l.metadata.targetBranchId)?.name || l.metadata.targetBranchId}
                            </span>
                          )}

                          {/* Target role */}
                          {l.metadata.targetRole && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono">
                              Role: {l.metadata.targetRole}
                            </span>
                          )}

                          {/* Target customer mobile */}
                          {l.metadata.targetCustomerMobile && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono">
                              Member: +{l.metadata.targetCustomerMobile}
                            </span>
                          )}

                          {/* Email Subject / Recipient */}
                          {l.metadata.recipient && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-800">
                              To: {l.metadata.recipient}
                            </span>
                          )}

                          {/* Extra metadata fields */}
                          {Object.entries(l.metadata)
                            .filter(([k]) => ![
                              "branchName", "branchId", "customerName", "customer", "name",
                              "mobile", "points", "amount", "invoiceNumber", "staffName",
                              "couponCode", "targetBranchId", "targetRole", "targetCustomerMobile",
                              "recipient", "password", "pin", "newPin", "currentPin"
                            ].includes(k))
                            .map(([k, v]) => (
                              <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF7F4] text-[#7A6E67] border border-[#EAE3DC]">
                                {k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}
                              </span>
                            ))}
                        </div>
                      )}

                      <div className="text-[11px] text-[#8C7F78] mt-1 flex items-center gap-2">
                        <span className="font-bold text-[#4A3F39]">{staffDisplayName}</span>
                        {l.staffUsername && <span className="font-mono text-[#8C7F78]">(@{l.staffUsername})</span>}
                        <span>•</span>
                        <span title={new Date(l.createdAt).toLocaleString()}>
                          {formatRelativeTime(l.createdAt)}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[10px] text-[#8C7F78]">
                          {new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-[#FAF7F4] rounded-2xl border border-[#EAE3DC] p-6 mt-3">
              <ShieldCheck className="w-10 h-10 text-[#0E331E]/30 mx-auto mb-2" />
              <h4 className="font-extrabold text-sm text-[#1E1815]">No Audit Events Found</h4>
              <p className="text-xs text-[#7A6E67] max-w-md mx-auto mt-1 mb-4">
                {auditSearch || auditActionFilter !== "all"
                  ? "No audit events match your search query or action filter. Try resetting filters."
                  : "No management security events have been logged yet."}
              </p>
              {(auditSearch || auditActionFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setAuditSearch("");
                    setAuditActionFilter("all");
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-[#EAE3DC] text-xs font-bold text-[#1E1815] hover:bg-[#FAF7F4] cursor-pointer shadow-2xs"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
