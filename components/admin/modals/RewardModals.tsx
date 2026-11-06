"use client";

import React from "react";
import {
  Gift,
  AlertTriangle,
  Cake,
  X,
} from "lucide-react";

interface RewardModalsProps {
  showVisitRewardModal: boolean;
  setShowVisitRewardModal: (v: boolean) => void;
  showDeleteVisitRewardModal: boolean;
  setShowDeleteVisitRewardModal: (v: boolean) => void;
  visitRewardToDelete: any;
  setVisitRewardToDelete: (v: any) => void;
  editingVisitRewardId: string | null;
  visitRewardForm: any;
  setVisitRewardForm: React.Dispatch<React.SetStateAction<any>>;
  visitRewardSaving: boolean;
  showBirthdayRewardModal: boolean;
  setShowBirthdayRewardModal: (v: boolean) => void;
  showDeleteBirthdayRewardModal: boolean;
  setShowDeleteBirthdayRewardModal: (v: boolean) => void;
  birthdayRewardToDelete: any;
  setBirthdayRewardToDelete: (v: any) => void;
  editingBirthdayRewardId: string | null;
  birthdayRewardForm: any;
  setBirthdayRewardForm: React.Dispatch<React.SetStateAction<any>>;
  birthdayRewardSaving: boolean;
  handleSaveVisitReward: (e: React.FormEvent) => void;
  handleDeleteVisitReward: () => void;
  handleSaveBirthdayReward: (e: React.FormEvent) => void;
  handleDeleteBirthdayReward: () => void;
  busy: boolean;
  cur?: string;
}

