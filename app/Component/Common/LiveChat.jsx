"use client";

import React, { useState } from 'react';
import { useAuth } from '@/app/Component/Auth/AuthProvider';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

const quickReplies = [
  'How do I start a task?',
  'What are the VIP levels?',
  'How do I make a deposit?',
  'Withdrawal process?',
];

const autoReplies = {
  'how do i start a task': 'To start a task, go to your Dashboard and click on "My Tasks". The system will assign tasks based on your available balance. Complete them sequentially to earn rewards.',
  'what are the vip levels': 'There are 4 VIP levels: VIP1 (up to 3 task groups/day, 0.5% profit), VIP2 (4 groups, 0.6%), VIP3 (4 groups, 0.8%), VIP4 (5 groups, 1%). The system auto-upgrades your level when conditions are met.',
  'how do i make a deposit': 'Go to the Deposits section in your Dashboard. Choose your preferred amount, and you will receive a wallet address or QR code to complete the payment. After payment, submit the proof screenshot for admin verification.',
  'withdrawal process': 'Navigate to Withdrawals in your Dashboard, enter your wallet address and the amount you wish to withdraw. Submit the request — our admin team will manually review and process it.',
};

export default function LiveChat() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Hi${user?.displayName ? ' ' + user.displayName : ''}! Welcome to Saffron Edge Support. How can we help you today?`,
      sender: 'bot',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  if (loading || !user) return null;

  const addMessage = (text, sender) => {
    setMessages((prev) => [...prev, { id: Date.now(), text, sender }]);
  };

  const handleSend = async (text) => {
    const message = text || input;
    if (!message.trim()) return;

    addMessage(message.trim(), 'user');
    setInput('');
    setSending(true);

    setTimeout(() => {
      const lower = message.toLowerCase().trim();
      let reply = null;

      for (const [key, value] of Object.entries(autoReplies)) {
        if (lower.includes(key)) {
          reply = value;
          break;
        }
      }

      if (!reply) {
        reply = 'Thank you for your message. Our support team will get back to you shortly. For urgent assistance, please contact us during business hours (11:00 - 22:59).';
      }

      addMessage(reply, 'bot');
      setSending(false);
    }, 800);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-[#E05305] to-[#c84a04] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Live Support</p>
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
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#E05305] text-white rounded-br-md'
                      : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 size={16} className="text-[#E05305] animate-spin" />
                </div>
              </div>
            )}
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {quickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qr)}
                  className="text-xs bg-[#FFF1E9] text-[#E05305] px-3 py-1.5 rounded-full hover:bg-[#ffe4d5] transition-colors font-medium"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

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
              disabled={!input.trim()}
              className="w-10 h-10 bg-[#E05305] hover:bg-[#c84a04] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#E05305] hover:bg-[#c84a04] text-white rounded-full shadow-lg shadow-orange-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
}
