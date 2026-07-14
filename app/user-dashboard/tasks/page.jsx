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
  const [allTaskSets, setAllTaskSets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [noGroupsAvailable, setNoGroupsAvailable] = useState(false);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [dailyLimitMessage, setDailyLimitMessage] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const [frozenBalance, setFrozenBalance] = useState(0);
  const [vipLevel, setVipLevel] = useState(1);
  const [firstTaskStarted, setFirstTaskStarted] = useState(false);

  const [activeCombo, setActiveCombo] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);

  const VIP_TIERS = [
    { level: 1, name: "VIP 1", label: "Bronze", minDeposit: 25, dailyProfit: 0.5, unlockBalance: 0, gradient: "from-blue-600 to-blue-400", badgeBg: "bg-blue-500" },
    { level: 2, name: "VIP 2", label: "Silver", minDeposit: 1500, dailyProfit: 2, unlockBalance: 1500, gradient: "from-purple-600 to-purple-400", badgeBg: "bg-purple-500" },
    { level: 3, name: "VIP 3", label: "Gold", minDeposit: 5000, dailyProfit: 6, unlockBalance: 5000, gradient: "from-amber-600 to-orange-400", badgeBg: "bg-amber-500" },
    { level: 4, name: "VIP 4", label: "Diamond", minDeposit: 10000, dailyProfit: 12, unlockBalance: 10000, gradient: "from-red-600 to-rose-500", badgeBg: "bg-red-500" },
  ];

  const currentVipLevel = vipLevel;

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

  // Returns the set the user should currently be working on: the earliest set
  // that is not yet fully completed. If every set is complete, the highest
  // (most recent) set is returned so the completion screen can be shown.
  const getActiveTaskSet = (sets) => {
    if (!sets || !sets.length) return null;
    const sorted = [...sets].sort((a, b) => (a.setNumber || 0) - (b.setNumber || 0));
    const incomplete = sorted.find(
      (s) => (s.completedTasks || 0) < (s.totalTasks || 30)
    );
    return incomplete || sorted[sorted.length - 1];
  };

  const loadData = useCallback(async () => {
    if (!user?.uid) return [];
    try {
      await fetch("/api/user/tasks/sync-combo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      }).catch(() => {});

      const [tasksRes, progressRes, dashRes] = await Promise.all([
        fetch(`/api/admin/tasks?assigneeUid=${encodeURIComponent(user.uid)}&limit=200`),
        fetch(`/api/admin/task-sets/progress?uid=${encodeURIComponent(user.uid)}`),
        fetch(`/api/user/dashboard?uid=${encodeURIComponent(user.uid)}`),
      ]);

      const tasksData = await tasksRes.json();
      const progressData = await progressRes.json();
      const dashData = await dashRes.json();

      if (dashData?.success) {
        setUserBalance(Number(dashData.dashboard?.availableBalance || 0));
        setFrozenBalance(Number(dashData.dashboard?.frozenBalance || 0));
        setVipLevel(Number(dashData.dashboard?.vipLevel || 1));
        setFirstTaskStarted(Boolean(dashData.dashboard?.firstTaskStarted || false));
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

      const sets = progressData?.success ? (progressData.taskSets || []) : [];
      setAllTaskSets(sets);

      // The "active" set is the earliest set the user has not yet finished.
      // Once an admin assigns a new group, the freshly created (incomplete) set
      // becomes the active one and surfaces on the dashboard immediately.
      const activeSet = getActiveTaskSet(sets);
      if (activeSet) {
        setSetProgress(activeSet);
      } else {
        setSetProgress(null);
      }

      if (progressData?.success && progressData.dailyLimit?.reached) {
        setDailyLimitReached(true);
        setDailyLimitMessage(progressData.dailyLimit.message || "Try again in 24 hours.");
      } else {
        setDailyLimitReached(false);
        setDailyLimitMessage("");
      }

      return { tasks, sets };
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [user?.uid]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!user?.uid) { setIsLoading(false); return; }
      setIsLoading(true);
      setNoGroupsAvailable(false);
      await loadData();
      if (!cancelled) setIsLoading(false);
    }
    init();
    return () => { cancelled = true; };
  }, [user?.uid, loadData]);

  useEffect(() => {
    if (activeCombo && (activeCombo.status === "in_progress" || activeCombo.status === "waiting_balance")) {
      setShowComboModal(true);
    }
  }, [activeCombo]);

  // Real-time refresh: keep progress, balances, and active combo in sync with
  // the server so newly assigned groups and admin changes are reflected without
  // a manual page refresh.
  useEffect(() => {
    if (!user?.uid) return;
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.uid, loadData]);

  const currentSetNumber = setProgress?.setNumber || 1;
  const completedCount = setProgress?.completedTasks || 0;
  const totalTasks = setProgress?.totalTasks || 30;
  const isAllComplete = completedCount >= totalTasks;
  const displayProgress = isAllComplete ? totalTasks : Math.min(completedCount, totalTasks);

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
    if (dailyLimitReached) {
      Swal.fire({
        icon: "info",
        title: "Try again in 24 hours.",
        text: dailyLimitMessage || "Try again in 24 hours.",
      });
      return;
    }

    // Block starting a new task while a previously started (but unsubmitted)
    // task is held in Frozen Balance. The user must submit pending tasks first.
    const frozenPending = assignedTasks.find(
      (t) => (t.status === "pending" || t.status === "frozen") && Number(t.frozenAmount || 0) > 0
    );
    if (frozenPending) {
      Swal.fire({
        icon: "warning",
        title: "Complete your pending task",
        text: "You have a task held in Frozen Balance. Submit all pending tasks before starting a new one.",
        showCancelButton: true,
        confirmButtonText: "Go to Pending Tasks",
        cancelButtonText: "Close",
        confirmButtonColor: "#E05305",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/user-dashboard/records";
        }
      });
      return;
    }

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

    // The $40 minimum only applies to the very first task session.
    const MINIMUM_BALANCE = 40;
    if (!firstTaskStarted && userBalance < MINIMUM_BALANCE) {
      Swal.fire({
        icon: "error",
        title: "Insufficient Balance",
        text: `Your account balance must be at least $${formatMoney(MINIMUM_BALANCE)} to start your first task. Your balance: $${formatMoney(userBalance)}`,
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
      text: `The task amount of $${formatMoney(totalAmt)} will be moved to your Frozen Balance. You can submit this task later from Pending Tasks.`,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, hold task",
      cancelButtonText: "Go back",
    });

    if (!confirmed.isConfirmed) return;

    setIsModalOpen(false);

    try {
      const res = await fetch("/api/user/tasks/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: selectedTask._id, uid: user.uid, mode: "freeze" }),
      });
      const result = await res.json();
      if (result.success) {
        setFirstTaskStarted(true);
        await Swal.fire({
          icon: "info",
          title: "Task held in Frozen Balance",
          text: `$${formatMoney(result.frozenAmount)} moved to Frozen Balance. Submit this task from Pending Tasks.`,
        });
        setUserBalance(result.balanceAfter || 0);
        setFrozenBalance(result.frozenBalance || 0);
        setAssignedTasks((prev) =>
          prev.map((t) =>
            String(t._id) === String(selectedTask._id)
              ? { ...t, status: "pending", frozenAmount: result.frozenAmount }
              : t
          )
        );
      } else {
        await Swal.fire({ icon: "error", title: "Failed", text: result.message || "Could not hold task." });
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

      setUserBalance(result.balanceAfter !== undefined ? result.balanceAfter : (prev) => prev + result.earned);
      setFirstTaskStarted(true);
      if (result.frozenBalanceAfter !== undefined) {
        setFrozenBalance(result.frozenBalanceAfter);
      }

      if (result.setComplete) {
        await loadData();
        await Swal.fire({
          icon: 'success',
          title: 'Set Completed!',
          text: `You earned $${formatMoney(result.earned)}. Contact the admin if you would like another task group.`,
        });
      } else {
        await Swal.fire({
          icon: "success",
          title: "Task Completed!",
          text: `You earned $${formatMoney(result.earned)}`,
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
        // Refetch so the dashboard triggers the combo freeze exactly when the
        // combo becomes the current task.
        await loadData();
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong!' });
    }
  };

  // Shown after a set is completed. Refreshes the latest data from the server
  // (so a group the admin just assigned is picked up without a page refresh)
  // and, if a new task set exists, activates it. Otherwise it prompts the user
  // to contact the admin.
  const handleNextSet = async () => {
    const prevActiveNum = getActiveTaskSet(allTaskSets)?.setNumber || 1;
    setIsAutoAssigning(true);
    try {
      const { sets } = await loadData();
      const active = getActiveTaskSet(sets || []);
      const newActiveNum = active?.setNumber || 1;
      const nextSet = (sets || []).find(
        (s) => (s.setNumber || 0) > newActiveNum && (s.completedTasks || 0) < (s.totalTasks || 30)
      );

      if (newActiveNum > prevActiveNum) {
        await Swal.fire({
          icon: "success",
          title: `Task Set ${newActiveNum} loaded`,
          text: "Your new task set is ready. Keep going!",
        });
      } else if (nextSet) {
        await Swal.fire({
          icon: "success",
          title: `Task Set ${nextSet.setNumber} loaded`,
          text: "Your new task set is ready. Keep going!",
        });
      } else {
        await Swal.fire({
          icon: "info",
          title: "No new task set yet",
          text: "Please contact the admin to receive your next task set.",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Could not load the next task set." });
    } finally {
      setIsAutoAssigning(false);
    }
  };

  if (loading || isLoading) {    return (
      <div className="h-full flex items-center justify-center animate-pulse">
        <div className="w-full max-w-sm space-y-4">
          <div className="h-6 w-24 bg-slate-200 rounded mx-auto" />
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center">
            <div className="h-20 w-20 bg-slate-200 rounded-full mb-3" />
            <div className="h-8 w-24 bg-slate-200 rounded-lg mb-2" />
            <div className="h-10 w-32 bg-slate-200 rounded-lg mt-4" />
          </div>
        </div>
      </div>
    );
  }
  if (!user) return <div className="h-full flex items-center justify-center text-slate-500">Please login to view tasks.</div>;

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
    <div className="h-full flex flex-col overflow-hidden">


      {/* Main Content - fills remaining space, scrollable internally if needed */}
      <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-0 px-1">
        {/* Screenshot Carousel */}
        <div className="shrink-0">
          <ScreenshotCarousel />
        </div>
        {/* Compact Floating Icons */}
        <div className="shrink-0">
          <FloatingAppIcons />
        </div>

        {/* Title */}
        <div className="shrink-0">
          <h1 className="text-lg font-bold ">My Tasks</h1>
          <p className="text-[10px] ">Complete tasks one at a time</p>
        </div>

        {/* Progress + VIP side by side on desktop, stacked on mobile */}
        <div className="flex-1 flex flex-col xl:flex-row gap-2 min-h-0 overflow-hidden">
          {/* Progress Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col items-center justify-center shrink-0 xl:w-1/2">
            {assignedTasks.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm font-bold text-slate-900">No tasks assigned yet</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Contact the admin to receive a task group.</p>
                <a
                  href="/user-dashboard/chat"
                  className="mt-2 inline-block bg-[#E05305] text-white rounded-lg px-5 py-2 text-xs font-semibold hover:bg-[#c84a04] transition shadow"
                >
                  Contact Admin
                </a>
              </div>
            ) : (
              <>
                <div className="relative h-20 w-20 mb-2">
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
                      strokeDasharray={`${(displayProgress / totalTasks) * 327} 327`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-slate-900">
                      {displayProgress}
                      <span className="text-sm text-slate-400">/{totalTasks}</span>
                    </span>
                  </div>
                </div>

            {dailyLimitReached ? (
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">No tasks assigned yet</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Contact the admin to receive a task group.</p>
                <a
                  href="/user-dashboard/chat"
                  className="mt-2 inline-block bg-[#E05305] text-white rounded-lg px-5 py-2 text-xs font-semibold hover:bg-[#c84a04] transition shadow"
                >
                  Contact Admin
                </a>
              </div>
            ) : dailyLimitReached ? (
              <div className="text-center">
              <p className="text-sm font-bold text-amber-600">Try again in 24 hours.</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{dailyLimitMessage || "Try again in 24 hours."}</p>
              </div>
            ) : noGroupsAvailable ? (
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">No tasks available now</p>
                <p className="text-[10px] text-slate-500">Please try again later.</p>
              </div>
            ) : isAllComplete ? (
              <div className="text-center">
                <p className="text-sm font-bold text-emerald-600">Task {totalTasks} of {totalTasks}</p>
                <p className="text-[10px] text-slate-500">{isAutoAssigning ? "Loading next group..." : "All tasks completed in this set."}</p>
                {!isAutoAssigning && (
                  <button
                    onClick={handleNextSet}
                    className="mt-2 bg-[#E05305] text-white rounded-lg px-8 py-2 text-xs font-semibold hover:bg-[#c84a04] transition shadow"
                  >
                    Next Set
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">
                  Task {displayProgress} of {totalTasks}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {nextTask
                    ? nextTask.isComboTask ? `Next: Combined Task` : `Next: ${nextTask.appName}`
                    : isAutoAssigning
                      ? "Loading tasks..."
                      : "No pending tasks available"}
                </p>
                {nextTask && !nextTask.isComboTask && Number(taskStartAmount) > 0 && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Required: ${formatMoney(taskStartAmount)}
                  </p>
                )}
                {nextTask && nextTask.isComboTask && activeCombo && (
                  <>
                    <p className="text-[10px] text-amber-500 font-medium">Combined Task - Multiple Orders</p>
                    <div className="flex justify-center gap-3 mt-1 text-[10px]">
                      <span className="text-slate-500">
                        Main Balance: <span className={`font-semibold ${(Number(userBalance) || 0) < 0 ? "text-red-500" : "text-slate-700"}`}>${formatMoney(userBalance)}</span>
                      </span>
                      <span className="text-slate-500">
                        Frozen: <span className="font-semibold text-slate-700">${formatMoney(frozenBalance)}</span>
                      </span>
                    </div>
                    {(Number(userBalance) || 0) < 0 && (
                      <div className="mt-1 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <p className="text-amber-800 font-semibold text-[10px]">Insufficient Balance</p>
                        <p className="text-amber-600 text-[9px] mt-0.5">
                          Main Balance: -${formatMoney(Math.abs(Number(userBalance) || 0))}. Deposit ${formatMoney(Math.abs(Number(userBalance) || 0))} more.
                        </p>
                      </div>
                    )}
                    <p className="text-[9px] text-amber-500 mt-0.5">Submit this Combined Task from Pending Tasks.</p>
                  </>
                )}
                {!nextTask && !isAutoAssigning && !noGroupsAvailable && !dailyLimitReached && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    No pending tasks available.
                  </p>
                )}
              </div>
            )}

            {!isAllComplete && nextTask && !noGroupsAvailable && !dailyLimitReached && (
              nextTask.isComboTask ? (
                <button
                  onClick={() => window.location.href = "/user-dashboard/records"}
                  className="mt-2 bg-[#E05305] text-white rounded-lg px-8 py-2 text-xs font-semibold hover:bg-[#c84a04] transition shadow"
                >
                  Go to Pending Tasks
                </button>
              ) : (
                <button
                  onClick={handleStartTask}
                  className="mt-2 bg-[#E05305] text-white rounded-lg px-8 py-2 text-xs font-semibold hover:bg-[#c84a04] transition shadow"
                >
                  Start
                </button>
              )
            )}
          </>
          )}

          </div>

          {/* VIP Status Card */}
          <div className={`bg-gradient-to-r ${currentTier.gradient} rounded-xl border border-white/10 shadow-sm p-3 relative overflow-hidden xl:w-1/2 flex flex-col justify-center`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-2">
                <Crown className="w-3 h-3 text-white/80" />
                <span className="text-white/80 font-bold text-[10px] uppercase tracking-widest">VIP Membership</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-white">{currentTier.name}</span>
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${currentTier.badgeBg} text-white`}>
                    <Trophy className="w-2.5 h-2.5" />
                    {currentTier.label}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-white/60 uppercase tracking-wider">Balance</p>
                  <p className="text-sm font-bold text-white">${formatMoney(userBalance)}</p>
                  {frozenBalance > 0 && (
                    <p className="text-[8px] text-amber-300 mt-0.5">Frozen: ${formatMoney(frozenBalance)}</p>
                  )}
                </div>
              </div>

              {nextTier ? (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-white/70 mb-0.5">
                    <span className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-yellow-300" />
                      {currentTier.name}
                    </span>
                    <span className="flex items-center gap-0.5">
                      {nextTier.name}
                      <Crown className="w-2.5 h-2.5 text-yellow-300" />
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-200 transition-all duration-500"
                      style={{ width: `${vipProgressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-white/50 mt-0.5">
                    <span>${formatMoney(currentTier.unlockBalance)}</span>
                    <span>${formatMoney(nextTier.unlockBalance)}</span>
                  </div>
                  <p className="text-[10px] text-white/70 mt-1">
                    Next: <span className="text-yellow-300 font-semibold">{nextTier.name}</span> at <span className="text-white font-semibold">${formatMoney(nextTier.unlockBalance)}</span>
                    &nbsp;·&nbsp;Profit: <span className="text-white font-semibold">{currentTier.dailyProfit}%</span>
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-white/80 mt-1">
                  <Trophy className="w-3 h-3 text-yellow-300 inline mr-0.5" />
                  Max VIP level! Enjoy {currentTier.dailyProfit}% daily profit.
                </p>
              )}
            </div>
          </div>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2">
          <div className="bg-white rounded-2xl w-full max-w-[380px] shadow-2xl relative overflow-hidden flex flex-col font-sans text-[#333] max-h-[90dvh]">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-3 text-slate-400 hover:text-slate-600 text-base font-bold z-10"
            >
              ✕
            </button>

            <div className="p-3 pb-2 text-center border-b border-slate-100 shrink-0">
              <h2 className="text-[#E05305] text-sm font-bold">{selectedTask.appName || "Task Submission"}</h2>

              <div className="my-2 flex justify-center">
                {selectedTask.appLogo ? (
                  <img src={selectedTask.appLogo} alt="" className="h-12 w-12 object-contain rounded-lg" />
                ) : (
                  <div className="w-12 h-12 bg-[#E05305] rounded-lg flex items-center justify-center text-white font-black text-[10px] p-1">
                    <span className="tracking-tighter text-center uppercase leading-none">{(selectedTask.appName || "Task").slice(0, 2)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1 mt-2 text-center">
                <div>
                  <span className="text-[9px] text-slate-400 block font-medium">Total amount</span>
                  <span className="text-[#E05305] text-xs font-bold">
                    USDC/T {formatMoney(selectedTask.totalAmount || selectedTask.requiredBalance || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-medium">Profit</span>
                  <span className="text-[#E05305] text-xs font-bold">
                    USDC/T {formatMoney(selectedTask.profit || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-2 text-[11px] flex-1 overflow-y-auto min-h-0">
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Creation time</span>
                <span>{selectedTask.createdAt ? new Date(selectedTask.createdAt).toISOString().replace('T', ' ').substring(0, 19) : "—"}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Progress</span>
                <span className="font-medium">{completedCount + 1}/{totalTasks}</span>
              </div>

              {requireRating && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500 font-medium text-[10px]">Application Evaluation</span>
                    <div className="flex text-amber-400 text-[11px]">★★★★★</div>
                  </div>
                  <div className="space-y-1 mt-1">
                    {ratingOptions.map((opt, idx) => (
                      <label key={idx} className="flex items-start gap-1.5 cursor-pointer text-slate-600 leading-tight text-[10px]">
                        <input
                          type="radio"
                          name="rating_option"
                          checked={selectedRating === opt}
                          onChange={() => {
                            setSelectedRating(opt);
                            setCustomComment(opt);
                          }}
                          className="mt-0.5 accent-[#E05305] h-3 w-3 shrink-0"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {requireFeedback && (
                <div className="pt-1">
                  <textarea
                    value={customComment}
                    onChange={(e) => setCustomComment(e.target.value.slice(0, maxFeedbackLength))}
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-[10px] text-slate-700 bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E05305] resize-none h-14"
                    placeholder="Write your feedback..."
                  />
                  <div className="text-right text-[9px] text-slate-400 mt-0.5">
                    {customComment.length}/{maxFeedbackLength}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleFinalSubmit}
              className="w-full bg-[#E05305] hover:bg-[#c84a04] text-white text-xs font-bold py-2.5 text-center transition-colors shrink-0"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
