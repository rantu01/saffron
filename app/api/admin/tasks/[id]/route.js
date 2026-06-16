import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
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

    const config = submissionConfig && typeof submissionConfig === "object"
      ? {
          requireRating: submissionConfig.requireRating !== false,
          ratingOptions:
            Array.isArray(submissionConfig.ratingOptions) && submissionConfig.ratingOptions.length
              ? submissionConfig.ratingOptions
              : [
                  "Peace of mind and security, very good app.",
                  "Convenient, easy, and simple.",
                  "Update too often.",
                  "This is very good software.",
                  "Free is quite good, but from time to time it shows that the server is busy, I hope to get improved.",
                ],
          requireFeedback: submissionConfig.requireFeedback !== false,
          maxFeedbackLength: Math.min(Math.max(Number(submissionConfig.maxFeedbackLength) || 500, 1), 5000),
        }
      : null;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const updateFields = {
      appName,
      appLogo: appLogo || "",
      description: description || "",
      totalAmount: totalAmt,
      profit,
      reward: profit,
      submissionConfig: config,
      updatedAt: new Date(),
    };

    if (taskGroupId !== undefined) {
      updateFields.taskGroupId = taskGroupId || null;
    }

    const result = await db.collection("tasks").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Task not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Task updated successfully.",
      task: result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update task." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const task = await db.collection("tasks").findOne({ _id: new ObjectId(id) });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found." },
        { status: 404 }
      );
    }

    await db.collection("tasks").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully.",
      taskGroupId: task.taskGroupId || null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete task." },
      { status: 500 }
    );
  }
}
