"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageCircle, Bell, X } from "lucide-react";

let toastId = 0;

/**
 * Global toast bus: any component can push a toast via `pushRealtimeToast()`.
 * `RealtimeToasts` renders them with consistent styling on both admin + user sides.
 */
const listeners = new Set();

export function pushRealtimeToast({ title, message, kind = "chat", href }) {
  const id = ++toastId;
  const toast = { id, title, message, kind, href, at: Date.now() };
  for (const fn of listeners) {
    try { fn(toast); } catch {}
  }
  return id;
}

export default function RealtimeToasts() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const onToast = (toast) => {
      setToasts((prev) => [...prev.slice(-3), toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 6000);
    };
    listeners.add(onToast);
    return () => { listeners.delete(onToast); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const isChat = t.kind !== "notification";
        const Icon = isChat ? MessageCircle : Bell;
        const accent = isChat ? "bg-[#E05305]" : "bg-blue-600";
        const content = (
          <>
            <div className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
              <Icon size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{t.title}</p>
              {t.message && (
                <p className="text-xs text-slate-500 truncate mt-0.5">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0 pointer-events-auto"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </>
        );
        const cls = "pointer-events-auto flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 px-3 py-3 animate-in slide-in-from-top-2 duration-200";
        return t.href ? (
          <a key={t.id} href={t.href} onClick={() => dismiss(t.id)} className={cls}>
            {content}
          </a>
        ) : (
          <div key={t.id} className={cls}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
