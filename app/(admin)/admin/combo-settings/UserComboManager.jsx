"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  RotateCcw,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const money = (v) =>
  Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const emptyForm = {
  enabled: true,
  position: "",
  targetNegativeBalance: "",
  commissionPercent: "",
};

export default function UserComboManager() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/combo-config/users?search=${encodeURIComponent(debounced)}&page=${page}&limit=10`
      );
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debounced, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openUser = async (user) => {
    setSelected(user);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/combo-config/user?uid=${encodeURIComponent(user.uid)}`);
      const data = await res.json();
      if (data.success) {
        setDetail(data);
        const s = data.settings;
        setForm(
          s
            ? {
                enabled: s.enabled !== false,
                position: s.position ?? "",
                targetNegativeBalance: s.targetNegativeBalance ?? "",
                commissionPercent: s.commissionPercent ?? "",
              }
            : { ...emptyForm }
        );
      } else {
        Swal.fire({ icon: "error", title: "Error", text: data.message || "Failed to load user." });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load user details." });
    } finally {
      setDetailLoading(false);
    }
  };

  const closePanel = () => {
    setSelected(null);
    setDetail(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!selected) return;

    const settings = {
      enabled: form.enabled,
      position: form.position ? Number(form.position) : null,
      targetNegativeBalance: form.targetNegativeBalance !== "" ? Number(form.targetNegativeBalance) : null,
      commissionPercent: form.commissionPercent !== "" ? Number(form.commissionPercent) : null,
    };

    if (settings.position && (settings.position < 1 || settings.position > 40)) {
      Swal.fire({ icon: "error", title: "Invalid", text: "Task number must be between 1 and 40." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/combo-config/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: selected.uid, settings }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: "success", title: "Saved", text: "Per-user combo settings saved." });
        await loadUsers();
        await openUser(selected);
      } else {
        Swal.fire({ icon: "error", title: "Error", text: data.message || "Failed to save." });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selected) return;
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Reset to defaults?",
      text: "This removes the per-user combo configuration and reverts to global settings.",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Yes, reset",
    });
    if (!confirm.isConfirmed) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/combo-config/user?uid=${encodeURIComponent(selected.uid)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: "success", title: "Reset", text: "Reverted to global settings." });
        setForm({ ...emptyForm });
        await loadUsers();
        await openUser(selected);
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-[#E05305]" />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">User Management</h3>
          <p className="text-xs text-slate-500">
            Search users and configure combo tasks on a per-user basis.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-[#E05305]">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, UID, or group name..."
          className="flex-1 appearance-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        {loading && <span className="text-xs text-slate-400">Loading...</span>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
              <th className="py-2 pr-3 font-semibold">User</th>
              <th className="py-2 px-3 font-semibold">Group</th>
              <th className="py-2 px-3 font-semibold">Combo</th>
              <th className="py-2 pl-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400 text-sm">
                  No users found.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.uid} className="border-b border-slate-50 hover:bg-slate-50/60">
                <td className="py-2.5 pr-3">
                  <div className="font-medium text-slate-800">{u.displayName || "N/A"}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                  <div className="text-[10px] text-slate-300 truncate max-w-[160px]">{u.uid}</div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-xs text-slate-600">
                    {u.currentGroup?.groupName || "—"}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  {u.comboSettings ? (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        u.comboSettings.enabled !== false
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {u.comboSettings.enabled !== false ? "Custom · On" : "Custom · Off"}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Global</span>
                  )}
                  {u.hasActiveCombo && (
                    <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                      Active
                    </span>
                  )}
                </td>
                <td className="py-2.5 pl-3 text-right">
                  <button
                    onClick={() => openUser(u)}
                    className="text-xs font-semibold text-[#E05305] hover:text-[#c84a04]"
                  >
                    Configure
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-400">
          {total} user{total === 1 ? "" : "s"} · Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detail / Config Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[92dvh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selected.displayName || "User"}</h3>
                <p className="text-xs text-slate-400">{selected.email}</p>
              </div>
              <button onClick={closePanel} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              {detailLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-16 bg-slate-100 rounded-xl" />
                  <div className="h-40 bg-slate-100 rounded-xl" />
                </div>
              ) : detail ? (
                <>
                  {/* Current status */}
                  <div className="grid grid-cols-2 gap-2">
                    <InfoCard label="Current Group" value={detail.currentGroup?.groupName || "—"} />
                    <InfoCard
                      label="Set / Progress"
                      value={
                        detail.currentSet
                          ? (() => {
                              const total = detail.currentSet.totalTasks || 40;
                              const completed = detail.currentSet.completedTasks || 0;
                              const prog = completed >= total ? total : Math.min(completed, total);
                              return `Set ${detail.currentSet.setNumber} · ${prog}/${total}`;
                            })()
                          : "—"
                      }
                    />
                    <InfoCard label="Account Type" value={detail.user.accountType} />
                    <InfoCard label="Combo Stage" value={String(detail.user.comboStage)} />
                    <InfoCard label="Balance" value={`$${money(detail.user.availableBalance)}`} />
                    <InfoCard label="Frozen" value={`$${money(detail.user.frozenBalance)}`} />
                  </div>

                  {/* Combo status */}
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Layers className="w-4 h-4 text-[#E05305]" />
                      <span className="text-xs font-semibold text-slate-700">Combo Task Status</span>
                    </div>
                    {detail.activeCombo ? (
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <p>
                          Status:{" "}
                          <span className="font-semibold text-amber-600">
                            {detail.activeCombo.status}
                          </span>{" "}
                           · Position {Math.max(1, (detail.activeCombo.position || 1) - 1)} · Set {detail.activeCombo.setNumber}
                        </p>
                        <p>
                          Orders: {detail.activeCombo.orders?.length || 0} · Required $
                          {money(detail.activeCombo.totalRequiredAmount)} · Commission $
                          {money(detail.activeCombo.totalCommission)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        No active combo task. ({detail.comboHistoryCount} historical)
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      Applied config:{" "}
                      {detail.settings ? (
                        <span className="text-emerald-600 font-medium">Per-user override</span>
                      ) : (
                        <span className="text-slate-500 font-medium">Global defaults</span>
                      )}
                    </p>
                  </div>

                  {/* Per-user config form */}
                  <div className="border border-slate-200 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">
                        Per-User Combo Configuration
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.enabled}
                          onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E05305]" />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      {form.enabled ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Combo active for this
                          user
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-slate-400" /> Combo disabled for this user
                        </>
                      )}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Appear at task #"
                        hint="Task number (1-40)"
                      >
                        <input
                          type="number"
                          min="1"
                          max="40"
                          value={form.position}
                          onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                          placeholder={String(detail.defaults?.positions?.[0] ?? 8)}
                          className="w-full appearance-none border border-slate-200 rounded-lg bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E05305]"
                        />
                      </Field>
                      <Field
                        label="Target negative balance"
                        hint="Final wallet balance after combo"
                      >
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={form.targetNegativeBalance}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, targetNegativeBalance: e.target.value }))
                          }
                          placeholder="0"
                          className="w-full appearance-none border border-slate-200 rounded-lg bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E05305]"
                        />
                      </Field>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                      <p className="font-semibold text-slate-700">Auto-generated combo preview</p>
                      {(() => {
                        const target = Number(form.targetNegativeBalance) || 0;
                        const balance = Number(detail.user?.availableBalance || 0);
                        const minOrders = detail.defaults?.minOrders ?? 2;
                        const maxOrders = detail.defaults?.maxOrders ?? 5;
                        const total = Math.max(0, balance + target);
                        return (
                          <p>
                            Wallet balance: <span className="font-semibold">${money(balance)}</span> ·
                            Target: <span className="font-semibold text-rose-600">-${money(target)}</span> ·
                            Total required: <span className="font-semibold">${money(total)}</span> ·
                            Split into {minOrders === maxOrders ? minOrders : `${minOrders}-${maxOrders}`} orders.
                          </p>
                        );
                      })()}
                    </div>

                    <Field label="Commission %" hint="Leave blank for global default">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={form.commissionPercent}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, commissionPercent: e.target.value }))
                        }
                        placeholder={`${detail.defaults?.commissionPercent ?? 5}`}
                        className="w-full appearance-none border border-slate-200 rounded-lg bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E05305]"
                      />
                    </Field>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2 p-4 border-t border-slate-100 shrink-0">
              <button
                onClick={handleReset}
                disabled={saving || !detail?.settings}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-500 disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to global
              </button>
              <button
                onClick={handleSave}
                disabled={saving || detailLoading}
                className="flex items-center gap-2 bg-[#E05305] text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-[#c84a04] transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2">
      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-xs font-semibold text-slate-800 truncate">{value}</p>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}
