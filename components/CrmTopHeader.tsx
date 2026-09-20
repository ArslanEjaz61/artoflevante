"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Store, LayoutDashboard, RefreshCw } from "lucide-react";

interface CrmTopHeaderProps {
  activeTab?: "customer" | "outlet" | "master";
  onRefresh?: () => void;
}

export function CrmTopHeader({ activeTab, onRefresh }: CrmTopHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const currentTab =
    activeTab ||
    (pathname.startsWith("/admin")
      ? "master"
      : pathname.startsWith("/outlet")
      ? "outlet"
      : "customer");

  const handleRefresh = () => {
    setRefreshing(true);
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="w-full shrink-0 z-40 bg-[#F0DBDB]">
      {/* Top Main Brand Header */}
      <header className="bg-white border-b border-[#EAE3DC] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        {/* Brand Left */}
        <Link href="/" className="flex items-center gap-3 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bc-roundel.png"
            alt="Bombay Chowpatty"
            className="w-10 h-10 object-contain shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="font-extrabold text-base sm:text-lg tracking-tight leading-none text-[#1E1815]">
              Bombay Chowpatty
            </div>
            <div className="text-[10px] text-[#7A6E67] uppercase tracking-widest font-extrabold mt-0.5">
              Loyalty Points Dashboard
            </div>
          </div>
        </Link>

        {/* Center: Live Connected Badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] border border-[#C8E6D3] text-[#1E7A4D] text-xs font-extrabold">
          <span className="w-2 h-2 rounded-full bg-[#1E7A4D] animate-pulse" />
          <span>LIVE CONNECTED DATA</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#DCD3CB] bg-white hover:bg-[#FAF7F4] text-xs font-bold text-[#4A3F39] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#801313]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Center Nav Switcher */}
      <div className="w-full flex justify-center py-3.5 px-4">
        <div className="inline-flex items-center bg-white border border-[#EAE3DC] p-1.5 rounded-2xl shadow-sm gap-1.5">
          <button
            type="button"
            onClick={() => router.push("/")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              currentTab === "customer"
                ? "bg-[#591313] text-white shadow-sm"
                : "text-[#5C504A] hover:text-[#1E1815] hover:bg-[#FAF7F4]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer Portal</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/outlet")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              currentTab === "outlet"
                ? "bg-[#591313] text-white shadow-sm"
                : "text-[#5C504A] hover:text-[#1E1815] hover:bg-[#FAF7F4]"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Outlet Entry</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              currentTab === "master"
                ? "bg-[#591313] text-white shadow-sm"
                : "text-[#5C504A] hover:text-[#1E1815] hover:bg-[#FAF7F4]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Master Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
