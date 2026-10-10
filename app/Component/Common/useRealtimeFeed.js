"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { playNotificationSound } from "./notificationSound";

/**
 * Shared SSE client hook.
 * Connects to /api/realtime/stream and keeps counts fresh in realtime.
 *
 * @param {{ uid?: string|null, role: "admin"|"user", onChatMessage?: (msg)=>void, onNotification?: (n)=>void, playSound?: boolean }} opts
 */
export default function useRealtimeFeed({ uid, role, onChatMessage, onNotification, playSound = true } = {}) {
  const [counts, setCounts] = useState(role === "admin"
    ? { pendingDeposits: 0, unreadMessages: 0, pendingVipRequests: 0 }
    : { unreadChat: 0, unreadNotifications: 0 });
  const [connected, setConnected] = useState(false);
  const [lastChatMessage, setLastChatMessage] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);
  const esRef = useRef(null);
  const fallbackRef = useRef(null);
  const prevTotalRef = useRef(null);
  const handlersRef = useRef({ onChatMessage, onNotification });
  useEffect(() => {
    handlersRef.current = { onChatMessage, onNotification };
  }, [onChatMessage, onNotification]);

  const totalOf = useCallback((c) => {
    if (!c) return 0;
    return Object.values(c).reduce((a, v) => a + (Number(v) || 0), 0);
  }, []);

  // Play sound only when the total goes UP (and not on first load).
  useEffect(() => {
    const total = totalOf(counts);
    if (prevTotalRef.current === null) {
      prevTotalRef.current = total;
      return;
    }
    if (total > prevTotalRef.current && playSound) {
      playNotificationSound();
    }
    prevTotalRef.current = total;
  }, [counts, totalOf, playSound]);

  const fetchFallback = useCallback(async () => {
    try {
      if (role === "admin") {
        const res = await fetch("/api/admin/notifications/counts");
        const data = await res.json();
        if (data.success) {
          setCounts({
            pendingDeposits: data.pendingDeposits || 0,
            unreadMessages: data.unreadMessages || 0,
            pendingVipRequests: data.pendingVipRequests || 0,
          });
        }
      } else if (uid) {
        const [chatRes, notifRes] = await Promise.all([
          fetch(`/api/chat/unread-count?uid=${encodeURIComponent(uid)}`),
          fetch(`/api/notifications/unread-count?uid=${encodeURIComponent(uid)}`),
        ]);
        const chat = await chatRes.json().catch(() => ({}));
        const notif = await notifRes.json().catch(() => ({}));
        setCounts({
          unreadChat: chat.unreadCount || 0,
          unreadNotifications: notif.count || 0,
        });
      }
    } catch {}
  }, [role, uid]);

  useEffect(() => {
    if (role !== "admin" && !uid) return;
    let stopped = false;

    function connect() {
      if (stopped) return;
      try {
        if (esRef.current) {
          try { esRef.current.close(); } catch {}
          esRef.current = null;
        }
        const params = new URLSearchParams({ role });
        if (uid) params.set("uid", uid);
        const es = new EventSource(`/api/realtime/stream?${params.toString()}`);
        esRef.current = es;

        es.addEventListener("connected", () => setConnected(true));
        es.addEventListener("counts", (e) => {
          try {
            const data = JSON.parse(e.data);
            setCounts((prev) => ({ ...prev, ...data }));
            setConnected(true);
          } catch {}
        });
        es.addEventListener("chat-message", (e) => {
          try {
            const payload = JSON.parse(e.data);
            // Never notify the sender about their own message (server already
            // filters this; this is defense-in-depth using the auth uid).
            if (uid && payload?.senderUid && payload.senderUid === uid) return;
            setLastChatMessage({ ...payload, _at: Date.now() });
            if (playSound) playNotificationSound();
            handlersRef.current.onChatMessage?.(payload);
          } catch {}
        });
        es.addEventListener("notification", (e) => {
          try {
            const payload = JSON.parse(e.data);
            setLastNotification({ ...payload, _at: Date.now() });
            // chat_* notifications always arrive alongside a "chat-message"
            // event which already plays the sound — avoid a double ding.
            const t = String(payload?.type || "");
            if (playSound && !t.startsWith("chat_")) playNotificationSound();
            handlersRef.current.onNotification?.(payload);
          } catch {}
        });
        es.onerror = () => {
          setConnected(false);
          try { es.close(); } catch {}
          // reconnect with backoff
          setTimeout(() => { if (!stopped) connect(); }, 5000);
        };
      } catch {
        setConnected(false);
      }
    }

    connect();
    // Safety-net polling in case SSE is blocked by a proxy
    fetchFallback();
    fallbackRef.current = setInterval(fetchFallback, 15000);

    return () => {
      stopped = true;
      try { esRef.current?.close(); } catch {}
      if (fallbackRef.current) clearInterval(fallbackRef.current);
    };
  }, [uid, role, fetchFallback, playSound]);

  const refresh = useCallback(() => fetchFallback(), [fetchFallback]);

  return { counts, connected, lastChatMessage, lastNotification, refresh };
}
