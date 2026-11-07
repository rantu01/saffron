"use client";

import { useEffect, useState, useCallback } from "react";
import Pagination from "../components/Pagination";
import { TableSkeleton } from "../components/TableSkeleton";

const ITEMS_PER_PAGE = 20;

export default function AdminLoginHistoryPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [resultFilter, setResultFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(ITEMS_PER_PAGE) });
      if (resultFilter) params.set("result", resultFilter);
      const res = await fetch(`/api/admin/login-history?${params}`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, resultFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Login History</h1>
          <p className="text-sm text-slate-500 mt-0.5">IP and device tracking for account sync/login events</p>
        </div>
        <span className="text-xs text-slate-400">{total} records</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <select
            value={resultFilter}
            onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
          >
            <option value="">All results</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No records found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-4 px-6">When</th>
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">IP</th>
                  <th className="py-4 px-6">User Agent</th>
                  <th className="py-4 px-6">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {entries.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-500">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-900">{e.email || e.uid?.slice(0, 12)}</div>
                      <div className="text-xs text-slate-400 font-mono">{e.uid?.slice(0, 16)}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">{e.ip || "-"}</td>
                    <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">{e.userAgent || "-"}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${e.result === "success" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                        {e.result}
                      </span>
                    </td>
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
