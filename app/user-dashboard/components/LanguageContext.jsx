"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { STRINGS } from "./translations";

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
  // Lazy initializer reads the persisted choice without an effect
  // (avoids a flash of the default language on reload).
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && STRINGS[saved]) return saved;
    } catch {}
    return "en";
  });

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
  }, []);

  const t = useCallback(
    (key) => lookup(lang, key) ?? lookup("en", key) ?? key,
    [lang]
  );

  const value = React.useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
