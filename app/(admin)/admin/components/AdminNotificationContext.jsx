"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";

const AdminNotificationContext = createContext(null);

const POLL_INTERVAL = 10000;

export function AdminNotificationProvider({ children }) {
  const [counts, setCounts] = useState({ pendingDeposits: 0, unreadMessages: 0, pendingVipRequests: 0 });
  const intervalRef = useRef(null);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/counts");
      const data = await res.json();
      if (data.success) {
        setCounts({
          pendingDeposits: data.pendingDeposits,
          unreadMessages: data.unreadMessages,
          pendingVipRequests: data.pendingVipRequests,
        });
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    intervalRef.current = setInterval(fetchCounts, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchCounts]);

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
