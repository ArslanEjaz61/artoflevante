"use client";

import React from "react";
import {
  Check,
  AlertCircle,
  Users,
  UserPlus,
  Search,
  Store,
  Building2,
  Edit2,
  Trash2,
  X,
} from "lucide-react";

interface StaffTabProps {
  staffMsg: { type: string; text: string } | null;
  setStaffMsg: (v: any) => void;
  staffData: any;
  staffSearch: string;
  setStaffSearch: (s: string) => void;
  staffRoleFilter: string;
  setStaffRoleFilter: (s: string) => void;
  staffBranchFilter: string;
  setStaffBranchFilter: (s: string) => void;
  allBranches: any[];
  setShowCreateStaffModal: (v: boolean) => void;
  setStaffForm: React.Dispatch<React.SetStateAction<any>>;
  openEditStaff: (s: any) => void;
  openDeleteStaff: (s: any) => void;
  handleToggleStaff: (s: any) => void;
  data?: any;
}

export default function StaffTab({
  staffMsg,
  setStaffMsg,
  staffData,
  staffSearch,
  setStaffSearch,
  staffRoleFilter,
  setStaffRoleFilter,
  staffBranchFilter,
  setStaffBranchFilter,
  allBranches,
  setShowCreateStaffModal,
  setStaffForm,
  openEditStaff,
  openDeleteStaff,
  handleToggleStaff,
  data,
}: StaffTabProps) {
    const rawStaff: any[] = Array.isArray(staffData) ? staffData : (staffData?.staff || []);
  const filteredStaff = rawStaff.filter((s: any) => {
    const qLower = staffSearch.toLowerCase();
    const matchQ =
      !staffSearch ||
      s.name.toLowerCase().includes(qLower) ||
      s.username.toLowerCase().includes(qLower) ||
      (s.branch?.name && s.branch.name.toLowerCase().includes(qLower)) ||
      s.role.toLowerCase().includes(qLower);
    const matchRole = staffRoleFilter === "all" || s.role === staffRoleFilter;
    const matchBranch =
      staffBranchFilter === "all" ||
      (staffBranchFilter === "hq" && !s.branchId) ||
      s.branchId === staffBranchFilter;
    return matchQ && matchRole && matchBranch;
  });

  return (
    <>
      <div className="space-y-6">
              {staffMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${staffMsg.type === "ok"
                    ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                    : "bg-[#143F26]/10 text-[#143F26] border border-[#143F26]/30"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {staffMsg.type === "ok" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{staffMsg.text}</span>
                  </div>
                  <button onClick={() => setStaffMsg(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Staff Management Header Card */}
              <div className="bg-white border border-[#EAE3DC] rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-3.5">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-gradient-to-br from-[#143F26] to-[#0A2617] flex items-center justify-center font-bold text-white shadow-md shadow-[#143F26]/30 shrink-0">
                      <Users className="w-5 sm:w-6 h-5 sm:h-6" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-[#1E1815]">
                        Staff &amp; Terminal POS Accounts
                      </h2>
                      <p className="text-xs text-[#7A6E67] mt-0.5">
                        Manage cashier till logins, store managers, assigned outlet branches, and security PIN credentials.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setStaffForm({
                          username: "",
                          name: "",
                          pin: "",
                          role: "CASHIER",
                          branchId: "",
                          isActive: true,
                        });
                        setStaffMsg(null);
                        setShowCreateStaffModal(true);
                      }}
                      className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#143F26] to-[#0A2617] hover:from-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 transition-all cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Staff Account</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Toolbar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-[#EAE3DC]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, username, branch, or role…"
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#143F26]"
                    />
                    <Search className="w-4 h-4 text-[#8C7F78] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div>
                    <select
                      value={staffRoleFilter}
                      onChange={(e) => setStaffRoleFilter(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#143F26]"
                    >
                      <option value="all">All System Roles</option>
                      <option value="CASHIER">Cashiers (POS Front Tills)</option>
                      <option value="BRANCH_MANAGER">Branch Managers</option>
                      <option value="COMPANY_ADMIN">Company Admins</option>
                      <option value="SUPER_ADMIN">Super Administrators</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={staffBranchFilter}
                      onChange={(e) => setStaffBranchFilter(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#143F26]"
                    >
                      <option value="all">All Outlet Assignments</option>
                      <option value="hq"> Corporate Head Office (All Outlets)</option>
                      {allBranches.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code}) - {b.city || "Dubai"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Staff Data Table */}
                <div className="mt-4 sm:mt-5 overflow-x-auto w-full custom-scrollbar rounded-2xl border border-[#EAE3DC]">
                  <table className="w-full text-left text-xs text-[#1E1815]">
                    <thead className="bg-[#FAF7F4] border-b border-[#EAE3DC] text-[11px] uppercase tracking-wider text-[#7A6E67] font-bold">
                      <tr>
                        <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Staff Member</th>
                        <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Login Username</th>
                        <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Assigned Branch / Outlet</th>
                        <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">System Role</th>
                        <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Till Activity</th>
                        <th className="py-3 px-3.5 sm:px-4 whitespace-nowrap">Account Status</th>
                        <th className="py-3 px-3.5 sm:px-4 text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE8E1] bg-white">
                      {filteredStaff.length > 0 ? (
                        filteredStaff.map((s) => (
                          <tr key={s.id} className="hover:bg-[#FAF7F4]/60 transition-colors">
                            <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EAE3DC] to-[#DCD3CB] flex items-center justify-center font-bold text-[#4A3F39] text-xs shrink-0">
                                  {s.name ? s.name.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div>
                                  <div className="font-extrabold text-xs text-[#1E1815]">{s.name}</div>
                                  <div className="text-[10px] text-[#7A6E67]">
                                    Joined {new Date(s.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-4 font-mono font-bold text-xs text-[#4A3F39] whitespace-nowrap">
                              @{s.username}
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                              {s.branch ? (
                                <div className="flex items-center gap-1.5">
                                  <Store className="w-3.5 h-3.5 text-[#143F26]" />
                                  <span className="font-bold text-xs text-[#1E1815]">
                                    {s.branch.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#8C7F78]">
                                    ({s.branch.code})
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[#7A6E67]">
                                  <Building2 className="w-3.5 h-3.5 text-[#C68A1E]" />
                                  <span className="font-semibold text-xs text-[#7A6E67]">
                                    Corporate / All Outlets
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                              {s.role === "SUPER_ADMIN" && (
                                <span className="px-2.5 py-1 rounded-full bg-[#143F26]/10 text-[#143F26] border border-[#143F26]/20 text-[10px] font-black uppercase tracking-wider">
                                  SUPER ADMIN
                                </span>
                              )}
                              {s.role === "COMPANY_ADMIN" && (
                                <span className="px-2.5 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 text-[10px] font-black uppercase tracking-wider">
                                  COMPANY ADMIN
                                </span>
                              )}
                              {s.role === "BRANCH_MANAGER" && (
                                <span className="px-2.5 py-1 rounded-full bg-[#C68A1E]/10 text-[#9E690B] border border-[#C68A1E]/20 text-[10px] font-black uppercase tracking-wider">
                                  BRANCH MANAGER
                                </span>
                              )}
                              {s.role === "CASHIER" && (
                                <span className="px-2.5 py-1 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 text-[10px] font-black uppercase tracking-wider">
                                  CASHIER (POS TILL)
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-4 font-semibold text-xs text-[#4A3F39] whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-lg bg-[#FAF7F4] border border-[#EAE3DC] font-mono text-[11px]">
                                {s.transactionCount ?? 0} txs
                              </span>
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleToggleStaff(s)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition-colors ${s.isActive
                                  ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 hover:bg-[#1E7A4D]/20"
                                  : "bg-[#7A6E67]/10 text-[#7A6E67] border border-[#7A6E67]/20 hover:bg-[#7A6E67]/20"
                                  }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${s.isActive ? "bg-[#1E7A4D]" : "bg-[#7A6E67]"
                                    }`}
                                />
                                <span>{s.isActive ? "ACTIVE" : "INACTIVE"}</span>
                              </button>
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditStaff(s)}
                                  className="p-1.5 rounded-lg text-[#7A6E67] hover:text-[#1E1815] hover:bg-[#FAF7F4] transition-colors cursor-pointer"
                                  title="Edit staff details & reset PIN"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteStaff(s)}
                                  className="p-1.5 rounded-lg text-[#143F26] hover:bg-[#143F26]/10 transition-colors cursor-pointer"
                                  title="Delete / Deactivate staff account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-xs text-[#7A6E67]">
                            No staff accounts found matching your filters.
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
