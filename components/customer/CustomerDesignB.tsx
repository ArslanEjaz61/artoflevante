"use client";

import React from "react";

export interface CustomerCardDesignProps {
  customer: any;
  qr: any;
  customerCode: string;
  targetStamps: number;
  stampsEarned: number;
  couponDisplay: string;
}

export default function CustomerDesignB({
  customer,
  qr,
  customerCode,
  targetStamps,
  stampsEarned,
  couponDisplay,
}: CustomerCardDesignProps) {
  const stampCount = targetStamps || 5;

  return (
    <div className="space-y-2.5 sm:space-y-3 mb-3 font-sans">
      {/* ============================================================== */}
      {/* CARD 1: STAMP PROGRESS & CUSTOMER DETAILS                      */}
      {/* ============================================================== */}
      <div className="bg-white rounded-[24px] sm:rounded-[28px] p-3.5 min-[380px]:p-4 sm:p-5 shadow-xs border border-[#E8E2D7] relative overflow-hidden">
        {/* Subtle Watermark on Right */}
        <div className="absolute right-0 top-0 bottom-0 w-36 min-[380px]:w-44 sm:w-52 pointer-events-none select-none z-0 overflow-hidden flex items-center justify-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/watermark-top.png"
            alt=""
            className="h-[110%] w-auto object-contain opacity-90"
          />
        </div>

        {/* Stamps Row (Centered Horizontally with Flexible Scaling) */}
        <div className="relative z-10 my-3 sm:my-5 flex items-center justify-center gap-1.5 min-[380px]:gap-2.5 sm:gap-3.5">
          {Array.from({ length: stampCount }).map((_, i) => {
            const isFilled = i < stampsEarned;
            return (
              <div
                key={i}
                className="w-10 h-10 min-[380px]:w-11 min-[380px]:h-11 sm:w-12 sm:h-12 rounded-full border-[1.5px] border-[#8E7E7C] flex items-center justify-center bg-transparent overflow-hidden shrink-0 transition-transform"
              >
                {isFilled && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/levante-stamp.png"
                    alt="Earned Stamp"
                    className="w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 sm:w-10 sm:h-10 object-contain"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card 1 Bottom: Full Name + Cupon + Points */}
        <div className="flex items-end justify-between gap-2 pt-1 relative z-10">
          <div className="min-w-0 flex-1 pr-1">
            <div className="text-[10px] sm:text-[11px] font-medium text-[#7A6A68] leading-tight">Full Name</div>
            <div className="text-[14px] min-[380px]:text-[15px] sm:text-[17px] font-bold text-[#1E1815] leading-snug tracking-tight truncate">
              {customer?.name || "Bilal Chishty"}
            </div>
          </div>
          <div className="text-right shrink-0 whitespace-nowrap">
            <div className="text-[10px] sm:text-[11px] font-bold text-[#1E1815] leading-tight">
              Cupon: {couponDisplay}
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-[#1E1815] leading-tight mt-0.5">
              Loyalty Points: {customer?.pointsBalance ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CARD 2: CENTERED QR CODE & CUSTOMER IDENTIFIER                 */}
      {/* ============================================================== */}
      <div className="bg-white rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 shadow-xs border border-[#E8E2D7] relative overflow-hidden flex flex-col items-center justify-center">
        {/* Subtle Watermark on Left */}
        <div className="absolute left-0 top-0 bottom-0 w-36 min-[380px]:w-44 sm:w-52 pointer-events-none select-none z-0 overflow-hidden flex items-center justify-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/watermark-bottom.png"
            alt=""
            className="h-[110%] w-auto object-contain opacity-90"
          />
        </div>

        {/* Framed Centered QR Code with 4 Corner Brackets */}
        <div className="relative p-2 sm:p-2.5 inline-block z-10">
          <span className="absolute top-0 left-0 w-3.5 sm:w-4 h-3.5 sm:h-4 border-t-2 border-l-2 border-[#1E1815]" />
          <span className="absolute top-0 right-0 w-3.5 sm:w-4 h-3.5 sm:h-4 border-t-2 border-r-2 border-[#1E1815]" />
          <span className="absolute bottom-0 left-0 w-3.5 sm:w-4 h-3.5 sm:h-4 border-b-2 border-l-2 border-[#1E1815]" />
          <span className="absolute bottom-0 right-0 w-3.5 sm:w-4 h-3.5 sm:h-4 border-b-2 border-r-2 border-[#1E1815]" />

          {qr?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr.image}
              alt="Customer QR Code"
              className="w-28 h-28 min-[380px]:w-32 min-[380px]:h-32 sm:w-36 sm:h-36 mix-blend-multiply object-contain block"
            />
          ) : (
            <div className="w-28 h-28 min-[380px]:w-32 min-[380px]:h-32 sm:w-36 sm:h-36 bg-white/40 flex items-center justify-center text-xs font-mono">
              QR CODE
            </div>
          )}
        </div>

        {/* Centered Customer Code */}
        <div className="mt-2 min-[380px]:mt-2.5 sm:mt-3 text-center font-bold text-xs min-[380px]:text-sm sm:text-base tracking-wider text-[#1E1815] relative z-10">
          {customerCode}
        </div>
      </div>
    </div>
  );
}
