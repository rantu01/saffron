import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const status = searchParams.get("status") || "all";

    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const records = [];

    // Normal (non-combo) tasks: only include tasks that have actually appeared to
    // the user and been resolved. A task "appears" once it is reached; the only
    // resolved states we surface are completed and cancelled. Cancelled tasks are
    // shown as "Pending" (amount held until resolved). Untouched pending tasks that
    // have not yet appeared are never listed.
    const normalTasks = await db
      .collection("tasks")
      .find({
        assigneeUid: uid,
        isComboTask: { $ne: true },
        status: { $in: ["completed", "cancelled", "submission"] },
      })
      .sort({ createdAt: -1 })
      .toArray();

    for (const r of normalTasks) {
      const displayStatus =
        r.status === "completed"
          ? "completed"
          : r.status === "submission"
            ? "submission"
            : "pending";

      records.push({
        _id: String(r._id),
        title: r.appName || r.description || "Untitled",
        status: displayStatus,
        rating: r.ratingOption || r.submissionConfig?.ratingOptions?.[0] || 5,
        imageUrl: r.appLogo || "",
        totalAmount: Number(r.totalAmount || r.requiredBalance || 0),
        profit: Number(r.profit || r.reward || r.earnedAmount || 0),
        currencyType: "USDCIT",
        createdAt: r.cancelledAt || r.completedAt || r.createdAt,
      });
    }

    // Current position is used to decide whether a still-pending combo has
    // actually appeared to the user yet (future combos are not listed).
    const latestSet = await db
      .collection("userTaskSets")
      .find({ uid })
      .sort({ setNumber: -1 })
      .limit(1)
      .toArray();
    const currentPosition = Number(latestSet[0]?.currentPosition || 0);

    // Combo tasks: each combo is grouped into a SINGLE record card (not one card
    // per order). A combo that has appeared and is incomplete or cancelled is shown
    // as a single "Pending" combo card. A fully completed combo is shown as
    // "Completed". Future combos that have not yet appeared are never listed.
    const combos = await db
      .collection("comboTasks")
      .find({ uid })
      .sort({ createdAt: -1 })
      .toArray();

    for (const combo of combos) {
      const orders = Array.isArray(combo.orders) ? combo.orders : [];
      const comboPosition = Number(combo.position || 0);

      const appeared =
        combo.status === "completed" ||
        combo.status === "cancelled" ||
        combo.status === "in_progress" ||
        combo.status === "waiting_balance" ||
        (combo.status === "pending" && comboPosition > 0 && comboPosition <= currentPosition + 1);

      if (!appeared) continue;

      const isCompleted = combo.status === "completed";
      const completedOrders = orders.filter((o) => o.status === "completed").length;

      records.push({
        _id: String(combo._id),
        title: "Combined Task",
        isCombo: true,
        status: isCompleted ? "completed" : "pending",
        rating: 5,
        imageUrl: "",
        totalAmount: Number(combo.totalRequiredAmount || 0),
        profit: Number(combo.totalCommission || 0),
        commissionPercent: Number(combo.commissionPercent || 0),
        orderCount: orders.length,
        completedOrders,
        orders: orders.map((o) => ({
          orderNumber: o.orderNumber,
          requiredAmount: Number(o.requiredAmount || 0),
          status: o.status,
        })),
        currencyType: "USDCIT",
        createdAt: combo.completedAt || combo.updatedAt || combo.createdAt,
      });
    }

    records.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const filtered =
      status && status !== "all"
        ? records.filter((r) => r.status === status)
        : records;

    return NextResponse.json({ success: true, records: filtered });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch records" },
      { status: 500 }
    );
  }
}
