"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  UserPlus,
  LogIn,
  Coins,
  Gift,
  MapPin,
  Mail,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface AdminNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  isRead: boolean;
  createdAt: string;
}

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filter, setFilter] = useState<"all" | "unread">("unread");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications?limit=35");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    // Live polling every 12 seconds
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleClearRead = async () => {
    try {
      await fetch("/api/admin/notifications?all=false", { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch {}
  };

  const handleClearAll = async () => {
    try {
      await fetch("/api/admin/notifications?all=true", { method: "DELETE" });
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  };

  const filteredList = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "CUSTOMER_REGISTER":
        return <UserPlus className="w-4 h-4 text-[#1E7A4D]" />;
      case "CUSTOMER_LOGIN":
        return <LogIn className="w-4 h-4 text-[#3B82F6]" />;
      case "POINTS_EARNED":
        return <Coins className="w-4 h-4 text-[#C68A1E]" />;
      case "POINTS_REDEEMED":
        return <Gift className="w-4 h-4 text-[#C0392B]" />;
      case "VISIT_CHECKIN":
        return <MapPin className="w-4 h-4 text-[#8B5CF6]" />;
      case "BIRTHDAY_GIFT":
        return <Sparkles className="w-4 h-4 text-[#EC4899]" />;
      case "EMAIL_SENT":
        return <Mail className="w-4 h-4 text-[#0EA5E9]" />;
      case "STAFF_LOGIN":
        return <ShieldCheck className="w-4 h-4 text-[#4A3F39]" />;
      default:
        return <Bell className="w-4 h-4 text-[#801313]" />;
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const handleToggle = () => {
    const nextState = !open;
    setOpen(nextState);
    if (nextState && unreadCount > 0) {
      handleMarkAllRead();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 rounded-xl border border-[#DCD3CB] bg-white hover:bg-[#FAF7F4] text-[#4A3F39] hover:text-[#801313] transition-all cursor-pointer shadow-2xs flex items-center justify-center"
        title="Admin Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-gradient-to-r from-[#C0392B] to-[#96291D] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-white border border-[#EAE3DC] rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#FAF7F4] to-[#F5EFE9] border-b border-[#EAE3DC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#801313]/10 text-[#801313] flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-[#1E1815] leading-tight">Live Notifications</h3>
                <p className="text-[10px] font-bold text-[#7A6E67] uppercase tracking-wider">
                  {unreadCount > 0 ? `${unreadCount} unread events` : "All caught up"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="px-2 py-1 text-[11px] font-bold text-[#1E7A4D] hover:bg-[#1E7A4D]/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 text-[#7A6E67] hover:text-[#1E1815] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3 py-2 bg-white border-b border-[#EAE3DC] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                  filter === "unread" ? "bg-[#801313] text-white shadow-xs" : "bg-[#FAF7F4] text-[#7A6E67] hover:text-[#1E1815]"
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                  filter === "all" ? "bg-[#801313] text-white shadow-xs" : "bg-[#FAF7F4] text-[#7A6E67] hover:text-[#1E1815]"
                }`}
              >
                All ({notifications.length})
              </button>
            </div>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold text-[#C0392B]">
                {unreadCount} pending
              </span>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[#EAE3DC]">
            {filteredList.length > 0 ? (
              filteredList.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 sm:p-3.5 transition-colors flex items-start gap-3 relative ${
                    !item.isRead ? "bg-[#FAF3E6]/60 hover:bg-[#FAF3E6]" : "bg-white hover:bg-[#FAF7F4]"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#EAE3DC] shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-black text-[#1E1815] leading-snug truncate">
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#C0392B] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#5C504A] mt-0.5 leading-relaxed break-words">
                      {item.message}
                    </p>
                    <span className="text-[10px] font-bold text-[#8C7F78] mt-1 block">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>

                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkSingleRead(item.id)}
                      className="absolute right-2.5 top-3 p-1 text-[#7A6E67] hover:text-[#1E7A4D] hover:bg-white rounded-md transition-colors cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-[#7A6E67]">
                <Bell className="w-8 h-8 text-[#DCD3CB] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#1E1815]">No notifications found</p>
                <p className="text-[11px] mt-0.5">New signups, logins, points &amp; redemptions will appear here live.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#FAF7F4] border-t border-[#EAE3DC] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearRead}
                className="text-[11px] font-bold text-[#7A6E67] hover:text-[#C0392B] flex items-center gap-1 p-1 rounded-md transition-colors cursor-pointer"
                title="Clear only read notifications"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear read</span>
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-bold text-[#7A6E67] hover:text-[#C0392B] flex items-center gap-1 p-1 rounded-md transition-colors cursor-pointer"
                title="Clear all notifications"
              >
                <span>Clear all</span>
              </button>
            </div>
            <button
              type="button"
              onClick={fetchNotifications}
              className="text-[11px] font-bold text-[#4A3F39] hover:text-[#801313] flex items-center gap-1 p-1 rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
