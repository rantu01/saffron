"use client";

import { useLanguage, LANGUAGES } from "@/components/LanguageContext";

export default function LanguageSelector({ className = "" }) {
  const { lang, setLang } = useLanguage();
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      className={`border border-slate-200 rounded-md px-2 py-1.5 text-sm bg-white text-slate-700 ${className}`}
      aria-label="Language"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}