"use client";

import React from 'react';
import LiveChat from '@/app/Component/Common/LiveChat';

export default function ChatPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Live Chat</h1>
      <p className="text-sm mt-1">Chat with our support team</p>
      <div className="mt-6">
        <LiveChat inline />
      </div>
    </div>
  );
}
