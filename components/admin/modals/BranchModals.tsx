"use client";

import { generateRandomCouponCode, toDatetimeLocal, formatExpiryTime } from "../adminUtils";


import React from "react";
import {
  Building2,
  Ticket,
  RotateCw,
  Clock,
  CheckCircle2,
  Globe,
  Edit2,
  AlertTriangle,
  Sparkles,
  Store,
  X,
} from "lucide-react";

interface BranchModalsProps {
  showCreateBranchModal: boolean;
  setShowCreateBranchModal: (v: boolean) => void;
  showEditBranchModal: boolean;
  setShowEditBranchModal: (v: boolean) => void;
  showDeleteBranchModal: boolean;
  setShowDeleteBranchModal: (v: boolean) => void;
  branchToDelete: any;
  setBranchToDelete: (v: any) => void;
  showComingSoonModal: boolean;
  setShowComingSoonModal: (v: boolean) => void;
  comingSoonBranch: any;
  setComingSoonBranch: (v: any) => void;
  branchForm: any;
  setBranchForm: React.Dispatch<React.SetStateAction<any>>;
  branchMsg: { type: string; text: string } | null;
  busy: boolean;
  handleCreateBranch: (e: React.FormEvent) => void;
  handleUpdateBranch: (e: React.FormEvent) => void;
  handleDeleteBranch: () => void;
  branchesData?: any;
  data?: any;
  openEditBranch?: (branch: any) => void;
}

