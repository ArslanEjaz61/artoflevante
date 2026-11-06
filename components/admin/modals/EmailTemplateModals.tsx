"use client";

import React from "react";
import {
  FileText,
  Eye,
  Edit2,
  Laptop,
  Smartphone,
  Mail,
  X,
} from "lucide-react";

interface EmailTemplateModalsProps {
  showCreateTemplateModal: boolean;
  setShowCreateTemplateModal: (v: boolean) => void;
  showEditTemplateModal: boolean;
  setShowEditTemplateModal: (v: boolean) => void;
  showEmailPreviewModal: boolean;
  setShowEmailPreviewModal: (v: boolean) => void;
  previewDeviceMode: "desktop" | "mobile";
  setPreviewDeviceMode: (m: "desktop" | "mobile") => void;
  previewEmailData: any;
  templateForm: any;
  setTemplateForm: React.Dispatch<React.SetStateAction<any>>;
  templateSaving: boolean;
  templateMsg: { type: string; text: string } | null;
  handleCreateEmailTemplate: (e: React.FormEvent) => void;
  handleUpdateEmailTemplate: (e: React.FormEvent) => void;
  openEmailPreview: (title: string, subject: string, content: string, category?: string) => void;
}

export default function EmailTemplateModals({
  showCreateTemplateModal,
  setShowCreateTemplateModal,
  showEditTemplateModal,
  setShowEditTemplateModal,
  showEmailPreviewModal,
  setShowEmailPreviewModal,
  previewDeviceMode,
  setPreviewDeviceMode,
  previewEmailData,
  templateForm,
  setTemplateForm,
  templateSaving,
  templateMsg,
  handleCreateEmailTemplate,
  handleUpdateEmailTemplate,
  openEmailPreview,
}: EmailTemplateModalsProps) {
  return (
    <>
{/* MODAL: CREATE EMAIL TEMPLATE                                   */}
      {/* ============================================================== */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl max-w-xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#EAE3DC] bg-[#FAF7F4] shrink-0">
              <h3 className="font-extrabold text-base sm:text-lg text-[#1E1815] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0E331E]" />
                Create New Email Template
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateTemplateModal(false)}
                className="p-1.5 rounded-xl text-[#7A6E67] hover:bg-white hover:text-[#1E1815] border border-transparent hover:border-[#EAE3DC] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmailTemplate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                {templateMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      templateMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#143F26]/10 text-[#143F26]"
                    }`}
                  >
                    {templateMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VIP Birthday Greeting"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                      Category *
                    </label>
                    <select
                      value={templateForm.category}
                      onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                    >
                      <option value="BIRTHDAY">🎂 Birthday Gift &amp; Greetings</option>
                      <option value="OFFERS">🏷️ Promotional Offers &amp; Discounts</option>
                      <option value="GENERAL">📢 General Announcement</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Email Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 🎂 Happy Birthday {customer_name}! A Royal Treat Awaits"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="text-xs font-bold text-[#7A6E67] uppercase">
                      HTML Email Message Body *
                    </label>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#7A6E67] flex-wrap">
                      <span>Click to insert:</span>
                      {["{customer_name}", "{points_balance}", "{reward_name}", "{reward_description}", "{expiry_date}"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setTemplateForm({ ...templateForm, content: templateForm.content + " " + tag })}
                          className="bg-[#FAF7F4] hover:bg-[#0E331E]/10 hover:text-[#0E331E] px-1.5 py-0.5 rounded border border-[#EAE3DC] transition-colors cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    required
                    rows={9}
                    placeholder="Write your email HTML structure..."
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs font-mono bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E] leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="createTplDefault"
                    checked={templateForm.isDefault}
                    onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0E331E] focus:ring-[#0E331E]"
                  />
                  <label htmlFor="createTplDefault" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                    Set as active default template for this category
                  </label>
                </div>
              </div>

              <div className="p-4 px-6 border-t border-[#EAE3DC] bg-[#FAF7F4] flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    openEmailPreview(
                      templateForm.name || "Draft Template Preview",
                      templateForm.subject || "No Subject Specified",
                      templateForm.content || "<p>No content written.</p>",
                      templateForm.category
                    )
                  }
                  disabled={!templateForm.content}
                  className="px-3 py-2 rounded-xl bg-white border border-[#DCD3CB] hover:border-[#0E331E] hover:text-[#0E331E] text-[#1E1815] font-bold text-xs transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-[#0E331E]" />
                  <span>Preview Output</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateTemplateModal(false)}
                    className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={templateSaving}
                    className="px-5 py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-bold text-xs shadow-md shadow-[#0E331E]/20 disabled:opacity-50 cursor-pointer"
                  >
                    {templateSaving ? "Saving…" : "Save Template"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT EMAIL TEMPLATE                                     */}
      {/* ============================================================== */}
      {showEditTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl max-w-xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#EAE3DC] bg-[#FAF7F4] shrink-0">
              <h3 className="font-extrabold text-base sm:text-lg text-[#1E1815] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#0E331E]" />
                Edit Email Template
              </h3>
              <button
                type="button"
                onClick={() => setShowEditTemplateModal(false)}
                className="p-1.5 rounded-xl text-[#7A6E67] hover:bg-white hover:text-[#1E1815] border border-transparent hover:border-[#EAE3DC] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmailTemplate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                {templateMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      templateMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#143F26]/10 text-[#143F26]"
                    }`}
                  >
                    {templateMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                      Category *
                    </label>
                    <select
                      value={templateForm.category}
                      onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                    >
                      <option value="BIRTHDAY">🎂 Birthday Gift &amp; Greetings</option>
                      <option value="OFFERS">🏷️ Promotional Offers &amp; Discounts</option>
                      <option value="GENERAL">📢 General Announcement</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Email Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="text-xs font-bold text-[#7A6E67] uppercase">
                      HTML Email Message Body *
                    </label>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#7A6E67] flex-wrap">
                      <span>Click to insert:</span>
                      {["{customer_name}", "{points_balance}", "{reward_name}", "{reward_description}", "{expiry_date}"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setTemplateForm({ ...templateForm, content: templateForm.content + " " + tag })}
                          className="bg-[#FAF7F4] hover:bg-[#0E331E]/10 hover:text-[#0E331E] px-1.5 py-0.5 rounded border border-[#EAE3DC] transition-colors cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    required
                    rows={9}
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs font-mono bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#0E331E] leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editTplDefault"
                    checked={templateForm.isDefault}
                    onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0E331E] focus:ring-[#0E331E]"
                  />
                  <label htmlFor="editTplDefault" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                    Set as active default template for this category
                  </label>
                </div>
              </div>

              <div className="p-4 px-6 border-t border-[#EAE3DC] bg-[#FAF7F4] flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    openEmailPreview(
                      templateForm.name || "Preview",
                      templateForm.subject || "Subject",
                      templateForm.content || "<p>Content</p>",
                      templateForm.category
                    )
                  }
                  disabled={!templateForm.content}
                  className="px-3 py-2 rounded-xl bg-white border border-[#DCD3CB] hover:border-[#0E331E] hover:text-[#0E331E] text-[#1E1815] font-bold text-xs transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-[#0E331E]" />
                  <span>Preview Output</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditTemplateModal(false)}
                    className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={templateSaving}
                    className="px-5 py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-bold text-xs shadow-md shadow-[#0E331E]/20 disabled:opacity-50 cursor-pointer"
                  >
                    {templateSaving ? "Updating…" : "Update Template"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: LIVE EMAIL OUTPUT PREVIEW MOCKUP                         */}
      {/* ============================================================== */}
      {showEmailPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <div className="bg-[#FAF7F4] border border-[#EAE3DC] rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE3DC] bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0E331E]/10 text-[#0E331E] flex items-center justify-center font-bold">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                    <span>Live Rendered Email Preview</span>
                    {previewEmailData.category && (
                      <span className="px-2 py-0.5 rounded-full bg-[#0E331E]/10 text-[#0E331E] text-[10px] font-black uppercase">
                        {previewEmailData.category}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-[#7A6E67]">
                    Simulated recipient view with sample member data tags interpolated
                  </p>
                </div>
              </div>

              {/* Device switcher */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#FAF7F4] p-1 rounded-xl border border-[#EAE3DC]">
                  <button
                    type="button"
                    onClick={() => setPreviewDeviceMode("desktop")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      previewDeviceMode === "desktop"
                        ? "bg-[#0E331E] text-white shadow-2xs"
                        : "text-[#7A6E67] hover:text-[#1E1815]"
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDeviceMode("mobile")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      previewDeviceMode === "mobile"
                        ? "bg-[#0E331E] text-white shadow-2xs"
                        : "text-[#7A6E67] hover:text-[#1E1815]"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmailPreviewModal(false)}
                  className="p-1.5 rounded-xl text-[#7A6E67] hover:bg-[#FAF7F4] hover:text-[#1E1815] border border-transparent hover:border-[#EAE3DC] transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Email Client Simulated Envelope */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              {/* Client Header Info Box */}
              <div className="bg-white rounded-2xl p-4 border border-[#EAE3DC] shadow-xs space-y-2 text-xs">
                <div className="flex items-start justify-between gap-3 border-b border-[#EAE3DC] pb-2.5">
                  <div className="space-y-1">
                    <div className="font-extrabold text-sm text-[#1E1815] flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#0E331E]" />
                      <span>
                        {previewEmailData.subject
                          .replace(/{customer_name}/g, "Sara Al Nuaimi")
                          .replace(/{points_balance}/g, "250")
                          .replace(/{reward_name}/g, "Complimentary Royal Dessert")
                          .replace(/{offer_title}/g, "Double Points Weekend")}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#7A6E67] font-mono shrink-0">
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#7A6E67]">
                  <div>
                    <span className="font-bold text-[#1E1815]">From: </span>
                    <span>Levante Rewards &lt;loyalty@artoflevante.ae&gt;</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#1E1815]">To: </span>
                    <span>Sara Al Nuaimi &lt;sara.alnuaimi@example.ae&gt;</span>
                  </div>
                </div>
              </div>

              {/* Rendered Email Content Box */}
              <div className="flex justify-center">
                <div
                  className={`bg-white rounded-2xl border border-[#EAE3DC] shadow-sm transition-all overflow-hidden ${
                    previewDeviceMode === "mobile" ? "max-w-sm w-full" : "w-full"
                  }`}
                >
                  {/* Luxury Brand Header in Email */}
                  <div className="bg-gradient-to-r from-[#0E331E] to-[#0E331E] p-5 text-center text-white">
                    <div className="font-serif font-black text-xl tracking-wider">
                      LEVANTE
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-[#F5EFE0] font-semibold mt-0.5">
                      Loyalty &amp; Dining Club
                    </div>
                  </div>

                  {/* Body Content */}
                  <div
                    className="p-6 text-xs text-[#2D2420] leading-relaxed prose max-w-none font-sans"
                    dangerouslySetInnerHTML={{
                      __html: previewEmailData.content
                        .replace(/{customer_name}/g, "Sara Al Nuaimi")
                        .replace(/{points_balance}/g, "250")
                        .replace(/{reward_name}/g, "Complimentary Royal Dessert")
                        .replace(/{reward_description}/g, "Special royal dessert treat valid across 14 UAE outlets.")
                        .replace(/{expiry_date}/g, "30 Oct 2026")
                        .replace(/{offer_title}/g, "Double Points Weekend Extravaganza"),
                    }}
                  />

                  {/* Email Footer */}
                  <div className="bg-[#FAF7F4] p-4 text-center border-t border-[#EAE3DC] text-[10px] text-[#7A6E67] space-y-1">
                    <div className="font-semibold text-[#1E1815]">
                      Levante • Dubai
                    </div>
                    <div>
                      You received this message as a valued member of the Levante Rewards.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 px-6 border-t border-[#EAE3DC] bg-white flex items-center justify-between shrink-0">
              <span className="text-xs text-[#7A6E67]">
                Tags previewed with simulated member: <strong className="text-[#1E1815]">Sara Al Nuaimi (250 pts)</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowEmailPreviewModal(false)}
                className="px-5 py-2 rounded-xl bg-[#0E331E] hover:bg-[#0A2617] text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      
    </>
  );
}
