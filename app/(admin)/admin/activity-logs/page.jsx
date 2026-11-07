"use client";

import { useEffect, useState, useCallback } from "react";
import Pagination from "../components/Pagination";
import { TableSkeleton } from "../components/TableSkeleton";

const ITEMS_PER_PAGE = 20;

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(ITEMS_PER_PAGE) });
      if (actionFilter) params.set("action", actionFilter);
      if (targetTypeFilter) params.set("targetType", targetTypeFilter);
      const res = await fetch(`/api/admin/activity-logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, targetTypeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Activity Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Append-only record of administrative actions</p>
        </div>
        <span className="text-xs text-slate-400">{total} records</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Action (e.g. user.update)"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
          />
          <input
            type="text"
            placeholder="Target type (e.g. user)"
            value={targetTypeFilter}
            onChange={(e) => { setTargetTypeFilter(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No records found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-4 px-6">When</th>
                  <th className="py-4 px-6">Actor</th>
                  <th className="py-4 px-6">Action</th>
                  <th className="py-4 px-6">Target</th>
                  <th className="py-4 px-6">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-900">{log.actorEmail || log.actorUid?.slice(0, 12)}</div>
                      <div className="text-xs text-slate-400">{log.actorRole}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-700">{log.action}</td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      {log.targetType}{log.targetId ? `:${log.targetId.slice(0, 12)}` : ""}
                    </td>
                    <td className="py-4 px-6 text-slate-600 max-w-xs truncate">{log.reason || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
