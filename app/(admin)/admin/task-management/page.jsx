"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function TaskManagementPage() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", assigneeUid: "", reward: "" });
  const [loading, setLoading] = useState(true);
  const [filterUserUid, setFilterUserUid] = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [filterDate, setFilterDate] = useState("");

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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!filterUserUid) {
      setAvailableDates([]);
      setFilterDate("");
      return;
    }

    const dates = tasks
      .filter((t) => t.assigneeUid === filterUserUid)
      .map((t) => {
        try {
          return new Date(t.createdAt).toISOString().slice(0, 10);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    const uniq = Array.from(new Set(dates)).sort((a, b) => (a < b ? 1 : -1));
    setAvailableDates(uniq);
    setFilterDate("");
  }, [filterUserUid, tasks]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const assignee = users.find((item) => item.uid === form.assigneeUid);
    if (!assignee) {
      await Swal.fire({ icon: "error", title: "Select a user", text: "Please select a target user." });
      return;
    }

    const response = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        assigneeUid: assignee.uid,
        assigneeEmail: assignee.email,
        reward: form.reward,
      }),
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

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Task Management</h1>

      <div className="bg-white rounded shadow p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">Assign New Task</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Task title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="border border-slate-300 rounded px-3 py-2"
            required
          />

          <select
            value={form.assigneeUid}
            onChange={(event) => setForm((prev) => ({ ...prev, assigneeUid: event.target.value }))}
            className="border border-slate-300 rounded px-3 py-2"
            required
          >
            <option value="">Select target user</option>
            {users.map((user) => (
              <option key={user.uid} value={user.uid}>
                {user.email}
              </option>
            ))}
          </select>

          <textarea
            placeholder="Task description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="md:col-span-2 border border-slate-300 rounded px-3 py-2 min-h-28"
          />

          <input
            type="number"
            step="0.01"
            placeholder="Reward amount"
            value={form.reward}
            onChange={(event) => setForm((prev) => ({ ...prev, reward: event.target.value }))}
            className="border border-slate-300 rounded px-3 py-2"
          />

          <button
            type="submit"
            className="md:col-span-2 bg-[#E05305] text-white rounded px-4 py-2.5 font-medium hover:bg-[#c84a04] transition"
          >
            Assign Task
          </button>
        </form>
      </div>

      <div className="mt-6 bg-white rounded shadow p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">Assigned Tasks</h2>

        <div className="mb-4 flex flex-col md:flex-row md:items-center md:space-x-4">
          <div className="mb-2 md:mb-0">
            <label className="text-sm text-slate-600 mr-2">Filter user:</label>
            <select
              value={filterUserUid}
              onChange={(e) => setFilterUserUid(e.target.value)}
              className="border border-slate-300 rounded px-3 py-2"
            >
              <option value="">All users</option>
              {users.map((user) => (
                <option key={user.uid} value={user.uid}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-600 mr-2">Filter date:</label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-slate-300 rounded px-3 py-2"
              disabled={!availableDates.length}
            >
              <option value="">All dates</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-600">Loading...</p>
        ) : (
          (() => {
            const filtered = tasks.filter((task) => {
              if (filterUserUid && task.assigneeUid !== filterUserUid) return false;
              if (filterDate) {
                const d = (() => {
                  try {
                    return new Date(task.createdAt).toISOString().slice(0, 10);
                  } catch (e) {
                    return null;
                  }
                })();
                if (d !== filterDate) return false;
              }
              return true;
            });

            if (!filtered.length) {
              return <p className="text-slate-600">No tasks match the selected filters.</p>;
            }

            return (
              <div className="space-y-3">
                {filtered.map((task) => (
                  <div key={task._id} className="border border-slate-200 rounded-lg p-3">
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{task.description || "No description"}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Assigned to: {task.assigneeEmail || task.assigneeUid} | Status: {task.status} | Reward: ${Number(task.reward || 0).toFixed(2)} | Date: {new Date(task.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
