"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CrmTopHeader } from "@/components/CrmTopHeader";

export default function CrmHubPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically open Customer Portal directly in full screen
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F0DBDB] text-[#1E1815] flex flex-col font-sans">
      <CrmTopHeader activeTab="customer" />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 border-3 border-[#801313]/20 border-t-[#801313] rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#7A6E67] uppercase tracking-wider">
          Opening Customer Portal…
        </p>
      </div>
    </div>
  );
}
