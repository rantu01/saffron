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
  const [userBalance, setUserBalance] = useState(0);

  // Task Submission Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedRating, setSelectedRating] = useState("Peace of mind and security, very good app.");
  const [customComment, setCustomComment] = useState("Peace of mind and security, very good app.");

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
        const [tasksRes, progressRes, logsRes, dashRes] = await Promise.all([
          fetch(`/api/admin/tasks?assigneeUid=${encodeURIComponent(user.uid)}`),
          fetch(`/api/admin/task-sets/progress?uid=${encodeURIComponent(user.uid)}`),
          fetch(`/api/user/balance-logs?uid=${encodeURIComponent(user.uid)}&type=task_earnings&limit=200`),
          fetch(`/api/user/dashboard?uid=${encodeURIComponent(user.uid)}`),
        ]);

        const tasksData = await tasksRes.json();
        const progressData = await progressRes.json();
        const logsData = await logsRes.json();
        const dashData = await dashRes.json();

        if (dashData?.success) {
          setUserBalance(Number(dashData.dashboard?.availableBalance || 0));
        }

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

  // Open the customized Task Submission UI Modal
  const handleOpenCompleteModal = (task) => {
    setSelectedTask(task);
    setSelectedRating("Peace of mind and security, very good app.");
    setCustomComment("Peace of mind and security, very good app.");
    setIsModalOpen(true);
  };

  // Close modal with confirmation — deduct totalAmount if confirmed
  const handleCloseModal = async () => {
    if (!selectedTask) { setIsModalOpen(false); return; }

    const totalAmt = Number(selectedTask.totalAmount || 0);
    if (totalAmt <= 0) { setIsModalOpen(false); return; }

    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Close without submitting?",
      text: `Are you sure you want to close this task without submitting it? The task amount of $${formatMoney(totalAmt)} will be deducted from your account balance.`,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, close",
      cancelButtonText: "Go back",
    });

    if (!confirmed.isConfirmed) return;

    setIsModalOpen(false);

    try {
      const res = await fetch("/api/user/tasks/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: selectedTask._id, uid: user.uid }),
      });
      const result = await res.json();
      if (result.success) {
        await Swal.fire({
          icon: "info",
          title: "Task cancelled",
          text: `$${formatMoney(result.deductedAmount)} deducted from your account.`,
        });
        setUserBalance(result.balanceAfter || 0);
        setTasks((prev) => prev.map((t) => (String(t._id) === String(selectedTask._id) ? { ...t, status: "cancelled" } : t)));
      } else {
        await Swal.fire({ icon: "error", title: "Failed", text: result.message || "Could not cancel task." });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong!" });
    }
  };

  // Process the final API Call
  const handleFinalSubmit = async () => {
    if (!selectedTask) return;

    if (requireRating && !selectedRating) {
      await Swal.fire({ icon: 'error', title: 'Required', text: 'Please select a rating option.' });
      return;
    }
    if (requireFeedback && !customComment.trim()) {
      await Swal.fire({ icon: 'error', title: 'Required', text: 'Please provide feedback.' });
      return;
    }

    setIsModalOpen(false);

    try {
      const res = await fetch('/api/user/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId: selectedTask._id, 
          uid: user.uid,
          feedback: customComment,
          ratingOption: selectedRating
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        await Swal.fire({ icon: 'error', title: 'Failed', text: result.message || 'Could not complete task' });
        return;
      }

      await Swal.fire({
        icon: 'success',
        title: 'Completed',
        text: `You earned $${formatMoney(result.earned)} (Total: $${formatMoney(result.totalAmount)} + Profit: $${formatMoney(result.profit)})`,
      });

      setTasks((prev) => prev.map((t) => (String(t._id) === String(selectedTask._id) ? { ...t, status: 'completed', earnedAmount: result.earned } : t)));
      setUserBalance((prev) => prev + result.earned);

      setSetProgress((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentPosition: (prev.currentPosition || 0) + 1,
          completedTasks: (prev.completedTasks || 0) + 1,
        };
      });
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong!' });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-32 bg-slate-200 rounded mb-2" />
            <div className="h-4 w-40 bg-slate-200 rounded" />
          </div>
        </div>

        {/* Progress bar skeleton */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 w-48 bg-blue-200 rounded" />
            <div className="h-4 w-10 bg-blue-200 rounded" />
          </div>
          <div className="h-2.5 bg-blue-200 rounded-full" />
        </div>

        {/* Chart skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="h-4 w-44 bg-slate-200 rounded" />
          </div>
          <div className="p-4">
            <div className="flex items-end gap-1.5 h-24">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex-1 bg-slate-200 rounded-t" style={{ height: `${20 + Math.random() * 80}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Filter skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
          <div className="flex gap-3">
            <div className="h-9 w-36 bg-slate-200 rounded-lg" />
            <div className="h-9 w-36 bg-slate-200 rounded-lg" />
          </div>
        </div>

        {/* Task cards skeleton */}
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 bg-slate-200 rounded" />
                  <div className="h-5 w-36 bg-slate-200 rounded" />
                </div>
                <div className="h-4 w-64 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-48 bg-slate-200 rounded" />
              </div>
              <div className="h-9 w-28 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!user) return <div className="max-w-6xl mx-auto px-4 py-10">Please login to view tasks.</div>;

  const paginatedTasks = tasks.slice((page - 1) * TASKS_PER_PAGE, page * TASKS_PER_PAGE);
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const maxEarning = Math.max(...dailyEarnings.map((d) => d.amount), 1);

  const DEFAULT_RATING_OPTIONS = [
    "Peace of mind and security, very good app.",
    "Convenient, easy, and simple.",
    "Update too often.",
    "This is very good software.",
    "Free is quite good, but from time to time it shows that the server is busy, I hope to get improved."
  ];

  const taskSubConfig = selectedTask?.submissionConfig;
  const ratingOptions = taskSubConfig?.ratingOptions?.length ? taskSubConfig.ratingOptions : DEFAULT_RATING_OPTIONS;
  const requireRating = taskSubConfig ? taskSubConfig.requireRating !== false : true;
  const requireFeedback = taskSubConfig ? taskSubConfig.requireFeedback !== false : true;
  const maxFeedbackLength = taskSubConfig?.maxFeedbackLength || 500;

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
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Daily Earnings</h2>
                <p className="text-[11px] text-slate-400">Last 14 days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-sm font-bold text-emerald-600">${formatMoney(dailyEarnings.reduce((s, d) => s + d.amount, 0))}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="px-5 pt-6 pb-4">
            {/* Y-axis labels + bars */}
            <div className="flex items-end gap-[3px] h-32 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="border-t border-slate-100 h-0" />
                ))}
              </div>

              {dailyEarnings.slice().reverse().map((day, idx) => {
                const height = Math.max(6, (day.amount / maxEarning) * 100);
                const isToday = idx === dailyEarnings.length - 1;
                const isBest = day.amount === maxEarning;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 group relative h-full justify-end">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                      <div className="bg-slate-800 text-white text-[11px] font-semibold rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                        ${formatMoney(day.amount)}
                      </div>
                      <div className="w-2 h-2 bg-slate-800 rotate-45 -mt-1" />
                    </div>

                    {/* Bar */}
                    <div className="w-full flex justify-center">
                      <div
                        className={`w-full max-w-[28px] rounded-[4px] transition-all duration-300 cursor-pointer relative overflow-hidden
                          ${isBest ? 'bg-gradient-to-t from-emerald-500 to-emerald-300 shadow-sm shadow-emerald-200' : 'bg-gradient-to-t from-emerald-400/80 to-emerald-300/60'}
                          group-hover:scale-[1.05] group-hover:shadow-md`}
                        style={{ height: `${height}%`, minHeight: '6px' }}
                      >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/20 to-white/0" />
                      </div>
                    </div>

                    {/* Date label */}
                    <span className={`text-[10px] whitespace-nowrap font-medium ${isToday ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {new Date(day.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                Daily earnings
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Best day
              </span>
            </div>
            <span>
              Avg ${formatMoney(dailyEarnings.reduce((s, d) => s + d.amount, 0) / dailyEarnings.length)}
            </span>
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
            const isCompleted = task.status === 'completed';
            const isCancelled = task.status === 'cancelled';
            const requiredBal = Number(task.totalAmount || task.requiredBalance || 0);
            const insufficientBalance = !isCompleted && !isCancelled && userBalance < requiredBal;
            const canComplete = !isCompleted && !isCancelled && !insufficientBalance;
            const multiplier = isCombo ? 5 : 1;

            return (
              <div
                key={task._id}
                className={`bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between ${
                  isCombo ? 'border-amber-300 bg-amber-50' : 'border-slate-200'
                } ${canComplete ? 'ring-2 ring-[#E05305]' : ''}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    {task.appLogo && (
                      <img src={task.appLogo} alt="" className="h-8 w-8 object-contain rounded" />
                    )}
                    <h3 className="font-medium text-slate-900">{task.appName || task.title}</h3>
                    
                  </div>
                  <p className="text-sm text-slate-600">{task.description || 'No description'}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Total: ${formatMoney(task.totalAmount || 0)} | Profit: ${formatMoney(task.profit || 0)}
                  </p>
                  {Number(task.totalAmount || 0) > 0 && (
                    <p className="text-xs text-slate-500">Required balance: ${formatMoney(task.totalAmount)}</p>
                  )}
                  {isCompleted && (
                    <p className="text-xs text-emerald-600">
                      Earned: ${formatMoney(task.earnedAmount ?? task.totalAmount + task.profit)}
                    </p>
                  )}
                  {isCancelled && (
                    <p className="text-xs text-red-500">Cancelled</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  {isCompleted ? (
                    <span className="text-sm text-emerald-600 font-medium">Completed</span>
                  ) : isCancelled ? (
                    <span className="text-sm text-red-500 font-medium">Cancelled</span>
                  ) : insufficientBalance ? (
                    <span className="text-xs text-red-500 font-medium text-right">
                      Insufficient<br />Balance
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenCompleteModal(task)}
                      className="bg-[#E05305] text-white rounded px-3 py-2 hover:bg-[#c84a04]"
                    >
                      Mark Complete
                    </button>
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

      {/* Task Submission Modal */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[380px] shadow-2xl relative overflow-hidden flex flex-col font-sans text-[#333]">
            
            {/* Top Close Icon Button — triggers confirmation */}
            <button 
              onClick={handleCloseModal}
              className="absolute top-3 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ✕
            </button>

            {/* Header Content */}
            <div className="p-5 pb-3 text-center border-b border-slate-100">
              <h2 className="text-[#E05305] text-lg font-bold">{selectedTask.appName || "Task Submission"}</h2>
              
              {/* Brand Logo */}
              <div className="my-3 flex justify-center">
                {selectedTask.appLogo ? (
                  <img src={selectedTask.appLogo} alt="" className="h-16 w-16 object-contain rounded-xl" />
                ) : (
                  <div className="w-16 h-16 bg-[#E05305] rounded-xl flex items-center justify-center text-white font-black text-xs p-1">
                    <span className="tracking-tighter text-center uppercase leading-none">{(selectedTask.appName || "Task").slice(0, 2)}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide">{selectedTask.appName || "Task"}</p>
              
              {/* Total amount and profit blocks */}
              <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Total amount</span>
                  <span className="text-[#E05305] text-sm font-bold">
                    USDC/T {formatMoney(selectedTask.totalAmount || selectedTask.requiredBalance || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Profit</span>
                  <span className="text-[#E05305] text-sm font-bold">
                    USDC/T {formatMoney(selectedTask.profit || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Application evaluation details */}
            <div className="p-4 space-y-4 text-[12px] flex-1 max-h-[400px] overflow-y-auto">
              <div className="flex justify-between text-slate-500">
                <span>Creation time</span>
                <span>{new Date(selectedTask.createdAt || Date.now()).toISOString().replace('T', ' ').substring(0, 19)}</span>
              </div>

              {requireRating && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 font-medium">Application Evaluation</span>
                    <div className="flex text-amber-400 text-sm">★★★★★</div>
                  </div>
                  <div className="space-y-2.5 mt-2">
                    {ratingOptions.map((opt, idx) => (
                      <label key={idx} className="flex items-start gap-2.5 cursor-pointer text-slate-600 leading-tight">
                        <input
                          type="radio"
                          name="rating_option"
                          checked={selectedRating === opt}
                          onChange={() => {
                            setSelectedRating(opt);
                            setCustomComment(opt);
                          }}
                          className="mt-0.5 accent-[#E05305] h-3.5 w-3.5 shrink-0"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {requireFeedback && (
                <div className="pt-2">
                  <textarea
                    value={customComment}
                    onChange={(e) => setCustomComment(e.target.value.slice(0, maxFeedbackLength))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#E05305] resize-none h-20"
                    placeholder="Write your feedback..."
                  />
                  <div className="text-right text-[10px] text-slate-400 mt-1">
                    {customComment.length}/{maxFeedbackLength}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Submit Action Button */}
            <button
              onClick={handleFinalSubmit}
              className="w-full bg-[#E05305] hover:bg-[#c84a04] text-white text-sm font-bold py-3.5 text-center transition-colors"
            >
              Submit
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