export default function RewardModals({
  showVisitRewardModal,
  setShowVisitRewardModal,
  showDeleteVisitRewardModal,
  setShowDeleteVisitRewardModal,
  visitRewardToDelete,
  setVisitRewardToDelete,
  editingVisitRewardId,
  visitRewardForm,
  setVisitRewardForm,
  visitRewardSaving,
  showBirthdayRewardModal,
  setShowBirthdayRewardModal,
  showDeleteBirthdayRewardModal,
  setShowDeleteBirthdayRewardModal,
  birthdayRewardToDelete,
  setBirthdayRewardToDelete,
  editingBirthdayRewardId,
  birthdayRewardForm,
  setBirthdayRewardForm,
  birthdayRewardSaving,
  handleSaveVisitReward,
  handleDeleteVisitReward,
  handleSaveBirthdayReward,
  handleDeleteBirthdayReward,
  busy,
  cur = "AED",
}: RewardModalsProps) {
  return (
    <>
{/* MODAL: CREATE / EDIT VISIT MILESTONE REWARD                    */}
      {/* ============================================================== */}
      {showVisitRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-[#1E1815] flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#143F26]" />
                {editingVisitRewardId ? "Edit Visit Milestone Reward" : "Add New Visit Milestone Reward"}
              </h3>
              <button
                onClick={() => setShowVisitRewardModal(false)}
                className="p-1 rounded-lg text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVisitReward} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Visit Milestone Threshold *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={500}
                      value={visitRewardForm.threshold}
                      onChange={(e) => setVisitRewardForm({ ...visitRewardForm, threshold: e.target.value })}
                      placeholder="e.g. 5, 10, 20"
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                      Visits
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Validity (Days after unlock) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={365}
                      value={visitRewardForm.validDays}
                      onChange={(e) => setVisitRewardForm({ ...visitRewardForm, validDays: e.target.value })}
                      placeholder="e.g. 30"
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                      Days
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Free Reward / Item Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Signature Coffee / Beverage or Free Chef Dessert"
                  value={visitRewardForm.name}
                  onChange={(e) => setVisitRewardForm({ ...visitRewardForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] font-bold focus:outline-none focus:border-[#143F26]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Free Reward / Item Name (Arabic - Optional)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  placeholder="مثال: مشروب مجاني مميز / حلوى مجانية"
                  value={visitRewardForm.nameAr}
                  onChange={(e) => setVisitRewardForm({ ...visitRewardForm, nameAr: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Customer Description / Wallet Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Enjoy any complimentary signature beverage on your 5th dining visit!"
                  value={visitRewardForm.description}
                  onChange={(e) => setVisitRewardForm({ ...visitRewardForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="vrActive"
                  checked={visitRewardForm.isActive}
                  onChange={(e) => setVisitRewardForm({ ...visitRewardForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#143F26] focus:ring-[#143F26]"
                />
                <label htmlFor="vrActive" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                  Milestone Rule is Active & Automatically Issued upon reaching visits
                </label>
              </div>

              <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVisitRewardModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={visitRewardSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#143F26] to-[#0A2617] hover:from-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 disabled:opacity-50 cursor-pointer"
                >
                  {visitRewardSaving ? "Saving…" : editingVisitRewardId ? "Update Milestone" : "Save Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DELETE VISIT MILESTONE REWARD                           */}
      {/* ============================================================== */}
      {showDeleteVisitRewardModal && visitRewardToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#143F26]/10 text-[#143F26] flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-black text-lg text-[#1E1815] mb-1">
              Delete Milestone: {visitRewardToDelete.threshold} Visits?
            </h3>
            <p className="text-xs text-[#7A6E67] leading-relaxed mb-4">
              Are you sure you want to remove the <strong className="text-[#1E1815]">{visitRewardToDelete.name}</strong> milestone rule? Customers who have already unlocked their vouchers will keep them until expiry, but new visits will no longer trigger this rule.
            </p>

            <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteVisitRewardModal(false);
                  setVisitRewardToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteVisitReward}
                disabled={busy}
                className="px-5 py-2 rounded-xl bg-[#143F26] hover:bg-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 disabled:opacity-50 cursor-pointer"
              >
                {busy ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE / EDIT BIRTHDAY GIFT REWARD                      */}
      {/* ============================================================== */}
      {showBirthdayRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-[#1E1815] flex items-center gap-2">
                <Cake className="w-5 h-5 text-[#EC4899]" />
                {editingBirthdayRewardId ? "Edit Birthday Gift Rule" : "Add New Birthday Gift Rule"}
              </h3>
              <button
                onClick={() => setShowBirthdayRewardModal(false)}
                className="p-1 rounded-lg text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBirthdayReward} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Gift Value / Discount *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      step={0.5}
                      value={birthdayRewardForm.value}
                      onChange={(e) => setBirthdayRewardForm({ ...birthdayRewardForm, value: e.target.value })}
                      placeholder="e.g. 20"
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#EC4899]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                      {birthdayRewardForm.isPercent ? "%" : "AED"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Validity Duration *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={365}
                      value={birthdayRewardForm.validDays}
                      onChange={(e) => setBirthdayRewardForm({ ...birthdayRewardForm, validDays: e.target.value })}
                      placeholder="e.g. 30"
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#EC4899]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                      Days
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="bIsPercent"
                  checked={birthdayRewardForm.isPercent}
                  onChange={(e) => setBirthdayRewardForm({ ...birthdayRewardForm, isPercent: e.target.checked })}
                  className="w-4 h-4 rounded text-[#EC4899] focus:ring-[#EC4899]"
                />
                <label htmlFor="bIsPercent" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                  Is Percentage Bill Discount (e.g. 20% off whole bill)
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Birthday Gift Title (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Birthday Special: Free Royal Falooda & 20% Off"
                  value={birthdayRewardForm.name}
                  onChange={(e) => setBirthdayRewardForm({ ...birthdayRewardForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] font-bold focus:outline-none focus:border-[#EC4899]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Birthday Gift Title (Arabic - Optional)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  placeholder="مثال: عرض عيد الميلاد الخاص: حلوى ملكية مجانية"
                  value={birthdayRewardForm.nameAr}
                  onChange={(e) => setBirthdayRewardForm({ ...birthdayRewardForm, nameAr: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#EC4899]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Description / Redemption Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Enjoy a complimentary dessert and discount during your birthday month at any branch."
                  value={birthdayRewardForm.description}
                  onChange={(e) => setBirthdayRewardForm({ ...birthdayRewardForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#EC4899]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bActive"
                  checked={birthdayRewardForm.isActive}
                  onChange={(e) => setBirthdayRewardForm({ ...birthdayRewardForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#EC4899] focus:ring-[#EC4899]"
                />
                <label htmlFor="bActive" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                  Activate Rule (Available for instant & automated dispatch)
                </label>
              </div>

              <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBirthdayRewardModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={birthdayRewardSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#BE185D] hover:from-[#DB2777] text-white font-bold text-xs shadow-md shadow-[#EC4899]/20 disabled:opacity-50 cursor-pointer"
                >
                  {birthdayRewardSaving ? "Saving…" : editingBirthdayRewardId ? "Update Birthday Rule" : "Create Birthday Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DELETE BIRTHDAY GIFT REWARD                             */}
      {/* ============================================================== */}
      {showDeleteBirthdayRewardModal && birthdayRewardToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#143F26]/10 text-[#143F26] flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-black text-lg text-[#1E1815] mb-1">
              Delete Birthday Gift: {birthdayRewardToDelete.name}?
            </h3>
            <p className="text-xs text-[#7A6E67] leading-relaxed mb-4">
              Are you sure you want to remove the <strong className="text-[#1E1815]">{birthdayRewardToDelete.name}</strong> birthday perk? Customers who have already received their vouchers will keep them until expiry.
            </p>

            <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteBirthdayRewardModal(false);
                  setBirthdayRewardToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBirthdayReward}
                disabled={busy}
                className="px-5 py-2 rounded-xl bg-[#143F26] hover:bg-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 disabled:opacity-50 cursor-pointer"
              >
                {busy ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      
    </>
  );
}
