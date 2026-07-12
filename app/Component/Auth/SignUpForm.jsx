"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export default function SignUpForm({ onLoginClick, onClose, inline = false }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    phoneNumber: '',
    email: '',
    invitationCode: '',
    agreeToTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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
    if (!usernameValue) return;

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formData.invitationCode }),
      });
      const invitationCheckResult = await invitationCheckResponse.json();
      if (!invitationCheckResponse.ok || !invitationCheckResult.success) {
        throw new Error(invitationCheckResult.message || 'Invalid invitation code.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
      const derivedName = email.split('@')[0] || 'User';
      await updateProfile(userCredential.user, { displayName: derivedName });

      const syncResponse = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || email.split('@')[0] || '',
          phoneNumber: formData.phoneNumber,
          invitationCode: formData.invitationCode,
          username: formData.username.trim(),
        }),
      });
      const syncResult = await syncResponse.json();
      if (!syncResponse.ok || !syncResult.success) {
        throw new Error(syncResult.message || 'Failed to sync user data.');
      }

      const isNewUser = Boolean(syncResult.isNewUser);

      await Swal.fire({
        icon: 'success',
        title: 'Registration successful',
        text: 'Your account has been created.',
        timer: 1500,
        showConfirmButton: false,
      });

      try {
        const dashRes = await fetch(`/api/user/dashboard?uid=${encodeURIComponent(userCredential.user.uid)}`);
        const dashData = await dashRes.json();
        const role = dashData?.dashboard?.role || 'user';
        const basePath = role === 'admin' ? '/admin' : '/user-dashboard';
        const queryParam = isNewUser ? '?welcome=true' : '';
        router.push(`${basePath}${queryParam}`);
      } catch {
        router.push(`/user-dashboard${isNewUser ? '?welcome=true' : ''}`);
      }
    } catch (error) {
      console.error('Registration error', error);
      let message = error.message || 'Registration failed.';
      await Swal.fire({
        icon: 'error',
        title: 'Registration error',
        text: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="w-full flex-grow flex flex-col justify-center">
      <h2 className="text-2xl font-bold text-[#FF7A00] mb-1">Register</h2>
      <p className="text-gray-400 text-xs mb-6">Please register to access more content</p>

      <div className="space-y-4">
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
      </div>

      {statusMessage && (
        <p className="text-green-400 text-sm mt-4">{statusMessage}</p>
      )}
      {errorMessage && (
        <p className="text-red-400 text-sm mt-4">{errorMessage}</p>
      )}

      <div className="mt-8 space-y-3">
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
          onClick={onLoginClick}
          className="w-full bg-purple-900/40 hover:bg-purple-900/60 text-orange-400 font-bold py-2 rounded-lg border border-purple-500/30 text-sm transition-all"
        >
          Login Now
        </button>
      </div>
    </form>
  );

  if (inline) {
    return formContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative z-10 w-full max-w-[400px] mx-4 bg-[#0d0221] rounded-2xl p-6 min-h-[600px] flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl leading-none"
        >
          ✕
        </button>
        <div className="text-3xl font-black tracking-tight text-center mt-2 mb-4 select-none drop-shadow-[0_2px_10px_rgba(239,90,36,0.3)]">
          <span className="text-[#FF7A00]">saffron</span>
          <span className="text-[#00C2FF]">edge</span>
        </div>
        {formContent}
      </div>
    </div>
  );
}
