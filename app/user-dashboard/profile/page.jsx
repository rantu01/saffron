"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import Swal from "sweetalert2";
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification } from "firebase/auth";

export default function ProfilePage() {
  const { user: authUser, loading } = useAuth();
  const [profile, setProfile] = useState({ displayName: "", avatarUrl: "", phoneNumber: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" });

  useEffect(() => {
    async function load() {
      if (!authUser?.uid) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/user/profile?uid=${encodeURIComponent(authUser.uid)}`);
        const data = await res.json();
        if (data?.success) {
          setProfile({
            displayName: data.user.displayName || "",
            avatarUrl: data.user.avatarUrl || "",
            phoneNumber: data.user.phoneNumber || "",
          });
        }
      } finally { setIsLoading(false); }
    }
    load();
  }, [authUser?.uid]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!authUser?.uid) return;
    const res = await fetch('/api/user/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: authUser.uid, ...profile })
    });
    const data = await res.json();
    if (!res.ok || !data.success) return Swal.fire({ icon: 'error', title: 'Failed', text: data.message || 'Could not update' });
    Swal.fire({ icon: 'success', title: 'Saved', timer: 1000, showConfirmButton: false });
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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isEmailVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {isEmailVerified ? "Verified" : "Not verified"}
            </span>
            {!isEmailVerified && (
              <button onClick={handleSendVerification} className="text-xs text-blue-600 hover:underline">
                Send verification
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Display name</label>
            <input
              value={profile.displayName}
              onChange={(e) => setProfile(p => ({ ...p, displayName: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Phone number</label>
            <input
              value={profile.phoneNumber}
              onChange={(e) => setProfile(p => ({ ...p, phoneNumber: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">New password</label>
            <input
              type="password"
              value={passwordForm.newPass}
              onChange={(e) => setPasswordForm(p => ({ ...p, newPass: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
          <button className="bg-blue-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-blue-700 transition">
            Update password
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
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
      </div>
    </div>
  );
}
