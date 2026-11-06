"use client";

import { DEFAULT_BRANCHES } from "../adminUtils";


import React from "react";
import {
  Tag,
  ImageIcon,
  CheckCircle2,
  Upload,
  Mail,
  X,
} from "lucide-react";

interface OfferModalsProps {
  showCreateOfferModal: boolean;
  setShowCreateOfferModal: (v: boolean) => void;
  newOffer: any;
  setNewOffer: React.Dispatch<React.SetStateAction<any>>;
  compressingOfferImg: boolean;
  compressedImgStats: any;
  setCompressedImgStats: (v: any) => void;
  handleOfferImageFile: (file: File) => void;
  createOffer: (e: React.FormEvent) => void;
  showEditOfferModal: boolean;
  setShowEditOfferModal: (v: boolean) => void;
  editOfferForm: any;
  setEditOfferForm: React.Dispatch<React.SetStateAction<any>>;
  compressingEditOfferImg: boolean;
  compressedEditImgStats: any;
  setCompressedEditImgStats: (v: any) => void;
  handleEditOfferImageFile: (file: File) => void;
  updateOffer: (e: React.FormEvent) => void;
  offerMsg: { type: string; text: string } | null;
  busy: boolean;
  allBranches?: any[];
  cur?: string;
}

export default function OfferModals({
  showCreateOfferModal,
  setShowCreateOfferModal,
  newOffer,
  setNewOffer,
  compressingOfferImg,
  compressedImgStats,
  setCompressedImgStats,
  handleOfferImageFile,
  createOffer,
  showEditOfferModal,
  setShowEditOfferModal,
  editOfferForm,
  setEditOfferForm,
  compressingEditOfferImg,
  compressedEditImgStats,
  setCompressedEditImgStats,
  handleEditOfferImageFile,
  updateOffer,
  offerMsg,
  busy,
  allBranches = [],
  cur = "AED",
}: OfferModalsProps) {
  const branchesList = allBranches.length > 0 ? allBranches : DEFAULT_BRANCHES;

  return (
    <>
{/* MODAL: CREATE CAMPAIGN OFFER                                    */}
      {/* ============================================================== */}
      {showCreateOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="font-extrabold text-lg text-[#1E1815] flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#0E331E]" />
                Launch Promotional Campaign
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateOfferModal(false)}
                className="p-1 rounded-lg text-[#7A6E67] hover:bg-[#FAF7F4] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {offerMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 shrink-0 ${
                  offerMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#143F26]/10 text-[#143F26]"
                }`}
              >
                {offerMsg.text}
              </div>
            )}

            <form onSubmit={createOffer} className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Family Feast 20% Off"
                  value={newOffer.name}
                  onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Description / Eligibility Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Valid on dine-in bills over AED 100 on Saturdays and Sundays across selected branches."
                  value={newOffer.description}
                  onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 20"
                    value={newOffer.value}
                    onChange={(e) => setNewOffer({ ...newOffer, value: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Discount Type
                  </label>
                  <select
                    value={newOffer.isPercent ? "pct" : "flat"}
                    onChange={(e) => setNewOffer({ ...newOffer, isPercent: e.target.value === "pct" })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                  >
                    <option value="pct">Percentage (% Off)</option>
                    <option value="flat">Flat Amount (AED Off)</option>
                  </select>
                </div>
              </div>

              {/* ===================== PROMOTIONAL BANNER IMAGE UPLOAD ===================== */}
              <div className="p-4 bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#0E331E]" />
                    <label className="text-xs font-black text-[#1E1815] uppercase tracking-wide">
                      Promotional Hero Banner Image
                    </label>
                  </div>
                  <span className="text-[10px] font-bold text-[#0E331E] bg-[#0E331E]/10 px-2 py-0.5 rounded-full">
                    WebP Auto-Optimized
                  </span>
                </div>

                {newOffer.imageUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-2xl overflow-hidden border border-[#EAE3DC] aspect-[2/1] bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newOffer.imageUrl}
                        alt="Campaign Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewOffer({ ...newOffer, imageUrl: "" });
                          setCompressedImgStats(null);
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-black/70 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md"
                        title="Remove Image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {compressedImgStats && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1E7A4D]">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{compressedImgStats}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="offer-img-upload"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-[#DCD3CB] hover:border-[#0E331E] bg-white rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#FAF7F4] group-hover:bg-[#0E331E]/10 text-[#7A6E67] group-hover:text-[#0E331E] flex items-center justify-center transition-colors mb-2">
                        {compressingOfferImg ? (
                          <div className="w-5 h-5 border-2 border-[#0E331E]/30 border-t-[#0E331E] rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-[#1E1815] group-hover:text-[#0E331E]">
                        {compressingOfferImg ? "Optimizing & Compressing to WebP…" : "Click or drag to upload promotional banner"}
                      </div>
                      <p className="text-[10px] text-[#7A6E67] mt-1">
                        Supports PNG, JPG, WebP. Automatically resized & compressed for ultra-fast customer loading.
                      </p>
                    </label>
                    <input
                      id="offer-img-upload"
                      type="file"
                      accept="image/*"
                      disabled={compressingOfferImg}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleOfferImageFile(file);
                      }}
                      className="hidden"
                    />
                  </div>
                )}

                <div className="text-[11px] text-[#7A6E67] bg-white/70 p-2.5 rounded-xl border border-[#EAE3DC] space-y-0.5">
                  <div className="font-extrabold text-[#1E1815] text-[11px]">
                    📐 Recommended Dimensions: 1080 × 540 px (2:1 aspect ratio)
                  </div>
                  <div className="text-[10px] text-[#8C7F78]">
                    This banner will appear in the customer app hero slider. If no image is uploaded, Levante standard artwork will display.
                  </div>
                </div>
              </div>

              {/* ===================== BRANCH SELECTION SECTION ===================== */}
              <div className="p-3.5 bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <label className="block text-xs font-black text-[#1E1815] uppercase tracking-wide">
                      Branch / Outlet Assignment *
                    </label>
                    <p className="text-[11px] text-[#7A6E67]">
                      {newOffer.branchIds.length === 0
                        ? "✨ Applicable across ALL UAE branch outlets nationwide."
                        : `📍 Targeted specifically to ${newOffer.branchIds.length} selected outlet${
                            newOffer.branchIds.length === 1 ? "" : "s"
                          }.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewOffer({ ...newOffer, branchIds: [] })}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        newOffer.branchIds.length === 0
                          ? "bg-[#0E331E] text-white border-[#0E331E] shadow-2xs"
                          : "bg-white text-[#7A6E67] border-[#EAE3DC] hover:text-[#1E1815]"
                      }`}
                    >
                      All Outlets
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNewOffer({
                          ...newOffer,
                          branchIds: branchesList.map((b: any) => b.id),
                        })
                      }
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#EAE3DC] bg-white text-[#7A6E67] hover:text-[#1E1815] transition-all cursor-pointer"
                    >
                      Select All
                    </button>
                    {newOffer.branchIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNewOffer({ ...newOffer, branchIds: [] })}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Multi-Branch Checkbox Grid */}
                <div className="max-h-44 overflow-y-auto p-2 bg-white border border-[#EAE3DC] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-1.5 custom-scrollbar">
                  {branchesList.map((b: any) => {
                    const isSelected = newOffer.branchIds.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                          isSelected
                            ? "bg-[#0E331E]/5 border-[#0E331E] text-[#0E331E] font-bold shadow-2xs"
                            : "bg-[#FAF7F4]/50 border-transparent text-[#4A3F39] hover:bg-[#FAF7F4] hover:border-[#EAE3DC]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewOffer({
                                ...newOffer,
                                branchIds: [...newOffer.branchIds, b.id],
                              });
                            } else {
                              setNewOffer({
                                ...newOffer,
                                branchIds: newOffer.branchIds.filter((id: any) => id !== b.id),
                              });
                            }
                          }}
                          className="w-3.5 h-3.5 text-[#0E331E] rounded border-[#DCD3CB] focus:ring-[#0E331E] cursor-pointer"
                        />
                        <span className="truncate flex-1 font-medium">{b.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF7F4] text-[#7A6E67] font-mono shrink-0">
                          #{b.code}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newOffer.startsAt}
                    onChange={(e) => setNewOffer({ ...newOffer, startsAt: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newOffer.endsAt}
                    onChange={(e) => setNewOffer({ ...newOffer, endsAt: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                  />
                </div>
              </div>

              {/* Automated Member Email Announcement Notice */}
              <div className="p-3 rounded-2xl bg-[#FAF3E6] border border-[#C68A1E]/30 flex items-center gap-2.5 text-xs text-[#0E331E]">
                <Mail className="w-4 h-4 text-[#C68A1E] shrink-0" />
                <span className="text-[11px] leading-snug">
                  <strong>Automated Email Broadcast:</strong> A personalized announcement email with this offer&apos;s title, discount badge, image, and validity will automatically be sent to all registered loyalty members upon publishing.
                </span>
              </div>

              <div className="pt-4 border-t border-[#EAE3DC] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateOfferModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-bold text-xs shadow-md shadow-[#0E331E]/20 disabled:opacity-50 cursor-pointer"
                >
                  {busy ? "Publishing…" : "Publish & Broadcast Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}

{/* MODAL: EDIT PROMOTIONAL OFFER                                   */}
      {/* ============================================================== */}
      {showEditOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl max-w-xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#EAE3DC] bg-[#FAF7F4] shrink-0">
              <h3 className="font-extrabold text-base sm:text-lg text-[#1E1815] flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#0E331E]" />
                Edit Promotional Campaign Offer
              </h3>
              <button
                type="button"
                onClick={() => setShowEditOfferModal(false)}
                className="p-1.5 rounded-xl text-[#7A6E67] hover:bg-white hover:text-[#1E1815] border border-transparent hover:border-[#EAE3DC] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={updateOffer} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                {offerMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      offerMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#143F26]/10 text-[#143F26]"
                    }`}
                  >
                    {offerMsg.text}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekend Biryani Feast - 20% Off"
                    value={editOfferForm.name}
                    onChange={(e) => setEditOfferForm({ ...editOfferForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Campaign Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Offer details and terms shown to customers..."
                    value={editOfferForm.description}
                    onChange={(e) => setEditOfferForm({ ...editOfferForm, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                  />
                </div>

                {/* Promotional Banner Image Upload with WebP Optimizer */}
                <div className="p-4 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-[#1E1815] flex items-center gap-1.5 uppercase">
                      <ImageIcon className="w-4 h-4 text-[#0E331E]" />
                      <span>Promotional Banner Image</span>
                    </label>
                    <span className="text-[10px] font-bold text-[#7A6E67] bg-white px-2 py-0.5 rounded-full border border-[#EAE3DC]">
                      1200 × 500 px Recommended (WebP)
                    </span>
                  </div>

                  {editOfferForm.imageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-[#EAE3DC] bg-[#1E1815] group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editOfferForm.imageUrl}
                        alt="Offer banner preview"
                        className="w-full h-36 object-cover select-none"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="px-3 py-1.5 rounded-xl bg-white text-[#1E1815] font-bold text-xs cursor-pointer hover:bg-[#FAF7F4] shadow-md">
                          Replace Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleEditOfferImageFile(file);
                            }}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setEditOfferForm({ ...editOfferForm, imageUrl: "" });
                            setCompressedEditImgStats(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs cursor-pointer hover:bg-red-700 shadow-md"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[#DCD3CB] hover:border-[#0E331E] bg-white hover:bg-[#FAF3E6]/30 p-4 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center">
                      <Upload className="w-6 h-6 text-[#0E331E]" />
                      <div className="text-xs font-bold text-[#1E1815]">
                        {compressingEditOfferImg ? "Optimizing & Converting to WebP…" : "Click or Drag to Upload Offer Image"}
                      </div>
                      <div className="text-[10px] text-[#7A6E67]">
                        Auto-compressed into ultra-lightweight WebP for fast customer loading
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={compressingEditOfferImg}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleEditOfferImageFile(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  )}

                  {compressedEditImgStats && (
                    <div className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{compressedEditImgStats}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="e.g. 20"
                      value={editOfferForm.value}
                      onChange={(e) => setEditOfferForm({ ...editOfferForm, value: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                      Discount Unit *
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditOfferForm({ ...editOfferForm, isPercent: true })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          editOfferForm.isPercent
                            ? "bg-[#0E331E] text-white border-[#0E331E]"
                            : "bg-[#FAF7F4] text-[#4A3F39] border-[#EAE3DC]"
                        }`}
                      >
                        % Percent
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditOfferForm({ ...editOfferForm, isPercent: false })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          !editOfferForm.isPercent
                            ? "bg-[#0E331E] text-white border-[#0E331E]"
                            : "bg-[#FAF7F4] text-[#4A3F39] border-[#EAE3DC]"
                        }`}
                      >
                        Fixed (AED)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Multi-Branch Outlets Assignment */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#1E1815] block">
                        Assigned Outlet Branches
                      </span>
                      <span className="text-[10px] text-[#7A6E67]">
                        {editOfferForm.branchIds.length === 0
                          ? "Universal / All Branches (Visible to every customer)"
                          : `Selected for ${editOfferForm.branchIds.length} branches (Visible to all customers)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditOfferForm({ ...editOfferForm, branchIds: [] })}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          editOfferForm.branchIds.length === 0
                            ? "bg-[#0E331E] text-white border-[#0E331E] shadow-2xs"
                            : "bg-white text-[#7A6E67] border-[#EAE3DC] hover:text-[#1E1815]"
                        }`}
                      >
                        All Outlets
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditOfferForm({
                            ...editOfferForm,
                            branchIds: branchesList.map((b: any) => b.id),
                          })
                        }
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#EAE3DC] bg-white text-[#7A6E67] hover:text-[#1E1815] transition-all cursor-pointer"
                      >
                        Select All
                      </button>
                    </div>
                  </div>

                  <div className="max-h-40 overflow-y-auto p-2 bg-white border border-[#EAE3DC] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-1.5 custom-scrollbar">
                    {branchesList.map((b: any) => {
                      const isSelected = editOfferForm.branchIds.includes(b.id);
                      return (
                        <label
                          key={b.id}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                            isSelected
                              ? "bg-[#0E331E]/5 border-[#0E331E] text-[#0E331E] font-bold shadow-2xs"
                              : "bg-[#FAF7F4]/50 border-transparent text-[#4A3F39] hover:bg-[#FAF7F4] hover:border-[#EAE3DC]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditOfferForm({
                                  ...editOfferForm,
                                  branchIds: [...editOfferForm.branchIds, b.id],
                                });
                              } else {
                                setEditOfferForm({
                                  ...editOfferForm,
                                  branchIds: editOfferForm.branchIds.filter((id: any) => id !== b.id),
                                });
                              }
                            }}
                            className="w-3.5 h-3.5 text-[#0E331E] rounded border-[#DCD3CB] focus:ring-[#0E331E] cursor-pointer"
                          />
                          <span className="truncate flex-1 font-medium">{b.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF7F4] text-[#7A6E67] font-mono shrink-0">
                            #{b.code}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={editOfferForm.startsAt}
                      onChange={(e) => setEditOfferForm({ ...editOfferForm, startsAt: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={editOfferForm.endsAt}
                      onChange={(e) => setEditOfferForm({ ...editOfferForm, endsAt: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editOfferActive"
                    checked={editOfferForm.isActive}
                    onChange={(e) => setEditOfferForm({ ...editOfferForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0E331E] focus:ring-[#0E331E]"
                  />
                  <label htmlFor="editOfferActive" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                    Offer is Active &amp; Displayed on Customer Loyalty Portal
                  </label>
                </div>
              </div>

              <div className="p-4 px-6 border-t border-[#EAE3DC] bg-[#FAF7F4] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditOfferModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-bold text-xs shadow-md shadow-[#0E331E]/20 disabled:opacity-50 cursor-pointer"
                >
                  {busy ? "Saving Changes…" : "Update Promotional Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
    </>
  );
}
