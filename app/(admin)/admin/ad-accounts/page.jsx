"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import { Megaphone, RefreshCw, UserPlus, UserX, ExternalLink, CheckCircle, XCircle, AlertTriangle, Search, X, ChevronDown } from "lucide-react";

export default function AdminAdAccountsPage() {
  const [adAccounts, setAdAccounts] = useState([]);
  const [metaAccounts, setMetaAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [users, setUsers] = useState([]);

  const [assignModal, setAssignModal] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ad-accounts?includeUnassigned=true");
      const data = await res.json();
      if (data.success) setAdAccounts(data.adAccounts || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMetaAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/meta-api/sync?type=meta-accounts");
      const data = await res.json();
      if (data.success) setMetaAccounts(data.accounts || []);
    } catch {}
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) setUsers(data.users || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
    loadMetaAccounts();
    loadUsers();
  }, [loadData, loadMetaAccounts, loadUsers]);

  useEffect(() => {
    function handleClick(e) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const updateAccount = async (_id, updates) => {
    const res = await fetch("/api/admin/ad-accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id, ...updates }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Update failed", text: result.message || "Try again." });
      return;
    }
    await Swal.fire({ icon: "success", title: "Updated", timer: 1000, showConfirmButton: false });
    loadData();
  };

  const deleteAccount = async (_id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete ad account?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Delete",
    });
    if (!isConfirmed) return;
    const res = await fetch(`/api/admin/ad-accounts?id=${_id}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Delete failed", text: result.message || "Try again." });
      return;
    }
    await Swal.fire({ icon: "success", title: "Deleted", timer: 1000, showConfirmButton: false });
    loadData();
  };

  const openAssignModal = () => {
    const unassigned = adAccounts.filter((a) => !a.uid || a.uid === "");
    if (unassigned.length === 0) {
      Swal.fire({ icon: "info", title: "No unassigned accounts", text: "All accounts are already assigned." });
      return;
    }
    setSelectedAccounts([]);
    setSelectedUser(null);
    setUserSearch("");
    setAssignModal(true);
  };

  const toggleAccountSelection = (id) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllUnassigned = () => {
    const unassigned = adAccounts.filter((a) => !a.uid || a.uid === "");
    setSelectedAccounts(unassigned.map((a) => a._id));
  };

  const deselectAll = () => {
    setSelectedAccounts([]);
  };

  const handleAssign = async () => {
    if (selectedAccounts.length === 0) {
      Swal.fire({ icon: "warning", title: "Select accounts", text: "Please select at least one account to assign." });
      return;
    }
    if (!selectedUser) {
      Swal.fire({ icon: "warning", title: "Select user", text: "Please select a user to assign to." });
      return;
    }

    try {
      const res = await fetch("/api/admin/ad-accounts/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountIds: selectedAccounts, uid: selectedUser.uid, assignedBy: "admin" }),
      });
      const data = await res.json();
      if (data.success) {
        await Swal.fire({
          icon: "success",
          title: `${data.assigned} account(s) assigned to ${selectedUser.displayName || selectedUser.email}`,
          timer: 1500,
          showConfirmButton: false,
        });
        setAssignModal(false);
        loadData();
      } else {
        await Swal.fire({ icon: "error", title: "Assign failed", text: data.message });
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const handleUnassign = async (_id, name) => {
    const { isConfirmed } = await Swal.fire({
      title: "Unassign account?",
      text: `Remove "${name}" from current user?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Unassign",
    });
    if (!isConfirmed) return;

    const res = await fetch(`/api/admin/ad-accounts/assign?accountId=${_id}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Unassign failed", text: result.message || "Try again." });
      return;
    }
    await Swal.fire({ icon: "success", title: "Account unassigned", timer: 1200, showConfirmButton: false });
    loadData();
  };

  const handleImportFromMeta = async () => {
    const unimported = metaAccounts.filter(
      (ma) => !adAccounts.some((aa) => aa.metaAccountId === ma.metaAccountId)
    );
    if (unimported.length === 0) {
      await Swal.fire({ icon: "info", title: "No new accounts", text: "All Meta accounts are already imported." });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: `Import ${unimported.length} accounts?`,
      text: "These will be added as unassigned ad accounts.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Import",
    });
    if (!isConfirmed) return;

    let imported = 0;
    let errors = 0;
    for (const ma of unimported) {
      try {
        const res = await fetch("/api/admin/ad-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: ma.name,
            metaAccountId: ma.metaAccountId,
            metaAccountName: ma.name,
            currency: ma.currency,
            spendCap: ma.spendCap,
            budget: ma.spendCap ? ma.spendCap / 100 : 0,
            accountId: ma.metaAccountId,
            status: ma.accountStatus === 1 ? "active" : "paused",
            uid: "",
          }),
        });
        const data = await res.json();
        if (data.success) imported++;
        else errors++;
      } catch {
        errors++;
      }
    }

    await Swal.fire({
      icon: errors > 0 ? "warning" : "success",
      title: `Imported ${imported} accounts${errors > 0 ? `, ${errors} failed` : ""}`,
      timer: 2000,
      showConfirmButton: false,
    });
    loadData();
  };

  const handleSyncSpend = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/meta-api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync-spend" }),
      });
      const data = await res.json();
      if (data.success) {
        await Swal.fire({
          icon: data.errors > 0 ? "warning" : "success",
          title: `Synced: ${data.synced} ok, ${data.errors} errors`,
          timer: 2000,
          showConfirmButton: false,
        });
        loadData();
      } else {
        await Swal.fire({ icon: "error", title: "Sync failed", text: data.message });
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.uid?.toLowerCase().includes(q);
  });

  const unassignedAccounts = adAccounts.filter((a) => !a.uid || a.uid === "");

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const filtered = adAccounts.filter((a) => {
    if (showUnassigned && a.uid) return false;
    if (!showUnassigned && (!a.uid || a.uid === "")) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name?.toLowerCase().includes(q) || a.accountId?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.uid?.toLowerCase().includes(q);
  });

  const totalBudget = adAccounts.reduce((s, a) => s + Number(a.budget || 0), 0);
  const totalSpent = adAccounts.reduce((s, a) => s + Number(a.spent || 0), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Ad Account Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {adAccounts.length} total accounts &middot; ${formatMoney(totalBudget)} total budget &middot; ${formatMoney(totalSpent)} total spent
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleImportFromMeta}
            className="border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <ExternalLink size={15} /> Import from Meta
          </button>
          <button
            onClick={handleSyncSpend}
            disabled={syncing}
            className="border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync Spend"}
          </button>
          <button
            onClick={openAssignModal}
            className="bg-[#E05305] text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#c84a04] transition flex items-center gap-1.5"
          >
            <UserPlus size={15} /> Assign Account
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, account ID, email, or UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white flex-1 max-w-md"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showUnassigned}
              onChange={() => setShowUnassigned(!showUnassigned)}
              className="w-4 h-4 rounded border-slate-300 text-[#E05305] focus:ring-[#E05305]"
            />
            Show unassigned only
          </label>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : filtered.length ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Name / Account ID</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Spent</th>
                  <th className="py-3 px-4">Sync</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((acc) => {
                  const spendPct = acc.budget > 0 ? Math.min((acc.spent / acc.budget) * 100, 100) : 0;
                  return (
                    <tr key={acc._id} className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 max-w-[220px]">
                        <input
                          defaultValue={acc.name || ""}
                          className="border border-transparent hover:border-slate-200 focus:border-blue-400 rounded px-1.5 py-0.5 text-sm font-medium w-full bg-transparent focus:bg-white transition"
                          onBlur={(e) => {
                            if (e.target.value !== acc.name) updateAccount(acc._id, { name: e.target.value });
                          }}
                        />
                        <p className="text-xs font-mono text-blue-600 mt-0.5">{acc.metaAccountId || acc.accountId}</p>
                      </td>
                      <td className="py-3 px-4">
                        {acc.uid ? (
                          <div className="text-xs">
                            <p className="text-slate-900 truncate max-w-[160px]">{acc.email || "\u2014"}</p>
                            <p className="text-slate-400 font-mono">{acc.uid?.slice(0, 20)}...</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          defaultValue={acc.status || "active"}
                          onChange={(e) => updateAccount(acc._id, { status: e.target.value })}
                          className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white"
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number" step="0.01"
                          defaultValue={Number(acc.budget || 0)}
                          className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-24 bg-white"
                          onBlur={(e) => {
                            if (Number(e.target.value) !== Number(acc.budget)) updateAccount(acc._id, { budget: e.target.value });
                          }}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">${formatMoney(acc.spent)}</span>
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${spendPct > 90 ? "bg-red-500" : spendPct > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${spendPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {acc.syncStatus === "synced" ? (
                            <CheckCircle size={14} className="text-emerald-500" />
                          ) : acc.syncStatus === "error" ? (
                            <XCircle size={14} className="text-red-500" />
                          ) : (
                            <AlertTriangle size={14} className="text-amber-400" />
                          )}
                          <span className="text-xs text-slate-400">
                            {acc.lastSyncedAt ? new Date(acc.lastSyncedAt).toLocaleDateString() : "\u2014"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {acc.uid ? (
                            <button
                              onClick={() => handleUnassign(acc._id, acc.name)}
                              className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 p-1.5 rounded-lg transition text-xs font-medium flex items-center gap-1"
                            >
                              <UserX size={13} /> Unassign
                            </button>
                          ) : null}
                          <button
                            onClick={() => deleteAccount(acc._id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
          <Megaphone size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No ad accounts found</p>
          <p className="text-xs text-slate-400 mt-1">
            {showUnassigned ? "No unassigned accounts" : "Go to Meta API settings to fetch accounts from Meta"}
          </p>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Assign Ad Accounts</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Select accounts and choose a user to assign them to
                </p>
              </div>
              <button
                onClick={() => setAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Left: User Selection */}
              <div className="lg:w-2/5 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Select User</h3>
                  <div className="relative" ref={userDropdownRef}>
                    <div
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white flex items-center justify-between cursor-pointer ${
                        selectedUser ? "border-blue-300" : "border-slate-200"
                      }`}
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    >
                      {selectedUser ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#E05305]/10 flex items-center justify-center text-xs font-bold text-[#E05305]">
                            {(selectedUser.displayName || selectedUser.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-slate-900 truncate max-w-[180px]">
                              {selectedUser.displayName || "Unnamed"}
                            </p>
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">{selectedUser.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Search and select a user...</span>
                      )}
                      <ChevronDown size={16} className={`text-slate-400 transition ${userDropdownOpen ? "rotate-180" : ""}`} />
                    </div>

                    {userDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-[300px] flex flex-col">
                        <div className="p-2 border-b border-slate-100">
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search by name, email, or UID..."
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {filteredUsers.length > 0 ? (
                            filteredUsers.map((u) => {
                              const isSelected = selectedUser?.uid === u.uid;
                              return (
                                <button
                                  key={u.uid}
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setUserDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50 transition ${
                                    isSelected ? "bg-[#E05305]/5 border-l-2 border-[#E05305]" : ""
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                    isSelected ? "bg-[#E05305] text-white" : "bg-slate-100 text-slate-600"
                                  }`}>
                                    {(u.displayName || u.email || "U").charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-900 truncate">
                                      {u.displayName || "Unnamed User"}
                                      {u.accountType === "demo" && (
                                        <span className="ml-1.5 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Demo</span>
                                      )}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                    <p className="text-xs text-slate-300 font-mono truncate">{u.uid?.slice(0, 24)}...</p>
                                  </div>
                                  {isSelected && <CheckCircle size={16} className="text-[#E05305] shrink-0" />}
                                </button>
                              );
                            })
                          ) : (
                            <p className="p-4 text-sm text-slate-400 text-center">No users found</p>
                          )}
                        </div>
                        <div className="p-2 border-t border-slate-100 text-xs text-slate-400 text-center">
                          {users.length} total users
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedUser && (
                  <div className="p-4 flex-1">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Selected User</h4>
                    <div className="bg-[#E05305]/5 rounded-xl p-4 border border-[#E05305]/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E05305] flex items-center justify-center text-sm font-bold text-white">
                          {(selectedUser.displayName || selectedUser.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{selectedUser.displayName || "Unnamed"}</p>
                          <p className="text-xs text-slate-500">{selectedUser.email}</p>
                          <p className="text-xs text-slate-400 font-mono">{selectedUser.uid}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <span>Role: <span className="font-medium text-slate-700">{selectedUser.role}</span></span>
                        <span>Balance: <span className="font-medium text-slate-700">${formatMoney(selectedUser.availableBalance)}</span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Account Selection */}
              <div className="lg:w-3/5 flex flex-col">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-700">
                      Select Accounts
                      <span className="ml-2 text-xs text-slate-400 font-normal">{unassignedAccounts.length} unassigned</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAllUnassigned}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Select All
                      </button>
                      <span className="text-xs text-slate-300">|</span>
                      <button
                        onClick={deselectAll}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter accounts..."
                      className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {unassignedAccounts.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {unassignedAccounts.map((acc) => {
                        const isSelected = selectedAccounts.includes(acc._id);
                        return (
                          <label
                            key={acc._id}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${
                              isSelected ? "bg-[#E05305]/5" : "hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAccountSelection(acc._id)}
                              className="w-4 h-4 rounded border-slate-300 text-[#E05305] focus:ring-[#E05305] shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 truncate">{acc.name}</p>
                              <p className="text-xs text-slate-400 font-mono truncate">{acc.metaAccountId || acc.accountId}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-slate-900">${formatMoney(acc.budget)}</p>
                              <p className="text-xs text-slate-400">{acc.currency || "USD"}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Megaphone size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">No unassigned accounts</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {selectedAccounts.length > 0 ? (
                  <span>
                    <span className="font-semibold text-slate-700">{selectedAccounts.length}</span> account(s) selected
                    {selectedUser && (
                      <span>
                        {" "}\u2192{" "}
                        <span className="font-semibold text-slate-700">{selectedUser.displayName || selectedUser.email}</span>
                      </span>
                    )}
                  </span>
                ) : (
                  <span>Select accounts and a user to assign</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAssignModal(false)}
                  className="border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={selectedAccounts.length === 0 || !selectedUser}
                  className="bg-[#E05305] text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-[#c84a04] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <UserPlus size={16} />
                  Assign to User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
