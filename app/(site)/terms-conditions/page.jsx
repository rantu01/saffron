"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, FileText, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';

export default function TermsConditionsPage() {
  const { lang } = useLanguage();
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/terms/active?lang=${encodeURIComponent(lang)}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.success) {
          setVersion(data.version);
        } else {
          setError(data.message || 'No terms version is currently published.');
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load terms.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lang]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-orange-50">
        <Loader2 className="w-8 h-8 text-[#E05305] animate-spin" />
      </div>
    );
  }

  const content = version?.content || '';
  const lines = content.split('\n');

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-orange-50">
      <main className="px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#E05305] transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#E05305] to-[#c84a04] px-8 py-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Terms & Conditions</h1>
                <p className="text-orange-100 text-sm mt-1">
                  {version ? `Version ${version.version}` : 'Please read these terms carefully before using our platform'}
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-8 space-y-6">
            <div className="flex items-center gap-3 bg-[#FFF1E9] rounded-xl px-5 py-4">
              <Shield className="w-5 h-5 text-[#E05305] shrink-0" />
              <p className="text-sm text-gray-700">
                Each user is required to read and comply with the following terms and conditions before using the platform.
              </p>
            </div>

            {error && !version && (
              <p className="text-slate-500 text-sm">{error}</p>
            )}

            {version && (
              <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}