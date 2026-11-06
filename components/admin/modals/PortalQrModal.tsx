"use client";

import React from "react";
import { X, Share2 } from "lucide-react";

interface PortalQrModalProps {
  showPortalQrModal: boolean;
  setShowPortalQrModal: (v: boolean) => void;
  portalQrDataUrl: string | null;
  portalUrl: string;
  handleSharePortalLink: () => void;
  copiedPortalLink: boolean;
}

export default function PortalQrModal({
  showPortalQrModal,
  setShowPortalQrModal,
  portalQrDataUrl,
  portalUrl,
  handleSharePortalLink,
  copiedPortalLink,
}: PortalQrModalProps) {
  return (
    <>
{/* CUSTOMER PORTAL QR CODE MODAL (Matches Image 3)                 */}
      {/* ============================================================== */}
      {showPortalQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F4] border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowPortalQrModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white hover:bg-[#EFE9E2] border border-[#EAE3DC] text-[#7A6E67] hover:text-[#1E1815] flex items-center justify-center cursor-pointer transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="pr-8 mb-4">
              <h3 className="text-xl font-black text-[#1E1815] tracking-tight">
                Customer Portal QR Code
              </h3>
              <p className="text-xs text-[#7A6E67] mt-1">
                Guests can scan this code to register or open their loyalty account.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-3xl border border-[#EAE3DC] shadow-xs inline-block my-2">
              {portalQrDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={portalQrDataUrl}
                  alt="Customer Portal QR Code"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-[#0E331E]/20 border-t-[#0E331E] rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Subtext & URL Display */}
            <div className="my-3 space-y-1">
              <div className="text-xs font-semibold text-[#7A6E67]">
                Scan to join Levante Rewards
              </div>
              <div className="text-[11px] font-mono text-[#0E331E] break-all px-2 font-bold select-all bg-white/70 py-1.5 rounded-lg border border-[#EAE3DC]/60">
                {portalUrl || "https://artoflevante.ae"}
              </div>
            </div>

            {/* Share Link Button */}
            <button
              onClick={handleSharePortalLink}
              className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-[#092015] hover:bg-[#092015] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#092015]/20 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedPortalLink ? "Link Copied to Clipboard!" : "SHARE LINK"}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
