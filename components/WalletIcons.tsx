import React from "react";

export function AppleWalletIcon({ className = "w-5 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#appleWalletClip)">
        {/* Layered Cards Top to Bottom */}
        <rect x="0" y="0" width="32" height="6" fill="#2997FF" />
        <rect x="0" y="4.5" width="32" height="4.5" fill="#FFD60A" />
        <rect x="0" y="8" width="32" height="4.5" fill="#30D158" />
        <rect x="0" y="11.5" width="32" height="6.5" fill="#FF453A" />

        {/* White Wallet Pocket with smooth finger notch */}
        <path
          d="M 0 12.5 L 9.5 12.5 C 11.2 12.5 12 17.5 16 17.5 C 20 17.5 20.8 12.5 22.5 12.5 L 32 12.5 L 32 24 L 0 24 Z"
          fill="#FFFFFF"
        />
        {/* Subtle shadow line along notch */}
        <path
          d="M 0 12.5 L 9.5 12.5 C 11.2 12.5 12 17.5 16 17.5 C 20 17.5 20.8 12.5 22.5 12.5 L 32 12.5"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="0.6"
          fill="none"
        />
      </g>
      {/* Outer border & clip */}
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="23"
        rx="4"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
      <defs>
        <clipPath id="appleWalletClip">
          <rect x="0" y="0" width="32" height="24" rx="4.5" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function GoogleWalletIcon({ className = "w-5 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#googleWalletClip)">
        {/* Top Green Card */}
        <rect x="0" y="0" width="32" height="9" rx="3.5" fill="#34A853" />
        {/* Middle Yellow Card */}
        <rect x="0" y="4" width="32" height="9" rx="3.5" fill="#FBBC04" />
        {/* Lower Red Card */}
        <rect x="0" y="8" width="32" height="10" rx="3.5" fill="#EA4335" />
        {/* Front Blue Wallet Pocket with signature curve */}
        <path
          d="M 0 13.5 C 8 16.5 24 16.5 32 13.5 L 32 25 C 32 26.7 30.7 28 29 28 L 3 28 C 1.3 28 0 26.7 0 25 Z"
          fill="#4285F4"
        />
      </g>
      <defs>
        <clipPath id="googleWalletClip">
          <rect x="0" y="0" width="32" height="28" rx="5.5" />
        </clipPath>
      </defs>
    </svg>
  );
}
