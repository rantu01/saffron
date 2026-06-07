"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import Swal from "sweetalert2";

export default function UserTasksPage() {
  const { user, loading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [setProgress, setSetProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dailyEarnings, setDailyEarnings] = useState([]);

  const TASKS_PER_PAGE = 15;

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return '0.00';
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.uid) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const [tasksRes, progressRes, logsRes] = await Promise.all([
          fetch(`/api/admin/tasks?assigneeUid=${encodeURIComponent(user.uid)}`),
          fetch(`/api/admin/task-sets/progress?uid=${encodeURIComponent(user.uid)}`),
          fetch(`/api/user/balance-logs?uid=${encodeURIComponent(user.uid)}&type=task_earnings&limit=200`),
        ]);

        const tasksData = await tasksRes.json();
        const progressData = await progressRes.json();
        const logsData = await logsRes.json();

        if (cancelled) return;

        if (tasksData?.success) {
          let filtered = tasksData.tasks || [];
          if (filterDateStart) {
            filtered = filtered.filter((t) => new Date(t.createdAt) >= new Date(filterDateStart));
          }
          if (filterDateEnd) {
            const end = new Date(filterDateEnd);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter((t) => new Date(t.createdAt) <= end);
          }
          setTotalPages(Math.max(1, Math.ceil(filtered.length / TASKS_PER_PAGE)));
          setTasks(filtered);
        }
        if (progressData?.success && progressData.taskSets?.length) {
          setSetProgress(progressData.taskSets[0]);
        }
        if (logsData?.success && logsData.logs) {
          const daily = {};
          for (const log of logsData.logs) {
            const day = new Date(log.createdAt).toLocaleDateString();
            if (!daily[day]) daily[day] = 0;
            daily[day] += Number(log.amount || 0);
          }
          setDailyEarnings(
            Object.entries(daily)
              .map(([date, amount]) => ({ date, amount }))
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 14)
          );
        }
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.uid, filterDateStart, filterDateEnd]);

  const handleComplete = async (task) => {
    const isCombinationTask = Boolean(task.isCombinationTask || task.taskType === 'combination' || (task.combinationPositions || []).includes(task.position));
    const multiplier = isCombinationTask ? 5 : 1;
    const totalReward = Number(task.reward || 0) * multiplier;
    const requiredBalance = Number(task.requiredBalance || 0);

    let rewardText = `You will receive $${formatMoney(totalReward)} for this task.`;
    if (isCombinationTask) {
      rewardText += `\n\nBonus! This is a combination task.\nBase reward: $${formatMoney(task.reward)}\n5x multiplier applied!`;
    }
    if (requiredBalance > 0) {
      rewardText += `\n\nRequired balance: $${formatMoney(requiredBalance)}`;
    }
    const confirmationHtml = rewardText.replace(/\n/g, "<br/>");

    const confirmed = await Swal.fire({
      icon: 'question',
      title: 'Mark task complete?',
      html: confirmationHtml,
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

    let successMessage = `You earned $${formatMoney(result.earned ?? task.reward)}`;
    if (result.isCombinationTask) {
      successMessage = `Bonus! You earned $${formatMoney(result.earned)} (${result.baseReward} x ${result.multiplier})`;
    }
    await Swal.fire({ icon: 'success', title: 'Completed', text: successMessage });

    setTasks((prev) => prev.map((t) => (String(t._id) === String(task._id) ? { ...t, status: 'completed', earnedAmount: result.earned } : t)));

    setSetProgress((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentPosition: (prev.currentPosition || 0) + 1,
        completedTasks: (prev.completedTasks || 0) + 1,
      };
    });
  };

  if (loading || isLoading) return <div className="max-w-6xl mx-auto px-4 py-10 text-slate-600">Loading tasks...</div>;
  if (!user) return <div className="max-w-6xl mx-auto px-4 py-10">Please login to view tasks.</div>;

  const paginatedTasks = tasks.slice((page - 1) * TASKS_PER_PAGE, page * TASKS_PER_PAGE);
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const maxEarning = Math.max(...dailyEarnings.map((d) => d.amount), 1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {completedCount} of {tasks.length} completed
          </p>
        </div>
      </div>

      {setProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-900 font-medium">
              Set {setProgress.setNumber}: Task {setProgress.currentPosition + 1} / {setProgress.totalTasks}
            </p>
            <span className="text-xs text-blue-700 font-semibold">
              {Math.round((setProgress.completedTasks / setProgress.totalTasks) * 100)}%
            </span>
          </div>
          <div className="mt-2 bg-blue-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all"
              style={{ width: `${(setProgress.completedTasks / setProgress.totalTasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {dailyEarnings.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Daily Earnings (Last 14 Days)</h2>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-1.5 h-24">
              {dailyEarnings.slice().reverse().map((day) => {
                const height = Math.max(4, (day.amount / maxEarning) * 100);
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      ${formatMoney(day.amount)}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t hover:from-emerald-600 transition-all cursor-pointer min-h-[4px]"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[9px] text-slate-400 -rotate-45 origin-left whitespace-nowrap">
                      {new Date(day.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={filterDateStart}
            onChange={(e) => { setFilterDateStart(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={filterDateEnd}
            onChange={(e) => { setFilterDateEnd(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          />
          {(filterDateStart || filterDateEnd) && (
            <button
              onClick={() => { setFilterDateStart(""); setFilterDateEnd(""); setPage(1); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto">{tasks.length} task{(tasks.length !== 1) && "s"}</span>
        </div>
      </div>

      <div className="space-y-3">
        {paginatedTasks.length ? (
          paginatedTasks.map((task) => {
            const isCombo = Boolean(task.isCombinationTask || task.taskType === 'combination' || (task.combinationPositions || []).includes(task.position));
            const currentPos = setProgress?.currentPosition || 0;
            const isCurrentTask = task.position === currentPos + 1;
            const isCompleted = task.status === 'completed';
            const canComplete = isCurrentTask && !isCompleted;
            const multiplier = isCombo ? 5 : 1;

            return (
              <div
                key={task._id}
                className={`bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between ${
                  isCombo ? 'border-amber-300 bg-amber-50' : 'border-slate-200'
                } ${isCurrentTask && !isCompleted ? 'ring-2 ring-[#E05305]' : ''}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">{task.title}</h3>
                    {task.position && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        isCombo ? 'bg-amber-200 text-amber-900 font-semibold' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isCombo ? 'Combination Task' : `Task ${task.position}`}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{task.description || 'No description'}</p>
                  <p className={`text-xs mt-2 ${isCombo ? 'text-amber-700 font-semibold' : 'text-slate-500'}`}>
                    Reward: ${formatMoney(task.reward)}{isCombo && ` x ${multiplier} = $${formatMoney(task.reward * multiplier)}`}
                  </p>
                  {Number(task.requiredBalance || 0) > 0 && (
                    <p className="text-xs text-slate-500 mt-1">Required balance: ${formatMoney(task.requiredBalance)}</p>
                  )}
                  {isCompleted && (
                    <p className="text-xs text-emerald-600">
                      Earned: ${formatMoney(task.earnedAmount ?? task.reward)}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  {canComplete ? (
                    <button
                      onClick={() => handleComplete(task)}
                      className="bg-[#E05305] text-white rounded px-3 py-2 hover:bg-[#c84a04]"
                    >
                      Mark Complete
                    </button>
                  ) : isCompleted ? (
                    <span className="text-sm text-emerald-600 font-medium">Completed</span>
                  ) : (
                    <span className="text-sm text-slate-400">Locked</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            No tasks found.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
