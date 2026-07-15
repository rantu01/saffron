"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { Layers, CheckCircle2, Circle, Play, AlertTriangle, DollarSign, Loader2 } from "lucide-react";

const STATUS_ICONS = {
  pending: Circle,
  in_progress: Loader2,
  completed: CheckCircle2,
};

const STATUS_COLORS = {
  pending: "text-slate-300",
  in_progress: "text-blue-500",
  completed: "text-emerald-500",
};

export default function ComboTaskModal({ combo, uid, userBalance, frozenBalance, onClose, onComplete }) {
  const [comboData, setComboData] = useState(combo);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(combo?.currentOrderIndex || 0);
  const [loading, setLoading] = useState(false);
  const [orderLoadingIndex, setOrderLoadingIndex] = useState(null);

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const refreshCombo = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/tasks/combo?uid=${encodeURIComponent(uid)}&setNumber=${comboData.setNumber}`);
      const data = await res.json();
      if (data?.success && data?.combo) {
        setComboData(data.combo);
        setCurrentOrderIndex(data.combo.currentOrderIndex || 0);
      }
    } catch (e) {
      console.error("Failed to refresh combo", e);
    }
  }, [uid, comboData?.setNumber]);

  const handleStartOrder = async (orderIndex) => {
    setLoading(true);
    setOrderLoadingIndex(orderIndex);
    try {
      const res = await fetch("/api/user/tasks/combo/start-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comboId: comboData._id, uid }),
      });
      const data = await res.json();

      if (!data.success) {
        if (data.insufficientBalance) {
          Swal.fire({
            icon: "warning",
            title: "Insufficient Balance",
            html: `
              <div style="text-align: left;">
                <p style="margin-bottom: 8px;"><strong>Required Amount:</strong> $${formatMoney(data.requiredAmount)}</p>
                <p style="margin-bottom: 8px;"><strong>Frozen Balance:</strong> $${formatMoney(data.currentBalance)}</p>
                <hr style="margin: 12px 0; border-color: #eee;">
                <p style="color: #E05305; font-weight: bold; font-size: 16px;">
                  Additional Amount Required:<br>
                  <span style="font-size: 24px;">$${formatMoney(data.additionalRequired)}</span>
                </p>
              </div>
            `,
            confirmButtonColor: "#E05305",
            confirmButtonText: "Deposit Now",
            showCancelButton: true,
            cancelButtonText: "Close",
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = "/user-dashboard/deposits";
            }
          });
        } else {
          Swal.fire({ icon: "error", title: "Error", text: data.message });
        }
        await refreshCombo();
        return;
      }

      await refreshCombo();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong!" });
    } finally {
      setLoading(false);
      setOrderLoadingIndex(null);
    }
  };

  const handleCompleteOrder = async (orderIndex) => {
    setLoading(true);
    setOrderLoadingIndex(orderIndex);
    try {
      const res = await fetch("/api/user/tasks/combo/complete-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comboId: comboData._id, uid }),
      });
      const data = await res.json();

      if (!data.success) {
        if (data.insufficientBalance) {
          Swal.fire({
            icon: "warning",
            title: "Insufficient Balance",
            html: `
              <div style="text-align: left;">
                <p style="margin-bottom: 8px;"><strong>Required Amount:</strong> $${formatMoney(data.requiredAmount)}</p>
                <p style="margin-bottom: 8px;"><strong>Frozen Balance:</strong> $${formatMoney(data.currentBalance)}</p>
                <hr style="margin: 12px 0; border-color: #eee;">
                <p style="color: #E05305; font-weight: bold; font-size: 16px;">
                  Additional Amount Required:<br>
                  <span style="font-size: 24px;">$${formatMoney(data.additionalRequired)}</span>
                </p>
              </div>
            `,
            confirmButtonColor: "#E05305",
            confirmButtonText: "Deposit Now",
            showCancelButton: true,
            cancelButtonText: "Close",
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = "/user-dashboard/deposits";
            }
          });
        } else {
          Swal.fire({ icon: "error", title: "Error", text: data.message });
        }
        await refreshCombo();
        return;
      }

      if (data.allComplete) {
        await Swal.fire({
          icon: "success",
          title: "Combined Task Complete!",
          html: `
            <div style="text-align: center;">
              <p style="margin-bottom: 8px;">All ${comboData.orders.length} orders completed successfully!</p>
              <p style="color: #E05305; font-weight: bold; font-size: 18px;">
                Commission Earned: <span style="font-size: 24px;">$${formatMoney(data.commission)}</span>
              </p>
              <p style="font-size: 12px; color: #888;">(${comboData.commissionPercent}% of $${formatMoney(comboData.totalRequiredAmount)})</p>
            </div>
          `,
          confirmButtonColor: "#E05305",
          confirmButtonText: "Continue",
        });
        onComplete(data);
        return;
      }

      await refreshCombo();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong!" });
    } finally {
      setLoading(false);
      setOrderLoadingIndex(null);
    }
  };

  const currentOrder = comboData?.orders?.[currentOrderIndex];
  const allCompleted = comboData?.orders?.every((o) => o.status === "completed");
  const isWaitingBalance = comboData?.status === "waiting_balance";
  const isComboPending = comboData?.status === "pending";
  const completedOrders = comboData?.orders?.filter((o) => o.status === "completed").length || 0;
  const totalOrders = comboData?.orders?.length || 0;

  const needsDeposit = (Number(userBalance) || 0) < 0;

  const orderBeforeCurrentComplete = currentOrderIndex > 0
    ? comboData?.orders?.[currentOrderIndex - 1]?.status === "completed"
    : true;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2">
      <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl relative overflow-hidden flex flex-col font-sans text-[#333] max-h-[95dvh]">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold z-10"
        >
          ✕
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-3 text-white shrink-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Layers className="w-4 h-4" />
            <h2 className="text-base font-bold">Combined Task</h2>
          </div>
          <p className="text-white/80 text-[10px]">Complete all linked orders sequentially</p>
        </div>

        <div className="p-3 space-y-2 overflow-y-auto flex-1">
          {/* Status Banner */}
          {needsDeposit && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-amber-800 font-semibold text-xs">Waiting for Balance</p>
                <p className="text-amber-600 text-[10px] mt-0.5">
                  Main Balance is -${formatMoney(Math.abs(Number(userBalance) || 0))}. Deposit ${formatMoney(Math.abs(Number(userBalance) || 0))} to continue with the next order.
                </p>
              </div>
            </div>
          )}

          {/* Balance Info */}
          <div className="bg-slate-50 rounded-lg p-2 space-y-0.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-600">Main Balance</span>
              </div>
              <span className={`text-xs font-bold ${(Number(userBalance) || 0) < 0 ? "text-red-500" : "text-slate-900"}`}>${formatMoney(userBalance)}</span>
            </div>
            <div className="flex items-center justify-between pl-5">
              <span className="text-[10px] text-amber-500">Frozen for Combo</span>
              <span className="text-[10px] font-bold text-amber-500">${formatMoney(frozenBalance || 0)}</span>
            </div>
          </div>

          {/* Commission Info */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2">
            <div className="flex justify-between text-xs">
              <span className="text-emerald-700">Commission Rate</span>
              <span className="text-emerald-700 font-bold">{comboData?.commissionPercent}%</span>
            </div>
            <div className="flex justify-between text-xs mt-0.5">
              <span className="text-emerald-700">Estimated Commission</span>
              <span className="text-emerald-700 font-bold">${formatMoney(comboData?.totalCommission)}</span>
            </div>
            <div className="flex justify-between text-xs mt-0.5">
              <span className="text-emerald-700">Total Required</span>
              <span className="text-emerald-700 font-bold">${formatMoney(comboData?.totalRequiredAmount)}</span>
            </div>
          </div>

          {/* Orders List */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 mb-2">
              Linked Orders ({completedOrders}/{totalOrders})
            </h3>
            <div className="space-y-1.5">
              {comboData?.orders?.map((order, index) => {
                const isCurrent = index === currentOrderIndex;
                const isCompleted = order.status === "completed";
                const isInProgress = order.status === "in_progress";
                const isPending = order.status === "pending";
                const isLocked = isPending && !isCurrent;

                const StatusIcon = STATUS_ICONS[order.status] || Circle;

                return (
                  <div
                    key={order.orderNumber}
                    className={`border rounded-lg p-2 transition-all ${
                      isCurrent && !isCompleted
                        ? "border-orange-300 bg-orange-50"
                        : isCompleted
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-white"
                    } ${isLocked ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className={`w-3.5 h-3.5 ${STATUS_COLORS[order.status]} ${order.status === "in_progress" ? "animate-spin" : ""}`} />
                        <span className="text-xs font-medium text-slate-700">
                          Order {order.orderNumber}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        ${formatMoney(order.requiredAmount)}
                      </span>
                    </div>

                    {isCurrent && !isCompleted && (
                      <div className="mt-1">
                        {isPending && (() => {
                          const canStart = (Number(userBalance) || 0) >= 0;
                          if (canStart) {
                            return (
                              <button
                                onClick={() => handleStartOrder(index)}
                                disabled={loading}
                                className={`w-full flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded-lg transition bg-blue-500 text-white hover:bg-blue-600 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                {loading && orderLoadingIndex === index ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Play className="w-3 h-3" />
                                )}
                                Start Order
                              </button>
                            );
                          }
                          return (
                            <button
                              onClick={() => window.location.href = "/user-dashboard/deposits"}
                              className="w-full flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded-lg transition bg-amber-500 text-white hover:bg-amber-600"
                            >
                              Deposit to Continue
                            </button>
                          );
                        })()}
                        {isInProgress && (
                          <button
                            onClick={() => handleCompleteOrder(index)}
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition ${
                              loading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            {loading && orderLoadingIndex === index ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            Complete Order
                          </button>
                        )}
                      </div>
                    )}

                    {isCurrent && isCompleted && (
                      <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Completed</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
              <span>Progress</span>
              <span>{completedOrders}/{totalOrders} orders</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0}%` }}
              />
            </div>
          </div>

          {needsDeposit && (
            <button
              onClick={() => window.location.href = "/user-dashboard/deposits"}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 rounded-lg transition shrink-0"
            >
              Deposit to Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
