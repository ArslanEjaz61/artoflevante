"use client";

import React from "react";
import {
  UserPlus,
  EyeOff,
  Eye,
  Edit2,
  AlertTriangle,
  X,
} from "lucide-react";

interface StaffModalsProps {
  showCreateStaffModal: boolean;
  setShowCreateStaffModal: (v: boolean) => void;
  showEditStaffModal: boolean;
  setShowEditStaffModal: (v: boolean) => void;
  showDeleteStaffModal: boolean;
  setShowDeleteStaffModal: (v: boolean) => void;
  staffToDelete: any;
  setStaffToDelete: (v: any) => void;
  showStaffPin: boolean;
  setShowStaffPin: React.Dispatch<React.SetStateAction<boolean>>;
  showEditStaffPin: boolean;
  setShowEditStaffPin: React.Dispatch<React.SetStateAction<boolean>>;
  staffForm: any;
  setStaffForm: React.Dispatch<React.SetStateAction<any>>;
  staffMsg: { type: string; text: string } | null;
  allBranches: any[];
  busy: boolean;
  handleCreateStaff: (e: React.FormEvent) => void;
  handleUpdateStaff: (e: React.FormEvent) => void;
  handleDeleteStaff: () => void;
}

export default function StaffModals({
  showCreateStaffModal,
  setShowCreateStaffModal,
  showEditStaffModal,
  setShowEditStaffModal,
  showDeleteStaffModal,
  setShowDeleteStaffModal,
  staffToDelete,
  setStaffToDelete,
  showStaffPin,
  setShowStaffPin,
  showEditStaffPin,
  setShowEditStaffPin,
  staffForm,
  setStaffForm,
  staffMsg,
  allBranches,
  busy,
  handleCreateStaff,
  handleUpdateStaff,
  handleDeleteStaff,
}: StaffModalsProps) {
  return (
    <>
{/* MODAL: CREATE STAFF ACCOUNT                                     */}
      {/* ============================================================== */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-[#1E1815] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#143F26]" />
                Add New Staff Member
              </h3>
              <button
                onClick={() => setShowCreateStaffModal(false)}
                className="p-1 rounded-lg text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {staffMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 ${staffMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#143F26]/10 text-[#143F26]"
                  }`}
              >
                {staffMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Al Nuaimi"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Login Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. tariq_pos1"
                    value={staffForm.username}
                    onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Security PIN / Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showStaffPin ? "text" : "password"}
                      required
                      minLength={4}
                      placeholder={showStaffPin ? "Enter password" : "Min 4 characters"}
                      value={staffForm.pin}
                      onChange={(e) => setStaffForm({ ...staffForm, pin: e.target.value })}
                      className="w-full pl-3 pr-8 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-medium text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPin(!showStaffPin)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#8C7F78] hover:text-[#143F26] transition-colors rounded focus:outline-none cursor-pointer"
                      title={showStaffPin ? "Hide Password" : "Show Password"}
                    >
                      {showStaffPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    System Role *
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                  >
                    <option value="CASHIER">Cashier (POS Till)</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="COMPANY_ADMIN">Company Administrator</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Assigned Outlet Branch *
                  </label>
                  <select
                    value={staffForm.branchId}
                    onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                  >
                    <option value=""> Corporate / All Outlets</option>
                    {allBranches.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="sActive"
                  checked={staffForm.isActive}
                  onChange={(e) => setStaffForm({ ...staffForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#143F26] focus:ring-[#143F26]"
                />
                <label htmlFor="sActive" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                  Account is Active & Allowed to Sign In to POS / Admin
                </label>
              </div>

              <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#143F26] to-[#0A2617] hover:from-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 disabled:opacity-50 cursor-pointer"
                >
                  {busy ? "Creating…" : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT STAFF DETAILS & RESET PIN                           */}
      {/* ============================================================== */}
      {showEditStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-[#1E1815] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#143F26]" />
                Edit Staff Member & Reset PIN
              </h3>
              <button
                onClick={() => setShowEditStaffModal(false)}
                className="p-1 rounded-lg text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {staffMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 ${staffMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#143F26]/10 text-[#143F26]"
                  }`}
              >
                {staffMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Login Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.username}
                    onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Reset PIN / Password (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type={showEditStaffPin ? "text" : "password"}
                      minLength={4}
                      placeholder={showEditStaffPin ? "Enter new password" : "Leave blank to keep current"}
                      value={staffForm.pin}
                      onChange={(e) => setStaffForm({ ...staffForm, pin: e.target.value })}
                      className="w-full pl-3 pr-8 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-medium text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditStaffPin(!showEditStaffPin)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#8C7F78] hover:text-[#143F26] transition-colors rounded focus:outline-none cursor-pointer"
                      title={showEditStaffPin ? "Hide Password" : "Show Password"}
                    >
                      {showEditStaffPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    System Role *
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                  >
                    <option value="CASHIER">Cashier (POS Till)</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="COMPANY_ADMIN">Company Administrator</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Assigned Outlet Branch *
                  </label>
                  <select
                    value={staffForm.branchId}
                    onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#143F26]"
                  >
                    <option value=""> Corporate / All Outlets</option>
                    {allBranches.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="sActiveEdit"
                  checked={staffForm.isActive}
                  onChange={(e) => setStaffForm({ ...staffForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#143F26] focus:ring-[#143F26]"
                />
                <label htmlFor="sActiveEdit" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                  Account is Active & Allowed to Sign In
                </label>
              </div>

              <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditStaffModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#143F26] to-[#0A2617] hover:from-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 disabled:opacity-50 cursor-pointer"
                >
                  {busy ? "Updating…" : "Update Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DELETE / DEACTIVATE STAFF CONFIRMATION                  */}
      {/* ============================================================== */}
      {showDeleteStaffModal && staffToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#143F26]/10 text-[#143F26] flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-black text-lg text-[#1E1815] mb-1">
              Delete Staff: {staffToDelete.name}?
            </h3>
            <p className="text-xs text-[#7A6E67] leading-relaxed mb-4">
              Are you sure you want to remove{" "}
              <strong className="text-[#1E1815]">{staffToDelete.name} (@{staffToDelete.username})</strong>?
              If this staff account has processed historical till transactions, it will be safely deactivated to preserve financial audit history.
            </p>

            <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteStaffModal(false);
                  setStaffToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
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
      
    </>
  );
}
