"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import Swal from "sweetalert2";
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification } from "firebase/auth";

export default function ProfilePage() {
  const { user: authUser, loading } = useAuth();
  const [profile, setProfile] = useState({ displayName: "", avatarUrl: "", phoneNumber: "", referralCode: "", canGenerateMultipleCodes: false, username: "" });
  const [usernameError, setUsernameError] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" });

  const loadData = async () => {
    if (!authUser?.uid) return;
    setIsLoading(true);
    try {
      const [profileRes, referralRes] = await Promise.all([
        fetch(`/api/user/profile?uid=${encodeURIComponent(authUser.uid)}`),
        fetch(`/api/user/referral?uid=${encodeURIComponent(authUser.uid)}`),
      ]);
      const profileData = await profileRes.json();
      if (profileData?.success) {
        setProfile({
          displayName: profileData.user.displayName || "",
          avatarUrl: profileData.user.avatarUrl || "",
          phoneNumber: profileData.user.phoneNumber || "",
          referralCode: profileData.user.referralCode || "",
          canGenerateMultipleCodes: Boolean(profileData.user.canGenerateMultipleCodes),
          username: profileData.user.username || "",
        });
      }
      const referralData = await referralRes.json();
      if (referralData?.success) {
        setInvitations(referralData.referral.invitations || []);
      }
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    loadData();
  }, [authUser?.uid]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!authUser?.uid) return;
    if (usernameError) {
      return Swal.fire({ icon: 'error', title: 'Username unavailable', text: 'Please choose a different username.' });
    }
    const res = await fetch('/api/user/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: authUser.uid, displayName: profile.displayName, avatarUrl: profile.avatarUrl, phoneNumber: profile.phoneNumber, username: profile.username })
    });
    const data = await res.json();
    if (!res.ok || !data.success) return Swal.fire({ icon: 'error', title: 'Failed', text: data.message || 'Could not update' });
    Swal.fire({ icon: 'success', title: 'Saved', timer: 1000, showConfirmButton: false });
    setUsernameError('');
  };

  const handleUsernameBlur = async () => {
    const usernameValue = profile.username.trim();
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
      if (!data.success) {
        setUsernameError(data.message || 'Could not verify username.');
      } else if (!data.available) {
        setUsernameError('This username is already taken.');
      }
    } catch {
      setUsernameError('Could not verify username.');
    } finally {
      setUsernameChecking(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!authUser) return;

    if (passwordForm.newPass !== passwordForm.confirm) {
      return Swal.fire({ icon: "error", title: "Passwords do not match" });
    }
    if (passwordForm.newPass.length < 6) {
      return Swal.fire({ icon: "error", title: "Password must be at least 6 characters" });
    }

    try {
      const fbAuth = getAuth();
      const credential = EmailAuthProvider.credential(authUser.email, passwordForm.current);
      await reauthenticateWithCredential(authUser, credential);
      await updatePassword(authUser, passwordForm.newPass);
      Swal.fire({ icon: "success", title: "Password updated", timer: 1500, showConfirmButton: false });
      setPasswordForm({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.message || "Could not update password" });
    }
  };

  const handleSendVerification = async () => {
    if (!authUser) return;
    try {
      const fbAuth = getAuth();
      await sendEmailVerification(authUser);
      Swal.fire({ icon: "success", title: "Verification email sent!", timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.message });
    }
  };

  const handleDeleteAccount = async () => {
    if (!authUser?.uid) return;

    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Delete Account?",
      text: "This will permanently delete all your data. This cannot be undone.",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Yes, delete my account",
    });

    if (!confirmed.isConfirmed) return;

    try {
      const res = await fetch("/api/user/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: authUser.uid }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      const fbAuth = getAuth();
      await fbAuth.currentUser?.delete();

      Swal.fire({ icon: "success", title: "Account deleted", timer: 1500, showConfirmButton: false });
      setTimeout(() => { window.location.href = "/"; }, 1500);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.message });
    }
  };

  if (loading || isLoading) return <div className="max-w-6xl mx-auto px-4 py-10 text-slate-600">Loading profile...</div>;
  if (!authUser) return <div className="max-w-6xl mx-auto px-4 py-10">Please login to edit profile.</div>;

  const isEmailVerified = authUser.emailVerified;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Account Information</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Email:</span>
            <span className="text-sm font-medium text-slate-900">{authUser.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Username:</span>
            <span className="text-sm font-medium text-slate-900">{profile.username || "(not set)"}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Your Referral Code</h2>
        </div>
        <div className="p-5">
          {profile.referralCode ? (
            <div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-50 border border-dashed border-slate-300 rounded-lg px-4 py-3 font-mono text-lg font-bold text-[#E05305] tracking-[0.2em] text-center select-all">
                  {profile.referralCode}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(profile.referralCode);
                    Swal.fire({ icon: "success", title: "Copied!", timer: 1000, showConfirmButton: false });
                  }}
                  className="bg-[#E05305] text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-[#c84a04] transition"
                >
                  Copy
                </button>
              </div>
              {profile.canGenerateMultipleCodes && (
                <button
                  onClick={async () => {
                    if (!authUser?.uid) return;
                    const res = await fetch("/api/user/referral/generate-code", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ uid: authUser.uid, email: authUser.email, displayName: authUser.displayName }),
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success) {
                      return Swal.fire({ icon: "error", title: "Failed", text: data.message || "Could not generate code" });
                    }
                    Swal.fire({ icon: "success", title: "New code generated!", text: data.invitation.code, timer: 1500, showConfirmButton: false });
                    loadData();
                  }}
                  className="mt-3 bg-[#E05305] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#c84a04] transition"
                >
                  Generate New Code
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">No referral code yet.</p>
              <button
                onClick={async () => {
                  if (!authUser?.uid) return;
                  const res = await fetch("/api/user/referral/generate-code", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid: authUser.uid, email: authUser.email, displayName: authUser.displayName }),
                  });
                  const data = await res.json();
                  if (!res.ok || !data.success) {
                    return Swal.fire({ icon: "error", title: "Failed", text: data.message || "Could not generate code" });
                  }
                  Swal.fire({ icon: "success", title: "Code generated!", text: data.invitation.code, timer: 1500, showConfirmButton: false });
                  loadData();
                }}
                className="bg-[#E05305] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#c84a04] transition"
              >
                Generate My Code
              </button>
            </div>
          )}
          <p className="text-xs text-slate-400 mt-3">Share this code with friends. They can use it to register and you earn from their activities.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">All Invitation Codes ({invitations.length})</h2>
        </div>
        {invitations.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200/60">
                  <th className="py-4 px-6">Code</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Used By</th>
                  <th className="py-4 px-6">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {invitations.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/40">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 tracking-widest">{inv.code}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${inv.usedByEmail ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {inv.usedByEmail ? "Used" : "Available"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{inv.usedByEmail || "-"}</td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-5 text-sm text-slate-500 text-center">No invitation codes generated yet.</p>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Username</label>
            <input
              value={profile.username}
              onChange={(e) => { setProfile(p => ({ ...p, username: e.target.value })); setUsernameError(''); }}
              onBlur={handleUsernameBlur}
              className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {usernameChecking && <p className="text-xs text-slate-400 mt-1">Checking availability...</p>}
            {usernameError && <p className="text-xs text-red-500 mt-1">{usernameError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Display name</label>
            <input
              value={profile.displayName}
              onChange={(e) => setProfile(p => ({ ...p, displayName: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Phone number</label>
            <input
              value={profile.phoneNumber}
              onChange={(e) => setProfile(p => ({ ...p, phoneNumber: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Avatar</label>
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatarInput')?.click()}>
                <img
                  src={profile.avatarUrl || "https://ui-avatars.com/api/?name=User&background=E05305&color=fff"}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 group-hover:opacity-80 transition"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 transition">
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition">
                    Upload Image
                  </span>
                </div>
              </div>
              <input
                id="avatarInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !authUser?.uid) return;
                  const fd = new FormData();
                  fd.append("avatar", file);
                  fd.append("uid", authUser.uid);
                  try {
                    const res = await fetch("/api/user/profile/avatar", { method: "POST", body: fd });
                    const data = await res.json();
                    if (data.success) {
                      setProfile(p => ({ ...p, avatarUrl: data.avatarUrl }));
                      Swal.fire({ icon: "success", title: "Avatar uploaded", timer: 1000, showConfirmButton: false });
                    } else {
                      Swal.fire({ icon: "error", title: "Upload failed", text: data.message });
                    }
                  } catch {
                    Swal.fire({ icon: "error", title: "Upload failed" });
                  }
                }}
              />
            </div>
          </div>
          <button className="bg-[#E05305] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#c84a04] transition">
            Save changes
          </button>
        </div>
      </form>

      <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Current password</label>
            <input
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm(p => ({ ...p, current: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">New password</label>
            <input
              type="password"
              value={passwordForm.newPass}
              onChange={(e) => setPasswordForm(p => ({ ...p, newPass: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Confirm new password</label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
          <button className="bg-blue-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-blue-700 transition">
            Update password
          </button>
        </div>
      </form>

      {/* <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-red-100">
          <h2 className="text-lg font-bold text-red-700">Danger Zone</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-600 mb-3">Permanently delete your account and all associated data.</p>
          <button
            onClick={handleDeleteAccount}
            className="bg-red-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-red-700 transition"
          >
            Delete Account
          </button>
        </div>
      </div> */}
    </div>
  );
}
