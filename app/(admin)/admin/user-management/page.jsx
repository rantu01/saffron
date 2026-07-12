"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import Pagination from "../components/Pagination";
import { CardSkeleton, TableSkeleton } from "../components/TableSkeleton";

const ITEMS_PER_PAGE = 10;

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [invPage, setInvPage] = useState(1);
  const searchTimerRef = useRef(null);

  const loadUsers = useCallback(async (searchQuery, pageNum) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum, limit: String(ITEMS_PER_PAGE) });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInvitations = async () => {
    try {
      const res = await fetch("/api/admin/invitations");
      const data = await res.json();
      setInvitations(data.invitations || []);
    } catch {}
  };

  useEffect(() => {
    loadUsers("", 1);
    loadInvitations();
  }, []);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      loadUsers(value, 1);
    }, 300);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadUsers(search, newPage);
  };

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
    loadUsers(search, page);
  };

  const createInvitationCode = async () => {
    const response = await fetch("/api/admin/invitations", { method: "POST" });
    const result = await response.json();
    if (!response.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Generation failed", text: result.message || "Please try again." });
      return;
    }
    await Swal.fire({ icon: "success", title: "Invitation code created", text: `New code: ${result.invitation.code}` });
    loadInvitations();
  };

  const createReferralCodeForUser = async (user) => {
    const response = await fetch("/api/admin/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ createdByUid: user.uid, createdByEmail: user.email || "", createdByName: user.displayName || "" }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Generation failed", text: result.message || "Please try again." });
      return;
    }
    await Swal.fire({ icon: "success", title: "Referral code created", text: `${user.email || user.uid}: ${result.invitation.code}` });
  };

  const createDemoAccount = async (user) => {
    const { value: formValues } = await Swal.fire({
      title: "Create Demo Account",
      html: `
        <div style="text-align:left;margin-bottom:8px;font-size:13px;color:#475569;">Email</div>
        <input id="swal-email" class="swal2-input" type="email" value="demo_${user.email || user.uid}" style="width:100%">
        <div style="text-align:left;margin-bottom:8px;margin-top:12px;font-size:13px;color:#475569;">Password</div>
        <input id="swal-password" class="swal2-input" type="password" placeholder="Enter password" style="width:100%">
      `,
      focusConfirm: false, showCancelButton: true, confirmButtonText: "Create",
      preConfirm: () => {
        const email = document.getElementById("swal-email").value.trim();
        const password = document.getElementById("swal-password").value;
        if (!email) { Swal.showValidationMessage("Email is required"); return false; }
        if (!password || password.length < 6) { Swal.showValidationMessage("Password must be at least 6 characters"); return false; }
        return { email, password };
      },
    });
    if (!formValues) return;
    const response = await fetch("/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, email: formValues.email, password: formValues.password }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Creation failed", text: result.message || "Please try again." });
      return;
    }
    await Swal.fire({ icon: "success", title: "Demo account created", text: `Email: ${result.user.email}` });
  };

  const totalInvPages = Math.ceil(invitations.length / ITEMS_PER_PAGE) || 1;
  const paginatedInvitations = invitations.slice((invPage - 1) * ITEMS_PER_PAGE, invPage * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total users</p>
        </div>
        <button onClick={createInvitationCode} className="bg-[#E05305] text-white rounded-lg px-4 py-2.5 font-medium hover:bg-[#c84a04] transition">
          Generate Invitation Code
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by email, username, name, or UID..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 flex-1 max-w-md"
          />
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <CardSkeleton rows={3} />
        ) : users.length ? (
          users.map((user) => (
            <div key={user.uid} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{user.displayName || user.email || user.uid}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === "admin" ? "bg-purple-50 text-purple-700" : "bg-slate-50 text-slate-600"}`}>
                      {user.role || "user"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                  {user.username && <p className="text-xs text-slate-500">@{user.username}</p>}
                  <p className="text-xs text-slate-400 font-mono mt-0.5">UID: {user.uid.slice(0, 24)}...</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>Phone: {user.phoneNumber || "—"}</span>
                    {user.inviterEmail && <span>Invited by: {user.inviterEmail}</span>}
                    <span className="capitalize">{user.accountType || (user.isDemoAccount ? "demo" : "main")}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select defaultValue={user.role || "user"} onChange={(e) => updateUser(user.uid, { role: e.target.value })} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white text-slate-900">
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  <input type="number" step="0.01" defaultValue={Number(user.availableBalance || 0)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-28 bg-white text-slate-900" onBlur={(e) => updateUser(user.uid, { availableBalance: e.target.value })} />
                  <select defaultValue={user.accountType || (user.isDemoAccount ? "demo" : "main")} onChange={(e) => updateUser(user.uid, { accountType: e.target.value })} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white text-slate-900">
                    <option value="main">main</option>
                    <option value="demo">demo</option>
                  </select>
                  <select defaultValue={user.accountStatus || "active"} onChange={(e) => updateUser(user.uid, { accountStatus: e.target.value })} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white text-slate-900">
                    <option value="active">active</option>
                    <option value="frozen">frozen</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                    <input type="checkbox" defaultChecked={user.canGenerateMultipleCodes} onChange={(e) => updateUser(user.uid, { canGenerateMultipleCodes: e.target.checked })} className="w-4 h-4 accent-[#E05305]" />
                    <span className="text-slate-600">Multiple Codes</span>
                  </label>
                  {user.accountType !== "demo" && !user.isDemoAccount && (
                    <button onClick={() => createDemoAccount(user)} className="bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-emerald-700 transition">Create Demo</button>
                  )}
                  <button onClick={() => createReferralCodeForUser(user)} className="border border-[#E05305] text-[#E05305] rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-orange-50 transition">Referral Code</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500">No users found.</p>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />

      <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold">Invitation Codes ({invitations.length})</h2>
        </div>
        {invitations.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Used By</th>
                  <th className="py-3 px-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedInvitations.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 text-slate-600 font-mono font-bold tracking-widest">{inv.code}</td>
                    <td className="py-3 px-4 text-slate-600">{inv.createdByEmail || inv.createdByUid?.slice(0, 16) || "Global"}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${inv.usedByUid ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {inv.usedByUid ? "Used" : "Available"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{inv.usedByEmail || "—"}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-6 text-center text-slate-500">No invitation codes generated yet.</p>
        )}
        <Pagination page={invPage} totalPages={totalInvPages} total={invitations.length} onPageChange={setInvPage} />
      </div>
    </div>
  );
}
