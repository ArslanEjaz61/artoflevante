"use client";

import React from "react";
import {
  Check,
  Sliders,
  Coins,
  ShieldCheck,
  KeyRound,
  Mail,
  Sparkles,
  AlertCircle,
  EyeOff,
  Eye,
  Save,
  Calculator,
  Wallet,
  Zap,
  Gift,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Cake,
  PartyPopper,
  CheckCircle2,
  FileText,
  Tag,
  Star,
  Send,
  Server,
  MailCheck,
  RotateCw,
  X,
  MessageSquare,
} from "lucide-react";
import WhatsAppSettingsSection from "./WhatsAppSettingsSection";
import { formatMoney, formatRelativeTime } from "../adminUtils";

interface SettingsTabProps {
  settingsList: any[];
  loadEmailSettings?: () => void;
  loadEmailLogs?: () => void;
  loadEmailTemplates?: () => void;
  settingsCategory: string;
  setSettingsCategory: (cat: any) => void;
  settingsForm: any;
  setSettingsForm: React.Dispatch<React.SetStateAction<any>>;
  settingsSaving: boolean;
  settingsMsg: { type: string; text: string } | null;
  setSettingsMsg: (v: any) => void;
  handleSaveSettings: (e: React.FormEvent) => void;
  aiTesting: boolean;
  aiTestResult: any;
  testProvider: any;
  setTestProvider: (p: any) => void;
  handleTestAi: () => void;
  pinForm: any;
  setPinForm: React.Dispatch<React.SetStateAction<any>>;
  showCurrPin: boolean;
  setShowCurrPin: React.Dispatch<React.SetStateAction<boolean>>;
  showNewPin: boolean;
  setShowNewPin: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirmPin: boolean;
  setShowConfirmPin: React.Dispatch<React.SetStateAction<boolean>>;
  pinSaving: boolean;
  pinMsg: { type: string; text: string } | null;
  setPinMsg: (v: any) => void;
  handleUpdatePin: (e: React.FormEvent) => void;
  simBillAmount: string;
  setSimBillAmount: (v: string) => void;
  simPointsBalance: string;
  setSimPointsBalance: (v: string) => void;
  visitRewardsList: any[];
  visitRewardMsg: { type: string; text: string } | null;
  setVisitRewardMsg: (v: any) => void;
  handleToggleVisitReward: (reward: any) => void;
  openCreateVisitReward: () => void;
  openEditVisitReward: (r: any) => void;
  openDeleteVisitReward: (r: any) => void;
  birthdayRewardsList: any[];
  upcomingCelebrants: any[];
  birthdayRewardMsg: { type: string; text: string } | null;
  setBirthdayRewardMsg: (v: any) => void;
  dispatchingBirthdayId: string | null;
  handleToggleBirthdayReward: (reward: any) => void;
  openCreateBirthdayReward: () => void;
  openEditBirthdayReward: (r: any) => void;
  openDeleteBirthdayReward: (r: any) => void;
  handleGrantBirthdayTreat: (c: any) => void;
  handleDispatchAllBirthdayTreats: () => void;
  emailSubTab: any;
  setEmailSubTab: (t: any) => void;
  smtpForm: any;
  setSmtpForm: React.Dispatch<React.SetStateAction<any>>;
  smtpTestRecipient: string;
  setSmtpTestRecipient: (r: string) => void;
  smtpTesting: boolean;
  smtpSaving: boolean;
  smtpMsg: { type: string; text: string } | null;
  setSmtpMsg: (v: any) => void;
  handleSaveSmtpSettings: (e: React.FormEvent) => void;
  handleTestSmtpConnection: (e: React.FormEvent) => void;
  campaignForm: any;
  setCampaignForm: React.Dispatch<React.SetStateAction<any>>;
  campaignSending: boolean;
  campaignMsg: { type: string; text: string } | null;
  setCampaignMsg: (v: any) => void;
  handleSendCampaignEmail: (e: React.FormEvent) => void;
  emailLogs: any[];
  emailStats: any;
  loadingEmailLogs: boolean;
  emailTemplates: any[];
  loadingEmailTemplates: boolean;
  setShowCreateTemplateModal: (v: boolean) => void;
  setShowEditTemplateModal: (v: boolean) => void;
  setTemplateForm: React.Dispatch<React.SetStateAction<any>>;
  templateMsg: { type: string; text: string } | null;
  setTemplateMsg: (v: any) => void;
  openEmailPreview: (title: string, subject: string, content: string, category?: string) => void;
  handleSetDefaultTemplate: (id: string, category: string) => void;
  handleDeleteEmailTemplate: (id: string) => void;
  allBranches: any[];
  data?: any;
  cur?: string;
}

