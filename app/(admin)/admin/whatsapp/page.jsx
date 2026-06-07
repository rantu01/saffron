"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { MessageSquare, Send, CheckCircle, XCircle, Clock, Settings, Phone, Bell, AlertTriangle } from "lucide-react";

export default function WhatsAppSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("settings");

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp");
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/logs");
      const data = await res.json();
      if (data.success) setLogs(data.logs || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadSettings();
    loadLogs();
  }, [loadSettings, loadLogs]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const form = e.target;

    const payload = {
      enabled: form.enabled.checked,
      phoneNumberId: form.phoneNumberId.value.trim(),
      businessAccountId: form.businessAccountId.value.trim(),
      accessToken: form.accessToken.value.trim(),
      notifyOnDeposit: form.notifyDeposit.checked,
      notifyOnWithdrawal: form.notifyWithdrawal.checked,
      notifyOnTaskComplete: form.notifyTask.checked,
      notifyOnBalanceFreeze: form.notifyFreeze.checked,
    };

    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        await Swal.fire({ icon: "success", title: "Settings saved", timer: 1000, showConfirmButton: false });
        loadSettings();
      } else {
        await Swal.fire({ icon: "error", title: "Failed", text: data.message });
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Send Test WhatsApp Message",
      html: `
        <div style="text-align:left;margin-bottom:8px;font-size:13px;color:#475569;">Phone Number (with country code)</div>
        <input id="swal-phone" class="swal2-input" placeholder="+8801XXXXXXXXX" style="width:100%">
        <div style="text-align:left;margin-bottom:8px;margin-top:12px;font-size:13px;color:#475569;">Message</div>
        <textarea id="swal-msg" class="swal2-input" rows="3" placeholder="Type your test message..." style="width:100%"></textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Send",
      preConfirm: () => {
        const phone = document.getElementById("swal-phone").value.trim();
        const message = document.getElementById("swal-msg").value.trim();
        if (!phone) { Swal.showValidationMessage("Phone is required"); return false; }
        if (!message) { Swal.showValidationMessage("Message is required"); return false; }
        return { phone, message };
      },
    });

    if (!formValues) return;

    try {
      const res = await fetch("/api/admin/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });
      const data = await res.json();
      if (data.success) {
        await Swal.fire({ icon: "success", title: "Message sent!", timer: 1500, showConfirmButton: false });
        loadLogs();
      } else {
        await Swal.fire({ icon: "error", title: "Send failed", text: data.error || data.message });
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const formatTime = (d) => (d ? new Date(d).toLocaleString() : "\u2014");

  if (loading) {
    return <p className="text-slate-500">Loading WhatsApp Settings...</p>;
  }

  const tabs = [
    { id: "settings", label: "Settings", icon: Settings },
    { id: "logs", label: `Notification Logs (${logs.length})`, icon: Clock },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">WhatsApp Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure WhatsApp Business API for sending notifications to users
          </p>
        </div>
        <button
          onClick={handleTestSend}
          className="border border-slate-200 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition flex items-center gap-2"
        >
          <Send size={16} /> Send Test Message
        </button>
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
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={settings?.enabled || false}
                  className="w-5 h-5 rounded border-slate-300 text-[#E05305] focus:ring-[#E05305]"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-700">Enable WhatsApp Notifications</span>
                  <p className="text-xs text-slate-400">Master toggle for all WhatsApp notifications</p>
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Phone size={16} /> API Configuration
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number ID</label>
                <input
                  name="phoneNumberId"
                  defaultValue={settings?.phoneNumberId || ""}
                  placeholder="123456789012345"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  WhatsApp Business API Phone Number ID (from Meta Business Settings)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Account ID (WABA ID)</label>
                <input
                  name="businessAccountId"
                  defaultValue={settings?.businessAccountId || ""}
                  placeholder="123456789012345"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Access Token
                  {settings?.hasAccessToken && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle size={12} /> Configured
                    </span>
                  )}
                </label>
                <textarea
                  name="accessToken"
                  rows={2}
                  placeholder="EAAx... (Permanent WhatsApp Access Token)"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  defaultValue=""
                />
                <p className="text-xs text-slate-400 mt-1">
                  Permanent access token from Meta System User with{" "}
                  <code className="bg-slate-100 px-1 rounded">whatsapp_business_messaging</code> and{" "}
                  <code className="bg-slate-100 px-1 rounded">whatsapp_business_management</code> permissions.
                  Leave blank to keep existing.
                </p>
              </div>
            </div>

            <hr className="border-slate-200" />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Bell size={16} /> Notification Triggers
              </h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notifyDeposit"
                  defaultChecked={settings?.notifyOnDeposit ?? true}
                  className="w-4 h-4 rounded border-slate-300 text-[#E05305] focus:ring-[#E05305]"
                />
                <span className="text-sm text-slate-700">Deposit Approved / Rejected</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notifyWithdrawal"
                  defaultChecked={settings?.notifyOnWithdrawal ?? true}
                  className="w-4 h-4 rounded border-slate-300 text-[#E05305] focus:ring-[#E05305]"
                />
                <span className="text-sm text-slate-700">Withdrawal Approved / Rejected</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notifyTask"
                  defaultChecked={settings?.notifyOnTaskComplete ?? true}
                  className="w-4 h-4 rounded border-slate-300 text-[#E05305] focus:ring-[#E05305]"
                />
                <span className="text-sm text-slate-700">Task Completed</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notifyFreeze"
                  defaultChecked={settings?.notifyOnBalanceFreeze ?? true}
                  className="w-4 h-4 rounded border-slate-300 text-[#E05305] focus:ring-[#E05305]"
                />
                <span className="text-sm text-slate-700">Account Frozen (Balance Requirement)</span>
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

      {activeTab === "logs" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {logs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {logs.map((log, i) => (
                <div key={log._id || i} className="p-4 hover:bg-slate-50/40">
                  <div className="flex items-start gap-3">
                    {log.type === "sent" ? (
                      <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    ) : log.type === "error" ? (
                      <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    ) : log.type === "skipped" ? (
                      <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                    ) : (
                      <Clock size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          log.type === "sent" ? "bg-emerald-50 text-emerald-700" :
                          log.type === "error" ? "bg-red-50 text-red-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {log.type}
                        </span>
                        <span className="text-xs text-slate-400">{formatTime(log.createdAt)}</span>
                        {log.phone && (
                          <span className="text-xs font-mono text-slate-500">{log.phone}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 mt-1 break-words">{log.message}</p>
                      {log.reason && (
                        <p className="text-xs text-red-500 mt-0.5">{log.reason}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <MessageSquare size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No notification logs yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Notifications will appear here after configuring and enabling WhatsApp
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
