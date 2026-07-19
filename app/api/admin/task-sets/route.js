import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { initializeUserTaskSet } from "@/lib/taskSetModel";
import { buildTaskFinancialProfile, generateCombinationPositions } from "@/lib/taskModel";
import { getVipTasksPerSet } from "@/lib/vipModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, setNumber = 1, tasks } = body;

    if (!uid || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { success: false, message: "uid and tasks are required" },
        { status: 400 }
      );
    }

    const combinationPositions = generateCombinationPositions();

    const client = await clientPromise;
    const db = client.db("saffron");

    const userDoc = await db.collection("users").findOne({ uid }, { projection: { vipLevel: 1, vipTasksPerSet: 1 } });
    const expectedTasks = Number(userDoc?.vipTasksPerSet || getVipTasksPerSet(userDoc?.vipLevel));

    if (tasks.length !== expectedTasks) {
      return NextResponse.json(
        { success: false, message: `uid and ${expectedTasks} tasks required` },
        { status: 400 }
      );
    }

    const tasksToInsert = tasks.map((task, index) => {
      const taskProfile = buildTaskFinancialProfile(task, index + 1, setNumber, combinationPositions);

      return {
        title: task.title || `Task ${index + 1}`,
        description: task.description || "",
        assigneeUid: uid,
        assigneeEmail: task.assigneeEmail || "",
        reward: taskProfile.reward,
        status: "pending",
        setNumber: taskProfile.setNumber,
        position: taskProfile.position,
        taskType: taskProfile.taskType,
        isCombinationTask: taskProfile.isCombinationTask,
        profitMultiplier: taskProfile.profitMultiplier,
        requiredBalance: taskProfile.requiredBalance,
        combinationPositions: taskProfile.combinationPositions,
        combinationSlots: taskProfile.isCombinationTask ? taskProfile.combinationPositions : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const result = await db.collection("tasks").insertMany(tasksToInsert);
    await initializeUserTaskSet(uid, setNumber, { totalTasks: tasks.length });

    return NextResponse.json({
      success: true,
      message: `Created task set ${setNumber} with ${tasks.length} tasks`,
      taskCount: result.insertedIds.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create task set" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const setNumber = searchParams.get("setNumber");

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "uid required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("saffron");

    const query = { assigneeUid: uid };
    if (setNumber) query.setNumber = Number(setNumber);

    const tasks = await db
      .collection("tasks")
      .find(query)
      .sort({ setNumber: 1, position: 1 })
      .toArray();

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
