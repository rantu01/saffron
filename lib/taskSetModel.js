import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

async function getTaskSetsCollection() {
  const client = await clientPromise;
  return client.db("saffron").collection("userTaskSets");
}

async function getTasksCollection() {
  const client = await clientPromise;
  return client.db("saffron").collection("tasks");
}

export async function initializeUserTaskSet(uid, setNumber = 1) {
  const collection = await getTaskSetsCollection();
  
  const existing = await collection.findOne({ uid, setNumber });
  if (existing) return existing;

  const taskSet = {
    uid,
    setNumber,
    currentPosition: 0,
    completedTasks: 0,
    totalTasks: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(taskSet);
  return { ...taskSet, _id: result.insertedId };
}

export async function getUserTaskSetProgress(uid) {
  const collection = await getTaskSetsCollection();
  return collection.findOne({ uid }, { sort: { setNumber: -1 } });
}

export async function updateTaskSetProgress(uid, setNumber) {
  const collection = await getTaskSetsCollection();
  
  return collection.findOneAndUpdate(
    { uid, setNumber },
    { $inc: { completedTasks: 1, currentPosition: 1 }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" }
  );
}

export async function getNextAvailableTask(uid, setNumber) {
  const tasksCol = await getTasksCollection();
  const setProgress = await getUserTaskSetProgress(uid);
  
  if (!setProgress) {
    await initializeUserTaskSet(uid, setNumber);
  }

  const currentPos = setProgress?.currentPosition || 0;
  const task = await tasksCol.findOne({
    assigneeUid: uid,
    setNumber,
    position: currentPos + 1,
  });

  return task;
}

export async function canCompleteTask(uid, taskId) {
  const tasksCol = await getTasksCollection();
  const task = await tasksCol.findOne({ _id: new ObjectId(taskId) });

  if (!task || task.assigneeUid !== uid) return false;
  if (task.status === "completed") return false;

  const setProgress = await getUserTaskSetProgress(uid);
  if (!setProgress) return false;

  return setProgress.currentPosition + 1 === task.position;
}

export async function completeTaskInSet(uid, taskId) {
  const tasksCol = await getTasksCollection();
  const task = await tasksCol.findOne({ _id: new ObjectId(taskId) });

  if (!task || task.assigneeUid !== uid || task.status === "completed") {
    return null;
  }

  await tasksCol.updateOne(
    { _id: new ObjectId(taskId) },
    { $set: { status: "completed", completedAt: new Date(), updatedAt: new Date() } }
  );

  const updated = await updateTaskSetProgress(uid, task.setNumber);
  return updated.value;
}

export async function isSetComplete(uid, setNumber) {
  const collection = await getTaskSetsCollection();
  const setProgress = await collection.findOne({ uid, setNumber });
  return setProgress && setProgress.completedTasks === setProgress.totalTasks;
}

export const DAILY_SET_LIMIT = 3;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getCompletedSetsTodayCount(uid) {
  const collection = await getTaskSetsCollection();
  return collection.countDocuments({
    uid,
    status: "completed",
    completedAt: { $gte: startOfToday(), $lte: endOfToday() },
  });
}

export async function markSetCompletedToday(uid, setNumber) {
  const collection = await getTaskSetsCollection();
  return collection.updateOne(
    { uid, setNumber },
    { $set: { status: "completed", completedAt: new Date(), updatedAt: new Date() } }
  );
}

export async function getDailyLimitStatus(uid) {
  const completedToday = await getCompletedSetsTodayCount(uid);
  return {
    reached: completedToday >= DAILY_SET_LIMIT,
    completedToday,
    limit: DAILY_SET_LIMIT,
  };
}
