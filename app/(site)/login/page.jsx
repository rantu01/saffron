"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import SignUpForm from '@/app/Component/Auth/SignUpForm';

export default function SaffronEdgeAuth() {
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);

      const syncResponse = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || email.split('@')[0] || '',
        }),
      });

      const syncResult = await syncResponse.json();
      if (!syncResponse.ok || !syncResult.success) {
        throw new Error(syncResult.message || 'Failed to sync user data.');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Login successful',
        text: 'Welcome back!',
        timer: 1500,
        showConfirmButton: false,
      });

      try {
        const dashRes = await fetch(`/api/user/dashboard?uid=${encodeURIComponent(userCredential.user.uid)}`);
        const dashData = await dashRes.json();
        const role = dashData?.dashboard?.role || 'user';
        const basePath = role === 'admin' ? '/admin' : '/user-dashboard';
        router.push(basePath);
      } catch {
        router.push('/user-dashboard');
      }
    } catch (error) {
      console.error('Auth error', error);
      let message = error.message || 'Authentication failed.';
      if (error.code === 'auth/invalid-credential') {
        message = 'Invalid credentials. Please check and try again.';
      }

      await Swal.fire({
        icon: 'error',
        title: 'Authentication error',
        text: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoginView) {
    return (
      <div className="min-h-screen bg-[#0d0221] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1b004a] via-[#0d0221] to-[#3a0066] z-0" />
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-600 rounded-full blur-[160px] opacity-20 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[160px] opacity-20 pointer-events-none" />

        <div className="relative z-10 w-full max-w-[400px] flex flex-col justify-between min-h-[720px]">
          <div className="w-full flex flex-col items-center">
            <div className="text-3xl font-black tracking-tight mt-4 select-none drop-shadow-[0_2px_10px_rgba(239,90,36,0.3)]">
              <span className="text-[#FF7A00]">saffron</span>
              <span className="text-[#00C2FF]">edge</span>
            </div>
            <div className="relative w-40 h-28 my-6 flex items-center justify-center">
              <div className="absolute w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px] border-b-purple-500/20 opacity-40 animate-pulse" />
              <div className="absolute w-0 h-0 border-l-[50px] border-l-transparent border-r-[50px] border-r-transparent border-b-[85px] border-b-fuchsia-500/40" />
              <div className="absolute w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[70px] border-b-[#FF7A00]/60" />
            </div>
          </div>

          <SignUpForm
            inline
            onLoginClick={() => setIsLoginView(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0221] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">

      {/* Background Neon Aesthetics */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#1b004a] via-[#0d0221] to-[#3a0066] z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-600 rounded-full blur-[160px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[160px] opacity-20 pointer-events-none" />

      {/* Main Container Phone Mockup Frame */}
      <div className="relative z-10 w-full max-w-[400px]   flex flex-col justify-between min-h-[720px]">

        {/* Top Header Section */}
        <div className="w-full flex flex-col items-center">
          {/* SaffronEdge Text/Logo styling */}
          <div className="text-3xl font-black tracking-tight mt-4 select-none drop-shadow-[0_2px_10px_rgba(239,90,36,0.3)]">
            <span className="text-[#FF7A00]">saffron</span>
            <span className="text-[#00C2FF]">edge</span>
          </div>

          {/* Futuristic Neon Triangle Element */}
          <div className="relative w-40 h-28 my-6 flex items-center justify-center">
            <div className="absolute w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px] border-b-purple-500/20 opacity-40 animate-pulse" />
            <div className="absolute w-0 h-0 border-l-[50px] border-l-transparent border-r-[50px] border-r-transparent border-b-[85px] border-b-fuchsia-500/40" />
            <div className="absolute w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[70px] border-b-[#FF7A00]/60" />
          </div>
        </div>

        {/* Dynamic Form Interface */}
        <form onSubmit={handleSubmit} className="w-full flex-grow flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-[#FF7A00] mb-1">
            Login
          </h2>
          <p className="text-gray-400 text-xs mb-6">
            Please login to access more content
          </p>

          <div className="space-y-4">
            {/* Input: Password */}
            <div className="bg-white rounded-md flex items-center px-4 py-2.5 shadow-inner">
              <span className="text-[#FF7A00] text-xs font-bold w-24 block border-r border-gray-200 mr-2">Password</span>
              <input
                type="password"
                name="password"
                placeholder="Type Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent text-gray-800 text-sm focus:outline-none placeholder-gray-400"
              />
            </div>

            {/* Input: Email */}
            <div className="bg-white rounded-md flex items-center px-4 py-2.5 shadow-inner">
              <span className="text-[#FF7A00] text-xs font-bold w-24 block border-r border-gray-200 mr-2">Email</span>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent text-gray-800 text-sm focus:outline-none placeholder-gray-400"
              />
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-center mt-4">
            <a href="#" className="text-xs text-gray-400 underline hover:text-white transition">
              Forgot password?
            </a>
          </div>

          {errorMessage && (
            <p className="text-red-400 text-sm mt-4">{errorMessage}</p>
          )}

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#EF5A24] hover:bg-[#d94e1f] text-white font-bold py-3 rounded-lg transition-all transform active:scale-95 shadow-md shadow-orange-600/20"
            >
              {isSubmitting ? 'Please wait...' : 'Login Now'}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsLoginView(false)}
              className="w-full bg-purple-900/40 hover:bg-purple-900/60 text-orange-400 font-bold py-2 rounded-lg border border-purple-500/30 text-sm transition-all"
            >
              Register Now
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
