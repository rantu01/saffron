"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { useAuth } from '@/app/Component/Auth/AuthProvider';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';
import Navbar from './Component/Common/Navbar';
import Footer from './Component/Home/Footer';

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadRole() {
      if (!user?.uid) return setRole(null);
      try {
        const res = await fetch(`/api/user/dashboard?uid=${encodeURIComponent(user.uid)}`);
        const data = await res.json();
        if (mounted && data?.success) setRole(data.dashboard?.role || null);
      } catch (e) {
        if (mounted) setRole(null);
      }
    }
    loadRole();
    return () => (mounted = false);
  }, [user?.uid]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-[#E05305] animate-spin" />
      </div>
    );
  }

  if (user) {
    return (

      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-orange-50 px-4 py-12">
          <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#FFF1E9] text-[#E05305] text-sm font-semibold px-4 py-2 rounded-full">
                <Sparkles size={16} />
                Welcome back!
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Great to see you again
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed">
                You are already logged in. Head to your dashboard to manage your tasks, track progress, and explore everything waiting for you.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Active session
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#E05305] rounded-full" /> Ready to go
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-[#FFF1E9] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-[#E05305]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Dashboard
              </h2>
              <p className="text-gray-500 mb-8">
                Access your personal dashboard to manage tasks, view analytics, and update your account settings.
              </p>
              <Link
                href={role === 'admin' ? '/admin' : '/user-dashboard'}
                className="inline-flex items-center gap-2 bg-[#E05305] text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-[#c84a04] transition-all shadow-lg shadow-orange-200 w-full justify-center"
              >
                Go to Dashboard
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (

    <div>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-orange-50 px-4 py-12">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#FFF1E9] text-[#E05305] text-sm font-semibold px-4 py-2 rounded-full">
              <Sparkles size={16} />
              Welcome to Saffron Edge
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Ready to Start Work?
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              Please login to access more content, manage your tasks, and explore our full range of services.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Active platform
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#E05305] rounded-full" /> Secure login
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
              <p className="text-sm text-gray-400 mt-1">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05305]/20 focus:border-[#E05305] transition-all bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05305]/20 focus:border-[#E05305] transition-all bg-gray-50/50"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <Link
                  href="/login"
                  className="text-sm text-[#E05305] hover:text-[#c84a04] font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#E05305] hover:bg-[#c84a04] text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-200/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/login" className="text-[#E05305] hover:text-[#c84a04] font-semibold transition-colors">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>

  );
}
