"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Globe, Share, PlusSquare, MoreVertical, CheckCircle2 } from "lucide-react";

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerNative?: () => Promise<string | void>;
  isNativeAvailable?: boolean;
}

export function InstallGuideModal({
  isOpen,
  onClose,
  onTriggerNative,
  isNativeAvailable,
}: InstallGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"android" | "ios" | "desktop">("android");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setActiveTab("ios");
      } else if (/android/.test(ua)) {
        setActiveTab("android");
      } else {
        setActiveTab("desktop");
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#EAE3DC] relative animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF7F4] hover:bg-[#EAE3DC] text-[#7A6E67] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with App Logo */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 bg-white p-2 border border-[#EAE3DC] shadow-sm flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bc-roundel.png" alt="Loyalty Club" className="w-full h-full object-contain" />
          </div>
          <h3 className="font-serif font-black text-lg text-[#0E331E]">Install Loyalty App</h3>
          <p className="text-xs text-[#7A6E67] mt-0.5">
            Add to your home screen for quick 1-tap access
          </p>
        </div>

        {/* Native Install Button if browser supports it */}
        {isNativeAvailable && onTriggerNative && (
          <button
            onClick={async () => {
              await onTriggerNative();
              onClose();
            }}
            className="w-full mb-4 py-3 px-4 rounded-xl bg-[#0E331E] hover:bg-[#143F26] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Install Instantly</span>
          </button>
        )}

        {/* Device selector tabs */}
        <div className="flex bg-[#FAF7F4] p-1 rounded-xl mb-4 border border-[#EAE3DC]">
          <button
            onClick={() => setActiveTab("android")}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              activeTab === "android"
                ? "bg-white text-[#0E331E] shadow-xs"
                : "text-[#7A6E67] hover:text-[#1E1815]"
            }`}
          >
            Android
          </button>
          <button
            onClick={() => setActiveTab("ios")}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              activeTab === "ios"
                ? "bg-white text-[#0E331E] shadow-xs"
                : "text-[#7A6E67] hover:text-[#1E1815]"
            }`}
          >
            iPhone / iPad
          </button>
          <button
            onClick={() => setActiveTab("desktop")}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              activeTab === "desktop"
                ? "bg-white text-[#0E331E] shadow-xs"
                : "text-[#7A6E67] hover:text-[#1E1815]"
            }`}
          >
            PC / Mac
          </button>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="bg-[#FAF7F4] rounded-2xl p-4 border border-[#EAE3DC] text-xs text-[#1E1815] mb-5">
          {activeTab === "android" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#0E331E]/10 text-[#0E331E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  Tap browser menu <MoreVertical className="w-3.5 h-3.5 inline text-[#0E331E] -mt-0.5" /> (three dots in top right)
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#0E331E]/10 text-[#0E331E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  Tap <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#0E331E]/10 text-[#0E331E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  Tap <strong>&ldquo;Install / Add&rdquo;</strong> to place shortcut on home screen
                </div>
              </div>
            </div>
          )}

          {activeTab === "ios" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#0E331E]/10 text-[#0E331E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  In Safari, tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline text-[#0E331E] -mt-0.5" /> at the bottom
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#0E331E]/10 text-[#0E331E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  Scroll down &amp; tap <strong>&ldquo;Add to Home Screen&rdquo;</strong> <PlusSquare className="w-3.5 h-3.5 inline text-[#0E331E] -mt-0.5" />
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#0E331E]/10 text-[#0E331E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  Tap <strong>&ldquo;Add&rdquo;</strong> in the top right corner
                </div>
              </div>
            </div>
          )}

          {activeTab === "desktop" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#0E331E]/10 text-[#0E331E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  Look at the right side of the address bar (URL bar)
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#0E331E]/10 text-[#0E331E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  Click the <strong>Install App</strong> icon <Download className="w-3.5 h-3.5 inline text-[#0E331E] -mt-0.5" />
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#0E331E]/10 text-[#0E331E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  Click <strong>&ldquo;Install&rdquo;</strong> to open in dedicated window
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-[#FAF7F4] hover:bg-[#EAE3DC] border border-[#EAE3DC] text-[#1E1815] font-bold text-xs transition-colors cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
