import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const assigneeUid = searchParams.get("assigneeUid");
    const filterType = searchParams.get("filterType") || "all";
    const filterGroupId = searchParams.get("filterGroupId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const query = {};
    if (assigneeUid) query.assigneeUid = assigneeUid;
    if (filterType === "template") query.isTemplate = true;
    if (filterType === "assigned") query.isTemplate = { $ne: true };
    if (filterType === "completed") query.status = "completed";
    if (filterType === "pending") query.status = "pending";
    if (filterGroupId) {
      query.$or = [
        { taskGroupId: filterGroupId },
        { parentTaskGroupId: filterGroupId },
      ];
    }

    const [tasks, total] = await Promise.all([
      db
        .collection("tasks")
        .find(query)
        .project({ appLogo: 0, submissionConfig: 0 })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      db.collection("tasks").countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch tasks." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { appName, appLogo, totalAmount, description, submissionConfig, taskGroupId } = body;

    if (!appName || !totalAmount) {
      return NextResponse.json(
        { success: false, message: "appName and totalAmount are required." },
        { status: 400 }
      );
    }

    const totalAmt = Math.max(0, Number(totalAmount) || 0);
    const profit = Math.round(totalAmt * 0.5) / 100;

    const config = submissionConfig && typeof submissionConfig === "object" ? {
      requireRating: submissionConfig.requireRating !== false,
      ratingOptions: Array.isArray(submissionConfig.ratingOptions) && submissionConfig.ratingOptions.length
        ? submissionConfig.ratingOptions
        : ["Peace of mind and security, very good app.", "Convenient, easy, and simple.", "Update too often.", "This is very good software.", "Free is quite good, but from time to time it shows that the server is busy, I hope to get improved."],
      requireFeedback: submissionConfig.requireFeedback !== false,
      maxFeedbackLength: Math.min(Math.max(Number(submissionConfig.maxFeedbackLength) || 500, 1), 5000),
    } : null;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const now = new Date();
    const task = {
      appName,
      appLogo: appLogo || "",
      description: description || "",
      totalAmount: totalAmt,
      profit,
      reward: profit,
      isTemplate: true,
      taskGroupId: taskGroupId || null,
      submissionConfig: config,
      assigneeUid: null,
      assigneeEmail: null,
      status: "available",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("tasks").insertOne(task);

    return NextResponse.json({
      success: true,
      message: "Task created successfully.",
      task: { ...task, _id: result.insertedId },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Task creation failed." },
      { status: 500 }
    );
  }
}
