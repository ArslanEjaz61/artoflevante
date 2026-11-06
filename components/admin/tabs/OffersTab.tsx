"use client";

import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Tag,
  Plus,
  Search,
  ImageIcon,
  MapPin,
  Store,
  Edit2,
  Trash2,
  X,
  Clock,
} from "lucide-react";
import { toDatetimeLocal, DEFAULT_BRANCHES } from "../adminUtils";

interface OffersTabProps {
  offers: any;
  offerMsg: { type: string; text: string } | null;
  setOfferMsg: (v: any) => void;
  offerSearch: string;
  setOfferSearch: (s: string) => void;
  offerBranchFilter: string;
  setOfferBranchFilter: (b: string) => void;
  offerStatusFilter: "all" | "active" | "paused" | "expired";
  setOfferStatusFilter: (s: any) => void;
  setShowCreateOfferModal: (v: boolean) => void;
  setNewOffer: React.Dispatch<React.SetStateAction<any>>;
  setCompressedImgStats: (v: any) => void;
  openEditOffer: (o: any) => void;
  toggleOffer: (id: string, active: boolean) => void;
  deleteOffer: (id: string) => void;
  allBranches: any[];
  cur?: string;
}

export default function OffersTab({
  offers,
  offerMsg,
  setOfferMsg,
  offerSearch,
  setOfferSearch,
  offerBranchFilter,
  setOfferBranchFilter,
  offerStatusFilter,
  setOfferStatusFilter,
  setShowCreateOfferModal,
  setNewOffer,
  setCompressedImgStats,
  openEditOffer,
  toggleOffer,
  deleteOffer,
  allBranches,
  cur = "AED",
}: OffersTabProps) {
  const branchesList = allBranches.length > 0 ? allBranches : DEFAULT_BRANCHES;

  const now = new Date();
  const rawOffers: any[] = offers?.offers || [];
  const filteredOffers = rawOffers.filter((o: any) => {
    const isExpired = Boolean(o.endsAt && new Date(o.endsAt) < now);
    if (offerStatusFilter === "active" && (!o.isActive || isExpired)) return false;
    if (offerStatusFilter === "paused" && (o.isActive || isExpired)) return false;
    if (offerStatusFilter === "expired" && !isExpired) return false;
              if (offerBranchFilter !== "all") {
                // If offer has specific branches, check if selected branch is among them
                if (o.branches && o.branches.length > 0) {
                  const match = o.branches.some(
                    (b: any) => b.id === offerBranchFilter || b.code === offerBranchFilter
                  );
                  if (!match) return false;
                }
                // If offer has 0 branches, it applies to all branches, so it matches any branch filter
              }
              if (offerSearch.trim()) {
                const q = offerSearch.toLowerCase();
                const matchName = o.name?.toLowerCase().includes(q);
                const matchDesc = o.description?.toLowerCase().includes(q);
                const matchBranch = o.branches?.some(
                  (b: any) =>
                    b.name?.toLowerCase().includes(q) ||
                    b.city?.toLowerCase().includes(q) ||
                    b.code?.toLowerCase().includes(q)
                );
                if (!matchName && !matchDesc && !matchBranch) return false;
              }
              return true;
            });

            return (
              <div className="space-y-4 sm:space-y-6">
                {offerMsg && (
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm ${
                      offerMsg.type === "ok"
                        ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                        : "bg-[#143F26]/10 text-[#143F26] border border-[#143F26]/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {offerMsg.type === "ok" ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{offerMsg.text}</span>
                    </div>
                    <button onClick={() => setOfferMsg(null)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Filter & Action Toolbar */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="w-5 h-5 text-[#0E331E] shrink-0" />
                        <h2 className="font-extrabold text-base text-[#1E1815]">
                          Promotions &amp; Campaign Engine
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0E331E]/10 text-[#0E331E] text-xs font-bold">
                          {filteredOffers.length} {filteredOffers.length === 1 ? "Offer" : "Offers"}
                        </span>
                      </div>
                      <p className="text-xs text-[#7A6E67] mt-1">
                        Manage discount offers and assign promotions to specific UAE branch outlets or nationwide.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {offers?.canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewOffer({
                              name: "",
                              description: "",
                              value: "",
                              isPercent: true,
                              branchIds: [],
                              startsAt: "",
                              endsAt: "",
                              imageUrl: "",
                              bannerText: "",
                            });
                            setCompressedImgStats(null);
                            setShowCreateOfferModal(true);
                          }}
                          className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white text-xs font-black shadow-sm transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4 shrink-0" />
                          <span>Launch Promotional Campaign</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Controls Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-[#EAE3DC]">
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6E67]" />
                      <input
                        type="text"
                        placeholder="Search campaign, discount, branch…"
                        value={offerSearch}
                        onChange={(e) => setOfferSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                      />
                    </div>

                    {/* Branch Filter */}
                    <div className="relative">
                      <select
                        value={offerBranchFilter}
                        onChange={(e) => setOfferBranchFilter(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E] cursor-pointer"
                      >
                        <option value="all"> All Branches (Nationwide View)</option>
                        {branchesList.map((b: any) => (
                          <option key={b.id} value={b.id}>
                             {b.name} ({b.city || "Dubai"})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                      <select
                        value={offerStatusFilter}
                        onChange={(e) => setOfferStatusFilter(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E] cursor-pointer"
                      >
                        <option value="all">All Campaign Statuses</option>
                        <option value="active">Active Campaigns Only</option>
                        <option value="paused">Manually Paused Only</option>
                        <option value="expired">Expired (Auto-Paused)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Offers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredOffers.length > 0 ? (
                    filteredOffers.map((o: any) => {
                      const hasSpecificBranches = o.branches && o.branches.length > 0;
                      const isExpired = Boolean(o.endsAt && new Date(o.endsAt) < now);
                      const isScheduled = Boolean(o.startsAt && new Date(o.startsAt) > now);
                      const isLive = Boolean(o.isActive && !isExpired && !isScheduled);
                      return (
                        <div
                          key={o.id}
                          className="bg-white border border-[#EAE3DC] rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#0E331E]/10 to-transparent rounded-bl-full pointer-events-none" />
                          <div>
                            {/* Card Hero Banner (if uploaded) */}
                            {o.imageUrl && (
                              <div className="mb-4 -mx-5 -mt-5 h-36 overflow-hidden relative border-b border-[#EAE3DC] bg-[#1E1815]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={o.imageUrl}
                                  alt={o.name}
                                  className="w-full h-full object-cover select-none"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                {isLive ? (
                                  <span className="absolute bottom-2 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3 text-emerald-400" />
                                    <span>Customer Banner Active</span>
                                  </span>
                                ) : isExpired ? (
                                  <span className="absolute bottom-2 left-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1 border border-amber-400/30">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span>Banner Inactive (Campaign Expired)</span>
                                  </span>
                                ) : (
                                  <span className="absolute bottom-2 left-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1 border border-stone-400/30">
                                    <ImageIcon className="w-3 h-3 text-stone-400" />
                                    <span>Banner Inactive (Paused)</span>
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Card Header: Status & Value */}
                            <div className="flex items-center justify-between mb-3">
                              {isLive ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E7A4D] animate-pulse" />
                                  <span>Active Campaign</span>
                                </span>
                              ) : isExpired ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-800 border border-amber-400/40 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Expired (Auto-Paused)</span>
                                </span>
                              ) : isScheduled ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-700 border border-blue-300/40 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  <span>Scheduled</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#7A6E67]/10 text-[#7A6E67] border border-[#7A6E67]/20">
                                  Paused
                                </span>
                              )}
                              <div className="font-black text-lg text-[#0E331E] bg-[#0E331E]/10 px-2.5 py-0.5 rounded-xl border border-[#0E331E]/20">
                                {o.isPercent ? `${o.value}% OFF` : `AED ${o.value} OFF`}
                              </div>
                            </div>

                            <h3 className="font-black text-base text-[#1E1815] leading-snug">{o.name}</h3>
                            <p className="text-xs text-[#7A6E67] mt-1 leading-relaxed">
                              {o.description || "Applicable on eligible menu orders at designated Levante outlets."}
                            </p>

                            {/* ================= PROMINENT BRANCH LOCATION BADGES ================= */}
                            <div className="mt-4 pt-3 border-t border-[#EFE8E1]">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-extrabold text-[#7A6E67] uppercase text-[10px] tracking-wider">
                                  Branch Outlets:
                                </span>
                                <span className="font-black text-[11px] text-[#1E1815]">
                                  {hasSpecificBranches
                                    ? `${o.branches.length} Specific Outlet${o.branches.length === 1 ? "" : "s"}`
                                    : "All UAE Outlets (Nationwide)"}
                                </span>
                              </div>

                              {hasSpecificBranches ? (
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-1 bg-[#FAF7F4] rounded-xl border border-[#EAE3DC]">
                                  {o.branches.map((b: any) => (
                                    <span
                                      key={b.id || b.code}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-[#0E331E]/30 text-[#0E331E] text-[11px] font-bold shadow-2xs"
                                    >
                                      <MapPin className="w-3 h-3 text-[#0E331E] shrink-0" />
                                      <span className="truncate max-w-[130px]">{b.name}</span>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#EAF5EE] border border-[#C8E6D3] text-[#1E7A4D] text-[11px] font-extrabold">
                                  <Store className="w-3.5 h-3.5 text-[#1E7A4D] shrink-0" />
                                  <span>All UAE Branches (14 Outlets)</span>
                                </div>
                              )}
                            </div>

                            {/* Schedule Details */}
                            {(o.startsAt || o.endsAt) && (
                              <div className={`mt-3 flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl border ${
                                isExpired
                                  ? "bg-amber-500/10 border-amber-300/60 text-amber-900"
                                  : "bg-[#FAF7F4] border-[#EAE3DC] text-[#7A6E67]"
                              }`}>
                                <span className="text-[11px] font-semibold flex items-center gap-1">
                                  {isExpired && <Clock className="w-3 h-3 text-amber-700" />}
                                  <span>{isExpired ? "Expired On:" : "Valid:"}</span>
                                </span>
                                <span className={`font-bold text-[11px] ${isExpired ? "text-amber-900 font-mono" : "text-[#1E1815]"}`}>
                                  {o.startsAt ? new Date(o.startsAt).toLocaleDateString() : "Now"} –{" "}
                                  {o.endsAt ? new Date(o.endsAt).toLocaleDateString() : "Ongoing"}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Footer Actions */}
                          <div className="mt-5 pt-4 border-t border-[#EFE8E1] flex items-center justify-between gap-2">
                            <span className="text-[10px] text-[#7A6E67] font-medium">
                              Created {new Date(o.createdAt).toLocaleDateString()}
                            </span>
                            {offers?.canEdit && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditOffer(o)}
                                  className="p-1.5 rounded-xl bg-[#FAF7F4] hover:bg-[#EAE3DC] text-[#1E1815] border border-[#EAE3DC] transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold px-2.5"
                                  title="Edit Promotional Campaign"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#0E331E]" />
                                  <span>Edit</span>
                                </button>
                                {isExpired ? (
                                  <button
                                    type="button"
                                    onClick={() => openEditOffer(o)}
                                    className="px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-2xs bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1"
                                    title="Campaign has expired. Extend validity date to reactivate."
                                  >
                                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Extend to Activate</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => toggleOffer(o.id, !o.isActive)}
                                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-2xs ${
                                      o.isActive
                                        ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                                        : "bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                                    }`}
                                  >
                                    {o.isActive ? "Pause Offer" : "Activate Offer"}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => deleteOffer(o.id)}
                                  className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
                                  title="Delete Promotional Campaign"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full bg-white border border-[#EAE3DC] rounded-3xl p-12 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#0E331E]/10 text-[#0E331E] flex items-center justify-center mx-auto mb-3">
                        <Tag className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-extrabold text-[#1E1815] mb-1">
                        No Promotional Campaigns Found
                      </h3>
                      <p className="text-xs text-[#7A6E67] max-w-sm mx-auto mb-4">
                        {offerSearch || offerBranchFilter !== "all" || offerStatusFilter !== "all"
                          ? "No offers match your search or branch filter criteria. Try resetting filters."
                          : "No promotional campaigns are currently active. Click below to launch a new campaign."}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        {(offerSearch || offerBranchFilter !== "all" || offerStatusFilter !== "all") && (
                          <button
                            type="button"
                            onClick={() => {
                              setOfferSearch("");
                              setOfferBranchFilter("all");
                              setOfferStatusFilter("all");
                            }}
                            className="px-4 py-2 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC] text-xs font-bold text-[#4A3F39] hover:bg-white cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        )}
                        {offers?.canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewOffer({
                                name: "",
                                description: "",
                                value: "",
                                isPercent: true,
                                branchIds: [],
                                startsAt: "",
                                endsAt: "",
                                imageUrl: "",
                                bannerText: "",
                              });
                              setCompressedImgStats(null);
                              setShowCreateOfferModal(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white text-xs font-black cursor-pointer shadow-sm"
                          >
                            + Launch New Campaign
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
}
