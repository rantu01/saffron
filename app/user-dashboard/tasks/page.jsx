"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import Swal from "sweetalert2";

export default function UserTasksPage() {
  const { user, loading } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [setProgress, setSetProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [noGroupsAvailable, setNoGroupsAvailable] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  // Task Submission Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedRating, setSelectedRating] = useState("Peace of mind and security, very good app.");
  const [customComment, setCustomComment] = useState("Peace of mind and security, very good app.");

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return '0.00';
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const loadData = useCallback(async () => {
    if (!user?.uid) return [];
    try {
      const [tasksRes, progressRes, dashRes] = await Promise.all([
        fetch(`/api/admin/tasks?assigneeUid=${encodeURIComponent(user.uid)}`),
        fetch(`/api/admin/task-sets/progress?uid=${encodeURIComponent(user.uid)}`),
        fetch(`/api/user/dashboard?uid=${encodeURIComponent(user.uid)}`),
      ]);

      const tasksData = await tasksRes.json();
      const progressData = await progressRes.json();
      const dashData = await dashRes.json();

      if (dashData?.success) {
        setUserBalance(Number(dashData.dashboard?.availableBalance || 0));
      }

      const tasks = tasksData?.success ? (tasksData.tasks || []) : [];
      if (tasksData?.success) {
        setAssignedTasks(tasks);
      }
      if (progressData?.success && progressData.taskSets?.length) {
        setSetProgress(progressData.taskSets[0]);
      }

      return tasks;
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [user?.uid]);

  const tryAutoAssign = useCallback(async () => {
    if (!user?.uid) return false;
    setIsAutoAssigning(true);
    try {
      const res = await fetch("/api/user/tasks/auto-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });
      const data = await res.json();
      if (data?.success && data?.assigned) {
        setNoGroupsAvailable(false);
        return true;
      }
      if (data?.noGroups) {
        setNoGroupsAvailable(true);
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsAutoAssigning(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!user?.uid) { setIsLoading(false); return; }
      setIsLoading(true);
      setNoGroupsAvailable(false);
      const tasks = await loadData();
      if (cancelled) return;

      const hasPending = tasks.some((t) => t.status === "pending");
      if (!hasPending) {
        await tryAutoAssign();
        if (!cancelled) {
          await loadData();
        }
      }
      if (!cancelled) setIsLoading(false);
    }
    init();
    return () => { cancelled = true; };
  }, [user?.uid, loadData, tryAutoAssign]);

  const currentSetNumber = setProgress?.setNumber || 1;
  const completedCount = setProgress?.completedTasks || 0;
  const totalTasks = setProgress?.totalTasks || 30;
  const isAllComplete = completedCount >= totalTasks;

  const currentSetTasks = assignedTasks.filter(
    (t) => (t.setNumber || 1) === currentSetNumber && t.position > 0
  );

  const getNextPendingTask = () => {
    if (!setProgress) {
      const pending = assignedTasks.find((t) => t.status === "pending");
      return pending || null;
    }
    const currentPos = setProgress.currentPosition || 0;
    return currentSetTasks
      .filter((t) => t.position > currentPos && t.status === "pending")
      .sort((a, b) => a.position - b.position)[0] || null;
  };

  const handleStartTask = () => {
    if (isAllComplete) return;
    const nextTask = getNextPendingTask();
    if (!nextTask) {
      Swal.fire({
        icon: "info",
        title: "No task available",
        text: "No pending task found. Contact admin if you believe this is an error.",
      });
      return;
    }

    const requiredBal = Number(nextTask.totalAmount || nextTask.requiredBalance || 0);
    if (userBalance < requiredBal) {
      Swal.fire({
        icon: "error",
        title: "Insufficient Balance",
        text: `You need at least $${formatMoney(requiredBal)} to start this task. Your balance: $${formatMoney(userBalance)}`,
      });
      return;
    }

    setSelectedTask(nextTask);
    setSelectedRating("Peace of mind and security, very good app.");
    setCustomComment("Peace of mind and security, very good app.");
    setIsModalOpen(true);
  };

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
        setAssignedTasks((prev) =>
          prev.map((t) =>
            String(t._id) === String(selectedTask._id)
              ? { ...t, status: "cancelled" }
              : t
          )
        );
        setSetProgress((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentPosition: (prev.currentPosition || 0) + 1,
          };
        });
      } else {
        await Swal.fire({ icon: "error", title: "Failed", text: result.message || "Could not cancel task." });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong!" });
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedTask) return;

    const subConfig = selectedTask.submissionConfig;
    const requireRating = subConfig ? subConfig.requireRating !== false : true;
    const requireFeedback = subConfig ? subConfig.requireFeedback !== false : true;

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
          ratingOption: selectedRating,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        await Swal.fire({ icon: 'error', title: 'Failed', text: result.message || 'Could not complete task' });
        return;
      }

      setUserBalance((prev) => prev + result.earned);

      if (result.setComplete) {
        const assigned = await tryAutoAssign();
        await loadData();
        if (!assigned) {
          await Swal.fire({
            icon: 'success',
            title: 'Set Completed!',
            text: noGroupsAvailable
              ? 'No tasks available now. Please try again later.'
              : `You earned $${formatMoney(result.earned)}. New tasks loaded.`,
          });
        } else {
          await Swal.fire({
            icon: 'success',
            title: 'Set Completed!',
            text: `You earned $${formatMoney(result.earned)}. Next group assigned automatically.`,
          });
        }
      } else {
        await Swal.fire({
          icon: 'success',
          title: 'Task Completed!',
          text: `You earned $${formatMoney(result.earned)} (Total: $${formatMoney(result.totalAmount)} + Profit: $${formatMoney(result.profit)})`,
        });
        setAssignedTasks((prev) =>
          prev.map((t) =>
            String(t._id) === String(selectedTask._id)
              ? { ...t, status: 'completed', earnedAmount: result.earned }
              : t
          )
        );
        setSetProgress((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentPosition: (prev.currentPosition || 0) + 1,
            completedTasks: (prev.completedTasks || 0) + 1,
          };
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong!' });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6 animate-pulse">
        <div className="h-7 w-32 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-48 bg-slate-200 rounded" />
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center">
          <div className="h-24 w-24 bg-slate-200 rounded-full mb-4" />
          <div className="h-10 w-32 bg-slate-200 rounded-lg mb-3" />
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-12 w-40 bg-slate-200 rounded-lg mt-6" />
        </div>
      </div>
    );
  }
  if (!user) return <div className="max-w-2xl mx-auto px-4 py-10">Please login to view tasks.</div>;

  const nextTask = getNextPendingTask();

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

  const taskStartAmount = nextTask?.totalAmount || 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
        <p className="text-sm text-slate-500 mt-0.5">Complete tasks one at a time</p>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center">
        {/* Progress Circle */}
        <div className="relative h-28 w-28 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={isAllComplete ? "#10b981" : "#E05305"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(completedCount / totalTasks) * 327} 327`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-slate-900">
              {completedCount}
              <span className="text-lg text-slate-400">/{totalTasks}</span>
            </span>
          </div>
        </div>

          {noGroupsAvailable ? (
          <div className="text-center">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-lg font-bold text-slate-900 mb-1">No tasks available now</p>
            <p className="text-sm text-slate-500">Please try again later.</p>
          </div>
        ) : isAllComplete ? (
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600 mb-1">{totalTasks}/{totalTasks} Completed</p>
            <p className="text-sm text-slate-500">{isAutoAssigning ? "Loading next group..." : "Congratulations! You have completed all tasks in this set."}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg font-bold text-slate-900">
              {completedCount} of {totalTasks} Completed
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {nextTask
                ? `Next: ${nextTask.appName}`
                : isAutoAssigning
                  ? "Loading tasks..."
                  : "No pending tasks available"}
            </p>
            {nextTask && Number(taskStartAmount) > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                Required balance: ${formatMoney(taskStartAmount)}
              </p>
            )}
            {!nextTask && !isAutoAssigning && !noGroupsAvailable && (
              <button
                onClick={async () => {
                  await tryAutoAssign();
                  await loadData();
                }}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Check for new tasks
              </button>
            )}
          </div>
        )}

        {!isAllComplete && nextTask && !noGroupsAvailable && (
          <button
            onClick={handleStartTask}
            className="mt-6 bg-[#E05305] text-white rounded-xl px-10 py-3 font-semibold hover:bg-[#c84a04] transition shadow-lg shadow-orange-200"
          >
            Start
          </button>
        )}
      </div>

      {/* Task Submission Modal */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[380px] shadow-2xl relative overflow-hidden flex flex-col font-sans text-[#333]">
            <button
              onClick={handleCloseModal}
              className="absolute top-3 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ✕
            </button>

            <div className="p-5 pb-3 text-center border-b border-slate-100">
              <h2 className="text-[#E05305] text-lg font-bold">{selectedTask.appName || "Task Submission"}</h2>

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

            <div className="p-4 space-y-4 text-[12px] flex-1 max-h-[400px] overflow-y-auto">
              <div className="flex justify-between text-slate-500">
                <span>Creation time</span>
                <span>{selectedTask.createdAt ? new Date(selectedTask.createdAt).toISOString().replace('T', ' ').substring(0, 19) : "—"}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Progress</span>
                <span className="font-medium">{completedCount + 1}/{totalTasks}</span>
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
