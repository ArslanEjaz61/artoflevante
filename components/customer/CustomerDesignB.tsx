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

/**
 * Stamp card + QR card of the customer dashboard. Sizes come from the design mockup
 * (see app/dashboard/customer-dashboard.css, `.cd-*` classes).
 */
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
    <>
      {/* CARD 1: stamps + name + coupon / points */}
      <div className="cd-card cd-card1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/watermark-top.png" alt="" className="cd-wm-right" />

        <div className="cd-stamps">
          {Array.from({ length: stampCount }).map((_, i) => (
            <div key={i} className="cd-stamp">
              {i < stampsEarned && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/levante-stamp.png" alt="Earned stamp" />
              )}
            </div>
          ))}
        </div>

        <div className="cd-name-block">
          <div className="cd-label">Full Name</div>
          <div className="cd-name">{customer?.name || "—"}</div>
        </div>

        <div className="cd-stats">
          <div>Cupon: {couponDisplay}</div>
          <div>Loyality Points: {customer?.pointsBalance ?? 0}</div>
        </div>
      </div>

      {/* CARD 2: framed QR + customer code */}
      <div className="cd-card cd-card2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/watermark-bottom.png" alt="" className="cd-wm-left" />

        <div className="cd-qr-frame">
          <i />
          <i />
          <i />
          <i />
          {qr?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr.image} alt="Customer QR code" className="cd-qr" />
          ) : (
            <div className="cd-qr" />
          )}
        </div>

        <div className="cd-code">{customerCode}</div>
      </div>
    </>
  );
}
