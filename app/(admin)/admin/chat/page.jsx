"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import { MessageCircle, Send, Loader2, Search, ChevronLeft } from "lucide-react";

const ITEMS_PER_PAGE = 20;

export default function AdminChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const pollRef = useRef(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch {
      // silent
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId, afterId) => {
    try {
      const params = new URLSearchParams({ conversationId: convId });
      if (afterId) params.set("afterId", afterId);
      const res = await fetch(`/api/chat/messages?${params}`);
      const data = await res.json();
      if (data.success && data.messages?.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const newMsgs = data.messages.filter((m) => !existingIds.has(m._id));
          if (newMsgs.length === 0) return prev;
          return [...prev, ...newMsgs];
        });
        return data.messages[data.messages.length - 1]._id;
      }
      return afterId;
    } catch {
      return afterId;
    }
  }, []);

  const openConversation = async (conv) => {
    setSelectedConv(conv);
    setMessages([]);
    setLoadingMsgs(true);
    lastMessageIdRef.current = null;

    const lastId = await fetchMessages(conv.conversationId);
    lastMessageIdRef.current = lastId;
    setLoadingMsgs(false);

    await fetch("/api/chat/read", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: conv.conversationId, byUid: user?.uid }),
    });

    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const lastId = await fetchMessages(conv.conversationId, lastMessageIdRef.current);
      if (lastId) lastMessageIdRef.current = lastId;
    }, 3000);
  };

  const closeConversation = () => {
    clearInterval(pollRef.current);
    setSelectedConv(null);
    setMessages([]);
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !selectedConv || !user) return;

    setSending(true);
    const text = input.trim();
    setInput("");

    const tempId = "temp-" + Date.now();
    const tempMsg = {
      _id: tempId,
      conversationId: selectedConv.conversationId,
      senderUid: user.uid,
      senderRole: "admin",
      senderName: "Support",
      message: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.conversationId,
          senderUid: user.uid,
          senderRole: "admin",
          senderName: "Support",
          message: text,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.map((m) => (m._id === tempId ? data.message : m)));
        lastMessageIdRef.current = data.message._id;
        fetchConversations();
      }
    } catch {
      // keep temp
    } finally {
      setSending(false);
    }
  };

  const filteredConvs = conversations.filter(
    (c) =>
      (c.userName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (c.userEmail?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Live Chat</h1>
      <p className="text-sm text-slate-500 mb-6">Respond to user messages in real time</p>

      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
        {selectedConv ? (
          <div>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <button
                onClick={closeConversation}
                className="lg:hidden p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <div className="w-9 h-9 rounded-full bg-[#E05305]/10 flex items-center justify-center">
                <MessageCircle size={16} className="text-[#E05305]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {selectedConv.userName || selectedConv.userEmail || "Unknown User"}
                </p>
                <p className="text-xs text-gray-400">{selectedConv.userEmail}</p>
              </div>
            </div>

            <div className="h-[400px] overflow-y-auto p-5 space-y-3 bg-gray-50/30">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={20} className="text-[#E05305] animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-sm">No messages yet. Send a reply below.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.senderRole === "admin"
                          ? "bg-[#E05305] text-white rounded-br-md"
                          : "bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md"
                      }`}
                    >
                      {msg.senderRole !== "admin" && (
                        <p className="text-xs font-semibold text-[#E05305] mb-1">
                          {msg.senderName || "User"}
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
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your reply..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05305]/20 focus:border-[#E05305] bg-gray-50/50"
              />
              <button
                onClick={handleSend}
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
        ) : (
          <div>
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                   onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05305]/20 focus:border-[#E05305] bg-gray-50/50"
                />
              </div>
            </div>

            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {loadingConvs ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={20} className="text-[#E05305] animate-spin" />
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="text-center py-16">
                  <MessageCircle size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">
                    {search ? "No conversations match your search." : "No conversations yet."}
                  </p>
                </div>
              ) : (
                filteredConvs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((conv) => (
                  <button
                    key={conv.conversationId}
                    onClick={() => openConversation(conv)}
                    className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#E05305]/10 flex items-center justify-center shrink-0">
                      <MessageCircle size={18} className="text-[#E05305]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {conv.userName || conv.userEmail || "Unknown User"}
                        </p>
                        <span className="text-xs text-gray-400 shrink-0">
                          {conv.lastMessageAt
                            ? new Date(conv.lastMessageAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{conv.userEmail}</p>
                      <p className="text-sm text-gray-500 truncate mt-1">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="w-6 h-6 rounded-full bg-[#E05305] text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )}

              {filteredConvs.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">Page {page} of {Math.ceil(filteredConvs.length / ITEMS_PER_PAGE)}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(Math.ceil(filteredConvs.length / ITEMS_PER_PAGE), p + 1))}
                    disabled={page >= Math.ceil(filteredConvs.length / ITEMS_PER_PAGE)}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
