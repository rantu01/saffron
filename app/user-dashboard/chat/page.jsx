"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/Component/Auth/AuthProvider';
import { useLanguage } from "@/app/user-dashboard/components/LanguageContext";
import { getAuthToken } from '@/lib/clientAuth';
import LiveChat from '@/app/Component/Common/LiveChat';
import { useUserNotifications } from '@/app/user-dashboard/components/UserNotificationContext';
import { playNotificationSound } from '@/app/Component/Common/notificationSound';
import { pushRealtimeToast } from '@/app/Component/Common/RealtimeToasts';
import { MessageCircle, Bell } from 'lucide-react';

export default function ChatPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { unreadChat, refresh } = useUserNotifications();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`/api/chat/unread-count?uid=${encodeURIComponent(user.uid)}`);
      const data = await res.json();
      if (data.success) setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Keep local banner in sync with the realtime context
  useEffect(() => {
    if (typeof unreadChat === "number") setUnreadCount(unreadChat);
  }, [unreadChat]);

  // Instant admin replies even before the LiveChat widget polls
  useEffect(() => {
    if (!user?.uid || typeof window === "undefined" || !("EventSource" in window)) return;
    let stopped = false;
    let es = null;
    async function connect() {
      if (stopped) return;
      try {
        const token = await getAuthToken();
        const tokenParam = token ? `&token=${encodeURIComponent(token)}` : "";
        es = new EventSource(`/api/realtime/stream?role=user&uid=${encodeURIComponent(user.uid)}${tokenParam}`);
        es.addEventListener("chat-message", (e) => {
          try {
            const payload = JSON.parse(e.data);
            if (payload?.senderRole === "user") return;
            // Only the other party's messages notify (never the sender's own).
            if (payload?.senderUid && payload.senderUid === user.uid) return;
            playNotificationSound();
            pushRealtimeToast({
              title: "New reply from Customer Service",
              message: payload?.preview || "",
              kind: "chat",
              href: "/user-dashboard/chat",
            });
            fetchUnread();
            refresh();
          } catch {}
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
  }, [user?.uid, fetchUnread, refresh]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">{t("chat.title")}</h1>
      <p className="text-sm mt-1">Chat with our Customer Service team</p>

      {unreadCount > 0 && (
        <div className="mt-6 flex items-center gap-3 bg-[#E05305]/10 border border-[#E05305]/20 text-[#c84a04] rounded-xl px-4 py-3">
          <Bell size={18} className="shrink-0" />
          <p className="text-sm font-medium">
            You have {unreadCount} unread message{unreadCount > 1 ? "s" : ""} from Customer Service.
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <MessageCircle size={12} />
        Realtime notifications with sound are on — you&apos;ll be alerted instantly of new replies.
      </div>

      <div className="mt-4">
        <LiveChat inline />
      </div>
    </div>
  );
}