export default function SettingsTab({
  settingsList,
  loadEmailSettings,
  loadEmailLogs,
  loadEmailTemplates,
  settingsCategory,
  setSettingsCategory,
  settingsForm,
  setSettingsForm,
  settingsSaving,
  settingsMsg,
  setSettingsMsg,
  handleSaveSettings,
  aiTesting,
  aiTestResult,
  testProvider,
  setTestProvider,
  handleTestAi,
  pinForm,
  setPinForm,
  showCurrPin,
  setShowCurrPin,
  showNewPin,
  setShowNewPin,
  showConfirmPin,
  setShowConfirmPin,
  pinSaving,
  pinMsg,
  setPinMsg,
  handleUpdatePin,
  simBillAmount,
  setSimBillAmount,
  simPointsBalance,
  setSimPointsBalance,
  visitRewardsList,
  visitRewardMsg,
  setVisitRewardMsg,
  handleToggleVisitReward,
  openCreateVisitReward,
  openEditVisitReward,
  openDeleteVisitReward,
  birthdayRewardsList,
  upcomingCelebrants,
  birthdayRewardMsg,
  setBirthdayRewardMsg,
  dispatchingBirthdayId,
  handleToggleBirthdayReward,
  openCreateBirthdayReward,
  openEditBirthdayReward,
  openDeleteBirthdayReward,
  handleGrantBirthdayTreat,
  handleDispatchAllBirthdayTreats,
  emailSubTab,
  setEmailSubTab,
  smtpForm,
  setSmtpForm,
  smtpTestRecipient,
  setSmtpTestRecipient,
  smtpTesting,
  smtpSaving,
  smtpMsg,
  setSmtpMsg,
  handleSaveSmtpSettings,
  handleTestSmtpConnection,
  campaignForm,
  setCampaignForm,
  campaignSending,
  campaignMsg,
  setCampaignMsg,
  handleSendCampaignEmail,
  emailLogs,
  emailStats,
  loadingEmailLogs,
  emailTemplates,
  loadingEmailTemplates,
  setShowCreateTemplateModal,
  setShowEditTemplateModal,
  setTemplateForm,
  templateMsg,
  setTemplateMsg,
  openEmailPreview,
  handleSetDefaultTemplate,
  handleDeleteEmailTemplate,
  allBranches,
  data,
  cur = "AED",
}: SettingsTabProps) {
    const conversionKeys = [
    "spend_aed_for_points",
    "points_earned_per_spend",
    "points_required_for_redemption",
    "currency_value_per_redemption_points",
  ];

  const filteredSettings = settingsList.filter((s) => {
    if (conversionKeys.includes(s.key)) return false;
    return s.category === settingsCategory;
  });

  const spendStep = Number(settingsForm.spend_aed_for_points) || 10;
  const pointsPerSpend = Number(settingsForm.points_earned_per_spend) || 1;
  const reqPoints = Number(settingsForm.points_required_for_redemption) || 100;
  const aedRedemptionVal = Number(settingsForm.currency_value_per_redemption_points) || 5;

  const testBill = Number(simBillAmount) || 0;
  const calculatedPointsEarned = spendStep > 0 ? Math.floor((testBill / spendStep) * pointsPerSpend) : 0;
  const testPts = Number(simPointsBalance) || 0;
  const calculatedAedValue = reqPoints > 0 ? ((testPts / reqPoints) * aedRedemptionVal).toFixed(2) : "0.00";
  const singlePointAedVal = reqPoints > 0 ? (aedRedemptionVal / reqPoints).toFixed(4) : "0.0000";
  const singlePointFils = reqPoints > 0 ? ((aedRedemptionVal / reqPoints) * 100).toFixed(1) : "0.0";
  const cashbackPercent =
    spendStep > 0 && reqPoints > 0
      ? (((pointsPerSpend * (aedRedemptionVal / reqPoints)) / spendStep) * 100).toFixed(1)
      : "0.0";

  return (
    <>
      <div className="space-y-6">
              {settingsMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${settingsMsg.type === "ok"
                    ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                    : "bg-[#143F26]/10 text-[#143F26] border border-[#143F26]/30"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{settingsMsg.text}</span>
                  </div>
                  <button onClick={() => setSettingsMsg(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Settings Category Tabs */}
              <div className="flex items-center gap-1.5 sm:gap-2 border-b border-[#EAE3DC] pb-3 overflow-x-auto w-full custom-scrollbar flex-nowrap">
                <button
                  type="button"
                  onClick={() => setSettingsCategory("general")}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${settingsCategory === "general"
                    ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
                    : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  <Sliders className="w-4 h-4 shrink-0" />
                  <span>General Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsCategory("loyalty")}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${settingsCategory === "loyalty"
                    ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
                    : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  <Coins className="w-4 h-4 shrink-0" />
                  <span>Loyalty &amp; Points Engine</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsCategory("security")}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${settingsCategory === "security"
                    ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
                    : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Security &amp; Anti-Fraud</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsCategory("password")}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${settingsCategory === "password"
                    ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
                    : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span>Admin PIN &amp; Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsCategory("email");
                    setEmailSubTab("smtp");
                    loadEmailSettings?.();
                    loadEmailLogs?.();
                  }}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${settingsCategory === "email"
                    ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
                    : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>Email &amp; OTP Config</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsCategory("ai")}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${settingsCategory === "ai"
                    ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
                    : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>AI Models Config</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsCategory("whatsapp")}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${settingsCategory === "whatsapp"
                    ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
                    : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>WhatsApp &amp; OTP</span>
                </button>
              </div>

              {/* ========================================================= */}
              {/* TAB CONTENT: ADMIN PIN / PASSWORD UPDATE                 */}
              {/* ========================================================= */}
              {settingsCategory === "password" && (
                <div className="bg-white border border-[#EAE3DC] rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#143F26] to-[#0A2617] flex items-center justify-center font-bold text-white shadow-md shadow-[#143F26]/30 shrink-0">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight text-[#1E1815] flex items-center gap-2">
                          <span>Admin Security PIN & Login Access</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 text-[10px] font-black uppercase tracking-wider">
                            scrypt Hashed
                          </span>
                        </h3>
                        <p className="text-xs text-[#7A6E67] mt-0.5">
                          Update the master administrative PIN code used to access the executive dashboard.
                        </p>
                      </div>
                    </div>
                  </div>

                  {pinMsg && (
                    <div
                      className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${pinMsg.type === "ok"
                        ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                        : "bg-[#143F26]/10 text-[#143F26] border border-[#143F26]/30"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {pinMsg.type === "ok" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{pinMsg.text}</span>
                      </div>
                      <button onClick={() => setPinMsg(null)}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleUpdatePin} className="max-w-xl space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5" htmlFor="currPin">
                        Current Master Password / PIN *
                      </label>
                      <div className="relative">
                        <input
                          id="currPin"
                          type={showCurrPin ? "text" : "password"}
                          required
                          value={pinForm.currentPin}
                          onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value })}
                          placeholder={showCurrPin ? "Enter current password" : "••••••••"}
                          className="w-full pl-4 pr-11 py-3 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-medium text-sm focus:outline-none focus:border-[#143F26]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrPin(!showCurrPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8C7F78] hover:text-[#143F26] transition-colors rounded-lg focus:outline-none cursor-pointer"
                          title={showCurrPin ? "Hide Current Password" : "Show Current Password"}
                          aria-label={showCurrPin ? "Hide Current Password" : "Show Current Password"}
                        >
                          {showCurrPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5" htmlFor="nPin">
                          New Security Password / PIN *
                        </label>
                        <div className="relative">
                          <input
                            id="nPin"
                            type={showNewPin ? "text" : "password"}
                            required
                            minLength={4}
                            value={pinForm.newPin}
                            onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
                            placeholder={showNewPin ? "Enter new password" : "Min 4 characters"}
                            className="w-full pl-4 pr-11 py-3 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-medium text-sm focus:outline-none focus:border-[#143F26]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPin(!showNewPin)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8C7F78] hover:text-[#143F26] transition-colors rounded-lg focus:outline-none cursor-pointer"
                            title={showNewPin ? "Hide New Password" : "Show New Password"}
                            aria-label={showNewPin ? "Hide New Password" : "Show New Password"}
                          >
                            {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5" htmlFor="cPin">
                          Confirm New Password / PIN *
                        </label>
                        <div className="relative">
                          <input
                            id="cPin"
                            type={showConfirmPin ? "text" : "password"}
                            required
                            minLength={4}
                            value={pinForm.confirmPin}
                            onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                            placeholder={showConfirmPin ? "Confirm password" : "Re-enter password"}
                            className="w-full pl-4 pr-11 py-3 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-medium text-sm focus:outline-none focus:border-[#143F26]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPin(!showConfirmPin)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8C7F78] hover:text-[#143F26] transition-colors rounded-lg focus:outline-none cursor-pointer"
                            title={showConfirmPin ? "Hide Confirm Password" : "Show Confirm Password"}
                            aria-label={showConfirmPin ? "Hide Confirm Password" : "Show Confirm Password"}
                          >
                            {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#FAF7F4] border border-[#EFE8E1] rounded-2xl text-xs text-[#7A6E67] leading-relaxed space-y-1">
                      <div className="font-bold text-[#1E1815] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#1E7A4D]" />
                        <span>Security Policy & Audit Protection</span>
                      </div>
                      <p>
                        Your PIN is protected with high-workfactor cryptographic hashing. Changing your PIN will create an immutable audit record and require this new PIN for future executive logins.
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={pinSaving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#143F26] to-[#0A2617] hover:from-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{pinSaving ? "Updating PIN…" : "Update Security PIN"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ========================================================= */}
              {/* HERO: INTERACTIVE LOYALTY POINTS & AED CONVERSION CALCULATOR */}
              {/* ========================================================= */}
              {settingsCategory === "loyalty" && (
                <div className="bg-white text-[#1E1815] rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-[#EAE3DC] shadow-sm relative overflow-hidden space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl bg-gradient-to-br from-[#143F26] to-[#0A2617] flex items-center justify-center font-bold text-white shadow-md shadow-[#143F26]/30 shrink-0">
                        <Calculator className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight text-[#1E1815] flex items-center gap-2 flex-wrap">
                          <span>Loyalty Points &amp; AED Conversion Engine</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#C68A1E]/15 text-[#9E690B] border border-[#C68A1E]/30 text-[10px] font-black uppercase tracking-wider">
                            Live Calculator
                          </span>
                        </h3>
                        <p className="text-xs text-[#7A6E67] mt-0.5">
                          Configure how many AED earn loyalty points and how many points equal AED cash discount value.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC] font-mono text-[#4A3F39]">
                        Effective Cashback: <strong className="text-[#1E7A4D] font-black text-sm">{cashbackPercent}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* Dual Rules Configuration Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                    {/* Rule 1: AED to Points (Earning) */}
                    <div className="bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-[#C68A1E]" />
                          <h4 className="font-extrabold text-sm text-[#1E1815]">1. Earning Rule (AED ➔ Points)</h4>
                        </div>
                        <span className="text-[10px] font-black text-[#C68A1E] uppercase tracking-wider bg-[#C68A1E]/10 px-2.5 py-0.5 rounded-full border border-[#C68A1E]/20">
                          Bill Checkout
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6E67] mb-1">
                            Every (Spend Amount)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={settingsForm.spend_aed_for_points ?? "10"}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, spend_aed_for_points: e.target.value })
                              }
                              className="w-full px-3 py-2.5 bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-black text-sm focus:outline-none focus:border-[#143F26]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              {cur}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6E67] mb-1">
                            Awards (Points)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={settingsForm.points_earned_per_spend ?? "1"}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, points_earned_per_spend: e.target.value })
                              }
                              className="w-full px-3 py-2.5 bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-black text-sm focus:outline-none focus:border-[#143F26]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              pts
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rule Summary & Quick Presets */}
                      <div className="pt-2 border-t border-[#EAE3DC] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-[#7A6E67] text-[11px]">
                          Rate: <strong className="text-[#1E1815]">{(pointsPerSpend / spendStep).toFixed(2)} pts per 1 {cur}</strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({ ...settingsForm, spend_aed_for_points: "10", points_earned_per_spend: "1" })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#DCD3CB] hover:bg-[#FAF7F4] text-[10px] text-[#4A3F39] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            10 AED = 1 pt
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({ ...settingsForm, spend_aed_for_points: "1", points_earned_per_spend: "1" })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#DCD3CB] hover:bg-[#FAF7F4] text-[10px] text-[#4A3F39] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            1 AED = 1 pt
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Rule 2: Points to AED (Redemption) */}
                    <div className="bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-[#1E7A4D]" />
                          <h4 className="font-extrabold text-sm text-[#1E1815]">2. Redemption Rule (Points ➔ AED)</h4>
                        </div>
                        <span className="text-[10px] font-black text-[#1E7A4D] uppercase tracking-wider bg-[#1E7A4D]/10 px-2.5 py-0.5 rounded-full border border-[#1E7A4D]/20">
                          Wallet Discount
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6E67] mb-1">
                            Every (Points)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={settingsForm.points_required_for_redemption ?? "100"}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, points_required_for_redemption: e.target.value })
                              }
                              className="w-full px-3 py-2.5 bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-black text-sm focus:outline-none focus:border-[#143F26]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              pts
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6E67] mb-1">
                            Is Worth ({cur} Discount)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0.1"
                              step="0.5"
                              value={settingsForm.currency_value_per_redemption_points ?? "5"}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, currency_value_per_redemption_points: e.target.value })
                              }
                              className="w-full px-3 py-2.5 bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-black text-sm focus:outline-none focus:border-[#143F26]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              {cur}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rule Summary & Quick Presets */}
                      <div className="pt-2 border-t border-[#EAE3DC] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-[#7A6E67] text-[11px]">
                          Unit Value: <strong className="text-[#1E1815]">1 pt = {singlePointAedVal} {cur} ({singlePointFils} Fils)</strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({ ...settingsForm, points_required_for_redemption: "100", currency_value_per_redemption_points: "5" })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#DCD3CB] hover:bg-[#FAF7F4] text-[10px] text-[#4A3F39] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            100 pts = 5 AED
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({ ...settingsForm, points_required_for_redemption: "100", currency_value_per_redemption_points: "10" })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#DCD3CB] hover:bg-[#FAF7F4] text-[10px] text-[#4A3F39] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            100 pts = 10 AED
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* LIVE SIMULATOR SANDBOX TESTER                             */}
                  {/* ========================================================= */}
                  <div className="bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4 text-[#143F26]" />
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#1E1815]">
                        Live Calculator Simulator &amp; Scenario Tester
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* Simulator 1: Spend Bill Test */}
                      <div className="p-4 rounded-xl bg-white border border-[#EAE3DC] flex flex-col justify-between space-y-3 shadow-2xs">
                        <div>
                          <label className="block text-[11px] font-bold text-[#7A6E67] uppercase mb-1">
                            Test Bill Amount:
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={simBillAmount}
                              onChange={(e) => setSimBillAmount(e.target.value)}
                              className="w-full px-3 py-2 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-bold text-sm focus:outline-none focus:border-[#143F26]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              {cur}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-[#FAF7F4] border border-[#EAE3DC] flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#7A6E67]">Customer Receives:</span>
                          <span className="text-base font-black text-[#1E7A4D]">
                            +{calculatedPointsEarned} Points
                          </span>
                        </div>
                      </div>

                      {/* Simulator 2: Wallet Redemption Test */}
                      <div className="p-4 rounded-xl bg-white border border-[#EAE3DC] flex flex-col justify-between space-y-3 shadow-2xs">
                        <div>
                          <label className="block text-[11px] font-bold text-[#7A6E67] uppercase mb-1">
                            Test Member Points Balance:
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={simPointsBalance}
                              onChange={(e) => setSimPointsBalance(e.target.value)}
                              className="w-full px-3 py-2 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-bold text-sm focus:outline-none focus:border-[#143F26]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              pts
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-[#FAF7F4] border border-[#EAE3DC] flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#7A6E67]">Wallet Cash Discount:</span>
                          <span className="text-base font-black text-[#C68A1E]">
                            {cur} {calculatedAedValue}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* VISIT MILESTONES & FREE REWARDS ENGINE                    */}
              {/* (Kitny visit pr kiya free mily ga - Admin Control)       */}
              {/* ========================================================= */}
              {settingsCategory === "loyalty" && (
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-[#EAE3DC] shadow-sm space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#EAE3DC] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl bg-gradient-to-br from-[#143F26] to-[#0A2617] flex items-center justify-center font-bold text-white shadow-md shadow-[#143F26]/30 shrink-0">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight text-[#1E1815] flex items-center gap-2 flex-wrap">
                          <span>Visit Milestone &amp; Free Perks Engine</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 text-[10px] font-black uppercase tracking-wider">
                            {visitRewardsList.length} Milestones Configured
                          </span>
                        </h3>
                        <p className="text-xs text-[#7A6E67] mt-0.5">
                          Admin Rule: Kitny visit par customer ko kya free mily ga (Automated reward unlocks on dining check-in).
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={openCreateVisitReward}
                      className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#143F26] to-[#0A2617] hover:from-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Visit Milestone</span>
                    </button>
                  </div>

                  {visitRewardMsg && (
                    <div
                      className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between ${visitRewardMsg.type === "ok"
                          ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                          : "bg-[#143F26]/10 text-[#143F26] border border-[#143F26]/30"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {visitRewardMsg.type === "ok" ? (
                          <Check className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{visitRewardMsg.text}</span>
                      </div>
                      <button onClick={() => setVisitRewardMsg(null)}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Milestone Cards Grid */}
                  {visitRewardsList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {visitRewardsList.map((reward, index) => (
                        <div
                          key={reward.id}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${reward.isActive
                              ? "bg-[#FAF7F4] border-[#EAE3DC] shadow-2xs hover:shadow-md"
                              : "bg-[#F5F2EF]/60 border-[#E5DDD6] opacity-70"
                            }`}
                        >
                          {/* Top Badge & Actions */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#143F26] to-[#0A2617] text-white font-black text-xs tracking-wider shadow-xs flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>{reward.threshold} VISITS</span>
                                </span>
                                <span className="text-[10px] font-bold text-[#7A6E67] uppercase tracking-wider">
                                  Tier #{index + 1}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditVisitReward(reward)}
                                  className="p-1.5 rounded-lg text-[#7A6E67] hover:text-[#1E1815] hover:bg-white transition-colors cursor-pointer"
                                  title="Edit Milestone"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteVisitReward(reward)}
                                  className="p-1.5 rounded-lg text-[#143F26] hover:bg-[#143F26]/10 transition-colors cursor-pointer"
                                  title="Delete Milestone"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h4 className="font-extrabold text-sm text-[#1E1815] mb-1">
                              {reward.name}
                            </h4>
                            {reward.nameAr && (
                              <div className="text-xs text-[#7A6E67] font-semibold mb-2" dir="rtl">
                                {reward.nameAr}
                              </div>
                            )}
                            <p className="text-xs text-[#7A6E67] leading-relaxed mb-4">
                              {reward.description || `Unlocked automatically when diner hits visit #${reward.threshold}.`}
                            </p>
                          </div>

                          {/* Bottom Meta & Status */}
                          <div className="pt-3 border-t border-[#EAE3DC] space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[#7A6E67] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#C68A1E]" />
                                <span>Valid for {reward.validDays || 30} days</span>
                              </span>
                              <span className="font-mono font-bold text-[#1E7A4D]">
                                {reward.claimCount || 0} Claimed
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-[#8C7F78] uppercase font-bold tracking-wider">
                                Status
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleVisitReward(reward)}
                                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-colors ${reward.isActive
                                    ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 hover:bg-[#1E7A4D]/20"
                                    : "bg-[#7A6E67]/10 text-[#7A6E67] border border-[#7A6E67]/20 hover:bg-[#7A6E67]/20"
                                  }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${reward.isActive ? "bg-[#1E7A4D]" : "bg-[#7A6E67]"
                                    }`}
                                />
                                <span>{reward.isActive ? "ACTIVE" : "PAUSED"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl p-6">
                      <Gift className="w-10 h-10 text-[#143F26]/40 mx-auto mb-2" />
                      <h4 className="font-bold text-sm text-[#1E1815]">No Visit Milestone Rules Configured</h4>
                      <p className="text-xs text-[#7A6E67] max-w-md mx-auto mt-1 mb-4">
                        Create visit milestones (e.g. 5 visits = Free Drink, 10 visits = Free Dessert) so diners automatically unlock rewards upon dining!
                      </p>
                      <button
                        type="button"
                        onClick={openCreateVisitReward}
                        className="w-full sm:w-auto px-4 py-2 bg-[#143F26] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer hover:bg-[#143F26]"
                      >
                        Create First Milestone Reward
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* BIRTHDAY GIFT & SPECIAL TREATS ENGINE                    */}
              {/* (Customer ki birthday anay par gift / perks automated)     */}
              {/* ========================================================= */}
              {settingsCategory === "loyalty" && (
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-[#EAE3DC] shadow-sm space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#EAE3DC] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl bg-gradient-to-br from-[#EC4899] to-[#BE185D] flex items-center justify-center font-bold text-white shadow-md shadow-[#EC4899]/30 shrink-0">
                        <Cake className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight text-[#1E1815] flex items-center gap-2 flex-wrap">
                          <span>Birthday Gift &amp; Special Treats Engine</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#EC4899]/10 text-[#BE185D] border border-[#EC4899]/20 text-[10px] font-black uppercase tracking-wider">
                            {birthdayRewardsList.length} Gift Rules Configured
                          </span>
                        </h3>
                        <p className="text-xs text-[#7A6E67] mt-0.5">
                          Automated Birthday Perk: Customers whose birthday is approaching receive a special gift voucher, bonus points, or free treat!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {upcomingCelebrants.length > 0 && (
                        <button
                          type="button"
                          onClick={handleDispatchAllBirthdayTreats}
                          disabled={dispatchingBirthdayId === "ALL"}
                          className="w-full sm:w-auto justify-center flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#BE185D] hover:from-[#DB2777] text-white font-bold text-xs shadow-md shadow-[#EC4899]/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          <PartyPopper className="w-4 h-4" />
                          <span>{dispatchingBirthdayId === "ALL" ? "Dispatching..." : `Auto-Send to ${upcomingCelebrants.length} Celebrants`}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={openCreateBirthdayReward}
                        className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#143F26] to-[#0A2617] hover:from-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 transition-all cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Birthday Gift</span>
                      </button>
                    </div>
                  </div>

                  {birthdayRewardMsg && (
                    <div
                      className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between ${
                        birthdayRewardMsg.type === "ok"
                          ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                          : "bg-[#143F26]/10 text-[#143F26] border border-[#143F26]/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {birthdayRewardMsg.type === "ok" ? (
                          <Check className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{birthdayRewardMsg.text}</span>
                      </div>
                      <button onClick={() => setBirthdayRewardMsg(null)}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Birthday Gift Rules Grid */}
                  {birthdayRewardsList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {birthdayRewardsList.map((reward, index) => (
                        <div
                          key={reward.id}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                            reward.isActive
                              ? "bg-gradient-to-br from-[#F5FFF8] to-[#FAF7F4] border-[#FBCFE8] shadow-2xs hover:shadow-md"
                              : "bg-[#F5F2EF]/60 border-[#E5DDD6] opacity-70"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#BE185D] text-white font-black text-xs tracking-wider shadow-xs flex items-center gap-1.5">
                                  <Cake className="w-3.5 h-3.5" />
                                  <span>{reward.isPercent ? `${reward.value}% OFF` : reward.value > 0 ? `${reward.value} AED / PTS` : "FREE TREAT"}</span>
                                </span>
                                <span className="text-[10px] font-bold text-[#BE185D] uppercase tracking-wider">
                                  Gift #{index + 1}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditBirthdayReward(reward)}
                                  className="p-1.5 rounded-lg text-[#7A6E67] hover:text-[#1E1815] hover:bg-white transition-colors cursor-pointer"
                                  title="Edit Birthday Gift"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteBirthdayReward(reward)}
                                  className="p-1.5 rounded-lg text-[#143F26] hover:bg-[#143F26]/10 transition-colors cursor-pointer"
                                  title="Delete Birthday Gift"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h4 className="font-extrabold text-sm text-[#1E1815] mb-1">
                              {reward.name}
                            </h4>
                            {reward.nameAr && (
                              <div className="text-xs text-[#7A6E67] font-semibold mb-2" dir="rtl">
                                {reward.nameAr}
                              </div>
                            )}
                            <p className="text-xs text-[#7A6E67] leading-relaxed mb-4">
                              {reward.description || "Special birthday treat voucher unlocked during birthday month."}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-[#EAE3DC] space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[#7A6E67] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#C68A1E]" />
                                <span>Valid for {reward.validDays || 30} days</span>
                              </span>
                              <span className="font-mono font-bold text-[#BE185D]">
                                {reward.claimCount || 0} Celebrated
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-[#8C7F78] uppercase font-bold tracking-wider">
                                Status
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleBirthdayReward(reward)}
                                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-colors ${
                                  reward.isActive
                                    ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 hover:bg-[#1E7A4D]/20"
                                    : "bg-[#7A6E67]/10 text-[#7A6E67] border border-[#7A6E67]/20 hover:bg-[#7A6E67]/20"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    reward.isActive ? "bg-[#1E7A4D]" : "bg-[#7A6E67]"
                                  }`}
                                />
                                <span>{reward.isActive ? "ACTIVE" : "PAUSED"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl p-6">
                      <Cake className="w-10 h-10 text-[#EC4899]/40 mx-auto mb-2" />
                      <h4 className="font-bold text-sm text-[#1E1815]">No Birthday Gift Rules Active</h4>
                      <p className="text-xs text-[#7A6E67] max-w-md mx-auto mt-1 mb-4">
                        Set up a birthday treat (e.g. Free Royal Falooda, +100 Birthday Points, or 20% Discount Voucher) so diners celebrate their special day with you!
                      </p>
                      <button
                        type="button"
                        onClick={openCreateBirthdayReward}
                        className="w-full sm:w-auto px-4 py-2 bg-[#EC4899] hover:bg-[#DB2777] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                      >
                        Create Birthday Gift Rule
                      </button>
                    </div>
                  )}

                  {/* Upcoming Birthday Celebrants Sub-Panel */}
                  <div className="pt-4 border-t border-[#EAE3DC]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <PartyPopper className="w-4 h-4 text-[#EC4899]" />
                        <h4 className="font-extrabold text-sm text-[#1E1815]">
                          Upcoming Birthday Celebrants (Next 45 Days)
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F4] border border-[#EAE3DC] text-[11px] font-bold text-[#7A6E67]">
                        {upcomingCelebrants.length} Member{upcomingCelebrants.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {upcomingCelebrants.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-[#EAE3DC]">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FAF7F4] border-b border-[#EAE3DC] text-[10px] font-black uppercase tracking-wider text-[#7A6E67]">
                            <tr>
                              <th className="py-2.5 px-3">Member</th>
                              <th className="py-2.5 px-3">Birthday</th>
                              <th className="py-2.5 px-3">Days Left</th>
                              <th className="py-2.5 px-3">Gift Status</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EAE3DC]">
                            {upcomingCelebrants.map((c) => (
                              <tr key={c.id} className="hover:bg-[#FAF7F4]/60 transition-colors">
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-[#1E1815]">{c.name}</div>
                                  <div className="text-[10px] text-[#7A6E67]">{c.mobile}</div>
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-[#4A3F39]">
                                  {c.birthday ? new Date(c.birthday).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
                                </td>
                                <td className="py-2.5 px-3">
                                  {c.daysUntilBirthday === 0 ? (
                                    <span className="px-2 py-0.5 rounded-full bg-[#EC4899] text-white text-[10px] font-black animate-pulse">
                                      TODAY! 🎉
                                    </span>
                                  ) : c.daysUntilBirthday !== null && c.daysUntilBirthday <= 7 ? (
                                    <span className="px-2 py-0.5 rounded-full bg-[#EC4899]/10 text-[#BE185D] text-[10px] font-black">
                                      In {c.daysUntilBirthday} day{c.daysUntilBirthday > 1 ? "s" : ""}
                                    </span>
                                  ) : (
                                    <span className="text-[#7A6E67] font-medium">
                                      In {c.daysUntilBirthday} days
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  {c.alreadyReceivedThisYear ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E7A4D]">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Treat Issued</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C68A1E]">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>Ready to Send</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  {!c.alreadyReceivedThisYear ? (
                                    <button
                                      type="button"
                                      onClick={() => handleGrantBirthdayTreat(c.id)}
                                      disabled={dispatchingBirthdayId === c.id}
                                      className="px-3 py-1.5 rounded-lg bg-[#EC4899] hover:bg-[#BE185D] text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                                    >
                                      <Gift className="w-3 h-3" />
                                      <span>{dispatchingBirthdayId === c.id ? "Sending..." : "Send Gift"}</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleGrantBirthdayTreat(c.id)}
                                      disabled={dispatchingBirthdayId === c.id}
                                      className="px-2.5 py-1 rounded-lg border border-[#DCD3CB] text-[#7A6E67] hover:text-[#1E1815] text-[10px] font-bold transition-all cursor-pointer"
                                      title="Re-send Treat Voucher"
                                    >
                                      Re-send
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-[#7A6E67] italic bg-[#FAF7F4] p-3 rounded-xl border border-[#EAE3DC]">
                        No registered members with birthdays recorded in the upcoming 45 days.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB CONTENT: EMAIL MARKETING & SMTP CONFIG HUB            */}
              {/* ========================================================= */}
              {settingsCategory === "email" && (
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-[#EAE3DC] shadow-sm space-y-4 sm:space-y-6">
                  {/* Email Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] flex items-center justify-center font-bold text-white shadow-md shadow-[#0EA5E9]/30 shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight text-[#1E1815] flex items-center gap-2 flex-wrap">
                          <span>Email Marketing &amp; SMTP Sender Hub</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#0EA5E9]/10 text-[#0284C7] border border-[#0EA5E9]/20 text-[10px] font-black uppercase tracking-wider">
                            Direct Delivery
                          </span>
                        </h3>
                        <p className="text-xs text-[#7A6E67] mt-0.5">
                          Configure your SMTP email server and send direct announcements, promotion vouchers, or birthday greetings to customers.
                        </p>
                      </div>
                    </div>

                    {/* Email Sub-Tabs */}
                    <div className="flex items-center bg-[#FAF7F4] p-1 rounded-xl border border-[#EAE3DC] gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setEmailSubTab("smtp")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          emailSubTab === "smtp"
                            ? "bg-[#0E331E] text-white shadow-2xs"
                            : "text-[#7A6E67] hover:text-[#1E1815]"
                        }`}
                      >
                        <Server className="w-3.5 h-3.5" />
                        <span>SMTP &amp; OTP Gateway</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailSubTab("compose")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          emailSubTab === "compose"
                            ? "bg-[#0E331E] text-white shadow-2xs"
                            : "text-[#7A6E67] hover:text-[#1E1815]"
                        }`}
                      >
                        Compose Broadcast
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailSubTab("templates");
                          loadEmailTemplates?.();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          emailSubTab === "templates"
                            ? "bg-[#0E331E] text-white shadow-2xs"
                            : "text-[#7A6E67] hover:text-[#1E1815]"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Email Templates ({emailTemplates.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailSubTab("logs");
                          loadEmailLogs?.();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          emailSubTab === "logs"
                            ? "bg-[#0E331E] text-white shadow-2xs"
                            : "text-[#7A6E67] hover:text-[#1E1815]"
                        }`}
                      >
                        Sent History ({emailStats.totalCount})
                      </button>
                    </div>
                  </div>

                  {/* Sub-tab 1: Compose & Broadcast Email */}
                  {emailSubTab === "compose" && (
                    <form onSubmit={handleSendCampaignEmail} className="space-y-4 max-w-3xl">
                      {campaignMsg && (
                        <div
                          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between ${
                            campaignMsg.type === "ok"
                              ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                              : "bg-[#143F26]/10 text-[#143F26] border border-[#143F26]/30"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {campaignMsg.type === "ok" ? (
                              <Check className="w-4 h-4 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 shrink-0" />
                            )}
                            <span>{campaignMsg.text}</span>
                          </div>
                          <button onClick={() => setCampaignMsg(null)}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Audience Selector */}
                      <div>
                        <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5">
                          Target Recipient Audience *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: "all", label: "All Customers", desc: "All members with email" },
                            { id: "active", label: "Active Diners", desc: "Visited in last 45 days" },
                            { id: "birthdays", label: "Birthday Month", desc: "Birthdays this month" },
                            { id: "single", label: "Specific Email", desc: "Custom single address" },
                          ].map((aud) => (
                            <button
                              key={aud.id}
                              type="button"
                              onClick={() => setCampaignForm({ ...campaignForm, targetAudience: aud.id as any })}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                campaignForm.targetAudience === aud.id
                                  ? "border-[#0E331E] bg-[#0E331E]/5 ring-1 ring-[#0E331E]"
                                  : "border-[#EAE3DC] bg-[#FAF7F4] hover:bg-white"
                              }`}
                            >
                              <div className="font-extrabold text-xs text-[#1E1815]">{aud.label}</div>
                              <div className="text-[10px] text-[#7A6E67] mt-0.5">{aud.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {campaignForm.targetAudience === "single" && (
                        <div>
                          <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5">
                            Recipient Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={campaignForm.recipientEmail}
                            onChange={(e) => setCampaignForm({ ...campaignForm, recipientEmail: e.target.value })}
                            placeholder="customer@example.com"
                            className="w-full px-4 py-2.5 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-sm font-medium text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                          />
                        </div>
                      )}

                      {/* Template Selector from Library */}
                      {emailTemplates.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider">
                              Load From Template Library
                            </label>
                            <span className="text-[10px] text-[#7A6E67]">
                              Click any template to auto-fill subject &amp; message
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 p-2 bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl">
                            {emailTemplates.map((tpl) => (
                              <button
                                key={tpl.id}
                                type="button"
                                onClick={() => {
                                  setCampaignForm({
                                    ...campaignForm,
                                    subject: tpl.subject,
                                    content: tpl.content,
                                  });
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white border border-[#DCD3CB] hover:border-[#0E331E] hover:text-[#0E331E] text-xs font-bold text-[#1E1815] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              >
                                {tpl.category === "BIRTHDAY" ? (
                                  <Cake className="w-3.5 h-3.5 text-[#EC4899]" />
                                ) : tpl.category === "OFFERS" ? (
                                  <Tag className="w-3.5 h-3.5 text-[#0E331E]" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                                )}
                                <span>{tpl.name}</span>
                                {tpl.isDefault && (
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Subject */}
                      <div>
                        <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5">
                          Email Subject Line *
                        </label>
                        <input
                          type="text"
                          required
                          value={campaignForm.subject}
                          onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                          placeholder="e.g. Exclusive Weekend Treat: 20% Off Your Next Meal at Levante!"
                          className="w-full px-4 py-2.5 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-sm font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                        />
                      </div>

                      {/* Content Body */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider">
                            Email HTML Message Body *
                          </label>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7A6E67] flex-wrap">
                            <span>Tags:</span>
                            <code className="bg-[#FAF7F4] px-1.5 py-0.5 rounded border border-[#EAE3DC] text-[#0E331E]">
                              {"{customer_name}"}
                            </code>
                            <code className="bg-[#FAF7F4] px-1.5 py-0.5 rounded border border-[#EAE3DC] text-[#0E331E]">
                              {"{points_balance}"}
                            </code>
                            <code className="bg-[#FAF7F4] px-1.5 py-0.5 rounded border border-[#EAE3DC] text-[#0E331E]">
                              {"{reward_name}"}
                            </code>
                          </div>
                        </div>
                        <textarea
                          required
                          rows={8}
                          value={campaignForm.content}
                          onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                          placeholder="Write your email message in HTML or plain text..."
                          className="w-full px-4 py-3 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-xs font-mono text-[#1E1815] focus:outline-none focus:border-[#0E331E] leading-relaxed"
                        />
                      </div>

                      {/* Action Buttons: Live Preview + Send Button */}
                      <div className="pt-2 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            openEmailPreview(
                              "Campaign Draft Preview",
                              campaignForm.subject || "No Subject Specified",
                              campaignForm.content || "<p>No message body content written yet.</p>"
                            )
                          }
                          disabled={!campaignForm.content}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#DCD3CB] hover:border-[#0E331E] text-[#1E1815] hover:text-[#0E331E] font-bold text-xs transition-all cursor-pointer disabled:opacity-40 shadow-2xs"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Live Output Preview</span>
                        </button>

                        <button
                          type="submit"
                          disabled={campaignSending || !campaignForm.subject || !campaignForm.content}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0E331E] to-[#0E331E] hover:from-[#0A2617] text-white font-bold text-xs shadow-md shadow-[#0E331E]/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          <span>{campaignSending ? "Broadcasting Emails..." : "Send Email Campaign"}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Sub-tab: Templates Library */}
                  {emailSubTab === "templates" && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="font-extrabold text-sm sm:text-base text-[#1E1815] flex items-center gap-2">
                            <span>Email Templates &amp; Automated Triggers</span>
                            <span className="px-2 py-0.5 rounded-full bg-[#0E331E]/10 text-[#0E331E] text-[10px] font-black uppercase">
                              {emailTemplates.length} Available
                            </span>
                          </h4>
                          <p className="text-xs text-[#7A6E67] mt-0.5">
                            Create reusable templates for Birthday wishes, Promotional campaigns, and announcements. Choose which template is active by default.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setTemplateForm({
                              name: "",
                              category: "GENERAL",
                              subject: "",
                              content: "",
                              isDefault: false,
                            });
                            setTemplateMsg(null);
                            setShowCreateTemplateModal(true);
                          }}
                          className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-bold text-xs shadow-md shadow-[#0E331E]/20 transition-all cursor-pointer shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Create Email Template</span>
                        </button>
                      </div>

                      {templateMsg && (
                        <div
                          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between ${
                            templateMsg.type === "ok"
                              ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                              : "bg-[#143F26]/10 text-[#143F26] border border-[#143F26]/30"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {templateMsg.type === "ok" ? (
                              <Check className="w-4 h-4 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 shrink-0" />
                            )}
                            <span>{templateMsg.text}</span>
                          </div>
                          <button onClick={() => setTemplateMsg(null)}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Templates Grid */}
                      {loadingEmailTemplates ? (
                        <div className="py-12 text-center text-xs text-[#7A6E67]">
                          <div className="w-6 h-6 border-2 border-[#0E331E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <span>Loading Email Templates Library...</span>
                        </div>
                      ) : emailTemplates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {emailTemplates.map((tpl) => {
                            const isBirthday = tpl.category === "BIRTHDAY";
                            const isOffer = tpl.category === "OFFERS";
                            const isDefault = tpl.isDefault;

                            return (
                              <div
                                key={tpl.id}
                                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between relative bg-white ${
                                  isDefault
                                    ? "border-amber-400 shadow-sm ring-1 ring-amber-400/30"
                                    : "border-[#EAE3DC] hover:border-[#0E331E]/40 shadow-2xs hover:shadow-xs"
                                }`}
                              >
                                <div>
                                  {/* Top Header Badge */}
                                  <div className="flex items-center justify-between mb-3 gap-2">
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                        isBirthday
                                          ? "bg-[#EC4899]/10 text-[#BE185D] border border-[#EC4899]/20"
                                          : isOffer
                                          ? "bg-[#0E331E]/10 text-[#0E331E] border border-[#0E331E]/20"
                                          : "bg-blue-50 text-blue-700 border border-blue-200"
                                      }`}
                                    >
                                      {isBirthday ? (
                                        <Cake className="w-3 h-3" />
                                      ) : isOffer ? (
                                        <Tag className="w-3 h-3" />
                                      ) : (
                                        <Mail className="w-3 h-3" />
                                      )}
                                      <span>{tpl.category}</span>
                                    </span>

                                    {isDefault && (
                                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                                        <span>ACTIVE DEFAULT</span>
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="font-extrabold text-sm text-[#1E1815] mb-1">
                                    {tpl.name}
                                  </h4>

                                  <div className="text-xs text-[#7A6E67] font-semibold mb-2 line-clamp-1">
                                    <span className="text-[#1E1815] font-bold">Subject: </span>
                                    <span>{tpl.subject}</span>
                                  </div>

                                  {/* Preview box */}
                                  <div className="bg-[#FAF7F4] rounded-xl p-3 border border-[#EAE3DC] text-[11px] text-[#7A6E67] line-clamp-3 mb-4 font-mono leading-relaxed select-none">
                                    {tpl.content.replace(/<[^>]*>?/gm, " ").trim().slice(0, 140)}...
                                  </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="pt-3 border-t border-[#EAE3DC] space-y-2">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => openEmailPreview(tpl.name, tpl.subject, tpl.content, tpl.category)}
                                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-white border border-[#DCD3CB] hover:border-[#0E331E] hover:text-[#0E331E] text-[#1E1815] font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                                      title="Live Preview Email Output"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-[#0E331E]" />
                                      <span>Live Preview</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTemplateForm({
                                          id: tpl.id,
                                          name: tpl.name,
                                          category: tpl.category,
                                          subject: tpl.subject,
                                          content: tpl.content,
                                          isDefault: tpl.isDefault,
                                        });
                                        setTemplateMsg(null);
                                        setShowEditTemplateModal(true);
                                      }}
                                      className="p-1.5 rounded-xl bg-[#FAF7F4] hover:bg-[#EAE3DC] text-[#1E1815] border border-[#EAE3DC] transition-colors cursor-pointer"
                                      title="Edit Template"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-[#0E331E]" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteEmailTemplate(tpl.id)}
                                      className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
                                      title="Delete Template"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {!isDefault && (tpl.category === "BIRTHDAY" || tpl.category === "OFFERS") && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetDefaultTemplate(tpl.id, tpl.category)}
                                      className="w-full py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1"
                                    >
                                      <Star className="w-3 h-3 text-amber-600" />
                                      <span>Set as Default {tpl.category === "BIRTHDAY" ? "Birthday" : "Offers"} Template</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-10 bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl p-6">
                          <FileText className="w-10 h-10 text-[#0E331E]/40 mx-auto mb-2" />
                          <h4 className="font-bold text-sm text-[#1E1815]">No Email Templates Found</h4>
                          <p className="text-xs text-[#7A6E67] max-w-md mx-auto mt-1 mb-4">
                            Create custom templates for Birthday perks and promotional campaigns so emails can be dispatched instantly.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-tab 2: SMTP & OTP Gateway Configuration */}
                  {emailSubTab === "smtp" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <form onSubmit={handleSaveSmtpSettings} className="lg:col-span-2 space-y-4">
                        {smtpMsg && (
                          <div
                            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between ${
                              smtpMsg.type === "ok"
                                ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                                : "bg-[#143F26]/10 text-[#143F26] border border-[#143F26]/30"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {smtpMsg.type === "ok" ? (
                                <Check className="w-4 h-4 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 shrink-0" />
                              )}
                              <span>{smtpMsg.text}</span>
                            </div>
                            <button onClick={() => setSmtpMsg(null)}>
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5">
                              SMTP Host Server *
                            </label>
                            <input
                              type="text"
                              required
                              value={smtpForm.host}
                              onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                              placeholder="e.g. smtp.gmail.com or smtp.sendgrid.net"
                              className="w-full px-4 py-2.5 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-xs font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5">
                              Port *
                            </label>
                            <input
                              type="number"
                              required
                              value={smtpForm.port}
                              onChange={(e) => setSmtpForm({ ...smtpForm, port: e.target.value })}
                              placeholder="587"
                              className="w-full px-4 py-2.5 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-xs font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5">
                              SMTP Username / Email *
                            </label>
                            <input
                              type="text"
                              required
                              value={smtpForm.user}
                              onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                              placeholder="e.g. notifications@artoflevante.ae"
                              className="w-full px-4 py-2.5 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-xs font-medium text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5">
                              SMTP Password / App Key *
                            </label>
                            <input
                              type="password"
                              value={smtpForm.pass}
                              onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                              placeholder="••••••••••••"
                              className="w-full px-4 py-2.5 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-xs font-medium text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5">
                              Sender Display Name
                            </label>
                            <input
                              type="text"
                              value={smtpForm.fromName}
                              onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                              placeholder="Levante Rewards"
                              className="w-full px-4 py-2.5 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-xs font-medium text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5">
                              From Email Address
                            </label>
                            <input
                              type="email"
                              value={smtpForm.fromEmail}
                              onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                              placeholder="loyalty@artoflevante.ae"
                              className="w-full px-4 py-2.5 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-xs font-medium text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id="smtpSecure"
                            checked={smtpForm.secure}
                            onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                            className="w-4 h-4 rounded text-[#0E331E] focus:ring-[#0E331E]"
                          />
                          <label htmlFor="smtpSecure" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                            Enable SSL / TLS Encryption (Port 465)
                          </label>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="submit"
                            disabled={smtpSaving}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            <span>{smtpSaving ? "Saving Config..." : "Save SMTP Settings"}</span>
                          </button>
                        </div>
                      </form>

                      {/* Right: Live Connection Tester */}
                      <div className="p-5 rounded-2xl bg-[#FAF7F4] border border-[#EAE3DC] flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center gap-2 text-[#1E1815] font-extrabold text-sm mb-1">
                            <Server className="w-4 h-4 text-[#0EA5E9]" />
                            <span>Live SMTP Tester</span>
                          </div>
                          <p className="text-xs text-[#7A6E67] leading-relaxed">
                            Send a real-time verification email to verify your SMTP host, port, and credentials.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-[#7A6E67] uppercase mb-1">
                              Test Recipient Email:
                            </label>
                            <input
                              type="email"
                              value={smtpTestRecipient}
                              onChange={(e) => setSmtpTestRecipient(e.target.value)}
                              placeholder="your-email@example.com"
                              className="w-full px-3 py-2 bg-white border border-[#DCD3CB] rounded-xl text-xs font-medium text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleTestSmtpConnection}
                            disabled={smtpTesting || !smtpTestRecipient}
                            className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] text-white font-bold text-xs shadow-md shadow-[#0EA5E9]/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <MailCheck className="w-4 h-4" />
                            <span>{smtpTesting ? "Sending Test Email..." : "Send Test Email"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 3: Sent Email History Logs */}
                  {emailSubTab === "logs" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl">
                          <div className="text-[10px] font-bold text-[#7A6E67] uppercase">Total Dispatched</div>
                          <div className="text-lg font-black text-[#1E1815]">{emailStats.totalCount}</div>
                        </div>
                        <div className="p-3 bg-[#EAF5EE] border border-[#C8E6D3] rounded-xl">
                          <div className="text-[10px] font-bold text-[#1E7A4D] uppercase">Successful Sent</div>
                          <div className="text-lg font-black text-[#1E7A4D]">{emailStats.totalSent}</div>
                        </div>
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                          <div className="text-[10px] font-bold text-red-800 uppercase">Failed</div>
                          <div className="text-lg font-black text-red-800">{emailStats.totalFailed}</div>
                        </div>
                      </div>

                      {loadingEmailLogs ? (
                        <div className="text-center py-8 text-xs text-[#7A6E67]">Loading email history...</div>
                      ) : emailLogs.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-[#EAE3DC]">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#FAF7F4] border-b border-[#EAE3DC] text-[10px] font-black uppercase tracking-wider text-[#7A6E67]">
                              <tr>
                                <th className="py-2.5 px-3">Recipient</th>
                                <th className="py-2.5 px-3">Subject</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EAE3DC]">
                              {emailLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-[#FAF7F4]/60">
                                  <td className="py-2.5 px-3 font-bold text-[#1E1815]">{log.recipient}</td>
                                  <td className="py-2.5 px-3 text-[#5C504A] max-w-xs truncate">{log.subject}</td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        log.status === "SENT"
                                          ? "bg-[#1E7A4D]/10 text-[#1E7A4D]"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-[#7A6E67]">{new Date(log.createdAt).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center py-8 text-xs text-[#7A6E67]">No email logs recorded yet.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: WHATSAPP OTP GATEWAY */}
              {settingsCategory === "whatsapp" && (
                <WhatsAppSettingsSection />
              )}

              {/* General / Category Settings Form */}
              {/* ========================================================= */}
              {/* TAB CONTENT: AI MODELS & RECEIPT OCR VISION HUB         */}
              {/* ========================================================= */}
              {settingsCategory === "ai" && (
                <div className="bg-white border border-[#EAE3DC] rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0E331E] to-[#0B5A26] flex items-center justify-center font-bold text-white shadow-md shadow-[#0E331E]/30 shrink-0">
                        <Sparkles className="w-5 h-5 text-[#F5EFE0]" />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight text-[#1E1815] flex items-center gap-2 flex-wrap">
                          <span>AI Models Config</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                            Active: {settingsForm.receipt_ai_provider?.toUpperCase() || "GEMINI"}
                          </span>
                        </h3>
                        <p className="text-xs text-[#7A6E67] font-medium mt-0.5">
                          Configure Google Gemini, OpenAI GPT-4o, or OpenRouter for automated bill analysis and point awarding.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1. Provider Selection Cards */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#7A6E67] mb-2.5">
                      Select Primary AI Vision Provider
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Gemini Card */}
                      <div
                        onClick={() => {
                        setSettingsForm((prev: any) => ({ ...prev, receipt_ai_provider: "gemini" }));
                        setTestProvider("gemini");
                      }}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          (settingsForm.receipt_ai_provider || "gemini") === "gemini"
                            ? "border-[#0E331E] bg-[#F6FFF9] shadow-sm"
                            : "border-[#EAE3DC] bg-[#FAF7F4] hover:border-[#0E331E]/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-extrabold text-[#1E1815]">Google Gemini</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                            Recommended
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A6E67] leading-relaxed mb-3">
                          Direct multimodal vision. Ultra-low latency and best accuracy for thermal receipt scans.
                        </p>
                        <div className="text-[11px] font-mono font-bold text-[#0E331E]">
                          Default: gemini-2.5-flash
                        </div>
                      </div>

                      {/* OpenAI Card */}
                      <div
                        onClick={() => {
                        setSettingsForm((prev: any) => ({ ...prev, receipt_ai_provider: "openai" }));
                        setTestProvider("openai");
                      }}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          settingsForm.receipt_ai_provider === "openai"
                            ? "border-[#0E331E] bg-[#F6FFF9] shadow-sm"
                            : "border-[#EAE3DC] bg-[#FAF7F4] hover:border-[#0E331E]/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-extrabold text-[#1E1815]">OpenAI GPT</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold">
                            GPT-4o Vision
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A6E67] leading-relaxed mb-3">
                          Standard OpenAI JSON mode with high precision for complex tax invoices.
                        </p>
                        <div className="text-[11px] font-mono font-bold text-[#0E331E]">
                          Default: gpt-4o-mini
                        </div>
                      </div>

                      {/* OpenRouter Card */}
                      <div
                        onClick={() => {
                        setSettingsForm((prev: any) => ({ ...prev, receipt_ai_provider: "openrouter" }));
                        setTestProvider("openrouter");
                      }}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          settingsForm.receipt_ai_provider === "openrouter"
                            ? "border-[#0E331E] bg-[#F6FFF9] shadow-sm"
                            : "border-[#EAE3DC] bg-[#FAF7F4] hover:border-[#0E331E]/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-extrabold text-[#1E1815]">OpenRouter</span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold">
                            Multi-Model
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A6E67] leading-relaxed mb-3">
                          Access Claude 3.5 Sonnet, Llama Vision, or Gemini via single OpenRouter wallet.
                        </p>
                        <div className="text-[11px] font-mono font-bold text-[#0E331E]">
                          Default: google/gemini-2.5-flash
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Provider API Credentials Form */}
                  <form onSubmit={handleSaveSettings} className="space-y-5">
                    {/* Gemini Settings */}
                    {(settingsForm.receipt_ai_provider || "gemini") === "gemini" && (
                    <div className="p-4.5 rounded-2xl border border-[#EAE3DC] bg-[#FAF7F4] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-extrabold text-sm text-[#1E1815] flex items-center gap-2">
                          <span>Google Gemini Configuration</span>
                          {(settingsForm.receipt_ai_provider || "gemini") === "gemini" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0E331E] text-white font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#7A6E67]">Get key from aistudio.google.com</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#1E1815] mb-1">Gemini API Key</label>
                          <input
                            type="password"
                            placeholder="AIzaSy..."
                            value={settingsForm.gemini_api_key || ""}
                            onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, gemini_api_key: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-mono font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#1E1815] mb-1">Gemini Vision Model</label>
                          <input
                            type="text"
                            placeholder="gemini-2.5-flash"
                            value={settingsForm.gemini_model || "gemini-2.5-flash"}
                            onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, gemini_model: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-mono font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                          />
                        </div>
                      </div>
                    </div>
                    )}

                    {/* OpenAI Settings */}
                    {settingsForm.receipt_ai_provider === "openai" && (
                    <div className="p-4.5 rounded-2xl border border-[#EAE3DC] bg-[#FAF7F4] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-extrabold text-sm text-[#1E1815] flex items-center gap-2">
                          <span>OpenAI Configuration</span>
                          {settingsForm.receipt_ai_provider === "openai" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0E331E] text-white font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#7A6E67]">Get key from platform.openai.com</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#1E1815] mb-1">OpenAI API Key</label>
                          <input
                            type="password"
                            placeholder="sk-proj-..."
                            value={settingsForm.openai_api_key || ""}
                            onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, openai_api_key: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-mono font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#1E1815] mb-1">OpenAI Vision Model</label>
                          <input
                            type="text"
                            placeholder="gpt-4o-mini"
                            value={settingsForm.openai_model || "gpt-4o-mini"}
                            onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, openai_model: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-mono font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                          />
                        </div>
                      </div>
                    </div>
                    )}

                    {/* OpenRouter Settings */}
                    {settingsForm.receipt_ai_provider === "openrouter" && (
                    <div className="p-4.5 rounded-2xl border border-[#EAE3DC] bg-[#FAF7F4] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-extrabold text-sm text-[#1E1815] flex items-center gap-2">
                          <span>OpenRouter Configuration</span>
                          {settingsForm.receipt_ai_provider === "openrouter" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0E331E] text-white font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#7A6E67]">Get key from openrouter.ai/keys</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#1E1815] mb-1">OpenRouter API Key</label>
                          <input
                            type="password"
                            placeholder="sk-or-v1-..."
                            value={settingsForm.openrouter_api_key || ""}
                            onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, openrouter_api_key: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-mono font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#1E1815] mb-1">OpenRouter Model Name</label>
                          <input
                            type="text"
                            placeholder="google/gemini-2.5-flash"
                            value={settingsForm.openrouter_model || "google/gemini-2.5-flash"}
                            onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, openrouter_model: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-mono font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                          />
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Receipt Limits & Safeguards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl border border-[#EAE3DC] bg-[#FAF7F4]">
                        <label className="block text-xs font-bold text-[#1E1815] mb-1">
                          Max Receipt Age Allowed (Days)
                        </label>
                        <p className="text-[11px] text-[#7A6E67] mb-2">Bills older than this cannot be claimed.</p>
                        <input
                          type="number"
                          value={settingsForm.receipt_max_age_days || "7"}
                          onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, receipt_max_age_days: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                        />
                      </div>
                      <div className="p-3.5 rounded-xl border border-[#EAE3DC] bg-[#FAF7F4]">
                        <label className="block text-xs font-bold text-[#1E1815] mb-1">
                          Daily Receipt Claims per Customer
                        </label>
                        <p className="text-[11px] text-[#7A6E67] mb-2">Maximum receipts one member can claim in 24 hours.</p>
                        <input
                          type="number"
                          value={settingsForm.receipt_daily_limit || "3"}
                          onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, receipt_daily_limit: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                        />
                      </div>
                    </div>

                    {/* Save Settings Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={settingsSaving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white text-xs font-bold shadow-md shadow-[#0E331E]/20 disabled:opacity-50 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>{settingsSaving ? "Saving Live..." : "Save AI Vision Settings"}</span>
                      </button>
                    </div>
                  </form>

                  {/* 3. Real-time Live Connection Test Box */}
                  <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50/60 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-sky-700" />
                        <span className="text-xs font-extrabold text-sky-900">Live AI Connection Tester</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={testProvider}
                          onChange={(e) => setTestProvider(e.target.value as any)}
                          className="px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg text-xs font-bold text-sky-900 focus:outline-none"
                        >
                          <option value="gemini">Google Gemini</option>
                          <option value="openai">OpenAI GPT</option>
                          <option value="openrouter">OpenRouter</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleTestAi}
                          disabled={aiTesting}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {aiTesting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          <span>{aiTesting ? "Testing..." : "Test Connection"}</span>
                        </button>
                      </div>
                    </div>

                    {aiTestResult && (
                      <div
                        className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between ${
                          aiTestResult.ok
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : "bg-red-100 text-red-900 border border-red-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {aiTestResult.ok ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                          )}
                          <span>{aiTestResult.message}</span>
                        </div>
                        {aiTestResult.latencyMs !== undefined && (
                          <span className="text-[10px] font-mono opacity-80">{aiTestResult.latencyMs}ms</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 4. Authentic Levante Receipt Verification Guard */}
                  <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-950">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span>Authentic Receipt Guard Rules (Trained on Genuine POS Bills)</span>
                    </div>
                    <ul className="text-[11.5px] text-amber-900 space-y-1 list-disc list-inside font-medium leading-relaxed">
                      <li>
                        <b>Mandatory Brand Verification:</b> The receipt must show the Levante name or logo.
                      </li>
                      <li>
                        <b>Other Brands Auto-Rejected:</b> Receipts from Carrefour, Lulu, KFC, McDonald's, petrol pumps, or any other merchants are blocked automatically by AI.
                      </li>
                      <li>
                        <b>Invoice &amp; Date Duplicate Protection:</b> The database ensures no invoice number can ever be claimed twice.
                      </li>
                      <li>
                        <b>Only Final Grand Total Used:</b> Points are calculated strictly from the grand payable total (incl. 5% VAT), ignoring sub-totals or cash received.
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* General / Category Settings Form */}
              {settingsCategory !== "password" && settingsCategory !== "email" && settingsCategory !== "ai" && settingsCategory !== "whatsapp" && (
                <form onSubmit={handleSaveSettings} className="bg-white border border-[#EAE3DC] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE3DC] pb-3">
                    <h3 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                      {settingsCategory === "general" && (
                        <>
                          <Sliders className="w-5 h-5 text-[#143F26]" />
                          <span>General App &amp; Brand Parameters</span>
                        </>
                      )}
                      {settingsCategory === "loyalty" && (
                        <>
                          <Coins className="w-5 h-5 text-[#143F26]" />
                          <span>Additional Loyalty Rules &amp; Policies</span>
                        </>
                      )}
                      {settingsCategory === "security" && (
                        <>
                          <ShieldCheck className="w-5 h-5 text-[#143F26]" />
                          <span>Security &amp; Anti-Fraud Thresholds</span>
                        </>
                      )}
                    </h3>
                    <span className="text-xs text-[#7A6E67] font-semibold">{filteredSettings.length} Parameters</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {filteredSettings.map((item) => (
                      <div
                        key={item.key}
                        className="p-3.5 sm:p-4 rounded-2xl border border-[#EFE8E1] bg-[#FAF7F4] flex flex-col justify-between"
                      >
                        <div className="mb-3">
                          <label className="block text-xs font-bold text-[#1E1815] mb-1" htmlFor={item.key}>
                            {item.label}
                          </label>
                          <p className="text-[11px] text-[#7A6E67] leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <div>
                          <input
                            id={item.key}
                            type={item.secret ? "password" : item.type === "number" ? "number" : "text"}
                            autoComplete={item.secret ? "new-password" : undefined}
                            placeholder={item.secret ? "sk-or-v1-…" : undefined}
                            value={settingsForm[item.key] ?? ""}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, [item.key]: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#143F26]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#EAE3DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-[#7A6E67]">
                      Changes will take effect immediately across all customer and staff apps.
                    </div>
                    <button
                      type="submit"
                      disabled={settingsSaving}
                      className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#143F26] to-[#0A2617] hover:from-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{settingsSaving ? "Saving Config…" : "Save Settings"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
    </>
  );
}
