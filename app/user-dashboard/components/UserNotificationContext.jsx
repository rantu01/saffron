"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import useRealtimeFeed from "@/app/Component/Common/useRealtimeFeed";
import { pushRealtimeToast } from "@/app/Component/Common/RealtimeToasts";
import { unlockNotificationSound } from "@/app/Component/Common/notificationSound";

const UserNotificationContext = createContext(null);

export function UserNotificationProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid || null;
  const [counts, setCounts] = useState({ unreadChat: 0, unreadNotifications: 0 });

  const fetchCounts = useCallback(async () => {
    if (!uid) return;
    try {
      const [chatRes, notifRes] = await Promise.all([
        fetch(`/api/chat/unread-count?uid=${encodeURIComponent(uid)}`),
        fetch(`/api/notifications/unread-count?uid=${encodeURIComponent(uid)}`),
      ]);
      const chat = await chatRes.json().catch(() => ({}));
      const notif = await notifRes.json().catch(() => ({}));
      if (chat.success || notif.success) {
        setCounts({
          unreadChat: chat.unreadCount || 0,
          unreadNotifications: notif.count || 0,
        });
      }
    } catch {}
  }, [uid]);

  useRealtimeFeed({
    uid,
    role: "user",
    onChatMessage: (payload) => {
      // Only admin replies reach here (stream filters by conversationId).
      // Never notify the sender about their own message.
      if (payload?.senderUid && uid && payload.senderUid === uid) return;
      pushRealtimeToast({
        title: "New reply from Customer Service",
        message: payload?.preview || "You have a new message.",
        kind: "chat",
        href: "/user-dashboard/chat",
      });
      fetchCounts();
    },
    onNotification: (payload) => {
      if (payload?.type && String(payload.type).startsWith("chat_")) return; // chat toast already shown
      pushRealtimeToast({
        title: payload?.title || "New notification",
        message: payload?.preview || "",
        kind: "notification",
        href: "/user-dashboard/chat",
      });
      fetchCounts();
    },
  });

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  useEffect(() => {
    const unlock = () => unlockNotificationSound();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const refresh = useCallback(() => fetchCounts(), [fetchCounts]);

  return (
    <UserNotificationContext.Provider value={{ ...counts, refresh }}>
      {children}
    </UserNotificationContext.Provider>
  );
}

export function useUserNotifications() {
  const ctx = useContext(UserNotificationContext);
  if (!ctx) {
    // Allow usage outside provider (e.g. public pages) — return zeros
    return { unreadChat: 0, unreadNotifications: 0, refresh: () => {} };
  }
  return ctx;
}
