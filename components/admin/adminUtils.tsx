import React from "react";
export function generateRandomCouponCode(_prefix?: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let p1 = "";
  let p2 = "";
  for (let i = 0; i < 4; i++) {
    p1 += chars[Math.floor(Math.random() * chars.length)];
    p2 += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${p1}-${p2}`;
}

export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function toDatetimeLocal(isoOrDate?: string | Date | null): string {
  let d = isoOrDate ? new Date(isoOrDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (isNaN(d.getTime())) {
    d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${mins}`;
}

export function formatExpiryTime(iso?: string | null): string {
  if (!iso) return "24h Active";
  const target = new Date(iso).getTime();
  if (isNaN(target)) return "Active";
  const now = Date.now();
  const diffMs = target - now;
  if (diffMs <= 0) return "Expired (Auto-Rotating)";
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `Expires in ${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  const remMins = diffMins % 60;
  if (diffHours < 24) return `Expires in ${diffHours}h ${remMins}m`;
  const diffDays = Math.floor(diffHours / 24);
  return `Expires in ${diffDays}d ${diffHours % 24}h`;
}

export function formatMoney(cur: string, n: number): string {
  return `${cur} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export const DEFAULT_BRANCHES = [
  { id: "1001", code: "1001", name: "The Dubai Mall", city: "Dubai" },
  { id: "1002", code: "1002", name: "Dubai Hills Mall", city: "Dubai" },
  { id: "1003", code: "1003", name: "Mall of the Emirates", city: "Dubai" },
  { id: "1004", code: "1004", name: "Ibn Battuta Mall", city: "Dubai" },
  { id: "1005", code: "1005", name: "Dubai Festival City", city: "Dubai" },
  { id: "1006", code: "1006", name: "City Centre Deira", city: "Dubai" },
  { id: "1007", code: "1007", name: "City Centre Mirdif", city: "Dubai" },
  { id: "1008", code: "1008", name: "City Centre Shindagha", city: "Dubai" },
  { id: "1009", code: "1009", name: "BurJuman Centre", city: "Dubai" },
  { id: "1010", code: "1010", name: "Arabian Centre", city: "Dubai" },
  { id: "1011", code: "1011", name: "Oasis Mall", city: "Dubai" },
  { id: "1012", code: "1012", name: "City Centre Sharjah", city: "Sharjah" },
  { id: "1013", code: "1013", name: "City Centre Al Zahia", city: "Sharjah" },
  { id: "1014", code: "1014", name: "City Centre Ajman", city: "Ajman" },
];

export function StampIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
      <path d="M8 3h8" />
    </svg>
  );
}

export function RibbonIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
    </svg>
  );
}
