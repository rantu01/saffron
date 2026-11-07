"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import { STRINGS } from "@/lib/translations";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
];

const STORAGE_KEY = "saffron-edge-lang";

function lookup(lang, key) {
  const parts = String(key || "").split(".");
  let node = STRINGS[lang];
  for (const part of parts) {
    if (node == null) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const { user } = useAuth();
  const [lang, setLangState] = useState(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved && STRINGS[saved]) return saved;
    } catch {}
    return "en";
  });

  // Sync language from the user profile when they log in.
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/user/profile`);
        const data = await res.json();
        if (cancelled) return;
        const pref = data?.user?.preferredLanguage;
        if (pref && STRINGS[pref]) {
          setLangState(pref);
          try { localStorage.setItem(STORAGE_KEY, pref); } catch {}
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {}
  }, [lang]);

  const setLang = useCallback((code) => {
    if (!STRINGS[code]) return;
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {}
    // Persist to profile when logged in (best-effort).
    if (user?.uid) {
      fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguage: code }),
      }).catch(() => {});
    }
  }, [user?.uid]);

  const t = useCallback(
    (key) => lookup(lang, key) ?? lookup("en", key) ?? key,
    [lang]
  );

  const formatDate = useCallback(
    (value, options) => {
      try {
        return new Intl.DateTimeFormat(lang, options).format(new Date(value));
      } catch {
        return String(value);
      }
    },
    [lang]
  );

  const formatNumber = useCallback(
    (value, options) => {
      try {
        return new Intl.NumberFormat(lang, options).format(value);
      } catch {
        return String(value);
      }
    },
    [lang]
  );

  const formatCurrency = useCallback(
    (value, currency = "USD", options = {}) => {
      try {
        return new Intl.NumberFormat(lang, { style: "currency", currency, ...options }).format(value);
      } catch {
        return String(value);
      }
    },
    [lang]
  );

  const value = React.useMemo(
    () => ({ lang, setLang, t, formatDate, formatNumber, formatCurrency }),
    [lang, setLang, t, formatDate, formatNumber, formatCurrency]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}