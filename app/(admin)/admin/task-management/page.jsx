"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import Pagination from "../components/Pagination";
import { TableSkeleton, CardSkeleton } from "../components/TableSkeleton";

function Spinner({ size = 16 }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const ITEMS_PER_PAGE = 10;

const DEFAULT_RATING_OPTIONS = [
  "Peace of mind and security, very good app.",
  "Convenient, easy, and simple.",
  "Update too often.",
  "This is very good software.",
  "Free is quite good, but from time to time it shows that the server is busy, I hope to get improved.",
];

export default function TaskManagementPage() {
  const [users, setUsers] = useState([]);
  const [taskGroups, setTaskGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [filterUserUid, setFilterUserUid] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterGroupId, setFilterGroupId] = useState("");
  const [groupsPage, setGroupsPage] = useState(1);
  const [groupTasksPage, setGroupTasksPage] = useState(1);
  const [tasksPage, setTasksPage] = useState(1);
  const [activeTab, setActiveTab] = useState("groups");

  const [tasks, setTasks] = useState([]);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [tasksTotalPages, setTasksTotalPages] = useState(1);

  const [groupTaskList, setGroupTaskList] = useState([]);
  const [groupTaskTotal, setGroupTaskTotal] = useState(0);
  const [groupTaskTotalPages, setGroupTaskTotalPages] = useState(1);

  const [groupForm, setGroupForm] = useState({ name: "", description: "" });

  const [createForm, setCreateForm] = useState({
    appName: "",
    totalAmount: "",
    taskGroupId: "",
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

  const [editTask, setEditTask] = useState(null);
  const [editForm, setEditForm] = useState({
    appName: "",
    totalAmount: "",
    taskGroupId: "",
    description: "",
    submissionConfig: {
      enabled: true,
      requireRating: true,
      ratingOptions: [...DEFAULT_RATING_OPTIONS],
      requireFeedback: true,
      maxFeedbackLength: 500,
    },
  });
  const [editLogoData, setEditLogoData] = useState(null);
  const [editLogoPreview, setEditLogoPreview] = useState(null);
  const [editDragOver, setEditDragOver] = useState(false);
  const [showEditSubmissionConfig, setShowEditSubmissionConfig] = useState(true);
  const [editNewRatingOption, setEditNewRatingOption] = useState("");
  const editFileInputRef = useRef(null);

  const [groupAssign, setGroupAssign] = useState({ groupId: "", assigneeUid: "" });
  const [selectedGroupTaskId, setSelectedGroupTaskId] = useState("");

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
  const editProfit = calcProfit(editForm.totalAmount);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const params = new URLSearchParams({ page: tasksPage, limit: String(ITEMS_PER_PAGE) });
      if (filterUserUid) params.set("assigneeUid", filterUserUid);
      if (filterType !== "all") params.set("filterType", filterType);
      if (filterGroupId) params.set("filterGroupId", filterGroupId);
      const res = await fetch(`/api/admin/tasks?${params}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
        setTasksTotal(data.total || 0);
        setTasksTotalPages(data.totalPages || 1);
      }
    } finally {
      setTasksLoading(false);
    }
  }, [tasksPage, filterUserUid, filterType, filterGroupId]);

  const loadGroupTasks = useCallback(async () => {
    if (!selectedGroupTaskId) {
      setGroupTaskList([]);
      setGroupTaskTotal(0);
      setGroupTaskTotalPages(1);
      return;
    }
    try {
      const params = new URLSearchParams({
        page: groupTasksPage,
        limit: String(ITEMS_PER_PAGE),
        filterGroupId: selectedGroupTaskId,
      });
      const res = await fetch(`/api/admin/tasks?${params}`);
      const data = await res.json();
      if (data.success) {
        setGroupTaskList(data.tasks || []);
        setGroupTaskTotal(data.total || 0);
        setGroupTaskTotalPages(data.totalPages || 1);
      }
    } catch {}
  }, [selectedGroupTaskId, groupTasksPage]);

  const loadReferenceData = async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([
        fetch("/api/admin/users?limit=500"),
        fetch("/api/admin/task-groups"),
      ]);
      const usersData = await usersRes.json();
      const groupsData = await groupsRes.json();
      setUsers(usersData.users || []);
      setTaskGroups(groupsData.groups || []);
    } catch {}
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadReferenceData(), loadTasks()]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => { if (activeTab === "tasks") loadTasks(); }, [loadTasks]);
  useEffect(() => { loadGroupTasks(); }, [loadGroupTasks]);

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

  const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback(() => { setDragOver(false); }, []);
  const removeLogo = () => { setAppLogoData(null); setLogoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

  const handleEditLogoFile = useCallback((file) => {
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
      setEditLogoData(e.target.result);
      setEditLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleEditDrop = useCallback((e) => { e.preventDefault(); setEditDragOver(false); const file = e.dataTransfer?.files?.[0]; handleEditLogoFile(file); }, [handleEditLogoFile]);
  const handleEditDragOver = useCallback((e) => { e.preventDefault(); setEditDragOver(true); }, []);
  const handleEditDragLeave = useCallback(() => { setEditDragOver(false); }, []);
  const removeEditLogo = () => { setEditLogoData(null); setEditLogoPreview(null); if (editFileInputRef.current) editFileInputRef.current.value = ""; };

  const [creatingGroup, setCreatingGroup] = useState(false);
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) {
      await Swal.fire({ icon: "error", title: "Required", text: "Group name is required." });
      return;
    }
    setCreatingGroup(true);
    try {
      const response = await fetch("/api/admin/task-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupForm.name.trim(), description: groupForm.description }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        await Swal.fire({ icon: "error", title: "Failed", text: result.message || "Could not create group." });
        return;
      }
      await Swal.fire({ icon: "success", title: "Group created", timer: 1300, showConfirmButton: false });
      setGroupForm({ name: "", description: "" });
      setLoading(true);
      await loadReferenceData();
      setLoading(false);
    } finally { setCreatingGroup(false); }
  };

  const [creatingTask, setCreatingTask] = useState(false);
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!createForm.appName.trim()) { await Swal.fire({ icon: "error", title: "Required", text: "App Name is required." }); return; }
    if (!createForm.totalAmount || Number(createForm.totalAmount) <= 0) { await Swal.fire({ icon: "error", title: "Required", text: "Total Amount must be greater than 0." }); return; }
    if (!createForm.taskGroupId) { await Swal.fire({ icon: "error", title: "Required", text: "Please select a task group." }); return; }
    setCreatingTask(true);
    try {
      const payload = {
        appName: createForm.appName.trim(),
        appLogo: appLogoData || "",
        totalAmount: Number(createForm.totalAmount),
        taskGroupId: createForm.taskGroupId,
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
      if (!response.ok || !result.success) { await Swal.fire({ icon: "error", title: "Failed", text: result.message || "Could not create task." }); return; }
      await Swal.fire({ icon: "success", title: "Task created", timer: 1300, showConfirmButton: false });
      setCreateForm({ appName: "", totalAmount: "", taskGroupId: "", description: "", submissionConfig: { enabled: true, requireRating: true, ratingOptions: [...DEFAULT_RATING_OPTIONS], requireFeedback: true, maxFeedbackLength: 500 } });
      setAppLogoData(null);
      setLogoPreview(null);
      await loadReferenceData();
      if (activeTab === "tasks") loadTasks();
    } finally { setCreatingTask(false); }
  };

  const openEditModal = (task) => {
    setEditTask(task);
    setEditForm({
      appName: task.appName || "",
      totalAmount: String(task.totalAmount || ""),
      taskGroupId: task.taskGroupId || "",
      description: task.description || "",
      submissionConfig: task.submissionConfig || { enabled: true, requireRating: true, ratingOptions: [...DEFAULT_RATING_OPTIONS], requireFeedback: true, maxFeedbackLength: 500 },
    });
    setEditLogoPreview(task.appLogo || null);
    setEditLogoData(null);
    setEditDragOver(false);
    setShowEditSubmissionConfig(true);
    setEditNewRatingOption("");
  };
  const closeEditModal = () => { setEditTask(null); setEditLogoData(null); setEditLogoPreview(null); };

  const [updatingTask, setUpdatingTask] = useState(false);
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.appName.trim()) { await Swal.fire({ icon: "error", title: "Required", text: "App Name is required." }); return; }
    if (!editForm.totalAmount || Number(editForm.totalAmount) <= 0) { await Swal.fire({ icon: "error", title: "Required", text: "Total Amount must be greater than 0." }); return; }
    setUpdatingTask(true);
    try {
      const payload = { appName: editForm.appName.trim(), appLogo: editLogoData || editLogoPreview || "", totalAmount: Number(editForm.totalAmount), taskGroupId: editForm.taskGroupId || null, description: editForm.description };
      if (editForm.submissionConfig.enabled) {
        payload.submissionConfig = { requireRating: editForm.submissionConfig.requireRating, ratingOptions: editForm.submissionConfig.ratingOptions.filter((o) => o.trim()), requireFeedback: editForm.submissionConfig.requireFeedback, maxFeedbackLength: editForm.submissionConfig.maxFeedbackLength };
      }
      const response = await fetch(`/api/admin/tasks/${editTask._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.success) { await Swal.fire({ icon: "error", title: "Failed", text: result.message || "Could not update task." }); return; }
      await Swal.fire({ icon: "success", title: "Task updated", timer: 1300, showConfirmButton: false });
      closeEditModal();
      loadTasks();
    } finally { setUpdatingTask(false); }
  };

  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const handleDeleteTask = async (task) => {
    const confirmed = await Swal.fire({ title: "Delete Task?", text: `Are you sure you want to delete "${task.appName}"? This action cannot be undone.`, icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#3085d6", confirmButtonText: "Yes, delete it" });
    if (!confirmed.isConfirmed) return;
    setDeletingTaskId(task._id);
    try {
      const response = await fetch(`/api/admin/tasks/${task._id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) { await Swal.fire({ icon: "error", title: "Failed", text: result.message || "Could not delete task." }); return; }
      await Swal.fire({ icon: "success", title: "Task deleted", text: "The task has been removed and the group slot freed.", timer: 2000, showConfirmButton: false });
      loadTasks();
    } finally { setDeletingTaskId(null); }
  };

  const [assigningGroup, setAssigningGroup] = useState(false);
  const doGroupAssign = async (force = false) => {
    const user = users.find((u) => u.uid === groupAssign.assigneeUid);
    const response = await fetch("/api/admin/task-groups/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: groupAssign.groupId, assigneeUid: user.uid, assigneeEmail: user.email, force }),
    });
    const result = await response.json();

    if (result?.needsConfirmation) {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Daily limit reached",
        text: result.message,
        showCancelButton: true,
        confirmButtonColor: "#E05305",
        confirmButtonText: "Continue anyway",
        cancelButtonText: "Cancel",
      });
      if (confirm.isConfirmed) {
        return doGroupAssign(true);
      }
      return;
    }

    if (!response.ok || !result.success) {
      await Swal.fire({
        icon: response.status === 409 ? "warning" : "error",
        title: response.status === 409 ? "Already assigned" : "Assignment failed",
        text: result.message || "Please try again.",
      });
      return;
    }
    await Swal.fire({ icon: "success", title: "Group assigned", text: result.message, timer: 3000 });
    setGroupAssign({ groupId: "", assigneeUid: "" });
  };

  const handleGroupAssign = async (e) => {
    e.preventDefault();
    if (!groupAssign.groupId || !groupAssign.assigneeUid) { await Swal.fire({ icon: "error", title: "Select", text: "Please select a group and a user." }); return; }
    setAssigningGroup(true);
    try {
      await doGroupAssign(false);
    } finally { setAssigningGroup(false); }
  };

  const availableGroups = taskGroups.filter((g) => g.taskCount < 40);

  if (loading) {
    return (
      <div>
        <div className="h-7 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <TableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Task Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {tasksTotal} total tasks &middot; {taskGroups.length} groups &middot; {users.length} users
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-x-auto">
        {[
          { id: "groups", label: "Task Groups", desc: `${taskGroups.length} groups` },
          { id: "create", label: "New Task", desc: "Create a task" },
          { id: "assign", label: "Assign Group", desc: "Link group to user" },
          { id: "tasks", label: "All Tasks", desc: `${tasksTotal} total` },
        ].map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition flex-1 sm:flex-none ${activeTab === t.id ? "bg-[#E05305] text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}>
            <span className="hidden sm:inline text-left">
              <div className="font-medium leading-tight">{t.label}</div>
              <div className={`text-[11px] ${activeTab === t.id ? "text-white/70" : "text-slate-400"}`}>{t.desc}</div>
            </span>
            <span className="sm:hidden text-xs">{t.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "groups" && (
        <div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Create Task Group</h2>
            </div>
            <form onSubmit={handleCreateGroup} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-slate-500 block mb-1">Group Name</label>
                <input type="text" placeholder="e.g. App Store Optimization" value={groupForm.name} onChange={(e) => setGroupForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" required />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-slate-500 block mb-1">Description (optional)</label>
                <input type="text" placeholder="Brief description of the group" value={groupForm.description} onChange={(e) => setGroupForm((p) => ({ ...p, description: e.target.value }))} className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
              </div>
              <button type="submit" disabled={creatingGroup} className="bg-[#E05305] text-white rounded-lg px-5 py-2.5 font-medium hover:bg-[#c84a04] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0">
                {creatingGroup && <Spinner />} Create Group
              </button>
            </form>
          </div>

          {taskGroups.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">All Task Groups ({taskGroups.length})</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {taskGroups.slice((groupsPage - 1) * ITEMS_PER_PAGE, groupsPage * ITEMS_PER_PAGE).map((g) => {
                  const used = g.taskCount || 0;
                  const available = 40 - used;
                  const pct = (used / 40) * 100;
                  return (
                    <div key={g._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-slate-900">{g.name}</p>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${available > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{available} left</span>
                      </div>
                      {g.description && <p className="text-xs text-slate-400 mb-3">{g.description}</p>}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-[#E05305] rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{used}/30</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination page={groupsPage} totalPages={Math.ceil(taskGroups.length / ITEMS_PER_PAGE)} total={taskGroups.length} onPageChange={setGroupsPage} />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              <p className="text-sm font-medium">No task groups yet</p>
              <p className="text-xs mt-1">Create your first group above to get started.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "create" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Create New Task</h2>
              <p className="text-sm text-slate-500 mt-0.5">Add a new task to a task group</p>
            </div>
          </div>
          <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">App Name</label>
              <input type="text" placeholder="e.g. My Shopping App" value={createForm.appName} onChange={(e) => setCreateForm((p) => ({ ...p, appName: e.target.value }))} className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Total Amount ($)</label>
              <input type="number" step="0.01" min="0.01" placeholder="e.g. 100.00" value={createForm.totalAmount} onChange={(e) => setCreateForm((p) => ({ ...p, totalAmount: e.target.value }))} className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" required />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Task Group</label>
              <select value={createForm.taskGroupId} onChange={(e) => setCreateForm((p) => ({ ...p, taskGroupId: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-900" required>
                <option value="">— Select a group —</option>
                {availableGroups.map((g) => {
                  const used = g.taskCount || 0;
                  const slotAvail = 40 - used;
                  return <option key={g._id} value={g._id}>{g.name} ({used}/30, {slotAvail} slot{slotAvail !== 1 ? "s" : ""} available)</option>;
                })}
              </select>
              {availableGroups.length === 0 && <p className="text-xs text-red-500 mt-1">All groups are full. Create a new group first.</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-500 block mb-1.5">App Logo</label>
              <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? "border-[#E05305] bg-orange-50" : "border-slate-300 hover:border-slate-400"}`}>
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
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoFile(e.target.files?.[0])} />
              </div>
            </div>
            <div className="md:col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg px-5 py-4 flex items-center justify-between border border-amber-200/60">
              <div><p className="text-sm font-medium text-slate-700">Calculated Profit</p><p className="text-xs text-slate-400">0.5% of total amount</p></div>
              <span className="text-xl font-bold text-[#E05305]">${formatMoney(createdProfit)}</span>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Description (optional)</label>
              <textarea placeholder="Task description or instructions..." value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 min-h-24 resize-y" />
            </div>
            <div className="md:col-span-2 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => setShowSubmissionConfig(!showSubmissionConfig)} className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
                <svg className={`w-4 h-4 transition-transform ${showSubmissionConfig ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                Submission Requirements
              </button>
              {showSubmissionConfig && (
                <div className="mt-4 space-y-4 pl-5 border-l-2 border-slate-100">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={createForm.submissionConfig.enabled} onChange={(e) => setCreateForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, enabled: e.target.checked } }))} className="accent-[#E05305]" /> Enable custom submission requirements for this task</label>
                  {createForm.submissionConfig.enabled && (<>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={createForm.submissionConfig.requireRating} onChange={(e) => setCreateForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, requireRating: e.target.checked } }))} className="accent-[#E05305]" /> Require rating selection</label>
                    {createForm.submissionConfig.requireRating && (
                      <div className="space-y-2 pl-6">
                        <p className="text-xs text-slate-400 font-medium">Rating options:</p>
                        {createForm.submissionConfig.ratingOptions.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input value={opt} onChange={(e) => { const updated = [...createForm.submissionConfig.ratingOptions]; updated[i] = e.target.value; setCreateForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, ratingOptions: updated } })); }} className="flex-1 border border-slate-200 rounded bg-white px-2 py-1.5 text-xs text-slate-900" />
                            <button type="button" onClick={() => setCreateForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, ratingOptions: p.submissionConfig.ratingOptions.filter((_, idx) => idx !== i) } }))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <input value={newRatingOption} onChange={(e) => setNewRatingOption(e.target.value)} placeholder="New option..." className="flex-1 border border-slate-200 rounded bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400" />
                          <button type="button" onClick={() => { if (newRatingOption.trim()) { setCreateForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, ratingOptions: [...p.submissionConfig.ratingOptions, newRatingOption.trim()] } })); setNewRatingOption(""); } }} className="text-blue-600 hover:text-blue-800 text-xs font-medium">+ Add</button>
                        </div>
                      </div>
                    )}
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={createForm.submissionConfig.requireFeedback} onChange={(e) => setCreateForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, requireFeedback: e.target.checked } }))} className="accent-[#E05305]" /> Require feedback / comment</label>
                    {createForm.submissionConfig.requireFeedback && (
                      <div className="pl-6">
                        <label className="text-xs text-slate-500 block mb-1">Max feedback length</label>
                        <input type="number" min={1} max={5000} value={createForm.submissionConfig.maxFeedbackLength} onChange={(e) => setCreateForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, maxFeedbackLength: Number(e.target.value) } }))} className="border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm text-slate-900 w-32" />
                      </div>
                    )}
                  </>)}
                </div>
              )}
            </div>
            <button type="submit" disabled={creatingTask} className="md:col-span-2 bg-[#E05305] text-white rounded-lg px-4 py-3 font-medium hover:bg-[#c84a04] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {creatingTask && <Spinner />} Create Task
            </button>
          </form>
        </div>
      )}

      {activeTab === "assign" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Assign Task Group to User</h2>
            <p className="text-sm text-slate-500 mt-0.5">Link a task group to a user so they receive tasks from it. Up to 3 groups may be assigned per user per day.</p>
          </div>
          <form onSubmit={handleGroupAssign} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Select Task Group</label>
              <select value={groupAssign.groupId} onChange={(e) => setGroupAssign((p) => ({ ...p, groupId: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-900" required>
                <option value="">Choose a group...</option>
                {taskGroups.map((g) => <option key={g._id} value={g._id}>{g.name} ({g.taskCount || 0} tasks)</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Select User</label>
              <select value={groupAssign.assigneeUid} onChange={(e) => setGroupAssign((p) => ({ ...p, assigneeUid: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-900" required>
                <option value="">Choose a user...</option>
                {users.map((u) => <option key={u.uid} value={u.uid}>{u.email}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={assigningGroup} className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {assigningGroup && <Spinner />} Assign Group
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-medium text-slate-500 block mb-1">View tasks by group</label>
                  <select value={selectedGroupTaskId} onChange={(e) => { setSelectedGroupTaskId(e.target.value); setGroupTasksPage(1); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900">
                    <option value="">All groups</option>
                    {taskGroups.map((g) => <option key={g._id} value={g._id}>{g.name} ({g.taskCount || 0} tasks)</option>)}
                  </select>
                </div>
                {selectedGroupTaskId && <span className="text-xs text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-200">{groupTaskTotal} task{groupTaskTotal !== 1 ? "s" : ""} in this group</span>}
              </div>
            </div>

            {!selectedGroupTaskId ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <svg className="h-10 w-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                <p className="text-sm font-medium">Select a group to view its tasks</p>
                <p className="text-xs mt-1">Choose a group from the dropdown above.</p>
              </div>
            ) : groupTaskList.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">App Name</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Profit</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {groupTaskList.map((task) => (
                      <tr key={task._id} className="hover:bg-slate-50/40">
                        <td className="py-3 px-4 font-medium text-slate-900">{task.appName || task.title || "—"}</td>
                        <td className="py-3 px-4">${formatMoney(task.totalAmount)}</td>
                        <td className="py-3 px-4 text-emerald-600 font-medium">${formatMoney(task.profit)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${task.status === "completed" ? "bg-emerald-50 text-emerald-700" : task.status === "cancelled" ? "bg-red-50 text-red-700" : task.status === "available" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{task.status}</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">{new Date(task.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditModal(task)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                            <button onClick={() => handleDeleteTask(task)} disabled={deletingTaskId === task._id} className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1">{deletingTaskId === task._id ? <Spinner size={12} /> : null}Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-6 text-center text-slate-500">No tasks in this group.</p>
            )}
            <Pagination page={groupTasksPage} totalPages={groupTaskTotalPages} total={groupTaskTotal} onPageChange={setGroupTasksPage} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Filter Tasks</h3>
              <div className="flex flex-wrap items-center gap-3">
                <select value={filterGroupId} onChange={(e) => { setFilterGroupId(e.target.value); setTasksPage(1); }} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 min-w-[140px]">
                  <option value="">All groups</option>
                  {taskGroups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
                </select>
                <select value={filterUserUid} onChange={(e) => { setFilterUserUid(e.target.value); setTasksPage(1); }} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 min-w-[160px]">
                  <option value="">All users</option>
                  {users.map((user) => <option key={user.uid} value={user.uid}>{user.email}</option>)}
                </select>
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setTasksPage(1); }} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 min-w-[120px]">
                  <option value="all">All types</option>
                  <option value="template">Templates</option>
                  <option value="assigned">Assigned</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
                <span className="text-xs text-slate-400 ml-auto">{tasksTotal} task{(tasksTotal !== 1) && "s"}</span>
              </div>
            </div>

            {tasksLoading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : !filterUserUid ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <svg className="h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <p className="text-sm font-medium">Select a user to view tasks</p>
                <p className="text-xs mt-1">Choose a user from the filter above to see their tasks.</p>
              </div>
            ) : tasks.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">App Name</th>
                      <th className="py-3 px-4">Group</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Profit</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {tasks.map((task) => (
                      <tr key={task._id} className="hover:bg-slate-50/40">
                        <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">{task.appName || task.title || "—"}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{(() => { const gid = task.taskGroupId || task.parentTaskGroupId; const g = taskGroups.find((gr) => gr._id === gid); return g ? g.name : "—"; })()}</td>
                        <td className="py-3 px-4 text-slate-600 text-xs">{task.assigneeEmail || (task.isTemplate ? <span className="text-slate-400 italic">Template</span> : task.assigneeUid?.slice(0, 12))}</td>
                        <td className="py-3 px-4">${formatMoney(task.totalAmount)}</td>
                        <td className="py-3 px-4 text-emerald-600 font-medium">${formatMoney(task.profit)}</td>
                        <td className="py-3 px-4">{task.isTemplate ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">Template</span> : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">Assigned</span>}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${task.status === "completed" ? "bg-emerald-50 text-emerald-700" : task.status === "cancelled" ? "bg-red-50 text-red-700" : task.status === "available" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{task.status}</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">{new Date(task.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditModal(task)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                            <button onClick={() => handleDeleteTask(task)} disabled={deletingTaskId === task._id} className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1">{deletingTaskId === task._id ? <Spinner size={12} /> : null}Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-6 text-center text-slate-500">No tasks match the selected filters.</p>
            )}
            <Pagination page={tasksPage} totalPages={tasksTotalPages} total={tasksTotal} onPageChange={setTasksPage} />
          </div>
        </div>
      )}

      {editTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl mt-10 mb-10">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-semibold">Edit Task</h2>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="App Name" value={editForm.appName} onChange={(e) => setEditForm((p) => ({ ...p, appName: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm" required />
              <input type="number" step="0.01" min="0.01" placeholder="Total Amount" value={editForm.totalAmount} onChange={(e) => setEditForm((p) => ({ ...p, totalAmount: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm" required />
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700 block mb-1">Task Group</label>
                <select value={editForm.taskGroupId} onChange={(e) => setEditForm((p) => ({ ...p, taskGroupId: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white w-full">
                  <option value="">— No group —</option>
                  {taskGroups.map((g) => {
                    const used = g.taskCount || 0;
                    const slotAvail = 40 - used;
                    const isCurrentGroup = g._id === editTask.taskGroupId;
                    return <option key={g._id} value={g._id} disabled={!isCurrentGroup && slotAvail <= 0}>{g.name} ({used}/30{isCurrentGroup ? "" : `, ${slotAvail} slots available`})</option>;
                  })}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700 block mb-1">App Logo</label>
                <div onDrop={handleEditDrop} onDragOver={handleEditDragOver} onDragLeave={handleEditDragLeave} onClick={() => editFileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${editDragOver ? "border-[#E05305] bg-orange-50" : "border-slate-300 hover:border-slate-400"}`}>
                  {editLogoPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={editLogoPreview} alt="Logo preview" className="h-20 w-20 object-contain rounded-lg" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeEditLogo(); }} className="text-xs text-red-500 hover:underline">Remove</button>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      <svg className="mx-auto h-10 w-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-sm">Drag & drop or click to upload</p>
                      <p className="text-xs mt-1">PNG, JPG, WEBP (max 2MB)</p>
                    </div>
                  )}
                  <input ref={editFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleEditLogoFile(e.target.files?.[0])} />
                </div>
              </div>
              <div className="md:col-span-2 bg-slate-50 rounded-lg px-4 py-3 flex items-center justify-between">
                <div><p className="text-sm font-medium text-slate-700">Calculated Profit (0.5%)</p><p className="text-xs text-slate-400">0.5% of total amount</p></div>
                <span className="text-lg font-bold text-[#E05305]">${formatMoney(editProfit)}</span>
              </div>
              <textarea placeholder="Description (optional)" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} className="md:col-span-2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm min-h-20" />
              <div className="md:col-span-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowEditSubmissionConfig(!showEditSubmissionConfig)} className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
                  <span className={`transition-transform ${showEditSubmissionConfig ? "rotate-90" : ""}`}>▸</span> Submission Requirements
                </button>
                {showEditSubmissionConfig && (
                  <div className="mt-3 space-y-4 pl-4 border-l-2 border-slate-100">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.submissionConfig.enabled} onChange={(e) => setEditForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, enabled: e.target.checked } }))} className="accent-[#E05305]" /> Enable custom submission requirements</label>
                    {editForm.submissionConfig.enabled && (<>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.submissionConfig.requireRating} onChange={(e) => setEditForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, requireRating: e.target.checked } }))} className="accent-[#E05305]" /> Require rating selection</label>
                      {editForm.submissionConfig.requireRating && (
                        <div className="space-y-2 pl-6">
                          <p className="text-xs text-slate-400 font-medium">Rating options:</p>
                          {editForm.submissionConfig.ratingOptions.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input value={opt} onChange={(e) => { const updated = [...editForm.submissionConfig.ratingOptions]; updated[i] = e.target.value; setEditForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, ratingOptions: updated } })); }} className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs" />
                              <button type="button" onClick={() => setEditForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, ratingOptions: p.submissionConfig.ratingOptions.filter((_, idx) => idx !== i) } }))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                            </div>
                          ))}
                          <div className="flex items-center gap-2">
                            <input value={editNewRatingOption} onChange={(e) => setEditNewRatingOption(e.target.value)} placeholder="New option..." className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs" />
                            <button type="button" onClick={() => { if (editNewRatingOption.trim()) { setEditForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, ratingOptions: [...p.submissionConfig.ratingOptions, editNewRatingOption.trim()] } })); setEditNewRatingOption(""); } }} className="text-blue-600 hover:text-blue-800 text-xs font-medium">+ Add</button>
                          </div>
                        </div>
                      )}
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.submissionConfig.requireFeedback} onChange={(e) => setEditForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, requireFeedback: e.target.checked } }))} className="accent-[#E05305]" /> Require feedback / comment</label>
                      {editForm.submissionConfig.requireFeedback && (
                        <div className="pl-6">
                          <label className="text-xs text-slate-500 block mb-1">Max feedback length</label>
                          <input type="number" min={1} max={5000} value={editForm.submissionConfig.maxFeedbackLength} onChange={(e) => setEditForm((p) => ({ ...p, submissionConfig: { ...p.submissionConfig, maxFeedbackLength: Number(e.target.value) } }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-32" />
                        </div>
                      )}
                    </>)}
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <button type="submit" disabled={updatingTask} className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {updatingTask && <Spinner />} Update Task
                </button>
                <button type="button" onClick={closeEditModal} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
