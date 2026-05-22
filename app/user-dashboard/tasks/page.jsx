"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import Swal from "sweetalert2";

export default function UserTasksPage() {
  const { user, loading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/tasks?assigneeUid=${encodeURIComponent(user.uid)}`);
        const data = await res.json();
        if (data?.success) setTasks(data.tasks || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user?.uid]);

  const handleComplete = async (task) => {
    const formatMoney = (val) => {
      const n = Number(val || 0);
      if (!Number.isFinite(n)) return '0.00';
      return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
    };

    const confirmed = await Swal.fire({
      icon: 'question',
      title: 'Mark task complete?',
      text: `You will receive $${formatMoney(task.reward)} for this task.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, complete',
    });

    if (!confirmed.isConfirmed) return;

    const res = await fetch('/api/user/tasks/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: task._id, uid: user.uid }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      await Swal.fire({ icon: 'error', title: 'Failed', text: result.message || 'Could not complete task' });
      return;
    }

    await Swal.fire({ icon: 'success', title: 'Completed', text: `You earned $${formatMoney(result.earned ?? task.reward)}` });
    setTasks((prev) => prev.map((t) => (String(t._id) === String(task._id) ? { ...t, status: 'completed', earnedAmount: result.earned } : t)));
  };

  if (loading || isLoading) return <div className="max-w-6xl mx-auto px-4 py-10 text-slate-600">Loading tasks...</div>;
  if (!user) return <div className="max-w-6xl mx-auto px-4 py-10">Please login to view tasks.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">My Tasks</h1>
      <div className="mt-4 space-y-3">
        {tasks.length ? (
          tasks.map((task) => (
            <div key={task._id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900">{task.title}</h3>
                <p className="text-sm text-slate-600">{task.description || 'No description'}</p>
                <p className="text-xs text-slate-500 mt-2">Reward: ${(() => {
                  const formatMoney = (val) => {
                    const n = Number(val || 0);
                    if (!Number.isFinite(n)) return '0.00';
                    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
                  };
                  return formatMoney(task.reward);
                })()}</p>
                {task.status === 'completed' && <p className="text-xs text-emerald-600">Earned: ${(() => {
                  const formatMoney = (val) => {
                    const n = Number(val || 0);
                    if (!Number.isFinite(n)) return '0.00';
                    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
                  };
                  return formatMoney(task.earnedAmount ?? task.reward);
                })()}</p>}
              </div>
              <div>
                {task.status !== 'completed' ? (
                  <button onClick={() => handleComplete(task)} className="bg-[#E05305] text-white rounded px-3 py-2">Mark Complete</button>
                ) : (
                  <span className="text-sm text-slate-600">Completed</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-slate-600">No tasks assigned.</div>
        )}
      </div>
    </div>
  );
}
