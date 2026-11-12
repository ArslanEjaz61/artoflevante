"use client";

import React from "react";

/**
 * Single-card version of the loyalty card, shown in the Apple / Google Wallet popups.
 * Sizes come from the 1057 x 1332 wallet-card mockup (see `.wc-*` in app/dashboard/customer-dashboard.css)
 * and scale with the card's own width.
 */
export default function WalletCardPreview({
  name,
  points,
  couponDisplay,
  stampsEarned,
  targetStamps = 5,
  qrImage,
  code,
}: {
  name: string;
  points: number;
  couponDisplay: string;
  stampsEarned: number;
  targetStamps?: number;
  qrImage?: string | null;
  code: string;
}) {
  return (
    <div className="wc">
      <div className="wc-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/watermark-top.png" alt="" className="wc-wm" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/levante-wordmark.png" alt="Levante · Coffee · Flowers · Chocolates" className="wc-logo" />

        <div className="wc-stamps">
          {Array.from({ length: targetStamps }).map((_, i) => (
            <div key={i} className="wc-stamp">
              {i < stampsEarned && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/levante-stamp.png" alt="Earned stamp" />
              )}
            </div>
          ))}
        </div>

        <div className="wc-name">
          <div className="wc-label">Full Name</div>
          <div className="wc-value">{name}</div>
        </div>
        <div className="wc-stats">
          <div>Cupon: {couponDisplay}</div>
          <div>Loyality Points: {points}</div>
        </div>

        <div className="wc-qr">
          <i />
          <i />
          <i />
          <i />
          {qrImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrImage} alt="QR code" />
          ) : (
            <span />
          )}
        </div>
        <div className="wc-code">{code}</div>
      </div>
    </div>
  );
}