export default function BranchModals({
  showCreateBranchModal,
  setShowCreateBranchModal,
  showEditBranchModal,
  setShowEditBranchModal,
  showDeleteBranchModal,
  setShowDeleteBranchModal,
  branchToDelete,
  setBranchToDelete,
  showComingSoonModal,
  setShowComingSoonModal,
  comingSoonBranch,
  setComingSoonBranch,
  branchForm,
  setBranchForm,
  branchMsg,
  busy,
  handleCreateBranch,
  handleUpdateBranch,
  handleDeleteBranch,
  branchesData,
  data,
  openEditBranch,
}: BranchModalsProps) {
  return (
    <>
{/* MODAL: CREATE BRANCH                                            */}
      {/* ============================================================== */}
      {showCreateBranchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#EAE3DC] bg-[#FAF7F4] shrink-0">
              <h3 className="font-extrabold text-base sm:text-lg text-[#1E1815] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#143F26]" />
                Add New Outlet Branch
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateBranchModal(false)}
                className="p-1.5 rounded-xl text-[#7A6E67] hover:bg-white hover:text-[#1E1815] border border-transparent hover:border-[#EAE3DC] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form with scrollable body */}
            <form onSubmit={handleCreateBranch} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto overflow-x-hidden space-y-4 flex-1 custom-scrollbar">
                {branchMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${branchMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#143F26]/10 text-[#143F26]"
                      }`}
                  >
                    {branchMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                          dailyCode: branchForm.dailyCode || generateRandomCouponCode(),
                        });
                      }}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1 flex items-center justify-between">
                      <span>Invoice Prefix *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LV"
                      value={branchForm.invoicePrefix || ""}
                      onChange={(e) => setBranchForm({ ...branchForm, invoicePrefix: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono font-bold text-[#1E1815] uppercase focus:outline-none focus:border-[#143F26]"
                    />
                    <div className="text-[10px] text-[#7A6E67] mt-0.5 font-mono">
                      Inv: {branchForm.invoicePrefix || "LV"}-{new Date().getFullYear().toString().slice(-2)}-...
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dubai, Abu Dhabi"
                      value={branchForm.city}
                      onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#143F26]"
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
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#143F26]"
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
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                  />
                </div>

                {/* 24-Hour Coupon Generator & Custom Validity Engine */}
                <div className="p-4 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#143F26]" />
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
                          className="w-full px-3.5 py-2 text-xs bg-white border border-[#E0D7CF] rounded-xl font-mono font-black text-[#143F26] tracking-wider focus:outline-none focus:border-[#143F26]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const fresh = generateRandomCouponCode();
                          setBranchForm({ ...branchForm, dailyCode: fresh });
                        }}
                        title="Generate Fresh Coupon Code"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FAF0E6] text-xs font-bold text-[#4A3F39] hover:text-[#143F26] transition-colors cursor-pointer shrink-0 shadow-2xs"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-[#143F26]" />
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
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E0D7CF] rounded-xl font-mono text-[#1E1815] font-bold focus:outline-none focus:border-[#143F26]"
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
                        className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#143F26] hover:text-[#143F26] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
                      >
                        +12 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
                          setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(future) });
                        }}
                        className="px-2 py-1 rounded-lg bg-white border border-[#143F26]/30 hover:border-[#143F26] text-[10px] font-bold text-[#143F26] transition-colors cursor-pointer"
                      >
                        +24 Hours (Standard)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const future = new Date(Date.now() + 48 * 60 * 60 * 1000);
                          setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(future) });
                        }}
                        className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#143F26] hover:text-[#143F26] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
                      >
                        +48 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                          setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(future) });
                        }}
                        className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#143F26] hover:text-[#143F26] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
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
                        className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#143F26] hover:text-[#143F26] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
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
                    <span className="text-[#143F26] font-bold text-[10px]">
                      🚫 1-Time Use Per Customer
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#0E331E]" />
                      CRM Dashboard Link (URL)
                    </span>
                    <span className="text-[10px] font-normal text-[#7A6E67] lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://crm.artoflevante.ae/branch/..."
                      value={branchForm.crmUrl}
                      onChange={(e) => setBranchForm({ ...branchForm, crmUrl: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#143F26]"
                    />
                  </div>
                  <p className="text-[10px] text-[#7A6E67] mt-1">
                    Clicking this branch in the Overview will launch this external CRM URL. If left empty, a "Coming Soon" popup will appear.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Level 1, Near Food Court"
                    value={branchForm.address}
                    onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#143F26]"
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
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#143F26]"
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
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="bActive"
                    checked={branchForm.isActive}
                    onChange={(e) => setBranchForm({ ...branchForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#143F26] focus:ring-[#143F26]"
                  />
                  <label htmlFor="bActive" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                    Activate Outlet Immediately for POS Tills & Customer Cards
                  </label>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="px-6 py-4 border-t border-[#EAE3DC] bg-[#FAF7F4] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateBranchModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FAF7F4] text-xs font-bold text-[#7A6E67] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#143F26] to-[#0A2617] hover:from-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#EAE3DC] bg-[#FAF7F4] shrink-0">
              <h3 className="font-extrabold text-base sm:text-lg text-[#1E1815] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#143F26]" />
                Edit Branch Details
              </h3>
              <button
                type="button"
                onClick={() => setShowEditBranchModal(false)}
                className="p-1.5 rounded-xl text-[#7A6E67] hover:bg-white hover:text-[#1E1815] border border-transparent hover:border-[#EAE3DC] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form with scrollable body */}
            <form onSubmit={handleUpdateBranch} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto overflow-x-hidden space-y-4 flex-1 custom-scrollbar">
                {branchMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${branchMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#143F26]/10 text-[#143F26]"
                      }`}
                  >
                    {branchMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                      Branch Code
                    </label>
                    <input
                      type="text"
                      required
                      value={branchForm.code}
                      onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1 flex items-center justify-between">
                      <span>Invoice Prefix</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LV"
                      value={branchForm.invoicePrefix || ""}
                      onChange={(e) => setBranchForm({ ...branchForm, invoicePrefix: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono font-bold text-[#1E1815] uppercase focus:outline-none focus:border-[#143F26]"
                    />
                    <div className="text-[10px] text-[#7A6E67] mt-0.5 font-mono">
                      Inv: {branchForm.invoicePrefix || branchForm.code || "LV"}-{new Date().getFullYear().toString().slice(-2)}-...
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={branchForm.city}
                      onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#143F26]"
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
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#143F26]"
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
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                  />
                </div>

                {/* 24-Hour Coupon Generator & Custom Validity Engine in Edit */}
                <div className="p-4 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#143F26]" />
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
                          className="w-full px-3.5 py-2 text-xs bg-white border border-[#E0D7CF] rounded-xl font-mono font-black text-[#143F26] tracking-wider focus:outline-none focus:border-[#143F26]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const fresh = generateRandomCouponCode();
                          setBranchForm({ ...branchForm, dailyCode: fresh });
                        }}
                        title="Regenerate Coupon Code"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FAF0E6] text-xs font-bold text-[#4A3F39] hover:text-[#143F26] transition-colors cursor-pointer shrink-0 shadow-2xs"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-[#143F26]" />
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
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E0D7CF] rounded-xl font-mono text-[#1E1815] font-bold focus:outline-none focus:border-[#143F26]"
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
                        className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#143F26] hover:text-[#143F26] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
                      >
                        +12 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
                          setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(future) });
                        }}
                        className="px-2 py-1 rounded-lg bg-white border border-[#143F26]/30 hover:border-[#143F26] text-[10px] font-bold text-[#143F26] transition-colors cursor-pointer"
                      >
                        +24 Hours (Standard)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const future = new Date(Date.now() + 48 * 60 * 60 * 1000);
                          setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(future) });
                        }}
                        className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#143F26] hover:text-[#143F26] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
                      >
                        +48 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                          setBranchForm({ ...branchForm, dailyCodeExpiresAt: toDatetimeLocal(future) });
                        }}
                        className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#143F26] hover:text-[#143F26] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
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
                        className="px-2 py-1 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#143F26] hover:text-[#143F26] text-[10px] font-bold text-[#4A3F39] transition-colors cursor-pointer"
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
                    <span className="text-[#143F26] font-bold text-[10px]">
                      🚫 1-Time Use Per Customer
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#0E331E]" />
                      CRM Dashboard Link (URL)
                    </span>
                    <span className="text-[10px] font-normal text-[#7A6E67] lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://crm.artoflevante.ae/branch/..."
                      value={branchForm.crmUrl}
                      onChange={(e) => setBranchForm({ ...branchForm, crmUrl: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#143F26]"
                    />
                  </div>
                  <p className="text-[10px] text-[#7A6E67] mt-1">
                    Clicking this branch in the Overview will launch this external CRM URL. If left empty, a "Coming Soon" popup will appear.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">Address</label>
                  <input
                    type="text"
                    value={branchForm.address}
                    onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      value={branchForm.phone}
                      onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#143F26]"
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
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="bActiveEdit"
                    checked={branchForm.isActive}
                    onChange={(e) => setBranchForm({ ...branchForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#143F26] focus:ring-[#143F26]"
                  />
                  <label htmlFor="bActiveEdit" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                    Outlet Is Active & Available for Operations
                  </label>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="px-6 py-4 border-t border-[#EAE3DC] bg-[#FAF7F4] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditBranchModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FAF7F4] text-xs font-bold text-[#7A6E67] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#143F26] to-[#0A2617] hover:from-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 disabled:opacity-50 cursor-pointer"
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
            <div className="w-12 h-12 rounded-2xl bg-[#143F26]/10 text-[#143F26] flex items-center justify-center mb-4">
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
                className="px-5 py-2 rounded-xl bg-[#143F26] hover:bg-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 disabled:opacity-50 cursor-pointer"
              >
                {busy ? "Processing…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: STORE CRM COMING SOON / NOT CONFIGURED                  */}
      {/* ============================================================== */}
      {showComingSoonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0E331E] via-[#D4AF37] to-[#0E331E]" />

            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shadow-xs">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowComingSoonModal(false);
                  setComingSoonBranch(null);
                }}
                className="p-1.5 rounded-xl text-[#7A6E67] hover:bg-[#FAF7F4] hover:text-[#1E1815] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20 mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Coming Soon</span>
            </div>

            <h3 className="font-black text-xl text-[#1E1815] mb-2 leading-tight">
              CRM Dashboard Coming Soon
            </h3>

            {comingSoonBranch && (
              <div className="p-3 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0E331E] text-white flex items-center justify-center font-black text-xs shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs text-[#1E1815] truncate">
                      {comingSoonBranch.name}
                    </div>
                    <div className="text-[10px] text-[#7A6E67]">
                      Outlet Code: <span className="font-mono font-bold text-[#0E331E]">{comingSoonBranch.code || comingSoonBranch.id}</span> • {comingSoonBranch.city || "Dubai"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-[#7A6E67] leading-relaxed mb-6">
              The external CRM dashboard link has not been linked to this branch yet. You can configure a custom CRM link anytime in the <strong className="text-[#1E1815]">Branches Management</strong> section.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-3 border-t border-[#EAE3DC]">
              {(branchesData?.canEdit || data?.scope?.allBranches || data?.scope?.role === "SUPER_ADMIN" || data?.scope?.role === "COMPANY_ADMIN") && comingSoonBranch && (
                <button
                  type="button"
                  onClick={() => {
                    setShowComingSoonModal(false);
                    const targetBranch = branchesData?.branches?.find((b: any) => b.id === comingSoonBranch.id || b.code === comingSoonBranch.code) || comingSoonBranch;
                    openEditBranch?.(targetBranch);
                  }}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0E331E] to-[#0E331E] hover:from-[#0E331E] text-white font-bold text-xs shadow-md shadow-[#0E331E]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Configure CRM Link</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowComingSoonModal(false);
                  setComingSoonBranch(null);
                }}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl border border-[#EAE3DC] hover:bg-[#FAF7F4] text-xs font-bold text-[#7A6E67] hover:text-[#1E1815] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      
    </>
  );
}
