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

    // Normal (non-combo) tasks: include tasks that have been resolved
    // (completed / cancelled / submission) plus tasks the user started but did
    // not submit (held in Frozen Balance). Those frozen tasks are shown under
    // "Pending" and can be submitted from this page.
    const normalTasks = await db
      .collection("tasks")
      .find({
        assigneeUid: uid,
        isComboTask: { $ne: true },
        $or: [
          { status: { $in: ["completed", "cancelled", "submission"] } },
          { status: "pending", frozenAmount: { $gt: 0 } },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    for (const r of normalTasks) {
      const frozenAmount = Number(r.frozenAmount || 0);
      const displayStatus =
        r.status === "completed"
          ? "completed"
          : r.status === "submission"
            ? "submission"
            : "pending";

      records.push({
        _id: String(r._id),
        taskId: String(r._id),
        title: r.appName || r.description || "Untitled",
        appName: r.appName || "",
        status: displayStatus,
        submittable: frozenAmount > 0,
        frozenAmount,
        submissionConfig: r.submissionConfig || null,
        requiredBalance: Number(r.requiredBalance || 0),
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
        setNumber: Number(combo.setNumber || 0),
        position: Number(combo.position || 0),
        frozenAmount: Number(combo.frozenAmount || 0),
        balanceFrozen: Boolean(combo.balanceFrozen || false),
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
