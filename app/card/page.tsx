"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  QrCode,
  Gift,
  Clock,
  User,
  History,
  Tag,
  ChevronRight,
  RefreshCw,
  LogOut,
  Edit3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const BRAND = process.env.NEXT_PUBLIC_APP_NAME || "Loyalty Club";

function formatRelativeTime(iso?: string | null): string {
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

export default function CustomerCardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", birthday: "" });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadCard = useCallback(async () => {
    try {
      const r = await fetch("/api/card");
      if (r.status === 401) {
        router.push("/");
        return;
      }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not load your loyalty card.");
      setData(d);
    } catch (e: any) {
      setErr(String(e.message || e));
    }
  }, [router]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  // Refresh QR code before expiration
  useEffect(() => {
    if (!data?.qr?.ttlSeconds) return undefined;
    const ms = Math.max((data.qr.ttlSeconds - 10) * 1000, 15000);
    const interval = setInterval(loadCard, ms);
    return () => clearInterval(interval);
  }, [data?.qr?.ttlSeconds, loadCard]);

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-[#C0392B] mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Notice</h2>
          <p className="text-sm text-[var(--ink-2)] mb-4">{err}</p>
          <button
            onClick={() => router.push("/")}
            className="py-2.5 px-6 rounded-xl bg-[#C0392B] text-white font-bold text-sm"
          >
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-md mx-auto">
        <div className="w-8 h-8 border-3 border-[#C0392B]/30 border-t-[#C0392B] rounded-full animate-spin-custom mb-3" />
        <p className="text-sm font-semibold text-[var(--ink-2)]">Loading your card…</p>
      </div>
    );
  }

  const { customer, qr, rewards, transactions, offers, nextTargets, currency } = data;
  const availableRewards = rewards.filter((r: any) => r.status === "AVAILABLE");
  const usedRewards = rewards.filter((r: any) => r.status !== "AVAILABLE");

  function openEditor() {
    setProfile({
      name: customer.name || "",
      email: customer.email || "",
      birthday: customer.birthday ? String(customer.birthday).slice(0, 10) : "",
    });
    setProfileMsg(null);
    setEditing(true);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not save details.");
      setProfileMsg({ type: "ok", text: "Profile updated successfully." });
      setEditing(false);
      loadCard();
    } catch (e2: any) {
      setProfileMsg({ type: "err", text: String(e2.message || e2) });
    } finally {
      setProfileBusy(false);
    }
  }

  return (
    <div className="min-h-screen pb-16 px-4 pt-6 max-w-md mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C0392B] flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-[#C0392B]/20">
            LC
          </div>
          <div>
            <div className="text-base font-extrabold text-[var(--ink)] leading-none">{BRAND}</div>
            <div className="text-xs font-semibold text-[var(--ink-3)] uppercase tracking-wider mt-0.5">
              {customer.homeBranch ? `${customer.homeBranch.name} · ${customer.homeBranch.city}` : "Loyalty Member"}
            </div>
          </div>
        </div>
        <button
          onClick={loadCard}
          className="p-2 rounded-xl text-[var(--ink-2)] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--line)] transition-all"
          title="Refresh Card"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Digital Loyalty Card (Luxury Red VIP Aesthetic) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#C0392B] via-[#A92D21] to-[#801D13] p-6 text-white shadow-2xl shadow-[#C0392B]/30 mb-5">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-between text-xs font-semibold text-white/80 mb-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#E5A844]" /> VIP Member
            </span>
            <span>
              Since{" "}
              {new Date(customer.memberSince).toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white mb-4">{customer.name}</h1>

          {/* QR Code Container */}
          <div className="bg-white p-3 rounded-2xl shadow-lg leading-none mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.image} alt="Loyalty Card QR" className="w-44 h-44 rounded-lg block" />
          </div>

          {/* 8-character manual code */}
          <div className="text-2xl font-mono font-black tracking-[0.2em] text-white">
            {qr.code}
          </div>
          <p className="text-[11px] text-white/75 font-medium mt-1">
            Show code to cashier · Auto-refreshes every 3 minutes
          </p>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5 text-center shadow-sm">
          <div className="text-2xl font-black text-[#C0392B] leading-none">{customer.pointsBalance}</div>
          <div className="text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-wider mt-1.5">Points</div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5 text-center shadow-sm">
          <div className="text-2xl font-black text-[var(--ink)] leading-none">{customer.visitCount}</div>
          <div className="text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-wider mt-1.5">Visits</div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5 text-center shadow-sm">
          <div className="text-2xl font-black text-[var(--ink)] leading-none">{Math.round(customer.totalSpend)}</div>
          <div className="text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-wider mt-1.5">{currency} Spent</div>
        </div>
      </div>

      {/* Next Milestones ("Almost there") */}
      {nextTargets?.length > 0 && (
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 mb-5 shadow-sm">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--ink-2)] flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#C68A1E]" /> Almost There
          </h2>
          <div className="space-y-2.5">
            {nextTargets.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-subtle)]">
                <span className="font-bold text-sm text-[var(--ink)]">{t.name}</span>
                <span className="text-xs font-bold text-[#1E7A4D] bg-[#E3F2E9] px-2.5 py-1 rounded-full">
                  {t.need} more {t.kind === "points" ? "points" : t.need === 1 ? "visit" : "visits"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rewards Section */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-[var(--ink)] flex items-center gap-2">
            <Gift className="w-4 h-4 text-[#C68A1E]" /> Your Rewards
          </h2>
          <span className="text-xs font-bold text-[var(--ink-3)]">
            {availableRewards.length} Available
          </span>
        </div>

        {availableRewards.length === 0 && usedRewards.length === 0 ? (
          <div className="py-6 text-center text-sm text-[var(--ink-3)]">
            No rewards yet. They unlock automatically as you visit and dine!
          </div>
        ) : (
          <div className="space-y-3">
            {availableRewards.map((r: any) => (
              <div
                key={r.id}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#FBF1DC]/40 border border-[#C68A1E]/20"
              >
                <div className="w-10 h-10 rounded-xl bg-[#C68A1E] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                  ★
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-[var(--ink)] truncate">{r.name}</div>
                  <div className="text-xs text-[var(--ink-2)] truncate">{r.description}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#E3F2E9] text-[#1E7A4D] text-xs font-extrabold shrink-0">
                  Ready to Use
                </span>
              </div>
            ))}

            {usedRewards.map((r: any) => (
              <div
                key={r.id}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--surface-subtle)] opacity-60"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--line-2)] text-[var(--ink-3)] flex items-center justify-center font-bold text-sm shrink-0">
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-[var(--ink)] truncate">{r.name}</div>
                  <div className="text-[11px] text-[var(--ink-3)] truncate">
                    {r.status === "REDEEMED" ? `Redeemed ${formatRelativeTime(r.redeemedAt)}` : "Expired"}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[var(--ink-3)] uppercase">
                  {r.status === "REDEEMED" ? "Used" : "Expired"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Special Offers Section */}
      {offers?.length > 0 && (
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 mb-5 shadow-sm">
          <h2 className="text-base font-extrabold text-[var(--ink)] flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-[#C0392B]" /> Special Offers & Deals
          </h2>
          <div className="space-y-2.5">
            {offers.map((o: any) => (
              <div key={o.id} className="p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--line)] flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-[var(--ink)]">{o.name}</div>
                  <div className="text-xs text-[var(--ink-3)] mt-0.5">
                    {o.description || (o.isPercent ? `${o.value}% discount` : `${currency} ${o.value} off`)} · {o.everywhere ? "All branches" : "Selected branch"}
                  </div>
                </div>
                {o.endsAt && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FBEAE7] text-[#C0392B] shrink-0">
                    Till {new Date(o.endsAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Profile Details & Editor */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold text-[var(--ink)] flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--ink-2)]" /> Member Profile
          </h2>
          {!editing && (
            <button
              onClick={openEditor}
              className="text-xs font-bold text-[#C0392B] hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        {!editing ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-[var(--line)]">
              <span className="text-[var(--ink-3)]">Name</span>
              <span className="font-bold text-[var(--ink)]">{customer.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--line)]">
              <span className="text-[var(--ink-3)]">Mobile</span>
              <span className="font-bold text-[var(--ink)]">+{customer.mobile}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--line)]">
              <span className="text-[var(--ink-3)]">Email</span>
              <span className="font-bold text-[var(--ink)]">{customer.email || "—"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[var(--ink-3)]">Birthday</span>
              <span className="font-bold text-[var(--ink)]">
                {customer.birthday ? new Date(customer.birthday).toLocaleDateString() : "—"}
              </span>
            </div>
            {profileMsg?.type === "ok" && (
              <div className="mt-2 p-2.5 rounded-xl bg-[#E3F2E9] text-[#1E7A4D] text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {profileMsg.text}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={saveProfile} className="space-y-3 mt-3">
            <div>
              <label className="block text-xs font-bold uppercase text-[var(--ink-2)] mb-1">Full Name</label>
              <input
                className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#C0392B]"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[var(--ink-2)] mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#C0392B]"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[var(--ink-2)] mb-1">Birthday</label>
              <input
                type="date"
                className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--line-2)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[#C0392B]"
                value={profile.birthday}
                onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={profileBusy}
                className="flex-1 py-2 rounded-xl bg-[#C0392B] hover:bg-[#96291D] text-white text-xs font-bold"
              >
                {profileBusy ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--line)] text-xs font-bold text-[var(--ink-2)]"
              >
                Cancel
              </button>
            </div>
            {profileMsg?.type === "err" && (
              <div className="p-2.5 rounded-xl bg-[#FBEAE7] text-[#C0392B] text-xs font-semibold">
                {profileMsg.text}
              </div>
            )}
          </form>
        )}
      </section>

      {/* Recent Visits History */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 shadow-sm">
        <h2 className="text-base font-extrabold text-[var(--ink)] flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-[var(--ink-2)]" /> Recent Visits
        </h2>
        {transactions.length === 0 ? (
          <div className="py-6 text-center text-sm text-[var(--ink-3)]">
            Your first visit with points earned will appear here.
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t: any) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-2.5 border-b border-[var(--line)] last:border-0"
              >
                <div>
                  <div className="font-bold text-sm text-[var(--ink)]">{t.branch}</div>
                  <div className="text-xs text-[var(--ink-3)]">
                    {formatRelativeTime(t.createdAt)} · {currency} {t.amount}
                  </div>
                </div>
                <div className="font-extrabold text-sm text-[#1E7A4D]">
                  +{t.pointsEarned} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
