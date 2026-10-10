"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import useRealtimeFeed from "@/app/Component/Common/useRealtimeFeed";
import { pushRealtimeToast } from "@/app/Component/Common/RealtimeToasts";
import { unlockNotificationSound } from "@/app/Component/Common/notificationSound";

const AdminNotificationContext = createContext(null);

const POLL_INTERVAL = 15000;

export function AdminNotificationProvider({ children }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ pendingDeposits: 0, unreadMessages: 0, pendingVipRequests: 0 });
  const intervalRef = useRef(null);
  const uid = user?.uid || null;

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/counts");
      const data = await res.json();
      if (data.success) {
        setCounts({
          pendingDeposits: data.pendingDeposits || 0,
          unreadMessages: data.unreadMessages || 0,
          pendingVipRequests: data.pendingVipRequests || 0,
        });
      }
    } catch {
      // silently fail
    }
  }, []);

  // Realtime SSE feed: instant counts + chat/notification popups + sound.
  useRealtimeFeed({
    uid,
    role: "admin",
    onChatMessage: (payload) => {
      if (payload?.senderRole === "admin") return;
      // Only the other party's messages notify (never the sender's own).
      if (payload?.senderUid && uid && payload.senderUid === uid) return;
      pushRealtimeToast({
        title: `New message from ${payload?.senderName || "user"}`,
        message: payload?.preview || "You have a new chat message.",
        kind: "chat",
        href: "/admin/chat",
      });
      fetchCounts();
    },
    onNotification: (payload) => {
      if (payload?.forAdmin) {
        if (payload?.type && String(payload.type).startsWith("chat_")) return; // chat toast already shown
        pushRealtimeToast({
          title: payload?.title || "New notification",
          message: payload?.preview || "",
          kind: "notification",
          href: "/admin/chat",
        });
      }
      fetchCounts();
    },
  });

  useEffect(() => {
    fetchCounts();
    intervalRef.current = setInterval(fetchCounts, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchCounts]);

  // Unlock audio on first interaction (browser autoplay policy)
  useEffect(() => {
    const unlock = () => unlockNotificationSound();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const refreshCounts = useCallback(() => {
    fetchCounts();
  }, [fetchCounts]);

  return (
    <AdminNotificationContext.Provider value={{ ...counts, refreshCounts }}>
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotificationCounts() {
  const ctx = useContext(AdminNotificationContext);
  if (!ctx) {
    throw new Error("useAdminNotificationCounts must be used within AdminNotificationProvider");
  }
  return ctx;
}
