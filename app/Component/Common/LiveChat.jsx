"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/app/Component/Auth/AuthProvider';
import { MessageCircle, X, Send, Loader2, ImagePlus } from 'lucide-react';

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function LiveChat({ inline = false }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const pollRef = useRef(null);
  const unreadPollRef = useRef(null);

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
    if (!user?.uid) return;
    fetchUnread();
    unreadPollRef.current = setInterval(fetchUnread, 5000);
    return () => {
      if (unreadPollRef.current) clearInterval(unreadPollRef.current);
    };
  }, [user?.uid, fetchUnread]);

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

    fetch('/api/chat/read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: user.uid, byUid: user.uid }),
    }).catch(() => {});

    setUnreadCount(0);

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

  const handleSend = async (text, imageUrl) => {
    const message = text || input;
    if ((!message.trim() && !imageUrl) || sending || uploading) return;

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
      imageUrl: imageUrl || null,
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
          imageUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.map((m) => (m._id === tempId ? data.message : m)));
        lastMessageIdRef.current = data.message._id;
      } else {
        setUploadError(data.message || 'Failed to send message.');
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
      }
    } catch {
      setUploadError('Failed to send message. Please try again.');
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file || sending || uploading) return;

    setUploadError('');

    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      setUploadError('Only JPG, JPEG, PNG, and WEBP images are allowed.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError('Image is too large. Maximum size is 5 MB.');
      return;
    }

    setUploading(true);

    const tempId = 'temp-' + Date.now();
    const tempMsg = {
      _id: tempId,
      conversationId: user.uid,
      senderUid: user.uid,
      senderRole: 'user',
      senderName: user.displayName || user.email || 'User',
      message: '',
      imageUrl: URL.createObjectURL(file),
      uploading: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('uid', user.uid);
      const res = await fetch('/api/chat/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (!data.success) {
        setUploadError(data.message || 'Image upload failed.');
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        return;
      }
      await handleSend('', data.imageUrl);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } catch {
      setUploadError('Image upload failed. Please try again.');
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setUploading(false);
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
            <p className="text-white font-semibold text-sm">Customer Service</p>
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
                 className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.senderRole === 'user'
                     ? 'bg-[#E05305] text-white rounded-br-md'
                     : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'
                   }`}
               >
                 {msg.senderRole !== 'user' && (
                   <p className="text-xs font-semibold text-[#E05305] mb-1">
                     {msg.senderName || 'Support'}
                   </p>
                 )}
                 {msg.imageUrl && (
                   <button
                     type="button"
                     onClick={() => setLightboxUrl(msg.imageUrl)}
                     className="block w-full max-w-[220px] overflow-hidden rounded-xl mb-1 focus:outline-none"
                   >
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img
                       src={msg.imageUrl}
                       alt="Shared image"
                       className="w-full h-auto object-cover rounded-xl"
                     />
                   </button>
                 )}
                 {msg.uploading && (
                   <div className="flex items-center gap-2 text-xs opacity-80">
                     <Loader2 size={14} className="animate-spin" />
                     Uploading image...
                   </div>
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
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          ref={fileInputRef}
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || sending}
          title="Send an image"
          className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ImagePlus size={16} />
          )}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E05305]/20 focus:border-[#E05305] bg-white appearance-none"
          style={{
            color: "#111827",
            WebkitTextFillColor: "#111827",
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={(!input.trim() && !uploading) || sending}
          className="w-10 h-10 bg-[#E05305] hover:bg-[#c84a04] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
        >
          {sending ? (
            <Loader2 size={16} className="text-white animate-spin" />
          ) : (
            <Send size={16} className="text-white" />
          )}
        </button>
      </div>

      {uploadError && (
        <div className="px-4 pb-3">
          <p className="text-xs text-red-500">{uploadError}</p>
        </div>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Preview"
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={28} />
          </button>
        </div>
      )}
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
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[22px] h-[22px] px-1 text-[11px] font-bold text-white bg-red-500 rounded-full leading-none shadow-md">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
