"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/app/Component/Auth/AuthProvider';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

export default function LiveChat({ inline = false }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const params = new URLSearchParams({ conversationId: user.uid });
      if (lastMessageIdRef.current) {
        params.set('afterId', lastMessageIdRef.current);
      }
      const res = await fetch(`/api/chat/messages?${params}`);
      const data = await res.json();
      if (data.success && data.messages?.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const newMsgs = data.messages.filter((m) => !existingIds.has(m._id));
          if (newMsgs.length === 0) return prev;
          return [...prev, ...newMsgs];
        });
        lastMessageIdRef.current = data.messages[data.messages.length - 1]._id;
      }
    } catch {
      // silent
    } finally {
      setLoadingMessages(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!open || !user?.uid) return;
    setLoadingMessages(true);
    lastMessageIdRef.current = null;
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => {
      clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [open, user?.uid, fetchMessages]);

  useEffect(() => {
    if (inline) return;
    if (typeof window !== 'undefined') {
      window.__toggleLiveChat = () => setOpen((v) => !v);
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__toggleLiveChat;
      }
    };
  }, [inline]);

  if (loading || !user) return null;

  const handleSend = async (text) => {
    const message = text || input;
    if (!message.trim() || sending) return;

    setSending(true);
    setInput('');

    const tempId = 'temp-' + Date.now();
    const tempMsg = {
      _id: tempId,
      conversationId: user.uid,
      senderUid: user.uid,
      senderRole: 'user',
      senderName: user.displayName || user.email || 'User',
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: user.uid,
          senderUid: user.uid,
          senderRole: 'user',
          senderName: user.displayName || user.email || 'User',
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.map((m) => (m._id === tempId ? data.message : m)));
        lastMessageIdRef.current = data.message._id;
      }
    } catch {
      // keep temp message
    } finally {
      setSending(false);
    }
  };

  const chatWindow = (
    <div className={inline ? 'w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden' : 'fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300'}>
      <div className="bg-gradient-to-r from-[#E05305] to-[#c84a04] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Support</p>
            <p className="text-orange-100 text-xs">Online</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="text-[#E05305] animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Send a message to start chatting with support.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.senderRole === 'user'
                    ? 'bg-[#E05305] text-white rounded-br-md'
                    : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'
                }`}
              >
                {msg.senderRole !== 'user' && (
                  <p className="text-xs font-semibold text-[#E05305] mb-1">
                    {msg.senderName || 'Support'}
                  </p>
                )}
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-100 p-4 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05305]/20 focus:border-[#E05305] bg-gray-50/50"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || sending}
          className="w-10 h-10 bg-[#E05305] hover:bg-[#c84a04] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
        >
          {sending ? (
            <Loader2 size={16} className="text-white animate-spin" />
          ) : (
            <Send size={16} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );

  if (inline) {
    return (
      <div>
        {open ? chatWindow : (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 bg-[#E05305] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#c84a04] transition-colors shadow-lg shadow-orange-200/50"
          >
            <MessageCircle size={16} />
            Live Chat with Support
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {open && chatWindow}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#E05305] hover:bg-[#c84a04] text-white rounded-full shadow-lg shadow-orange-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
}
