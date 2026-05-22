"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, invitationsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/invitations"),
      ]);

      const usersData = await usersRes.json();
      const invitationsData = await invitationsRes.json();

      setUsers(usersData.users || []);
      setInvitations(invitationsData.invitations || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateUser = async (uid, updateFields) => {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, ...updateFields }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Update failed", text: result.message || "Please try again." });
      return;
    }

    await Swal.fire({ icon: "success", title: "User updated", timer: 1200, showConfirmButton: false });
    loadData();
  };

  const createInvitationCode = async () => {
    const response = await fetch("/api/admin/invitations", { method: "POST" });
    const result = await response.json();

    if (!response.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Generation failed", text: result.message || "Please try again." });
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Invitation code created",
      text: `New code: ${result.invitation.code}`,
    });

    loadData();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <button
          onClick={createInvitationCode}
          className="bg-[#E05305] text-white rounded px-4 py-2.5 font-medium hover:bg-[#c84a04] transition"
        >
          Generate Invitation Code
        </button>
      </div>

      <div className="bg-white rounded shadow p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">Users</h2>

        {loading ? (
          <p className="text-slate-600">Loading...</p>
        ) : users.length ? (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.uid} className="border border-slate-200 rounded-lg p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{user.email || user.uid}</p>
                    <p className="text-xs text-slate-500 mt-1">UID: {user.uid}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">

                    <p>Role : </p>
                    <select
                      defaultValue={user.role || "user"}
                      onChange={(event) => updateUser(user.uid, { role: event.target.value })}
                      className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>

                    <p>Balance : </p>

                    <input
                      type="number"
                      step="0.01"
                      defaultValue={Number(user.availableBalance || 0)}
                      className="border border-slate-300 rounded px-2 py-1.5 text-sm w-32"
                      onBlur={(event) => updateUser(user.uid, { availableBalance: event.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600">No users found.</p>
        )}
      </div>

      <div className="mt-6 bg-white rounded shadow p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">Invitation Codes</h2>
        {invitations.length ? (
          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div key={invitation._id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900 tracking-widest">{invitation.code}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {invitation.usedByEmail ? `Used by: ${invitation.usedByEmail}` : "Unused"}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${invitation.usedByUid ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {invitation.usedByUid ? "Used" : "Available"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600">No invitation codes generated yet.</p>
        )}
      </div>
    </div>
  );
}
