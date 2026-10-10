"use client";

import React from "react";
import { Globe, Check } from "lucide-react";
import { LANGUAGES, useLanguage } from "./LanguageContext";

/**
 * Language selector matching the existing sidebar design.
 * variant="dark"  -> slide-in drawer / dark surfaces (#121212)
 * variant="light" -> desktop sidebar / light surfaces
 */
export default function LanguageSelector({ variant = "dark" }) {
  const { lang, setLang, t } = useLanguage();
  const isDark = variant === "dark";

  if (isDark) {
    return (
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1 pb-1">
          {t("drawer.language")}
        </p>
        <div className="space-y-0.5 pt-1">
          {LANGUAGES.map((l) => {
            const active = lang === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`w-full flex items-center justify-between py-2 px-1 rounded-lg transition-colors ${
                  active ? "bg-slate-800/70" : "hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-[#FBBF24]" />
                  <span className={`text-sm font-medium ${active ? "text-[#FBBF24]" : "text-white"}`}>
                    {l.label}
                  </span>
                </div>
                {active && <Check size={14} className="text-[#FBBF24]" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {t("misc.language")}
      </p>
      <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-1.5">
        {LANGUAGES.map((l) => {
          const active = lang === l.code;
          return (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#E05305]/10 text-[#E05305]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Globe size={16} className={active ? "text-[#E05305]" : "text-slate-400"} />
              <span className="flex-1 text-left">{l.label}</span>
              {active && <Check size={14} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
