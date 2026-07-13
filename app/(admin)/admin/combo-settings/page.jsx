"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { Layers, Plus, X, Save, Search, Trash2 } from "lucide-react";
import UserComboManager from "./UserComboManager";

export default function ComboSettingsPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    enabled: true,
    probability: 0.25,
    minOrders: 2,
    maxOrders: 5,
    commissionPercent: 5,
    positions: [8, 18, 27],
    demoPositions: [],
    mainPositions: [],
    userPositionOverrides: {},
    targetNegativeBalance: 0,
    progressionLevels: [
      { level: 1, minAmountPerOrder: 20, maxAmountPerOrder: 100 },
    ],
  });

  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [overrideInputs, setOverrideInputs] = useState({});

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/combo-config");
      const data = await res.json();
      if (data?.success && data?.config) {
        setConfig(data.config);
        setForm({
          enabled: data.config.enabled ?? true,
          probability: data.config.probability ?? 0.25,
          minOrders: data.config.minOrders ?? 2,
          maxOrders: data.config.maxOrders ?? 5,
          commissionPercent: data.config.commissionPercent ?? 5,
          positions: data.config.positions || [8, 18, 27],
          demoPositions: data.config.demoPositions || [],
          mainPositions: data.config.mainPositions || [],
          userPositionOverrides: data.config.userPositionOverrides || {},
          targetNegativeBalance: data.config.targetNegativeBalance || 0,
          progressionLevels: data.config.progressionLevels || [
            { level: 1, minAmountPerOrder: 20, maxAmountPerOrder: 100 },
          ],
        });
        const inputs = {};
        for (const uid of Object.keys(data.config.userPositionOverrides || {})) {
          inputs[uid] = (data.config.userPositionOverrides[uid] || []).join(", ");
        }
        setOverrideInputs(inputs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.users || []);
        setShowResults(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearch) searchUsers(userSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, searchUsers]);

  const addOverride = (user) => {
    if (form.userPositionOverrides[user.uid]) {
      Swal.fire({ icon: "info", title: "Already Exists", text: `${user.email} already has a position override.` });
      return;
    }
    setForm((prev) => ({
      ...prev,
      userPositionOverrides: { ...prev.userPositionOverrides, [user.uid]: [] },
    }));
    setOverrideInputs((prev) => ({ ...prev, [user.uid]: "" }));
    setUserSearch("");
    setSearchResults([]);
    setShowResults(false);
  };

  const removeOverride = (uid) => {
    const { [uid]: _, ...rest } = form.userPositionOverrides;
    const { [uid]: __, ...restInputs } = overrideInputs;
    setForm((prev) => ({ ...prev, userPositionOverrides: rest }));
    setOverrideInputs(restInputs);
  };

  const updateOverridePositions = (uid, value) => {
    const vals = value.split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v >= 1 && v <= 30);
    setOverrideInputs((prev) => ({ ...prev, [uid]: value }));
    setForm((prev) => ({
      ...prev,
      userPositionOverrides: { ...prev.userPositionOverrides, [uid]: vals },
    }));
  };

  const addProgressionLevel = () => {
    const nextLevel = (form.progressionLevels.length || 0) + 1;
    setForm((prev) => ({
      ...prev,
      progressionLevels: [
        ...prev.progressionLevels,
        { level: nextLevel, minAmountPerOrder: 100, maxAmountPerOrder: 500 },
      ],
    }));
  };

  const removeProgressionLevel = (index) => {
    setForm((prev) => ({
      ...prev,
      progressionLevels: prev.progressionLevels.filter((_, i) => i !== index),
    }));
  };

  const updateProgressionLevel = (index, field, value) => {
    setForm((prev) => {
      const levels = [...prev.progressionLevels];
      levels[index] = { ...levels[index], [field]: Number(value) };
      return { ...prev, progressionLevels: levels };
    });
  };

  const handleSave = async () => {
    if (form.minOrders < 2 || form.minOrders > 5) {
      Swal.fire({ icon: "error", title: "Invalid", text: "Min orders must be between 2 and 5." });
      return;
    }
    if (form.maxOrders < 2 || form.maxOrders > 5) {
      Swal.fire({ icon: "error", title: "Invalid", text: "Max orders must be between 2 and 5." });
      return;
    }
    if (form.minOrders > form.maxOrders) {
      Swal.fire({ icon: "error", title: "Invalid", text: "Min orders cannot exceed max orders." });
      return;
    }
    if (form.probability < 0 || form.probability > 1) {
      Swal.fire({ icon: "error", title: "Invalid", text: "Probability must be between 0 and 1." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/combo-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: "success", title: "Saved", text: "Combo task configuration updated." });
        setConfig(data.config);
      } else {
        Swal.fire({ icon: "error", title: "Error", text: data.message || "Failed to save." });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold  flex items-center gap-2">
          <Layers className="w-6 h-6 text-[#E05305]" />
          Combined Task Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">Configure Combined (Combo) Tasks that appear randomly in user task rounds.</p>
      </div>

      {/* Per-User Management */}
      <UserComboManager />

      <div>
        <h2 className="text-lg font-bold text-slate-900">Global Defaults</h2>
        <p className="text-xs text-slate-500">Fallback settings applied to users without a per-user override.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Enable Combined Tasks</h3>
            <p className="text-xs text-slate-500">Allow combo tasks to be generated in user task rounds.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E05305]" />
          </label>
        </div>

        <hr className="border-slate-100" />

        {/* Probability */}
        <div>
          <label className="text-sm font-semibold text-slate-900 block mb-1">
            Appearance Probability ({Math.round(form.probability * 100)}%)
          </label>
          <p className="text-xs text-slate-500 mb-2">Chance that a combo task appears in each round.</p>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={form.probability}
            onChange={(e) => setForm((prev) => ({ ...prev, probability: Number(e.target.value) }))}
            className="w-full accent-[#E05305]"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Orders Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-900 block mb-1">Min Linked Orders</label>
            <p className="text-xs text-slate-500 mb-1">Minimum number of orders (2-5).</p>
            <input
              type="number"
              min="2"
              max="5"
              value={form.minOrders}
              onChange={(e) => setForm((prev) => ({ ...prev, minOrders: Math.max(2, Math.min(5, Number(e.target.value) || 2)) }))}
              className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E05305]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900 block mb-1">Max Linked Orders</label>
            <p className="text-xs text-slate-500 mb-1">Maximum number of orders (2-5).</p>
            <input
              type="number"
              min="2"
              max="5"
              value={form.maxOrders}
              onChange={(e) => setForm((prev) => ({ ...prev, maxOrders: Math.max(2, Math.min(5, Number(e.target.value) || 2)) }))}
              className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E05305]"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Target Negative Balance */}
        <div>
          <label className="text-sm font-semibold text-slate-900 block mb-1">
            Target Negative Balance
          </label>
          <p className="text-xs text-slate-500 mb-2">
            When set, combo orders are auto-generated so that the user's final wallet balance reaches this negative amount (total = wallet balance + target). Leave 0 to use the default stage-based amounts. Applied to all users without a per-user override.
          </p>
          <input
            type="number"
            min="0"
            step="1"
            value={form.targetNegativeBalance}
            onChange={(e) => setForm((prev) => ({ ...prev, targetNegativeBalance: Math.max(0, Number(e.target.value) || 0) }))}
            className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E05305]"
          />
        </div>

        <hr className="border-slate-100" />

        {/* Commission */}
        <div>
          <label className="text-sm font-semibold text-slate-900 block mb-1">
            Commission Percentage ({form.commissionPercent}%)
          </label>
          <p className="text-xs text-slate-500 mb-2">Percentage of total required amount credited as commission after all orders are completed.</p>
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={form.commissionPercent}
            onChange={(e) => setForm((prev) => ({ ...prev, commissionPercent: Number(e.target.value) }))}
            className="w-full accent-[#E05305]"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>1%</span>
            <span>10%</span>
            <span>20%</span>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Default Positions */}
        <div>
          <label className="text-sm font-semibold text-slate-900 block mb-1">Default Combo Position (Fallback)</label>
          <p className="text-xs text-slate-500 mb-2">The exact task position (1-30) where combo tasks appear when no account-type or per-user override is set. The first number is used as the fixed position.</p>
          <input
            type="text"
            value={(form.positions || []).join(", ")}
            onChange={(e) => {
              const vals = e.target.value.split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v >= 1 && v <= 30);
              setForm((prev) => ({ ...prev, positions: vals }));
            }}
            placeholder="8"
            className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E05305]"
          />
          <p className="text-[10px] text-slate-400 mt-1">Example: <code>8</code> means the combo always appears at position 8. Extra numbers are ignored; only the first is used.</p>
        </div>

        <hr className="border-slate-100" />

        {/* Demo Account Position */}
        <div>
          <label className="text-sm font-semibold text-slate-900 block mb-1">Demo Account Position</label>
          <p className="text-xs text-slate-500 mb-2">Fixed task position (1-30) where combo tasks appear for demo accounts. Overrides the default. Leave empty to use the default position. Only the first number is used.</p>
          <input
            type="text"
            value={(form.demoPositions || []).join(", ")}
            onChange={(e) => {
              const vals = e.target.value.split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v >= 1 && v <= 30);
              setForm((prev) => ({ ...prev, demoPositions: vals }));
            }}
            placeholder="5"
            className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E05305]"
          />
        </div>

        <hr className="border-slate-100" />

        {/* Main Account Position */}
        <div>
          <label className="text-sm font-semibold text-slate-900 block mb-1">Main Account Position</label>
          <p className="text-xs text-slate-500 mb-2">Fixed task position (1-30) where combo tasks appear for main accounts. Overrides the default. Leave empty to use the default position. Only the first number is used.</p>
          <input
            type="text"
            value={(form.mainPositions || []).join(", ")}
            onChange={(e) => {
              const vals = e.target.value.split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v >= 1 && v <= 30);
              setForm((prev) => ({ ...prev, mainPositions: vals }));
            }}
            placeholder="10"
            className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E05305]"
          />
        </div>

        <hr className="border-slate-100" />

        {/* Progression Levels */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Progression Levels</h3>
              <p className="text-xs text-slate-500">Amount ranges increase as users progress through task sets.</p>
            </div>
            <button
              onClick={addProgressionLevel}
              className="flex items-center gap-1 text-xs font-semibold text-[#E05305] hover:text-[#c84a04]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Level
            </button>
          </div>
          <div className="space-y-3">
            {form.progressionLevels.map((level, index) => (
              <div key={index} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                <span className="text-xs font-bold text-slate-400 w-16">Level {level.level}</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Min Amount</label>
                    <input
                      type="number"
                      min="1"
                      value={level.minAmountPerOrder}
                      onChange={(e) => updateProgressionLevel(index, "minAmountPerOrder", e.target.value)}
                      className="w-full border border-slate-200 rounded-lg bg-white px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E05305]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Max Amount</label>
                    <input
                      type="number"
                      min="1"
                      value={level.maxAmountPerOrder}
                      onChange={(e) => updateProgressionLevel(index, "maxAmountPerOrder", e.target.value)}
                      className="w-full border border-slate-200 rounded-lg bg-white px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E05305]"
                    />
                  </div>
                </div>
                {form.progressionLevels.length > 1 && (
                  <button
                    onClick={() => removeProgressionLevel(index)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-User Override Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Per-User Position Override</h3>
          <p className="text-xs text-slate-500">Set a fixed combo position for a specific user. This takes highest priority over all other settings. Only the first number is used.</p>
        </div>

        {/* User Search */}
        <div className="relative">
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-[#E05305]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              placeholder="Search users by email, name, or UID..."
              className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {searching && <span className="text-xs text-slate-400">Searching...</span>}
          </div>
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.uid}
                  onClick={() => addOverride(user)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                >
                  <div>
                    <span className="font-medium text-slate-800">{user.displayName || "N/A"}</span>
                    <span className="text-slate-400 ml-2">{user.email}</span>
                  </div>
                  <span className="text-xs text-slate-400">{user.accountType}</span>
                </button>
              ))}
            </div>
          )}
          {showResults && searchResults.length === 0 && userSearch && !searching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 p-4 text-sm text-slate-400 text-center">
              No users found.
            </div>
          )}
        </div>

        {/* Current Overrides */}
        {Object.keys(form.userPositionOverrides).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">Current Overrides ({Object.keys(form.userPositionOverrides).length})</p>
            {Object.entries(form.userPositionOverrides).map(([uid, positions]) => (
              <div key={uid} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{uid}</p>
                </div>
                <input
                  type="text"
                  value={overrideInputs[uid] || ""}
                  onChange={(e) => updateOverridePositions(uid, e.target.value)}
                  placeholder="e.g. 7"
                  className="w-40 border border-slate-200 rounded-lg bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E05305]"
                />
                <button
                  onClick={() => removeOverride(uid)}
                  className="text-slate-400 hover:text-red-500"
                  title="Remove override"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#E05305] text-white rounded-xl px-6 py-3 font-semibold hover:bg-[#c84a04] transition shadow-lg shadow-orange-200 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
