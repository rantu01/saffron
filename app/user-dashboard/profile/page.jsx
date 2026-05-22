"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import Swal from "sweetalert2";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState({ displayName: '', avatarUrl: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.uid) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/user/profile?uid=${encodeURIComponent(user.uid)}`);
        const data = await res.json();
        if (data?.success) setProfile({ displayName: data.user.displayName || '', avatarUrl: data.user.avatarUrl || '' });
      } finally { setIsLoading(false); }
    }
    load();
  }, [user?.uid]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    const res = await fetch('/api/user/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid, displayName: profile.displayName, avatarUrl: profile.avatarUrl })
    });
    const data = await res.json();
    if (!res.ok || !data.success) return Swal.fire({ icon: 'error', title: 'Failed', text: data.message || 'Could not update' });
    Swal.fire({ icon: 'success', title: 'Saved', timer: 1000, showConfirmButton: false });
  };

  if (loading || isLoading) return <div className="max-w-6xl mx-auto px-4 py-10 text-slate-600">Loading profile...</div>;
  if (!user) return <div className="max-w-6xl mx-auto px-4 py-10">Please login to edit profile.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <form onSubmit={handleSave} className="mt-4 space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block text-sm text-slate-600">Display name</label>
          <input value={profile.displayName} onChange={(e) => setProfile(p => ({...p, displayName: e.target.value}))} className="w-full border border-slate-200 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-slate-600">Avatar image URL</label>
          <input value={profile.avatarUrl} onChange={(e) => setProfile(p => ({...p, avatarUrl: e.target.value}))} className="w-full border border-slate-200 rounded px-3 py-2" />
        </div>
        <div>
          <button className="bg-[#E05305] text-white rounded px-4 py-2">Save profile</button>
        </div>
      </form>
    </div>
  );
}
