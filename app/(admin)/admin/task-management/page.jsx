"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Swal from "sweetalert2";

export default function TaskManagementPage() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUserUid, setFilterUserUid] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [assignMode, setAssignMode] = useState("single");

  const DEFAULT_RATING_OPTIONS = [
    "Peace of mind and security, very good app.",
    "Convenient, easy, and simple.",
    "Update too often.",
    "This is very good software.",
    "Free is quite good, but from time to time it shows that the server is busy, I hope to get improved."
  ];

  // ── Task Creation Form ──
  const [createForm, setCreateForm] = useState({
    appName: "",
    totalAmount: "",
    description: "",
    submissionConfig: {
      enabled: true,
      requireRating: true,
      ratingOptions: [...DEFAULT_RATING_OPTIONS],
      requireFeedback: true,
      maxFeedbackLength: 500,
    },
  });
  const [appLogoData, setAppLogoData] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showSubmissionConfig, setShowSubmissionConfig] = useState(true);
  const [newRatingOption, setNewRatingOption] = useState("");
  const fileInputRef = useRef(null);

  // ── Assignment Forms ──
  const [singleAssign, setSingleAssign] = useState({ taskId: "", assigneeUid: "" });
  const [multiAssign, setMultiAssign] = useState({ taskIds: [], assigneeUid: "" });
  const [multiUserSearch, setMultiUserSearch] = useState("");
  const [assignedTemplateIds, setAssignedTemplateIds] = useState(new Set());

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calcProfit = (total) => {
    const t = Math.max(0, Number(total) || 0);
    return Math.round(t * 0.5) / 100;
  };

  const createdProfit = calcProfit(createForm.totalAmount);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, tasksRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/tasks"),
      ]);
      const usersData = await usersRes.json();
      const tasksData = await tasksRes.json();
      setUsers(usersData.users || []);
      setTasks(tasksData.tasks || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Logo Upload Handlers ──
  const handleLogoFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Swal.fire({ icon: "error", title: "Invalid file", text: "Please upload an image file." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({ icon: "error", title: "File too large", text: "Maximum size is 10MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setAppLogoData(e.target.result);
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    handleLogoFile(file);
  }, [handleLogoFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const removeLogo = () => {
    setAppLogoData(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Create Task Handler ──
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!createForm.appName.trim()) {
      await Swal.fire({ icon: "error", title: "Required", text: "App Name is required." });
      return;
    }
    if (!createForm.totalAmount || Number(createForm.totalAmount) <= 0) {
      await Swal.fire({ icon: "error", title: "Required", text: "Total Amount must be greater than 0." });
      return;
    }

    const payload = {
      appName: createForm.appName.trim(),
      appLogo: appLogoData || "",
      totalAmount: Number(createForm.totalAmount),
      description: createForm.description,
    };

    if (createForm.submissionConfig.enabled) {
      payload.submissionConfig = {
        requireRating: createForm.submissionConfig.requireRating,
        ratingOptions: createForm.submissionConfig.ratingOptions.filter((o) => o.trim()),
        requireFeedback: createForm.submissionConfig.requireFeedback,
        maxFeedbackLength: createForm.submissionConfig.maxFeedbackLength,
      };
    }

    const response = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Failed", text: result.message || "Could not create task." });
      return;
    }

    await Swal.fire({ icon: "success", title: "Task created", timer: 1300, showConfirmButton: false });

    setCreateForm({
      appName: "",
      totalAmount: "",
      description: "",
      submissionConfig: {
        enabled: true,
        requireRating: true,
        ratingOptions: [...DEFAULT_RATING_OPTIONS],
        requireFeedback: true,
        maxFeedbackLength: 500,
      },
    });
    setAppLogoData(null);
    setLogoPreview(null);
    loadData();
  };

  // ── Task Templates (for assignment) ──
  const taskTemplates = tasks.filter((t) => t.isTemplate && t.status === "available");

  // When multi-assign user changes, compute which templates are already assigned to that user
  useEffect(() => {
    if (!multiAssign.assigneeUid) {
      setAssignedTemplateIds(new Set());
      setMultiAssign((p) => ({ ...p, taskIds: [] }));
      return;
    }
    const assigned = new Set(
      tasks
        .filter((t) => !t.isTemplate && t.assigneeUid === multiAssign.assigneeUid && t.parentTaskId)
        .map((t) => t.parentTaskId)
    );
    setAssignedTemplateIds(assigned);
    // Clear any previously selected taskIds that are now assigned
    setMultiAssign((p) => ({
      ...p,
      taskIds: p.taskIds.filter((id) => !assigned.has(id)),
    }));
  }, [multiAssign.assigneeUid, tasks]);

  // ── Single Assign Handler ──
  const handleSingleAssign = async (e) => {
    e.preventDefault();
    if (!singleAssign.taskId || !singleAssign.assigneeUid) {
      await Swal.fire({ icon: "error", title: "Select", text: "Please select a task and a user." });
      return;
    }

    const user = users.find((u) => u.uid === singleAssign.assigneeUid);
    const response = await fetch("/api/admin/tasks/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskIds: [singleAssign.taskId],
        assigneeUid: user.uid,
        assigneeEmail: user.email,
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        await Swal.fire({
          icon: "warning",
          title: "Already assigned",
          text: "This task has already been assigned to this user. Please create a new task instead.",
        });
      } else {
        await Swal.fire({ icon: "error", title: "Assignment failed", text: result.message || "Please try again." });
      }
      return;
    }

    await Swal.fire({ icon: "success", title: result.message, timer: 2000, showConfirmButton: false });
    setSingleAssign({ taskId: "", assigneeUid: "" });
    loadData();
  };

  // ── Multi Assign Handler ──
  const handleMultiAssign = async (e) => {
    e.preventDefault();
    if (!multiAssign.taskIds.length || !multiAssign.assigneeUid) {
      await Swal.fire({ icon: "error", title: "Select", text: "Please select at least one task and a user." });
      return;
    }

    const user = users.find((u) => u.uid === multiAssign.assigneeUid);
    const response = await fetch("/api/admin/tasks/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskIds: multiAssign.taskIds,
        assigneeUid: user.uid,
        assigneeEmail: user.email,
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        await Swal.fire({
          icon: "warning",
          title: "Already assigned",
          text: "All selected tasks have already been assigned to this user. Please create new tasks instead.",
          footer: result.duplicates?.length ? result.duplicates.map((d) => d.appName).join(", ") : "",
        });
      } else {
        await Swal.fire({ icon: "error", title: "Assignment failed", text: result.message || "Please try again." });
      }
      return;
    }

    let msg = `${result.createdCount} task(s) assigned.`;
    if (result.duplicates?.length) {
      msg += `\nSkipped (already assigned): ${result.duplicates.map((d) => d.appName).join(", ")}`;
    }

    await Swal.fire({
      icon: result.duplicates?.length ? "warning" : "success",
      title: "Tasks assigned",
      text: msg,
      timer: 3000,
    });
    setMultiAssign({ taskIds: [], assigneeUid: "" });
    loadData();
  };

  const toggleMultiTask = (taskId) => {
    setMultiAssign((prev) => ({
      ...prev,
      taskIds: prev.taskIds.includes(taskId)
        ? prev.taskIds.filter((id) => id !== taskId)
        : prev.taskIds.length < 30
          ? [...prev.taskIds, taskId]
          : prev.taskIds,
    }));
  };

  // ── Filters ──
  const filteredTasks = tasks.filter((task) => {
    if (filterUserUid && task.assigneeUid !== filterUserUid) return false;
    if (filterType === "template" && !task.isTemplate) return false;
    if (filterType === "assigned" && task.isTemplate) return false;
    if (filterType === "completed" && task.status !== "completed") return false;
    if (filterType === "pending" && task.status !== "pending") return false;
    return true;
  });

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-7 w-48 bg-slate-200 rounded mb-6" />

        {/* Create Task skeleton */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="h-5 w-36 bg-slate-200 rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-10 bg-slate-200 rounded-lg" />
            <div className="h-10 bg-slate-200 rounded-lg" />
            <div className="md:col-span-2 h-32 bg-slate-200 rounded-xl" />
            <div className="md:col-span-2 h-12 bg-slate-200 rounded-lg" />
            <div className="md:col-span-2 h-24 bg-slate-200 rounded-lg" />
            <div className="md:col-span-2 h-10 bg-slate-200 rounded-lg" />
          </div>
        </div>

        {/* Assign Tasks skeleton */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-28 bg-slate-200 rounded" />
            <div className="flex gap-2">
              <div className="h-7 w-24 bg-slate-200 rounded-lg" />
              <div className="h-7 w-24 bg-slate-200 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-10 bg-slate-200 rounded-lg" />
            <div className="h-10 bg-slate-200 rounded-lg" />
            <div className="h-10 bg-slate-200 rounded-lg" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="h-9 w-48 bg-slate-200 rounded-lg" />
          </div>
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-8 w-8 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-4 w-20 bg-slate-200 rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Task Management</h1>

      {/* ════════════════════════════════════════════════
          SECTION 1: CREATE NEW TASK
          ════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Create New Task</h2>
        <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="App Name"
            value={createForm.appName}
            onChange={(e) => setCreateForm((p) => ({ ...p, appName: e.target.value }))}
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            required
          />

          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Total Amount"
            value={createForm.totalAmount}
            onChange={(e) => setCreateForm((p) => ({ ...p, totalAmount: e.target.value }))}
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            required
          />

          {/* Logo Upload */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700 block mb-1">App Logo</label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragOver ? "border-[#E05305] bg-orange-50" : "border-slate-300 hover:border-slate-400"
              }`}
            >
              {logoPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={logoPreview} alt="Logo preview" className="h-20 w-20 object-contain rounded-lg" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeLogo(); }} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              ) : (
                <div className="text-slate-400">
                  <svg className="mx-auto h-10 w-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-sm">Drag & drop or click to upload</p>
                  <p className="text-xs mt-1">PNG, JPG, WEBP (max 2MB)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoFile(e.target.files?.[0])}
              />
            </div>
          </div>

          {/* Auto Profit Display */}
          <div className="md:col-span-2 bg-slate-50 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Calculated Profit (0.5%)</p>
              <p className="text-xs text-slate-400">0.5% of total amount</p>
            </div>
            <span className="text-lg font-bold text-[#E05305]">${formatMoney(createdProfit)}</span>
          </div>

          <textarea
            placeholder="Description (optional)"
            value={createForm.description}
            onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
            className="md:col-span-2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm min-h-20"
          />

          {/* ── Submission Requirements ── */}
          <div className="md:col-span-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setShowSubmissionConfig(!showSubmissionConfig)}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              <span className={`transition-transform ${showSubmissionConfig ? "rotate-90" : ""}`}>▸</span>
              Submission Requirements
            </button>

            {showSubmissionConfig && (
              <div className="mt-3 space-y-4 pl-4 border-l-2 border-slate-100">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={createForm.submissionConfig.enabled}
                    onChange={(e) => setCreateForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, enabled: e.target.checked } }))}
                    className="accent-[#E05305]"
                  />
                  Enable custom submission requirements for this task
                </label>

                {createForm.submissionConfig.enabled && (
                  <>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={createForm.submissionConfig.requireRating}
                        onChange={(e) => setCreateForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, requireRating: e.target.checked } }))}
                        className="accent-[#E05305]"
                      />
                      Require rating selection
                    </label>

                    {createForm.submissionConfig.requireRating && (
                      <div className="space-y-2 pl-6">
                        <p className="text-xs text-slate-400 font-medium">Rating options:</p>
                        {createForm.submissionConfig.ratingOptions.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              value={opt}
                              onChange={(e) => {
                                const updated = [...createForm.submissionConfig.ratingOptions];
                                updated[i] = e.target.value;
                                setCreateForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, ratingOptions: updated } }));
                              }}
                              className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setCreateForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, ratingOptions: p.submissionConfig.ratingOptions.filter((_, idx) => idx !== i) } }))}
                              className="text-red-400 hover:text-red-600 text-xs"
                            >✕</button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <input
                            value={newRatingOption}
                            onChange={(e) => setNewRatingOption(e.target.value)}
                            placeholder="New option…"
                            className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newRatingOption.trim()) {
                                setCreateForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, ratingOptions: [...p.submissionConfig.ratingOptions, newRatingOption.trim()] } }));
                                setNewRatingOption("");
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >+ Add</button>
                        </div>
                      </div>
                    )}

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={createForm.submissionConfig.requireFeedback}
                        onChange={(e) => setCreateForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, requireFeedback: e.target.checked } }))}
                        className="accent-[#E05305]"
                      />
                      Require feedback / comment
                    </label>

                    {createForm.submissionConfig.requireFeedback && (
                      <div className="pl-6">
                        <label className="text-xs text-slate-500 block mb-1">Max feedback length</label>
                        <input
                          type="number"
                          min={1}
                          max={5000}
                          value={createForm.submissionConfig.maxFeedbackLength}
                          onChange={(e) => setCreateForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, maxFeedbackLength: Number(e.target.value) } }))}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-32"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <button type="submit" className="md:col-span-2 bg-[#E05305] text-white rounded-lg px-4 py-2.5 font-medium hover:bg-[#c84a04] transition">
            Create Task
          </button>
        </form>
      </div>

      {/* ════════════════════════════════════════════════
          SECTION 2: ASSIGN TASKS
          ════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Assign Tasks</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setAssignMode("single")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${assignMode === "single" ? "bg-[#E05305] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Single Assign
            </button>
            <button
              onClick={() => setAssignMode("multi")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${assignMode === "multi" ? "bg-[#E05305] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Multi Assign
            </button>
          </div>
        </div>

        {assignMode === "single" ? (
          <form onSubmit={handleSingleAssign} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={singleAssign.taskId}
              onChange={(e) => setSingleAssign((p) => ({ ...p, taskId: e.target.value }))}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white"
              required
            >
              <option value="">Select a task</option>
              {taskTemplates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.appName} — ${formatMoney(t.totalAmount)} (Profit: ${formatMoney(t.profit)})
                </option>
              ))}
            </select>

            <select
              value={singleAssign.assigneeUid}
              onChange={(e) => setSingleAssign((p) => ({ ...p, assigneeUid: e.target.value }))}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white"
              required
            >
              <option value="">Select target user</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>{u.email}</option>
              ))}
            </select>

            <button type="submit" className="bg-blue-600 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-blue-700 transition">
              Assign Task
            </button>
          </form>
        ) : (
          <form onSubmit={handleMultiAssign} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: User selection — must select user first */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Step 1: Select Target User
              </label>
              <input
                type="text"
                placeholder="Search users…"
                value={multiUserSearch}
                onChange={(e) => setMultiUserSearch(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm w-full mb-1"
              />
              <select
                value={multiAssign.assigneeUid}
                onChange={(e) => {
                  setMultiAssign((p) => ({ ...p, assigneeUid: e.target.value, taskIds: [] }));
                  setMultiUserSearch("");
                }}
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white w-full"
                size={6}
                required
              >
                <option value="">— Select a user —</option>
                {users
                  .filter((u) => u.email.toLowerCase().includes(multiUserSearch.toLowerCase()))
                  .map((u) => (
                    <option key={u.uid} value={u.uid}>{u.email}</option>
                  ))}
              </select>
            </div>

            {/* Right: Task selection — visible only after user is selected */}
            <div>
              {!multiAssign.assigneeUid ? (
                <div className="flex items-center justify-center h-full min-h-[180px] border border-dashed border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-400">
                  Select a user first to view assignable tasks
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Step 2: Select Tasks (max 30)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{multiAssign.taskIds.length} selected</span>
                      <button
                        type="button"
                        onClick={() => {
                          const available = taskTemplates.filter((t) => !assignedTemplateIds.has(t._id));
                          const toSelect = available.slice(0, 30).map((t) => t._id);
                          setMultiAssign((p) => ({ ...p, taskIds: toSelect }));
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Select 30 Tasks
                      </button>
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                    {taskTemplates.length ? (
                      taskTemplates.map((t) => {
                        const alreadyAssigned = assignedTemplateIds.has(t._id);
                        const sel = multiAssign.taskIds.includes(t._id);
                        const atLimit = multiAssign.taskIds.length >= 30 && !sel;
                        return (
                          <div
                            key={t._id}
                            className={`flex items-center gap-2 px-3 py-2 text-sm border-b border-slate-50 last:border-0 ${
                              alreadyAssigned
                                ? "bg-red-50 opacity-60"
                                : sel
                                  ? "bg-blue-50"
                                  : "hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={sel}
                              disabled={alreadyAssigned || atLimit}
                              onChange={() => toggleMultiTask(t._id)}
                              className="accent-blue-600 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="truncate block">{t.appName}</span>
                              <span className="text-xs text-slate-400">${formatMoney(t.totalAmount)}</span>
                            </div>
                            {alreadyAssigned && (
                              <span className="text-[10px] text-red-600 font-medium whitespace-nowrap shrink-0">
                                Already assigned to this user
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="px-3 py-4 text-xs text-slate-400 text-center">No tasks available. Create a task first.</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!multiAssign.taskIds.length}
                    className="mt-3 w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Assign {multiAssign.taskIds.length} Task{multiAssign.taskIds.length !== 1 ? "s" : ""}
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          SECTION 3: TASKS TABLE
          ════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <select value={filterUserUid} onChange={(e) => setFilterUserUid(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All users</option>
            {users.map((user) => (<option key={user.uid} value={user.uid}>{user.email}</option>))}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">All</option>
            <option value="template">Templates</option>
            <option value="assigned">Assigned</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <span className="text-xs text-slate-400 ml-auto">{filteredTasks.length} task{(filteredTasks.length !== 1) && "s"}</span>
        </div>

        {loading ? (
          <p className="p-6 text-slate-500 text-center">Loading...</p>
        ) : filteredTasks.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">App Name</th>
                  <th className="py-3 px-4">Logo</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Profit</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">{task.appName || task.title || "—"}</td>
                    <td className="py-3 px-4">
                      {task.appLogo ? (
                        <img src={task.appLogo} alt="" className="h-8 w-8 object-contain rounded" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{task.assigneeEmail || (task.isTemplate ? <span className="text-slate-400 italic">Template</span> : task.assigneeUid?.slice(0, 12))}</td>
                    <td className="py-3 px-4">${formatMoney(task.totalAmount)}</td>
                    <td className="py-3 px-4 text-emerald-600 font-medium">${formatMoney(task.profit)}</td>
                    <td className="py-3 px-4">
                      {task.isTemplate ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">Template</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">Assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        task.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                        task.status === "cancelled" ? "bg-red-50 text-red-700" :
                        task.status === "available" ? "bg-blue-50 text-blue-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">{new Date(task.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-6 text-center text-slate-500">No tasks match the selected filters.</p>
        )}
      </div>
    </div>
  );
}
