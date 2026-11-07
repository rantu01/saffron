"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Plus, Upload, CheckCircle2 } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminTermsPage() {
  const [versions, setVersions] = useState([]);
  const [acceptances, setAcceptances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("versions");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ version: "", content: "", effectiveFrom: "", language: "en" });
  const [submitting, setSubmitting] = useState(false);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/terms/versions");
      const data = await res.json();
      if (data.success) setVersions(data.versions || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAcceptances = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/terms/acceptances");
      const data = await res.json();
      if (data.success) setAcceptances(data.entries || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "versions") loadVersions();
    else loadAcceptances();
  }, [tab, loadVersions, loadAcceptances]);

  const createVersion = async (e) => {
    e.preventDefault();
    if (!form.version.trim() || !form.content.trim()) {
      Swal.fire({ icon: "error", title: "Missing fields", text: "Version and content are required." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/terms/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: form.version.trim(),
          content: form.content,
          effectiveFrom: form.effectiveFrom || null,
          status: "draft",
          language: form.language,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        Swal.fire({ icon: "error", title: "Failed", text: data.message || "Could not create version." });
        return;
      }
      Swal.fire({ icon: "success", title: "Draft created", timer: 1200, showConfirmButton: false });
      setForm({ version: "", content: "", effectiveFrom: "" });
      setShowForm(false);
      loadVersions();
    } finally {
      setSubmitting(false);
    }
  };

  const publish = async (id) => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "Publish this version?",
      text: "It will become the active Terms & Conditions. Previous published version will be archived.",
      showCancelButton: true,
      confirmButtonText: "Publish",
    });
    if (!confirm.isConfirmed) return;
    const res = await fetch(`/api/admin/terms/versions/${id}/publish`, { method: "POST" });
    const data = await res.json();
    if (!res.ok || !data.success) {
      Swal.fire({ icon: "error", title: "Failed", text: data.message || "Could not publish." });
      return;
    }
    Swal.fire({ icon: "success", title: "Published", timer: 1200, showConfirmButton: false });
    loadVersions();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-7 h-7 text-[#E05305]" />
        <div>
          <h1 className="text-2xl font-bold">Terms & Conditions</h1>
          <p className="text-sm text-slate-500">Manage versioned terms content and view acceptances.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 border-b border-slate-200">
        {[
          { id: "versions", label: "Versions" },
          { id: "acceptances", label: "Acceptances" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t.id ? "border-[#E05305] text-[#E05305]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "versions" && (
        <>
          <div className="mb-4">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 bg-[#E05305] hover:bg-[#c84a04] text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus size={16} /> New Version
            </button>
          </div>

          {showForm && (
            <form onSubmit={createVersion} className="mb-6 border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Version</label>
                <input
                  value={form.version}
                  onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))}
                  placeholder="e.g. 1.0"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Effective from (optional)</label>
                <input
                  type="date"
                  value={form.effectiveFrom}
                  onChange={(e) => setForm((p) => ({ ...p, effectiveFrom: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  rows={12}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
                  placeholder="Terms content..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#E05305] hover:bg-[#c84a04] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Draft"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
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
                    <p className="font-semibold text-slate-900">Version {v.version}</p>
                    <p className="text-xs text-slate-500">Status: {v.status} · Effective: {v.effectiveFrom ? new Date(v.effectiveFrom).toLocaleDateString() : "—"}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{String(v.content || "").slice(0, 120)}</p>
                  </div>
                  <div className="flex gap-2">
                    {v.status !== "published" && (
                      <button
                        onClick={() => publish(v._id)}
                        className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                      >
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
        </>
      )}

      {tab === "acceptances" && (
        loading ? (
          <div className="text-center text-slate-400 py-10">Loading…</div>
        ) : acceptances.length === 0 ? (
          <div className="text-center text-slate-400 py-10">No acceptances recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">UID</th>
                  <th className="px-3 py-2 text-left">Version</th>
                  <th className="px-3 py-2 text-left">Accepted At</th>
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-left">IP</th>
                </tr>
              </thead>
              <tbody>
                {acceptances.map((a) => (
                  <tr key={a._id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs">{a.uid}</td>
                    <td className="px-3 py-2">{a.version}</td>
                    <td className="px-3 py-2">{a.acceptedAt ? new Date(a.acceptedAt).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2">{a.source}</td>
                    <td className="px-3 py-2 text-xs">{a.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}