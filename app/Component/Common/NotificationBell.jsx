"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, Volume2, VolumeX, MessageCircle } from "lucide-react";
import { playNotificationSound, isNotificationSoundEnabled, setNotificationSoundEnabled } from "./notificationSound";
import { pushRealtimeToast } from "./RealtimeToasts";
import { getAuthToken } from "@/lib/clientAuth";

export default function NotificationBell({ uid, dark = false }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChat, setUnreadChat] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const dropdownRef = useRef(null);
  const esRef = useRef(null);
  const prevTotalRef = useRef(null);

  useEffect(() => {
    try { setSoundOn(isNotificationSoundEnabled()); } catch {}
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setNotificationSoundEnabled(next);
    if (next) playNotificationSound();
  };

  const fetchNotifications = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [notifRes, countRes, chatRes] = await Promise.all([
        fetch(`/api/notifications?uid=${encodeURIComponent(uid)}&limit=20`),
        fetch(`/api/notifications/unread-count?uid=${encodeURIComponent(uid)}`),
        fetch(`/api/chat/unread-count?uid=${encodeURIComponent(uid)}`),
      ]);
      const notifData = await notifRes.json().catch(() => ({}));
      const countData = await countRes.json().catch(() => ({}));
      const chatData = await chatRes.json().catch(() => ({}));
      if (notifData.success) setNotifications(notifData.notifications || []);
      if (countData.success) setUnreadCount(countData.count || 0);
      if (typeof chatData.unreadCount === "number") setUnreadChat(chatData.unreadCount || 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [uid]);

  // Sound on total increase (notifications + chat), skipping first load
  const total = (unreadCount || 0) + (unreadChat || 0);
  useEffect(() => {
    if (prevTotalRef.current === null) {
      prevTotalRef.current = total;
      return;
    }
    if (total > prevTotalRef.current) playNotificationSound();
    prevTotalRef.current = total;
  }, [total]);

  useEffect(() => {
    fetchNotifications();
    // Fallback polling in case SSE is unavailable
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Realtime SSE subscription for this user
  useEffect(() => {
    if (!uid || typeof window === "undefined" || !("EventSource" in window)) return;
    let stopped = false;
    let es = null;
    async function connect() {
      if (stopped) return;
      try {
        const token = await getAuthToken();
        const tokenParam = token ? `&token=${encodeURIComponent(token)}` : "";
        es = new EventSource(`/api/realtime/stream?role=user&uid=${encodeURIComponent(uid)}${tokenParam}`);
        esRef.current = es;
        es.addEventListener("counts", (e) => {
          try {
            const data = JSON.parse(e.data);
            if (typeof data.unreadNotifications === "number") setUnreadCount(data.unreadNotifications);
            if (typeof data.unreadChat === "number") setUnreadChat(data.unreadChat);
          } catch {}
        });
        es.addEventListener("notification", () => fetchNotifications());
        es.addEventListener("chat-message", (e) => {
          try {
            const payload = JSON.parse(e.data);
            // Never notify the sender about their own message.
            if (payload?.senderUid && payload.senderUid === uid) return;
            setUnreadChat((c) => c + 1);
            playNotificationSound();
            pushRealtimeToast({
              title: "New reply from Customer Service",
              message: payload?.preview || "",
              kind: "chat",
            });
          } catch {}
          fetchNotifications();
        });
        es.onerror = () => {
          try { es.close(); } catch {}
          setTimeout(() => { if (!stopped) connect(); }, 5000);
        };
      } catch {}
    }
    connect();
    return () => {
      stopped = true;
      try { es?.close(); } catch {}
    };
  }, [uid, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetch("/api/notifications/mark-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, ids: [id] }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // silently fail
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, all: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch {
      // silently fail
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  const badgeTotal = total;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-xl transition ${dark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}
        aria-label="Notifications"
      >
        <Bell size={20} className={dark ? "text-white" : "text-slate-600"} />
        {badgeTotal > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
            {badgeTotal > 99 ? "99+" : badgeTotal}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSound}
                title={soundOn ? "Mute notification sound" : "Unmute notification sound"}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
              >
                {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {unreadChat > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#E05305]/5 border-b border-[#E05305]/10">
              <MessageCircle size={15} className="text-[#E05305] shrink-0" />
              <p className="text-xs font-medium text-[#c84a04]">
                {unreadChat} unread chat message{unreadChat > 1 ? "s" : ""} from Customer Service
              </p>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`px-4 py-3 border-b border-slate-50 last:border-0 transition ${
                    !n.isRead ? "bg-blue-50/50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                        <p
                          className={`text-sm ${
                            !n.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-700"
                          } truncate`}
                        >
                          {n.title}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatTime(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(n._id)}
                        className="shrink-0 text-[10px] font-medium text-blue-600 hover:text-blue-800 mt-0.5"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
