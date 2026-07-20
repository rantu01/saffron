"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/Component/Auth/AuthProvider';
import LiveChat from '@/app/Component/Common/LiveChat';
import { MessageCircle, Bell } from 'lucide-react';

export default function ChatPage() {
  const { user } = useAuth();
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
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Live Chat</h1>
      <p className="text-sm mt-1">Chat with our Customer Service team</p>

      {unreadCount > 0 && (
        <div className="mt-6 flex items-center gap-3 bg-[#E05305]/10 border border-[#E05305]/20 text-[#c84a04] rounded-xl px-4 py-3">
          <Bell size={18} className="shrink-0" />
          <p className="text-sm font-medium">
            You have {unreadCount} unread message{unreadCount > 1 ? "s" : ""} from Customer Service.
          </p>
        </div>
      )}

      <div className="mt-6">
        <LiveChat inline />
      </div>
    </div>
  );
}
