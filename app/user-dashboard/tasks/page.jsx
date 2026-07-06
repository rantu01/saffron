"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import Swal from "sweetalert2";
import { Crown, Star, Trophy } from "lucide-react";
import ScreenshotCarousel from "./components/ScreenshotCarousel";
import FloatingAppIcons from "./components/FloatingAppIcons";
import ComboTaskModal from "./components/ComboTaskModal";

export default function UserTasksPage() {
  const { user, loading } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [setProgress, setSetProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [noGroupsAvailable, setNoGroupsAvailable] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [frozenBalance, setFrozenBalance] = useState(0);

  const [activeCombo, setActiveCombo] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);

  const VIP_TIERS = [
    { level: 1, name: "VIP 1", label: "Bronze", minDeposit: 25, dailyProfit: 0.5, unlockBalance: 0, gradient: "from-blue-600 to-blue-400", badgeBg: "bg-blue-500" },
    { level: 2, name: "VIP 2", label: "Silver", minDeposit: 1500, dailyProfit: 2, unlockBalance: 1500, gradient: "from-purple-600 to-purple-400", badgeBg: "bg-purple-500" },
    { level: 3, name: "VIP 3", label: "Gold", minDeposit: 5000, dailyProfit: 6, unlockBalance: 5000, gradient: "from-amber-600 to-orange-400", badgeBg: "bg-amber-500" },
    { level: 4, name: "VIP 4", label: "Diamond", minDeposit: 10000, dailyProfit: 12, unlockBalance: 10000, gradient: "from-red-600 to-rose-500", badgeBg: "bg-red-500" },
  ];

  const currentVipLevel = (() => {
    if (userBalance >= 10000) return 4;
    if (userBalance >= 5000) return 3;
    if (userBalance >= 1500) return 2;
    return 1;
  })();

  const currentTier = VIP_TIERS[currentVipLevel - 1];
  const nextTier = VIP_TIERS.find(t => t.level === currentVipLevel + 1) || null;

  const vipProgressPercent = nextTier
    ? Math.min(Math.max(Math.round(((userBalance - currentTier.unlockBalance) / (nextTier.unlockBalance - currentTier.unlockBalance)) * 100), 0), 100)
    : 100;

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
        setFrozenBalance(Number(dashData.dashboard?.frozenBalance || 0));
        if (dashData.dashboard?.activeComboTask) {
          setActiveCombo(dashData.dashboard.activeComboTask);
        } else {
          setActiveCombo(null);
        }
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

  useEffect(() => {
    if (activeCombo && (activeCombo.status === "in_progress" || activeCombo.status === "waiting_balance")) {
      setShowComboModal(true);
    }
  }, [activeCombo]);

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

    if (nextTask.isComboTask && nextTask.taskType === "combo") {
      const comboId = nextTask.comboId;
      if (!comboId) {
        Swal.fire({ icon: "error", title: "Error", text: "Combo task data not found." });
        return;
      }

      fetch(`/api/user/tasks/combo?uid=${encodeURIComponent(user.uid)}&setNumber=${nextTask.setNumber || 1}&position=${nextTask.position}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && data?.combo) {
            setActiveCombo(data.combo);
            setShowComboModal(true);
          } else {
            Swal.fire({ icon: "error", title: "Error", text: "Could not load combo task data." });
          }
        })
        .catch(() => {
          Swal.fire({ icon: "error", title: "Error", text: "Failed to load combo task." });
        });
      return;
    }

    const MINIMUM_BALANCE = 40;
    if (userBalance < MINIMUM_BALANCE) {
      Swal.fire({
        icon: "error",
        title: "Insufficient Balance",
        text: `Your account balance must be at least $${formatMoney(MINIMUM_BALANCE)} to start any task. Your balance: $${formatMoney(userBalance)}`,
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
      <ScreenshotCarousel />
      <FloatingAppIcons />
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
                ? nextTask.isComboTask ? `Next: Combined Task` : `Next: ${nextTask.appName}`
                : isAutoAssigning
                  ? "Loading tasks..."
                  : "No pending tasks available"}
            </p>
            {nextTask && !nextTask.isComboTask && Number(taskStartAmount) > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                Required balance: ${formatMoney(taskStartAmount)}
              </p>
            )}
            {nextTask && nextTask.isComboTask && activeCombo && (
              <>
                <p className="text-xs text-amber-500 mt-0.5 font-medium">
                  Combined Task - Multiple Orders
                </p>
                <div className="flex justify-center gap-4 mt-2 text-xs">
                  <span className="text-slate-500">
                    Total Balance: <span className="font-semibold text-slate-700">${formatMoney(userBalance + frozenBalance)}</span>
                  </span>
                  <span className="text-slate-500">
                    Total Required: <span className="font-semibold text-slate-700">${formatMoney(activeCombo.totalRequiredAmount)}</span>
                  </span>
                </div>
                {(userBalance + frozenBalance) < activeCombo.totalRequiredAmount && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-amber-800 font-semibold text-sm">Insufficient Balance</p>
                    <p className="text-amber-600 text-xs mt-0.5">
                      Deposit additional ${formatMoney(activeCombo.totalRequiredAmount - (userBalance + frozenBalance))} to continue with this Combined Task.
                    </p>
                  </div>
                )}
                {frozenBalance > 0 && (
                  <p className="text-[10px] text-amber-500 mt-1">
                    Balance frozen for Combined Task
                  </p>
                )}
              </>
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
          nextTask.isComboTask && activeCombo && (userBalance + frozenBalance) < activeCombo.totalRequiredAmount ? (
            <button
              onClick={() => window.location.href = "/user-dashboard/deposits"}
              className="mt-6 bg-amber-500 text-white rounded-xl px-10 py-3 font-semibold hover:bg-amber-600 transition shadow-lg shadow-amber-200"
            >
              Deposit to Continue
            </button>
          ) : (
            <button
              onClick={handleStartTask}
              className="mt-6 bg-[#E05305] text-white rounded-xl px-10 py-3 font-semibold hover:bg-[#c84a04] transition shadow-lg shadow-orange-200"
            >
              Start
            </button>
          )
        )}
      </div>

      {/* VIP Status Card */}
      <div className={`bg-gradient-to-r ${currentTier.gradient} rounded-2xl border border-white/10 shadow-sm p-6 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-white/80" />
            <span className="text-white/80 font-bold text-xs uppercase tracking-widest">VIP Membership</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">{currentTier.name}</span>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${currentTier.badgeBg} text-white`}>
                <Trophy className="w-3 h-3" />
                {currentTier.label}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Balance</p>
              <p className="text-lg font-bold text-white">${formatMoney(userBalance)}</p>
              {frozenBalance > 0 && (
                <p className="text-[10px] text-amber-300 mt-0.5">
                  Frozen: ${formatMoney(frozenBalance)}
                </p>
              )}
            </div>
          </div>

          {nextTier ? (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-300" />
                  {currentTier.name}
                </span>
                <span className="flex items-center gap-1">
                  {nextTier.name}
                  <Crown className="w-3 h-3 text-yellow-300" />
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-200 transition-all duration-500"
                  style={{ width: `${vipProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-white/50 mt-1">
                <span>${formatMoney(currentTier.unlockBalance)}</span>
                <span>${formatMoney(nextTier.unlockBalance)}</span>
              </div>
              <p className="text-xs text-white/70 mt-2">
                Next unlock: <span className="text-yellow-300 font-semibold">{nextTier.name}</span> at <span className="text-white font-semibold">${formatMoney(nextTier.unlockBalance)}</span>
                &nbsp;·&nbsp;Daily profit: <span className="text-white font-semibold">{currentTier.dailyProfit}%</span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-white/80 mt-3">
              <Trophy className="w-3.5 h-3.5 text-yellow-300 inline mr-1" />
              Maximum VIP level reached! Enjoy {currentTier.dailyProfit}% daily profit.
            </p>
          )}
        </div>
      </div>

      {/* Combo Task Modal */}
      {showComboModal && activeCombo && (
        <ComboTaskModal
          combo={activeCombo}
          uid={user.uid}
          userBalance={userBalance}
          frozenBalance={frozenBalance}
          onClose={() => {
            setShowComboModal(false);
            loadData();
          }}
          onComplete={(result) => {
            setShowComboModal(false);
            setUserBalance(result?.creditResult?.balanceAfter || userBalance);
            loadData();
          }}
        />
      )}

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
