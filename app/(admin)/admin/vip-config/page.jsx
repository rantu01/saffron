"use client";

import { useEffect, useState, useCallback } from "react";
import { Crown, Plus, Upload, CheckCircle2 } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminVipConfigPage() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [levelsJson, setLevelsJson] = useState(
    JSON.stringify(
      [
        { level: 1, unlockBalance: 0, name: "VIP 1", label: "Bronze", profitIncrease: 0.5, tasksPerSet: 20, dailyGroupLimit: 3 },
        { level: 2, unlockBalance: 1500, name: "VIP 2", label: "Silver", profitIncrease: 2, tasksPerSet: 25, dailyGroupLimit: 3 },
        { level: 3, unlockBalance: 5000, name: "VIP 3", label: "Gold", profitIncrease: 6, tasksPerSet: 30, dailyGroupLimit: 3 },
        { level: 4, unlockBalance: 10000, name: "VIP 4", label: "Diamond", profitIncrease: 12, tasksPerSet: 40, dailyGroupLimit: 3 },
      ],
      null,
      2
    )
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vip/config");
      const data = await res.json();
      if (data.success) setVersions(data.versions || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    let levels;
    try {
      levels = JSON.parse(levelsJson);
    } catch {
      Swal.fire({ icon: "error", title: "Invalid JSON", text: "Levels must be valid JSON." });
      return;
    }
    if (!Array.isArray(levels) || levels.length === 0) {
      Swal.fire({ icon: "error", title: "Invalid levels", text: "Provide a non-empty array." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/vip/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levels, note }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        Swal.fire({ icon: "error", title: "Failed", text: data.message || "Could not create version." });
        return;
      }
      Swal.fire({ icon: "success", title: "Draft created", timer: 1200, showConfirmButton: false });
      setShowForm(false);
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const publish = async (id) => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "Publish this VIP configuration?",
      text: "It will become the active configuration. Previous published version will be archived.",
      showCancelButton: true,
      confirmButtonText: "Publish",
    });
    if (!confirm.isConfirmed) return;
    const res = await fetch(`/api/admin/vip/config/${id}/publish`, { method: "POST" });
    const data = await res.json();
    if (!res.ok || !data.success) {
      Swal.fire({ icon: "error", title: "Failed", text: data.message || "Could not publish." });
      return;
    }
    Swal.fire({ icon: "success", title: "Published", timer: 1200, showConfirmButton: false });
    load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Crown className="w-7 h-7 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold">VIP Configuration</h1>
          <p className="text-sm text-slate-500">Versioned VIP matrix (values supplied by business). Published version becomes active.</p>
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 bg-[#E05305] hover:bg-[#c84a04] text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> New Version
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="mb-6 border border-slate-200 rounded-xl p-4 bg-white space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Levels (JSON)</label>
            <textarea
              value={levelsJson}
              onChange={(e) => setLevelsJson(e.target.value)}
              rows={16}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="bg-[#E05305] hover:bg-[#c84a04] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {submitting ? "Saving..." : "Save Draft"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-slate-400 py-10">Loading…</div>
      ) : versions.length === 0 ? (
        <div className="text-center text-slate-400 py-10">No versions yet.</div>
      ) : (
        <div className="space-y-3">
          {versions.map((v) => (
            <div key={v._id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">VIP Config Version</p>
                <p className="text-xs text-slate-500">Status: {v.status} · Levels: {Array.isArray(v.levels) ? v.levels.length : 0} · Created: {v.createdAt ? new Date(v.createdAt).toLocaleString() : "—"}</p>
                {v.note && <p className="text-xs text-slate-400 mt-1">{v.note}</p>}
              </div>
              <div className="flex gap-2">
                {v.status !== "published" && (
                  <button onClick={() => publish(v._id)} className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                    <Upload size={14} /> Publish
                  </button>
                )}
                {v.status === "published" && (
                  <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle2 size={14} /> Published
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}