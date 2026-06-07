"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function TaskManagementPage() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", assigneeUid: "", reward: "" });
  const [loading, setLoading] = useState(true);
  const [filterUserUid, setFilterUserUid] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [bulkForm, setBulkForm] = useState({ assigneeUid: "", baseReward: "10" });
  const [showBulk, setShowBulk] = useState(false);

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const assignee = users.find((item) => item.uid === form.assigneeUid);
    if (!assignee) {
      await Swal.fire({ icon: "error", title: "Select a user", text: "Please select a target user." });
      return;
    }
    const response = await fetch("/api/admin/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, description: form.description, assigneeUid: assignee.uid, assigneeEmail: assignee.email, reward: form.reward }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Task assign failed", text: result.message || "Please try again." });
      return;
    }
    await Swal.fire({ icon: "success", title: "Task assigned", timer: 1300, showConfirmButton: false });
    setForm({ title: "", description: "", assigneeUid: "", reward: "" });
    loadData();
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const assignee = users.find((item) => item.uid === bulkForm.assigneeUid);
    if (!assignee) {
      await Swal.fire({ icon: "error", title: "Select a user", text: "Please select a target user." });
      return;
    }

    const tasks30 = Array.from({ length: 30 }, (_, i) => ({
      title: `Task ${i + 1}`,
      description: "",
      reward: Number(bulkForm.baseReward),
      assigneeEmail: assignee.email,
    }));

    const response = await fetch("/api/admin/task-sets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: assignee.uid, tasks: tasks30 }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      await Swal.fire({ icon: "error", title: "Bulk creation failed", text: result.message || "Please try again." });
      return;
    }
    await Swal.fire({ icon: "success", title: "30-task set created", text: `Combination tasks will be auto-assigned.` });
    setShowBulk(false);
    loadData();
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterUserUid && task.assigneeUid !== filterUserUid) return false;
    if (filterType === "combination" && !task.isCombinationTask && task.taskType !== "combination") return false;
    if (filterType === "completed" && task.status !== "completed") return false;
    if (filterType === "pending" && task.status !== "pending") return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Task Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{tasks.length} total tasks</p>
        </div>
        <button onClick={() => setShowBulk(!showBulk)} className="bg-blue-600 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-blue-700 transition">
          {showBulk ? "Single Task" : "Bulk Create (30 Tasks)"}
        </button>
      </div>

      {!showBulk ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Assign New Task</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Task title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm" required />
            <select value={form.assigneeUid} onChange={(e) => setForm((p) => ({ ...p, assigneeUid: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white" required>
              <option value="">Select target user</option>
              {users.map((user) => (<option key={user.uid} value={user.uid}>{user.email}</option>))}
            </select>
            <textarea placeholder="Task description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="md:col-span-2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm min-h-24" />
            <input type="number" step="0.01" placeholder="Reward amount" value={form.reward} onChange={(e) => setForm((p) => ({ ...p, reward: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
            <button type="submit" className="md:col-span-2 bg-[#E05305] text-white rounded-lg px-4 py-2.5 font-medium hover:bg-[#c84a04] transition">Assign Task</button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Bulk Create 30-Task Set</h2>
          <p className="text-sm text-slate-500 mb-4">Creates a full 30-task set with auto-generated combination tasks (5 random positions).</p>
          <form onSubmit={handleBulkSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={bulkForm.assigneeUid} onChange={(e) => setBulkForm((p) => ({ ...p, assigneeUid: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white" required>
              <option value="">Select target user</option>
              {users.map((user) => (<option key={user.uid} value={user.uid}>{user.email}</option>))}
            </select>
            <input type="number" step="0.01" placeholder="Base reward per task" value={bulkForm.baseReward} onChange={(e) => setBulkForm((p) => ({ ...p, baseReward: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
            <button type="submit" className="md:col-span-2 bg-blue-600 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-blue-700 transition">Create 30-Task Set</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <select value={filterUserUid} onChange={(e) => setFilterUserUid(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All users</option>
            {users.map((user) => (<option key={user.uid} value={user.uid}>{user.email}</option>))}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">All types</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="combination">Combination only</option>
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
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Multiplier</th>
                  <th className="py-3 px-4">Reward</th>
                  <th className="py-3 px-4">Required Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTasks.map((task) => {
                  const isCombo = task.isCombinationTask || task.taskType === "combination";
                  return (
                    <tr key={task._id} className={`hover:bg-slate-50/40 ${isCombo ? "bg-amber-50/30" : ""}`}>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">{task.title}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">{task.assigneeEmail || task.assigneeUid?.slice(0, 12)}</td>
                      <td className="py-3 px-4 text-slate-600">#{task.position || "—"}</td>
                      <td className="py-3 px-4">
                        {isCombo ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">Combination</span>
                        ) : (
                          <span className="text-slate-500">Single</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{isCombo ? `${task.profitMultiplier || 5}x` : "1x"}</td>
                      <td className="py-3 px-4 font-medium">${formatMoney(task.reward)}</td>
                      <td className="py-3 px-4 text-slate-500">${formatMoney(task.requiredBalance)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${task.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">{new Date(task.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
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
