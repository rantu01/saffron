"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/Component/Auth/AuthProvider";
import Swal from "sweetalert2";
import { Star, Filter } from "lucide-react";
import ComboTaskModal from "@/app/user-dashboard/tasks/components/ComboTaskModal";

const TABS = ["All", "Submission", "Completed", "Pending"];

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function StarRating({ rating }) {
  const stars = Math.round(rating || 0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= stars ? "fill-amber-400 text-amber-400" : "text-gray-300"}
        />
      ))}
      <span className="ml-1 text-xs text-gray-400 font-medium">({stars})</span>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "Completed" || status === "completed") {
    return (
      <span className="border border-green-500 text-green-600 bg-green-50/50 px-3 py-1 rounded text-sm font-medium">
        Completed
      </span>
    );
  }
  return (
    <span className="border border-amber-400 text-amber-600 bg-amber-50/50 px-3 py-1 rounded text-sm font-medium">
      {status === "Submission" || status === "submission"
        ? "Submission"
        : status === "Pending" || status === "pending"
          ? "Pending"
          : status}
    </span>
  );
}

export default function RecordsPage() {
  const { user, loading } = useAuth();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [error, setError] = useState("");

  const [submitRecord, setSubmitRecord] = useState(null);
  const [submitRating, setSubmitRating] = useState("");
  const [submitComment, setSubmitComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [comboModalCombo, setComboModalCombo] = useState(null);
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [comboUserBalance, setComboUserBalance] = useState(0);
  const [comboFrozenBalance, setComboFrozenBalance] = useState(0);

  const DEFAULT_RATING_OPTIONS = [
    "Peace of mind and security, very good app.",
    "Convenient, easy, and simple.",
    "Update too often.",
    "This is very good software.",
    "Free is quite good, but from time to time it shows that the server is busy, I hope to get improved",
  ];

  const openSubmit = (record) => {
    setSubmitRecord(record);
    const first = record.submissionConfig?.ratingOptions?.length
      ? record.submissionConfig.ratingOptions[0]
      : DEFAULT_RATING_OPTIONS[0];
    setSubmitRating(first);
    setSubmitComment(first);
  };

  const closeSubmit = () => {
    setSubmitRecord(null);
    setSubmitRating("");
    setSubmitComment("");
  };

  const openCombo = async (record) => {
    try {
      const [comboRes, dashRes] = await Promise.all([
        fetch(`/api/user/tasks/combo?uid=${encodeURIComponent(user.uid)}&setNumber=${record.setNumber}`),
        fetch(`/api/user/dashboard?uid=${encodeURIComponent(user.uid)}`),
      ]);
      const comboData = await comboRes.json();
      const dashData = await dashRes.json();
      if (comboData?.success && comboData?.combo) {
        setComboModalCombo(comboData.combo);
        setComboUserBalance(Number(dashData?.dashboard?.availableBalance || 0));
        setComboFrozenBalance(Number(dashData?.dashboard?.frozenBalance || 0));
        setComboModalOpen(true);
      } else {
        Swal.fire({ icon: "error", title: "Error", text: "Could not load combined task." });
      }
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong!" });
    }
  };

  const handleSubmitTask = async () => {
    if (!submitRecord) return;
    const subConfig = submitRecord.submissionConfig;
    const requireRating = subConfig ? subConfig.requireRating !== false : true;
    const requireFeedback = subConfig ? subConfig.requireFeedback !== false : true;

    if (requireRating && !submitRating) {
      Swal.fire({ icon: "error", title: "Required", text: "Please select a rating option." });
      return;
    }
    if (requireFeedback && !submitComment.trim()) {
      Swal.fire({ icon: "error", title: "Required", text: "Please provide feedback." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/user/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: submitRecord.taskId,
          uid: user.uid,
          feedback: submitComment,
          ratingOption: submitRating,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        Swal.fire({ icon: "error", title: "Failed", text: data.message || "Could not submit task." });
        return;
      }
      await Swal.fire({
        icon: "success",
        title: "Task Submitted!",
        text: `You earned $${formatMoney(data.earned)}`,
      });
      closeSubmit();
      setActiveTab("Pending");
      load();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong!" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const load = useCallback(async () => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const statusParam = activeTab === "All" ? "all" : activeTab.toLowerCase();
      const res = await fetch(
        `/api/user/records?uid=${encodeURIComponent(user.uid)}&status=${statusParam}`
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to load records");
      setRecords(data.records || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded-full" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Records</h1>
        <p className="mt-2 text-slate-600">
          Please login to view your records.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold  tracking-tight">
          Records
        </h1>
        <p className="text-sm  mt-1">
          Balance History / Records
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                  : "bg-transparent  hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse border border-gray-200 rounded-2xl p-4"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-16 bg-gray-100 rounded-xl mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16">
          <Filter size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-slate-500 text-sm">No records found.</p>
          <p className="text-slate-400 text-xs mt-1">
            {activeTab === "All"
              ? "Complete a task to see records here."
              : `No records with status "${activeTab}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const labelStatus =
              record.status.charAt(0).toUpperCase() +
              record.status.slice(1);

            if (record.isCombo) {
              return (
                <div
                  key={record._id}
                  className="border border-purple-200 rounded-2xl p-4 shadow-sm bg-white hover:shadow-md transition-shadow duration-200"
                >
                  {/* Top Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="pr-2">
                      <span className="inline-block mb-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                        Combo Task
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {record.title}
                      </h3>
                    </div>
                    <StatusBadge status={labelStatus} />
                  </div>

                  <div className="text-xs text-gray-400 mb-3">
                    {record.createdAt ? formatDate(record.createdAt) : "No date"}
                  </div>

                  <div className="border-t border-gray-100 my-2" />

                  {/* Bottom Row */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-orange-500">
                        USDCIT {formatMoney(record.totalAmount)}
                      </span>
                      <span className="text-xs text-gray-400">Total amount</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-orange-500">
                        USDCIT {formatMoney(record.profit)}
                      </span>
                      <span className="text-xs text-gray-400">
                        Commission ({record.commissionPercent || 0}%)
                      </span>
                    </div>
                    {/* <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">
                        {record.completedOrders}/{record.orderCount} orders
                      </span>
                      <span className="text-xs text-gray-400">Progress</span>
                    </div> */}
                  </div>

                  <div className="border-t border-gray-100 my-2" />

                  {/* Order breakdown */}
                  {/* <div className="space-y-1">
                    {record.orders.map((o) => (
                      <div
                        key={o.orderNumber}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-600">Order {o.orderNumber}</span>
                        <span className="text-slate-500">
                          USDCIT {formatMoney(o.requiredAmount)}
                        </span>
                        <span
                          className={
                            o.status === "completed"
                              ? "text-green-600 font-medium"
                              : "text-amber-600 font-medium"
                          }
                        >
                          {o.status === "completed" ? "Done" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div> */}

                  {record.status === "pending" && (
                    <button
                      onClick={() => openCombo(record)}
                      className="w-full mt-2 bg-[#E05305] hover:bg-[#c84a04] text-white text-xs font-bold py-2 rounded-xl transition-colors"
                    >
                      Work Combined Task
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div
                key={record._id}
                className="border border-gray-200 rounded-2xl p-4 shadow-sm bg-white hover:shadow-md transition-shadow duration-200"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-bold text-slate-900 leading-snug pr-2">
                    {record.title}
                  </h3>
                  <StatusBadge status={labelStatus} />
                </div>

                {/* Middle Row */}
                <div className="flex items-center gap-3 mb-3">
                  {record.imageUrl ? (
                    <img
                      src={record.imageUrl}
                      alt={record.title}
                      className="w-16 h-16 object-cover rounded-xl flex-shrink-0 bg-gray-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl flex-shrink-0 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-orange-400 text-xs font-bold">
                      No
                      <br />
                      Img
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {/* <StarRating rating={record.rating} /> */}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 text-right">
                    {record.createdAt ? (
                      <>
                        <div>{formatDate(record.createdAt).split(" ")[0]}</div>
                        <div className="text-[10px]">
                          {formatDate(record.createdAt).split(" ")[1]}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-300">No date</span>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 my-2" />

                {/* Bottom Row */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-orange-500">
                      USDCIT {formatMoney(record.totalAmount)}
                    </span>
                    <span className="text-xs text-gray-400">Total amount</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-orange-500">
                      USDCIT {formatMoney(record.profit)}
                    </span>
                    <span className="text-xs text-gray-400">Profit</span>
                  </div>
                </div>

                {record.submittable && (
                  <button
                    onClick={() => openSubmit(record)}
                    className="w-full mt-2 bg-[#E05305] hover:bg-[#c84a04] text-white text-xs font-bold py-2 rounded-xl transition-colors"
                  >
                    Submit Task
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {submitRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2">
          <div className="bg-white rounded-2xl w-full max-w-[380px] shadow-2xl relative overflow-hidden flex flex-col font-sans text-[#333] max-h-[90dvh]">
            <button
              onClick={closeSubmit}
              className="absolute top-2 right-3 text-slate-400 hover:text-slate-600 text-base font-bold z-10"
            >
              ✕
            </button>

            <div className="p-3 pb-2 text-center border-b border-slate-100 shrink-0">
              <h2 className="text-[#E05305] text-sm font-bold">{submitRecord.appName || "Task Submission"}</h2>
              <div className="grid grid-cols-2 gap-1 mt-2 text-center">
                <div>
                  <span className="text-[9px] text-slate-400 block font-medium">Total amount</span>
                  <span className="text-[#E05305] text-xs font-bold">
                    USDC/T {formatMoney(submitRecord.totalAmount || submitRecord.requiredBalance || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-medium">Profit</span>
                  <span className="text-[#E05305] text-xs font-bold">
                    USDC/T {formatMoney(submitRecord.profit || 0)}
                  </span>
                </div>
              </div>
              {submitRecord.frozenAmount > 0 && (
                <p className="text-[10px] text-amber-600 mt-1">
                  ${formatMoney(submitRecord.frozenAmount)} will be released from Frozen Balance on submission.
                </p>
              )}
            </div>

            <div className="p-3 space-y-2 text-[11px] flex-1 overflow-y-auto min-h-0">
              {(() => {
                const subConfig = submitRecord.submissionConfig;
                const requireRating = subConfig ? subConfig.requireRating !== false : true;
                const requireFeedback = subConfig ? subConfig.requireFeedback !== false : true;
                const ratingOptions = subConfig?.ratingOptions?.length
                  ? subConfig.ratingOptions
                  : DEFAULT_RATING_OPTIONS;
                const maxLen = Math.min(Math.max(Number(subConfig?.maxFeedbackLength) || 500, 1), 5000);

                return (
                  <>
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
                                name="record_rating_option"
                                checked={submitRating === opt}
                                onChange={() => {
                                  setSubmitRating(opt);
                                  setSubmitComment(opt);
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
                          value={submitComment}
                          onChange={(e) => setSubmitComment(e.target.value.slice(0, maxLen))}
                          className="w-full border border-slate-200 rounded-lg p-1.5 text-[10px] text-slate-700 bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E05305] resize-none h-14"
                          placeholder="Write your feedback..."
                        />
                        <div className="text-right text-[9px] text-slate-400 mt-0.5">
                          {submitComment.length}/{maxLen}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <button
              onClick={handleSubmitTask}
              disabled={submitting}
              className="w-full bg-[#E05305] hover:bg-[#c84a04] text-white text-xs font-bold py-2.5 text-center transition-colors shrink-0 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {comboModalOpen && comboModalCombo && (
        <ComboTaskModal
          combo={comboModalCombo}
          uid={user.uid}
          userBalance={comboUserBalance}
          frozenBalance={comboFrozenBalance}
          onClose={() => { setComboModalOpen(false); load(); }}
          onComplete={() => { setComboModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}