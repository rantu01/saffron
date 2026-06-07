"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { RefreshCw, CheckCircle, XCircle, Clock, Database, AlertTriangle, Settings, ExternalLink } from "lucide-react";

export default function MetaApiSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionTest, setConnectionTest] = useState(null);
  const [metaAccounts, setMetaAccounts] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/meta-api");
      const data = await res.json();
      if (data.success) setSettings(data.settings);
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

  const loadSyncLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/meta-api/sync?type=logs");
      const data = await res.json();
      if (data.success) setSyncLogs(data.logs || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadSettings();
    loadMetaAccounts();
    loadSyncLogs();
  }, [loadSettings, loadMetaAccounts, loadSyncLogs]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const form = e.target;
    const payload = {
      businessManagerId: form.bmId.value.trim(),
      appId: form.appId.value.trim(),
      accessToken: form.accessToken.value.trim(),
      autoSpendCapUpdate: form.autoCap.checked,
      autoSyncEnabled: form.autoSync.checked,
    };

    try {
      const res = await fetch("/api/admin/meta-api", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setConnectionTest(data.connectionTest || null);
        await Swal.fire({ icon: "success", title: "Settings saved", timer: 1000, showConfirmButton: false });
        loadSettings();
        if (data.connectionTest?.success) loadMetaAccounts();
      } else {
        await Swal.fire({ icon: "error", title: "Failed", text: data.message });
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleFetchAccounts = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/meta-api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch-accounts" }),
      });
      const data = await res.json();
      if (data.success) {
        await Swal.fire({ icon: "success", title: `Fetched ${data.count} accounts`, timer: 1500, showConfirmButton: false });
        loadMetaAccounts();
        loadSyncLogs();
      } else {
        await Swal.fire({ icon: "error", title: "Failed", text: data.message });
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setSyncing(false);
    }
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
          title: `Sync done: ${data.synced} synced, ${data.errors} errors`,
          timer: 2000,
          showConfirmButton: false,
        });
        loadSyncLogs();
      } else {
        await Swal.fire({ icon: "error", title: "Sync failed", text: data.message });
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/meta-api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test-connection" }),
      });
      const data = await res.json();
      setConnectionTest(data.connectionTest || { success: false, message: data.message });
    } catch (err) {
      setConnectionTest({ success: false, message: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const formatTime = (d) => d ? new Date(d).toLocaleString() : "—";

  if (loading) {
    return <p className="text-slate-500">Loading Meta API Settings...</p>;
  }

  const tabs = [
    { id: "settings", label: "Settings", icon: Settings },
    { id: "accounts", label: `Meta Accounts (${metaAccounts.length})`, icon: Database },
    { id: "logs", label: `Sync Logs (${syncLogs.length})`, icon: Clock },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Meta API Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configure Meta (Facebook) Marketing API integration</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === t.id ? "bg-[#E05305] text-white shadow" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "settings" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Manager ID</label>
              <input
                name="bmId"
                defaultValue={settings?.businessManagerId || ""}
                placeholder="123456789012345"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">Your Meta Business Manager ID (found in Business Settings)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">App ID</label>
              <input
                name="appId"
                defaultValue={settings?.appId || ""}
                placeholder="123456789012345"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Access Token
                {settings?.hasAccessToken && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle size={12} /> Configured
                  </span>
                )}
              </label>
              <textarea
                name="accessToken"
                rows={3}
                placeholder="EAAx... (System User or Long-lived User Access Token)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                defaultValue=""
              />
              <p className="text-xs text-slate-400 mt-1">
                System User access token with ads_read and ads_management permissions. Leave blank to keep existing.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={syncing}
                className="border border-slate-200 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50"
              >
                {syncing ? "Testing..." : "Test Connection"}
              </button>
            </div>

            {connectionTest && (
              <div className={`rounded-lg p-4 text-sm ${
                connectionTest.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
              }`}>
                <div className="flex items-center gap-2 font-medium mb-1">
                  {connectionTest.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {connectionTest.success ? "Connection Successful" : "Connection Failed"}
                </div>
                <p className="text-xs opacity-80">{connectionTest.message}</p>
              </div>
            )}

            <hr className="border-slate-200" />

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="autoCap"
                  defaultChecked={settings?.autoSpendCapUpdate || false}
                  className="w-4 h-4 rounded border-slate-300 text-[#E05305] focus:ring-[#E05305]"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">Auto Spending Limit Cap Update</span>
                  <p className="text-xs text-slate-400">Automatically increase spend cap when 95% of budget is reached</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="autoSync"
                  defaultChecked={settings?.autoSyncEnabled || false}
                  className="w-4 h-4 rounded border-slate-300 text-[#E05305] focus:ring-[#E05305]"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">Auto Sync (Not Implemented)</span>
                  <p className="text-xs text-slate-400">Enable automatic periodic sync (requires cron job or serverless function)</p>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#E05305] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#c84a04] transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "accounts" && (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={handleFetchAccounts}
              disabled={syncing}
              className="bg-[#E05305] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#c84a04] transition disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Fetching..." : "Fetch from Meta BM"}
            </button>
            <button
              onClick={handleSyncSpend}
              disabled={syncing}
              className="border border-slate-200 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Sync Spend Data"}
            </button>
            <span className="text-xs text-slate-400">{metaAccounts.length} accounts from Meta</span>
          </div>

          {metaAccounts.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Account Name</th>
                      <th className="py-3 px-4">Meta Account ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Currency</th>
                      <th className="py-3 px-4">Balance</th>
                      <th className="py-3 px-4">Spend Cap</th>
                      <th className="py-3 px-4">Amount Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {metaAccounts.map((acc, i) => (
                      <tr key={acc.metaAccountId || i} className="hover:bg-slate-50/40">
                        <td className="py-3 px-4 font-medium max-w-[200px] truncate">{acc.name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-blue-600">{acc.metaAccountId}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            acc.accountStatus === 1 ? "bg-emerald-50 text-emerald-700" :
                            acc.accountStatus === 2 ? "bg-amber-50 text-amber-700" :
                            "bg-red-50 text-red-700"
                          }`}>
                            {acc.accountStatus === 1 ? "Active" : acc.accountStatus === 2 ? "Disabled" : `Status ${acc.accountStatus}`}
                          </span>
                        </td>
                        <td className="py-3 px-4">{acc.currency}</td>
                        <td className="py-3 px-4">${(acc.balance / 100).toLocaleString()}</td>
                        <td className="py-3 px-4">${(acc.spendCap / 100).toLocaleString()}</td>
                        <td className="py-3 px-4">${(acc.amountSpent / 100).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
              <Database size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No Meta accounts fetched yet</p>
              <p className="text-xs text-slate-400 mt-1">Click "Fetch from Meta BM" to import ad accounts</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "logs" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {syncLogs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {syncLogs.map((log, i) => (
                <div key={log._id || i} className="p-4 hover:bg-slate-50/40">
                  <div className="flex items-center gap-2 mb-1">
                    {log.type === "success" ? (
                      <CheckCircle size={14} className="text-emerald-500" />
                    ) : log.type === "warning" ? (
                      <AlertTriangle size={14} className="text-amber-500" />
                    ) : log.type === "error" ? (
                      <XCircle size={14} className="text-red-500" />
                    ) : (
                      <Clock size={14} className="text-blue-500" />
                    )}
                    <span className="text-xs text-slate-400">{formatTime(log.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-700 ml-6">{log.message}</p>
                  {log.details?.errors?.length > 0 && (
                    <div className="ml-6 mt-1 text-xs text-red-500 space-y-0.5">
                      {log.details.errors.slice(0, 3).map((e, j) => (
                        <p key={j}>{e}</p>
                      ))}
                    </div>
                  )}
                  {log.details?.duration && (
                    <p className="ml-6 mt-1 text-xs text-slate-400">Duration: {log.duration}ms</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <Clock size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No sync logs yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
