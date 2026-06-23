"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export default function SaffronEdgeAuth() {
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    phoneNumber: '',
    invitationCode: '',
    agreeToTerms: false,
  });
  const [usernameError, setUsernameError] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUsernameBlur = async () => {
    const usernameValue = formData.username.trim();
    if (!usernameValue || isLoginView) return;

    setUsernameChecking(true);
    setUsernameError('');
    try {
      const res = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameValue }),
      });
      const data = await res.json();
      if (data.success && !data.available) {
        setUsernameError('This username is already taken.');
      } else if (!data.success) {
        setUsernameError(data.message || 'Could not verify username.');
      }
    } catch {
      setUsernameError('Could not verify username.');
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');
    setIsSubmitting(true);

    try {
      const email = formData.email.trim().toLowerCase();
      let userCredential;

      if (isLoginView) {
        userCredential = await signInWithEmailAndPassword(auth, email, formData.password);
      } else {
        if (!formData.agreeToTerms) {
          throw new Error('You must agree to the registration agreement.');
        }

        const usernameValue = formData.username.trim();
        if (!usernameValue) {
          throw new Error('Username is required.');
        }

        const usernameCheckResponse = await fetch('/api/auth/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameValue }),
        });
        const usernameCheckResult = await usernameCheckResponse.json();
        if (!usernameCheckResponse.ok || !usernameCheckResult.success) {
          throw new Error(usernameCheckResult.message || 'Failed to check username.');
        }
        if (!usernameCheckResult.available) {
          throw new Error('This username is already taken. Please choose another one.');
        }

        const invitationCheckResponse = await fetch('/api/auth/validate-invitation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: formData.invitationCode }),
        });

        const invitationCheckResult = await invitationCheckResponse.json();
        if (!invitationCheckResponse.ok || !invitationCheckResult.success) {
          throw new Error(invitationCheckResult.message || 'Invalid invitation code.');
        }

        userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
        const derivedName = email.split('@')[0] || 'User';
        await updateProfile(userCredential.user, { displayName: derivedName });
      }

      const syncResponse = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || email.split('@')[0] || '',
          phoneNumber: formData.phoneNumber,
          invitationCode: formData.invitationCode,
          username: !isLoginView ? formData.username.trim() : undefined,
        }),
      });

      const syncResult = await syncResponse.json();
      if (!syncResponse.ok || !syncResult.success) {
        throw new Error(syncResult.message || 'Failed to sync user data.');
      }

      const isNewUser = Boolean(syncResult.isNewUser);

      if (!isLoginView) {
        await Swal.fire({
          icon: 'success',
          title: 'Registration successful',
          text: 'Your account has been created.',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await Swal.fire({
          icon: 'success',
          title: 'Login successful',
          text: 'Welcome back!',
          timer: 1500,
          showConfirmButton: false,
        });
      }

      // After sync, fetch dashboard to determine role and redirect accordingly
      try {
        const dashRes = await fetch(`/api/user/dashboard?uid=${encodeURIComponent(userCredential.user.uid)}`);
        const dashData = await dashRes.json();
        const role = dashData?.dashboard?.role || 'user';
        const basePath = role === 'admin' ? '/admin' : '/user-dashboard';
        const queryParam = isNewUser ? '?welcome=true' : '';
        router.push(`${basePath}${queryParam}`);
      } catch (e) {
        // fallback
        router.push(`/user-dashboard${isNewUser ? '?welcome=true' : ''}`);
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
            {isLoginView ? 'Login' : 'Register'}
          </h2>
          <p className="text-gray-400 text-xs mb-6">
            Please {isLoginView ? 'login' : 'register'} to access more content
          </p>

          <div className="space-y-4">
            {/* Input 1: Email */}
            <div className="bg-white rounded-md flex items-center px-4 py-2.5 shadow-inner">
              <span className="text-[#FF7A00] text-xs font-bold w-24 block border-r border-gray-200 mr-2">Email</span>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full bg-transparent text-gray-800 text-sm focus:outline-none placeholder-gray-400"
              />
            </div>

            {/* Input 2: Password */}
            <div className="bg-white rounded-md flex items-center px-4 py-2.5 shadow-inner">
              <span className="text-[#FF7A00] text-xs font-bold w-24 block border-r border-gray-200 mr-2">Password</span>
              <input
                type="password"
                name="password"
                placeholder="Type Password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full bg-transparent text-gray-800 text-sm focus:outline-none placeholder-gray-400"
              />
            </div>

            {/* Registration Specific Fields */}
            {!isLoginView && (
              <>
                {/* Input 3: Username */}
                <div>
                  <div className="bg-white rounded-md flex items-center px-4 py-2.5 shadow-inner">
                    <span className="text-[#FF7A00] text-xs font-bold w-24 block border-r border-gray-200 mr-2">Username</span>
                    <input
                      type="text"
                      name="username"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={handleInputChange}
                      onBlur={handleUsernameBlur}
                      required
                      className="w-full bg-transparent text-gray-800 text-sm focus:outline-none placeholder-gray-400"
                    />
                    {usernameChecking && <span className="text-xs text-gray-400 ml-1">Checking...</span>}
                  </div>
                  {usernameError && (
                    <p className="text-red-400 text-xs mt-1 ml-1">{usernameError}</p>
                  )}
                </div>

                {/* Input 4: Phone Number */}
                <div className="bg-white rounded-md flex items-center px-4 py-2.5 shadow-inner">
                  <span className="text-[#FF7A00] text-xs font-bold w-24 block border-r border-gray-200 mr-2">Phone Number</span>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Type Phone Number"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-transparent text-gray-800 text-sm focus:outline-none placeholder-gray-400"
                  />
                </div>

                {/* Input 5: Invitation Code */}
                <div className="bg-white rounded-md flex items-center px-4 py-2.5 shadow-inner">
                  <span className="text-[#FF7A00] text-xs font-bold w-24 block border-r border-gray-200 mr-2">Invitation Code</span>
                  <input
                    type="text"
                    name="invitationCode"
                    placeholder="Type Invitation Code"
                    value={formData.invitationCode}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-transparent text-gray-800 text-sm focus:outline-none placeholder-gray-400"
                  />
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    required
                    className="w-4 h-4 rounded border-gray-300 text-[#FF7A00] focus:ring-[#FF7A00] accent-[#FF7A00]"
                  />
                  <label htmlFor="agreeToTerms" className="text-[10px] text-gray-300 cursor-pointer select-none">
                    Agree with <span className="underline text-fuchsia-400 font-medium">&lt;&lt;User Registration Agreement&gt;&gt;</span>
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Forgot Password Link (Only shows on Login page) */}
          {isLoginView && (
            <div className="text-center mt-4">
              <a href="#" className="text-xs text-gray-400 underline hover:text-white transition">
                Forgot password?
              </a>
            </div>
          )}

          {statusMessage && (
            <p className="text-green-400 text-sm mt-4">{statusMessage}</p>
          )}

          {errorMessage && (
            <p className="text-red-400 text-sm mt-4">{errorMessage}</p>
          )}

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            {isLoginView ? (
              <>
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
              </>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#EF5A24] hover:bg-[#d94e1f] text-white font-bold py-3 rounded-lg transition-all transform active:scale-95 shadow-md shadow-orange-600/20"
                >
                  {isSubmitting ? 'Please wait...' : 'Register Now'}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsLoginView(true)}
                  className="w-full bg-purple-900/40 hover:bg-purple-900/60 text-orange-400 font-bold py-2 rounded-lg border border-purple-500/30 text-sm transition-all"
                >
                  Login Now
                </button>
              </>
            )}
          </div>
        </form>

        {/* Mock Browser/App Bottom Navigation URL Bar (Just like image)
        <div className="w-full bg-gray-900/80 rounded-full px-4 py-2 mt-6 flex items-center justify-between border border-gray-800 text-[11px] text-gray-400 font-light select-none">
          <span>AA</span>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="tracking-wide">cedsaffron-edgeglobal.com</span>
          </div>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 11H19" />
          </svg>
        </div> */}

      </div>
    </div>
  );
}