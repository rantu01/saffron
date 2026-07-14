import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";
import { buildTaskFinancialProfile } from "./taskModel";

const DB_NAME = process.env.MONGODB_DB_NAME || "saffron";

export const NORMAL_COMMISSION_RATE = 0.005;
export const COMBO_COMMISSION_PERCENT = 5;
export const FIRST_COMBO_MIN = 30;
export const FIRST_COMBO_MAX = 35;
export const SECOND_COMBO_MIN = 55;
export const SECOND_COMBO_MAX = 60;

const DEFAULT_CONFIG = {
  enabled: true,
  probability: 0.25,
  minOrders: 2,
  maxOrders: 5,
  commissionPercent: COMBO_COMMISSION_PERCENT,
  positions: [8, 18, 27],
  demoPositions: [],
  mainPositions: [],
  userPositionOverrides: {},
  userComboSettings: {},
  progressionLevels: [
    { level: 1, minAmountPerOrder: 20, maxAmountPerOrder: 100 },
    { level: 2, minAmountPerOrder: 100, maxAmountPerOrder: 500 },
    { level: 3, minAmountPerOrder: 500, maxAmountPerOrder: 2000 },
  ],
  firstComboMin: FIRST_COMBO_MIN,
  firstComboMax: FIRST_COMBO_MAX,
  secondComboMin: SECOND_COMBO_MIN,
  secondComboMax: SECOND_COMBO_MAX,
  profitThreshold: 120,
  daysUntilFirstCombo: 4,
  targetNegativeBalance: 0,
};

export function roundCurrency(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function computeTaskProfit(amount) {
  return roundCurrency(Number(amount || 0) * NORMAL_COMMISSION_RATE);
}

export function generateNormalTaskAmount(userBalance) {
  return roundCurrency(userBalance * (0.2 + Math.random() * 0.6));
}

export function generateComboOrderAmount(userBalance, progressionMultiplier) {
  const ranges = {
    1: { min: 3, max: 8 },
    2: { min: 5, max: 15 },
    3: { min: 10, max: 30 },
  };
  const range = ranges[progressionMultiplier] || { min: 3, max: 8 };
  const factor = range.min + Math.random() * (range.max - range.min);
  return roundCurrency(userBalance * factor);
}

export async function getComboConfig() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const config = await db.collection("comboConfig").findOne({ _id: "global" });
  if (!config) {
    await db.collection("comboConfig").insertOne({
      _id: "global",
      ...DEFAULT_CONFIG,
      updatedAt: new Date(),
    });
    return { ...DEFAULT_CONFIG };
  }
  const { _id, ...rest } = config;
  return { ...DEFAULT_CONFIG, ...rest };
}

export async function updateComboConfig(updates) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const allowed = ["enabled", "probability", "minOrders", "maxOrders", "commissionPercent", "progressionLevels", "positions", "demoPositions", "mainPositions", "userPositionOverrides", "userComboSettings", "firstComboMin", "firstComboMax", "secondComboMin", "secondComboMax", "profitThreshold", "daysUntilFirstCombo", "targetNegativeBalance"];
  const setFields = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      setFields[key] = updates[key];
    }
  }
  setFields.updatedAt = new Date();

  await db.collection("comboConfig").updateOne(
    { _id: "global" },
    { $set: setFields },
    { upsert: true }
  );

  return getComboConfig();
}

export function shouldGenerateComboTask(config) {
  if (!config.enabled) return false;
  return Math.random() < (config.probability || 0);
}

export function getUserComboSettings(config, uid) {
  if (!config || !config.userComboSettings || !uid) return null;
  return config.userComboSettings[uid] || null;
}

export async function getUserComboSettingsByUid(uid) {
  const config = await getComboConfig();
  return getUserComboSettings(config, uid);
}

export async function saveUserComboSettings(uid, settings) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const clean = {
    enabled: settings.enabled !== false,
    position: settings.position ? Math.max(1, Math.min(30, Number(settings.position))) : null,
    numOrders: settings.numOrders ? Math.max(1, Math.min(10, Number(settings.numOrders))) : null,
    orderAmounts: Array.isArray(settings.orderAmounts)
      ? settings.orderAmounts.map((a) => roundCurrency(a)).filter((a) => a > 0)
      : [],
    targetNegativeBalance:
      settings.targetNegativeBalance !== undefined && settings.targetNegativeBalance !== null && Number(settings.targetNegativeBalance) > 0
        ? Number(settings.targetNegativeBalance)
        : null,
    commissionPercent:
      settings.commissionPercent !== undefined && settings.commissionPercent !== null
        ? Number(settings.commissionPercent)
        : null,
    updatedAt: new Date(),
  };

  await db.collection("comboConfig").updateOne(
    { _id: "global" },
    { $set: { [`userComboSettings.${uid}`]: clean, updatedAt: new Date() } },
    { upsert: true }
  );

  return clean;
}

export async function deleteUserComboSettings(uid) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  await db.collection("comboConfig").updateOne(
    { _id: "global" },
    { $unset: { [`userComboSettings.${uid}`]: "" }, $set: { updatedAt: new Date() } }
  );
  return true;
}

export function isEligibleForFirstCombo(user, config) {
  if (!config.enabled) return false;
  if (!user) return false;
  const userSettings = getUserComboSettings(config, user.uid);
  if (userSettings && userSettings.enabled === false) return false;
  const stage = Number(user.comboStage || 0);
  if (stage !== 0) return false;
  const profitThreshold = config.profitThreshold || 120;
  const daysThreshold = config.daysUntilFirstCombo || 4;
  const totalEarned = Number(user.totalEarned || 0);
  const createdAt = user.createdAt ? new Date(user.createdAt) : null;
  const daysSinceCreation = createdAt ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24) : 0;
  return totalEarned >= profitThreshold && daysSinceCreation >= daysThreshold;
}

export function isEligibleForSecondCombo(user, config = null) {
  if (!user) return false;
  if (config) {
    const userSettings = getUserComboSettings(config, user.uid);
    if (userSettings && userSettings.enabled === false) return false;
  }
  return Number(user.comboStage || 0) === 2;
}

export function generateStageOrderAmount(stage, config) {
  if (stage === 1) {
    const min = config.firstComboMin || FIRST_COMBO_MIN;
    const max = config.firstComboMax || FIRST_COMBO_MAX;
    return roundCurrency(min + Math.random() * (max - min));
  }
  const min = config.secondComboMin || SECOND_COMBO_MIN;
  const max = config.secondComboMax || SECOND_COMBO_MAX;
  return roundCurrency(min + Math.random() * (max - min));
}

export function generateComboOrders(config, progressionLevel, userBalance) {
  const numOrders = config.minOrders + Math.floor(Math.random() * (config.maxOrders - config.minOrders + 1));
  const progressionMultiplier = progressionLevel;

  const orders = [];
  for (let i = 0; i < numOrders; i++) {
    const amount = generateComboOrderAmount(userBalance, progressionMultiplier);
    orders.push({
      orderNumber: i + 1,
      requiredAmount: amount,
      status: "pending",
      completedAt: null,
    });
  }
  return orders;
}

export function getComboTotalRequired(orders) {
  return orders.reduce((sum, o) => sum + (o.requiredAmount || 0), 0);
}

/**
 * Generates combo orders whose total equals the user's wallet balance plus a
 * target negative balance. This drives the user's wallet negative once all
 * orders are started. The total is split across `numOrders` orders (reusing the
 * configured min/max order count) with the remainder absorbed by the last order.
 */
export function generateOrdersFromTargetNegative(userBalance, targetNegative, numOrders) {
  const total = roundCurrency(Math.max(0, Number(userBalance || 0) + Number(targetNegative || 0)));
  const count = Math.max(1, Math.floor(Number(numOrders) || 2));
  const orders = [];
  let remaining = total;

  for (let i = 0; i < count; i++) {
    let amount;
    if (i === count - 1) {
      amount = roundCurrency(remaining);
    } else {
      const maxForThis = remaining - (count - 1 - i);
      const minForThis = 1;
      const span = Math.max(0, maxForThis - minForThis);
      amount = roundCurrency(minForThis + Math.random() * span);
    }
    orders.push({
      orderNumber: i + 1,
      requiredAmount: amount,
      status: "pending",
      completedAt: null,
    });
    remaining = roundCurrency(remaining - amount);
  }

  return orders;
}

export function getComboCommission(orders, commissionPercent) {
  return roundCurrency(getComboTotalRequired(orders) * (commissionPercent || 6) / 100);
}

export function getProgressionLevel(setNumber) {
  if (setNumber <= 3) return 1;
  if (setNumber <= 6) return 2;
  return 3;
}

export function getComboPosition(config, setNumber, uid, accountType = "main") {
  // The admin configures "Appear at task #N" as a 1-based task number and
  // expects the combo to become the current task when the progress bar reads
  // N/30. Because the progress bar shows the number of *completed* tasks
  // (0-based), the combo must be placed one step further along the sequence so
  // it becomes current exactly when progress reaches N.
  const resolve = (raw) => {
    const p = Math.max(1, Math.min(30, Number(raw) || 1));
    return Math.min(30, p + 1);
  };

  // 0. Per-user combo settings take absolute highest priority
  const userSettings = getUserComboSettings(config, uid);
  if (userSettings && userSettings.enabled !== false && userSettings.position) {
    return resolve(userSettings.position);
  }

  // 1. Per-user override takes highest priority — use first position
  if (config.userPositionOverrides && config.userPositionOverrides[uid]) {
    const overrides = config.userPositionOverrides[uid];
    if (overrides.length > 0) return resolve(overrides[0]);
  }

  // 2. Account-type specific positions — use first position
  if (accountType === "demo" && config.demoPositions && config.demoPositions.length > 0) {
    return resolve(config.demoPositions[0]);
  }
  if ((accountType === "main" || !accountType) && config.mainPositions && config.mainPositions.length > 0) {
    return resolve(config.mainPositions[0]);
  }

  // 3. Fallback to global positions — use first position
  const positions = config.positions || [8, 19, 27];
  if (positions.length === 0) return null;
  return resolve(positions[0]);
}

async function freezeComboAmount(db, uid, amount) {
  const user = await db.collection("users").findOne({ uid });
  if (!user) return null;
  const available = Number(user.availableBalance || 0);
  const frozen = Number(user.frozenBalance || 0);
  await db.collection("users").updateOne(
    { uid },
    {
      $set: {
        availableBalance: roundCurrency(available - amount),
        frozenBalance: roundCurrency(frozen + amount),
        updatedAt: new Date(),
      },
    }
  );
  return { availableBalance: roundCurrency(available - amount), frozenBalance: roundCurrency(frozen + amount) };
}

async function releaseComboAmount(db, uid, amount) {
  const user = await db.collection("users").findOne({ uid });
  if (!user) return null;
  const frozen = Number(user.frozenBalance || 0);
  const release = roundCurrency(Math.min(frozen, Math.max(0, Number(amount || 0))));
  await db.collection("users").updateOne(
    { uid },
    {
      $inc: { availableBalance: release },
      $set: { frozenBalance: roundCurrency(frozen - release), updatedAt: new Date() },
    }
  );
  return release;
}

export async function createStageComboTask(uid, setNumber, config, stage) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const user = await db.collection("users").findOne({ uid }, { projection: { accountType: 1, comboStage: 1, availableBalance: 1 } });
  const accountType = user?.accountType || "main";

  const position = getComboPosition(config, setNumber, uid, accountType);
  if (position === null) return null;

  const userSettings = getUserComboSettings(config, uid);

  let orders;
  if (userSettings && Array.isArray(userSettings.orderAmounts) && userSettings.orderAmounts.length) {
    orders = userSettings.orderAmounts.map((amt, i) => ({
      orderNumber: i + 1,
      requiredAmount: roundCurrency(amt),
      status: "pending",
      completedAt: null,
    }));
  } else if (userSettings && userSettings.numOrders && userSettings.numOrders > 1) {
    orders = Array.from({ length: userSettings.numOrders }).map((_, i) => ({
      orderNumber: i + 1,
      requiredAmount: generateStageOrderAmount(stage, config),
      status: "pending",
      completedAt: null,
    }));
  } else {
    orders = [
      {
        orderNumber: 1,
        requiredAmount: generateStageOrderAmount(stage, config),
        status: "pending",
        completedAt: null,
      },
    ];
  }

  // Target negative balance: override the generated orders so the total equals
  // the user's wallet balance + the target. The runtime then drives the wallet
  // negative by that target amount.
  const targetNegative =
    userSettings && Number(userSettings.targetNegativeBalance) > 0
      ? Number(userSettings.targetNegativeBalance)
      : Number(config.targetNegativeBalance) > 0
        ? Number(config.targetNegativeBalance)
        : 0;

  let fromTargetNegative = false;
  let finalStage = stage;
  if (targetNegative > 0) {
    const userBalance = Number(user?.availableBalance || 0);
    orders = generateOrdersFromTargetNegative(userBalance, targetNegative, orders.length || config.minOrders || 2);
    fromTargetNegative = true;
    finalStage = 0;
  }

  const commissionPercent =
    userSettings && userSettings.commissionPercent != null
      ? Number(userSettings.commissionPercent)
      : COMBO_COMMISSION_PERCENT;
  const totalRequired = roundCurrency(orders.reduce((s, o) => s + o.requiredAmount, 0));
  const totalCommission = roundCurrency(totalRequired * commissionPercent / 100);

  const comboTask = {
    uid,
    setNumber,
    position,
    status: "pending",
    commissionPercent,
    totalRequiredAmount: totalRequired,
    totalCommission,
    currentOrderIndex: 0,
    orders,
    comboStage: finalStage,
    fromTargetNegative,
    targetNegativeBalance: targetNegative,
    debtCreated: false,
    frozenAmount: totalRequired,
    balanceFrozen: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("comboTasks").insertOne(comboTask);

  // NOTE: The required capital is NOT frozen here. Freezing (which drives the
  // Main Balance negative for target-negative combos) is deferred until the
  // combo actually appears at its position — see activateComboFreeze().


  if (stage === 1) {
    await db.collection("users").updateOne(
      { uid },
      { $set: { comboStage: 1, updatedAt: new Date() } }
    );
  } else if (stage === 2) {
    await db.collection("users").updateOne(
      { uid },
      { $set: { comboStage: 3, updatedAt: new Date() } }
    );
  }

  return { ...comboTask, _id: result.insertedId };
}

export async function createComboTask(uid, setNumber, config, userBalance, accountType) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  if (!accountType) {
    const user = await db.collection("users").findOne({ uid }, { projection: { accountType: 1 } });
    accountType = user?.accountType || "main";
  }

  const progressionLevel = getProgressionLevel(setNumber);
  const position = getComboPosition(config, setNumber, uid, accountType);
  if (position === null) return null;

  const orders = generateComboOrders(config, progressionLevel, userBalance);
  const commissionPercent = config.commissionPercent || 6;
  const totalRequired = getComboTotalRequired(orders);
  const totalCommission = getComboCommission(orders, commissionPercent);

  const comboTask = {
    uid,
    setNumber,
    position,
    status: "pending",
    commissionPercent,
    totalRequiredAmount: totalRequired,
    totalCommission,
    currentOrderIndex: 0,
    orders,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("comboTasks").insertOne(comboTask);

  await freezeUserBalanceForCombo(uid);

  return { ...comboTask, _id: result.insertedId };
}

export async function getComboTaskById(comboId) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection("comboTasks").findOne({ _id: new ObjectId(comboId) });
}

export async function getActiveComboTask(uid, setNumber) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection("comboTasks").findOne({
    uid,
    setNumber,
    status: { $in: ["pending", "in_progress", "waiting_balance"] },
  });
}

export async function getComboTaskAtPosition(uid, setNumber, position) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection("comboTasks").findOne({
    uid,
    setNumber,
    position,
  });
}

/**
 * Freeze a combo's required capital only once it has "appeared" — i.e. the user
 * has reached its position in the set. For target-negative combos this is what
 * drives the Main Balance negative (by the configured target). Before this point
 * the balance stays normal, and after the combo is submitted the frozen capital
 * is released (see creditComboCommission) so the balance never stays negative
 * permanently.
 *
 * Returns true if a freeze was just applied.
 */
export async function activateComboFreeze(db, uid, combo, currentPosition) {
  if (!combo || combo.balanceFrozen) return false;
  if (combo.status !== "pending") return false;

  // The combo becomes the current/next available task when currentPosition + 1
  // reaches its position (see taskSetModel isTaskCurrent). Activate at that point.
  if (Number(currentPosition || 0) + 1 < Number(combo.position || 0)) return false;

  let orders = combo.orders;
  let totalRequired = combo.totalRequiredAmount;
  let totalCommission = combo.totalCommission;
  const targetNegative = Number(combo.targetNegativeBalance || 0);

  // For target-negative combos, recompute the required total from the CURRENT
  // balance so the Main Balance is driven to exactly the negative target when
  // the combo appears (and reflects any deposits made before reaching it).
  if (combo.fromTargetNegative && targetNegative > 0) {
    const user = await db.collection("users").findOne({ uid }, { projection: { availableBalance: 1 } });
    const available = Number(user?.availableBalance || 0);
    orders = generateOrdersFromTargetNegative(
      available,
      targetNegative,
      (combo.orders || []).length || 2
    );
    totalRequired = roundCurrency(orders.reduce((s, o) => s + o.requiredAmount, 0));
    totalCommission = roundCurrency(totalRequired * (combo.commissionPercent || 6) / 100);
  }

  await freezeComboAmount(db, uid, totalRequired);
  await db.collection("comboTasks").updateOne(
    { _id: combo._id },
    {
      $set: {
        orders,
        totalRequiredAmount: totalRequired,
        totalCommission,
        frozenAmount: totalRequired,
        balanceFrozen: true,
        updatedAt: new Date(),
      },
    }
  );
  return true;
}

async function markTaskDocAsCombo(db, uid, setNumber, position, comboId) {
  const taskDoc = await db.collection("tasks").findOne({
    assigneeUid: uid,
    setNumber,
    position,
  });
  if (!taskDoc) return false;

  if (taskDoc.isComboTask) {
    await db.collection("tasks").updateOne(
      { _id: taskDoc._id },
      { $set: { comboId: String(comboId), taskType: "combo", updatedAt: new Date() } }
    );
    return true;
  }

  const backup = {
    appName: taskDoc.appName,
    appLogo: taskDoc.appLogo,
    description: taskDoc.description,
    totalAmount: taskDoc.totalAmount,
    profit: taskDoc.profit,
    reward: taskDoc.reward,
    submissionConfig: taskDoc.submissionConfig,
    taskType: taskDoc.taskType,
    isCombinationTask: taskDoc.isCombinationTask,
    requiredBalance: taskDoc.requiredBalance,
    combinationPositions: taskDoc.combinationPositions || [],
    combinationSlots: taskDoc.combinationSlots || [],
  };

  await db.collection("tasks").updateOne(
    { _id: taskDoc._id },
    {
      $set: {
        appName: "Combined Task",
        description: "Complete all linked orders sequentially",
        totalAmount: 0,
        profit: 0,
        reward: 0,
        submissionConfig: null,
        taskType: "combo",
        isCombinationTask: false,
        isComboTask: true,
        comboId: String(comboId),
        requiredBalance: 0,
        combinationPositions: [],
        combinationSlots: [],
        comboBackup: backup,
        updatedAt: new Date(),
      },
    }
  );
  return true;
}

async function restoreNormalTaskFromTemplate(db, taskDoc) {
  const template = await db.collection("tasks").findOne({ _id: new ObjectId(taskDoc.parentTaskId) });
  if (!template) return false;

  const combinationPositions = Array.isArray(template.combinationPositions)
    ? template.combinationPositions
    : [];
  const profile = buildTaskFinancialProfile(template, taskDoc.position, taskDoc.setNumber, combinationPositions);
  const user = await db.collection("users").findOne({ uid: taskDoc.assigneeUid }, { projection: { availableBalance: 1 } });
  const amount = generateNormalTaskAmount(Number(user?.availableBalance || 0));
  const profit = computeTaskProfit(amount);

  await db.collection("tasks").updateOne(
    { _id: taskDoc._id },
    {
      $set: {
        appName: template.appName,
        appLogo: template.appLogo || "",
        description: template.description || "",
        totalAmount: amount,
        profit,
        reward: profit,
        submissionConfig: template.submissionConfig,
        taskType: profile.taskType,
        isCombinationTask: profile.isCombinationTask,
        requiredBalance: profile.requiredBalance,
        combinationPositions: profile.combinationPositions,
        combinationSlots: profile.isCombinationTask ? profile.combinationPositions : [],
        isComboTask: false,
        comboId: null,
        profitMultiplier: profile.profitMultiplier,
        updatedAt: new Date(),
      },
      $unset: { comboBackup: "" },
    }
  );
  return true;
}

async function revertComboTaskDoc(db, uid, setNumber, position) {
  const taskDoc = await db.collection("tasks").findOne({
    assigneeUid: uid,
    setNumber,
    position,
    isComboTask: true,
  });
  if (!taskDoc) return false;
  if (taskDoc.status === "completed") return false;

  if (taskDoc.comboBackup) {
    const b = taskDoc.comboBackup;
    await db.collection("tasks").updateOne(
      { _id: taskDoc._id },
      {
        $set: {
          appName: b.appName,
          appLogo: b.appLogo,
          description: b.description,
          totalAmount: b.totalAmount,
          profit: b.profit,
          reward: b.reward,
          submissionConfig: b.submissionConfig,
          taskType: b.taskType,
          isCombinationTask: b.isCombinationTask,
          requiredBalance: b.requiredBalance,
          combinationPositions: b.combinationPositions || [],
          combinationSlots: b.combinationSlots || [],
          isComboTask: false,
          comboId: null,
          updatedAt: new Date(),
        },
        $unset: { comboBackup: "" },
      }
    );
    return true;
  }

  // Native combos created by auto-assign carry no backup; rebuild from template.
  return restoreNormalTaskFromTemplate(db, taskDoc);
}

// Ensure exactly one combo task doc exists at `position`; revert/restore any
// other (un-started) combo task docs in this set back to normal tasks.
async function sweepStrayComboTaskDocs(db, uid, setNumber, keepPosition) {
  const stray = await db
    .collection("tasks")
    .find({ assigneeUid: uid, setNumber, isComboTask: true, position: { $ne: keepPosition } })
    .toArray();
  for (const doc of stray) {
    if (doc.status === "completed") continue;
    await revertComboTaskDoc(db, uid, setNumber, doc.position);
  }
}

function buildOrdersFromSettings(settings, config, stage, userBalance = 0) {
  if (settings.targetNegativeBalance && Number(settings.targetNegativeBalance) > 0) {
    const count = settings.numOrders && settings.numOrders > 0 ? settings.numOrders : (config.minOrders || 2);
    return generateOrdersFromTargetNegative(userBalance, settings.targetNegativeBalance, count);
  }
  if (Array.isArray(settings.orderAmounts) && settings.orderAmounts.length) {
    return settings.orderAmounts.map((amt, i) => ({
      orderNumber: i + 1,
      requiredAmount: roundCurrency(amt),
      status: "pending",
      completedAt: null,
    }));
  }
  const count = settings.numOrders && settings.numOrders > 0 ? settings.numOrders : (config.minOrders || 2);
  return Array.from({ length: count }).map((_, i) => ({
    orderNumber: i + 1,
    requiredAmount: generateStageOrderAmount(stage, config),
    status: "pending",
    completedAt: null,
  }));
}

/**
 * Ensures the admin-defined per-user combo configuration is reflected in the
 * user's current (latest) active task set. Runs on every task load so the most
 * recent saved configuration is applied automatically without reconfiguration.
 */
export async function applyUserComboConfig(uid) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const config = await getComboConfig();
  const settings = getUserComboSettings(config, uid);

  const latestSet = await db
    .collection("userTaskSets")
    .find({ uid })
    .sort({ setNumber: -1 })
    .limit(1)
    .toArray();
  if (!latestSet.length) return { applied: false, reason: "no_set" };

  const setNumber = latestSet[0].setNumber;
  const currentPosition = Number(latestSet[0].currentPosition || 0);

  const allCombos = await db.collection("comboTasks").find({ uid, setNumber }).toArray();
  const pendingCombos = allCombos.filter((c) => c.status === "pending");
  const inProgress = allCombos.find((c) => c.status === "in_progress" || c.status === "waiting_balance");

  // No config or disabled: remove any un-started injected combo and revert its task doc.
    if (!settings || settings.enabled === false || !settings.position) {
      for (const c of pendingCombos) {
        if (c.injected) {
          if (c.balanceFrozen) {
            await releaseComboAmount(db, uid, Number(c.frozenAmount || 0));
          }
          await revertComboTaskDoc(db, uid, setNumber, c.position);
          await db.collection("comboTasks").deleteOne({ _id: c._id });
        }
      }
      await sweepStrayComboTaskDocs(db, uid, setNumber, null);
      return { applied: false, reason: "disabled_or_unset" };
    }

  const position = Number(settings.position);

  // A combo that is already in progress must not be modified.
  if (inProgress) {
    await sweepStrayComboTaskDocs(db, uid, setNumber, inProgress.position);
    return { applied: false, reason: "in_progress", comboId: String(inProgress._id) };
  }

  // The user already passed this position in the current set; it will apply to
  // the next assigned set instead.
  if (position <= currentPosition) {
    return { applied: false, reason: "position_passed" };
  }

  const userDoc = await db.collection("users").findOne({ uid }, { projection: { comboStage: 1, availableBalance: 1 } });
  const stage = Number(userDoc?.comboStage || 0) >= 2 ? 2 : 1;
  const userBalance = Number(userDoc?.availableBalance || 0);

  const useTargetNegative = settings.targetNegativeBalance && Number(settings.targetNegativeBalance) > 0;

  const orders = buildOrdersFromSettings(settings, config, stage, userBalance);
  const commissionPercent =
    settings.commissionPercent != null ? Number(settings.commissionPercent) : (config.commissionPercent || COMBO_COMMISSION_PERCENT);
  const totalRequired = roundCurrency(orders.reduce((s, o) => s + o.requiredAmount, 0));
  const totalCommission = roundCurrency(totalRequired * commissionPercent / 100);

  // Keep the combo the existing task doc references (for consistency); otherwise
  // keep the first pending one. Delete any other pending combos so there is
  // exactly one combo in the set.
  const comboTaskDoc = await db.collection("tasks").findOne({ assigneeUid: uid, setNumber, isComboTask: true });
  const referencedComboId = comboTaskDoc?.comboId ? String(comboTaskDoc.comboId) : null;

  let keptCombo = pendingCombos.find((c) => String(c._id) === referencedComboId) || pendingCombos[0] || null;
  const keepId = keptCombo ? String(keptCombo._id) : null;

  for (const c of pendingCombos) {
    const id = String(c._id);
    const isKeep = id === keepId;
    if (isKeep) {
      if (c.position !== position) {
        await revertComboTaskDoc(db, uid, setNumber, c.position);
      }

      // Preserve the combo's financials. They are locked at creation; this sync
      // only updates position/injection metadata. Freezing (which drives the
      // Main Balance negative for target-negative combos) is deferred until the
      // combo actually appears at its position — see activateComboFreeze().
      const comboUpdate = {
        position,
        injected: true,
        updatedAt: new Date(),
      };

      await db.collection("comboTasks").updateOne(
        { _id: c._id },
        { $set: comboUpdate }
      );
    } else {
      if (c.balanceFrozen) {
        await releaseComboAmount(db, uid, Number(c.frozenAmount || 0));
      }
      await revertComboTaskDoc(db, uid, setNumber, c.position);
      await db.collection("comboTasks").deleteOne({ _id: c._id });
    }
  }

  if (!keptCombo) {
    const comboTask = {
      uid,
      setNumber,
      position,
      status: "pending",
      commissionPercent,
      totalRequiredAmount: totalRequired,
      totalCommission,
      currentOrderIndex: 0,
      orders,
      comboStage: useTargetNegative ? 0 : stage,
      fromTargetNegative: useTargetNegative,
      targetNegativeBalance: useTargetNegative ? Number(settings.targetNegativeBalance) : 0,
      debtCreated: false,
      injected: true,
      frozenAmount: totalRequired,
      balanceFrozen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await db.collection("comboTasks").insertOne(comboTask);
    keptCombo = { _id: res.insertedId };
  }

  await markTaskDocAsCombo(db, uid, setNumber, position, keptCombo._id);
  await sweepStrayComboTaskDocs(db, uid, setNumber, position);

  return { applied: true, comboId: String(keptCombo._id) };
}

export async function freezeUserBalanceForCombo(uid) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const user = await db.collection("users").findOne({ uid });
  if (!user) return null;

  const availableBalance = Number(user.availableBalance || 0);
  const currentFrozen = Number(user.frozenBalance || 0);

  if (currentFrozen > 0) return user;

  await db.collection("users").updateOne(
    { uid },
    {
      $set: {
        availableBalance: 0,
        frozenBalance: availableBalance,
        updatedAt: new Date(),
      },
    }
  );

  return db.collection("users").findOne({ uid });
}

export async function autoUnfreezeForCombo(uid) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const pendingCombo = await db.collection("comboTasks").findOne({
    uid,
    status: "pending",
  });
  if (!pendingCombo) return null;

  const user = await db.collection("users").findOne({ uid });
  if (!user) return null;

  const totalBalance = Number(user.availableBalance || 0) + Number(user.frozenBalance || 0);
  if (totalBalance >= pendingCombo.totalRequiredAmount) {
    return await unfreezeUserBalanceForCombo(uid);
  }

  return null;
}

export async function unfreezeUserBalanceForCombo(uid) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const user = await db.collection("users").findOne({ uid });
  const frozenBalance = Number(user?.frozenBalance || 0);

  await db.collection("users").updateOne(
    { uid },
    {
      $inc: { availableBalance: frozenBalance },
      $set: { frozenBalance: 0, updatedAt: new Date() },
    }
  );

  return db.collection("users").findOne({ uid });
}

export async function startComboOrder(comboId, uid) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const combo = await db.collection("comboTasks").findOne({ _id: new ObjectId(comboId), uid });
  if (!combo) return { success: false, message: "Combo task not found" };
  if (combo.status === "completed") return { success: false, message: "Combo task already completed" };
  if (combo.status === "cancelled") return { success: false, message: "Combo task was cancelled" };

  const orderIndex = combo.currentOrderIndex;
  const order = combo.orders[orderIndex];
  if (!order) return { success: false, message: "No pending order found" };
  if (order.status !== "pending") return { success: false, message: "Order already started or completed" };

  // Ensure the combo's capital is frozen before any order can start. This drives
  // the Main Balance negative for target-negative combos (requiring a deposit)
  // and reserves the capital for normal combos. activateComboFreeze is a no-op
  // once already frozen, so calling it here guarantees the requirement is
  // enforced even if the dashboard-based activation hasn't fired yet.
  if (!combo.balanceFrozen) {
    const setDoc = await db.collection("userTaskSets").findOne(
      { uid, setNumber: combo.setNumber },
      { projection: { currentPosition: 1 } }
    );
    const currentPosition = setDoc ? Number(setDoc.currentPosition || 0) : 0;
    await activateComboFreeze(db, uid, combo, currentPosition);
    const refreshed = await db.collection("comboTasks").findOne({ _id: combo._id });
    if (refreshed) Object.assign(combo, refreshed);
  }

  // The full combo amount is frozen into Frozen Balance when the combo appears
  // at its position (see activateComboFreeze). Orders can only be started once
  // the Main Balance is non-negative (i.e. the user has deposited enough to
  // cover any negative target balance).
  const user = await db.collection("users").findOne({ uid });
  const availableBalance = Number(user?.availableBalance || 0);
  const requiredAmount = order.requiredAmount;

  if (availableBalance < 0) {
    const depositNeeded = Math.abs(availableBalance);
    return {
      success: false,
      insufficientBalance: true,
      message: `Main Balance is -$${depositNeeded.toFixed(2)}. Please deposit $${depositNeeded.toFixed(2)} to continue with this combined task.`,
      requiredAmount,
      currentBalance: availableBalance,
      additionalRequired: depositNeeded,
      status: "waiting_balance",
    };
  }

  await db.collection("comboTasks").updateOne(
    { _id: new ObjectId(comboId), "orders.orderNumber": order.orderNumber },
    {
      $set: {
        "orders.$.status": "in_progress",
        status: "in_progress",
        updatedAt: new Date(),
      },
    }
  );

  return {
    success: true,
    message: `Order ${order.orderNumber} started. Required: $${requiredAmount}`,
    order,
    orderIndex,
  };
}

export async function completeComboOrder(comboId, uid) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const combo = await db.collection("comboTasks").findOne({ _id: new ObjectId(comboId), uid });
  if (!combo) return { success: false, message: "Combo task not found" };

  const orderIndex = combo.currentOrderIndex;
  const order = combo.orders[orderIndex];
  if (!order) return { success: false, message: "No active order found" };
  if (order.status !== "in_progress") return { success: false, message: "Order is not in progress" };

  const now = new Date();

  await db.collection("comboTasks").updateOne(
    { _id: new ObjectId(comboId) },
    {
      $set: {
        [`orders.${orderIndex}.status`]: "completed",
        [`orders.${orderIndex}.completedAt`]: now,
        updatedAt: now,
      },
    }
  );

  const updatedCombo = await db.collection("comboTasks").findOne({ _id: new ObjectId(comboId) });
  const allOrdersComplete = updatedCombo.orders.every(o => o.status === "completed");

  if (allOrdersComplete) {
    const commission = updatedCombo.totalCommission;

    await db.collection("comboTasks").updateOne(
      { _id: new ObjectId(comboId) },
      {
        $set: {
          status: "completed",
          completedAt: now,
          updatedAt: now,
        },
      }
    );

    return {
      success: true,
      allComplete: true,
      message: `All orders completed! Commission: $${commission}`,
      commission,
      orderCompleted: order,
    };
  }

  const nextOrderIndex = orderIndex + 1;
  await db.collection("comboTasks").updateOne(
    { _id: new ObjectId(comboId) },
    {
      $set: {
        currentOrderIndex: nextOrderIndex,
        updatedAt: now,
      },
    }
  );

  return {
    success: true,
    allComplete: false,
    message: `Order ${order.orderNumber} completed. Proceeding to order ${nextOrderIndex + 1}.`,
    orderCompleted: order,
    nextOrder: updatedCombo.orders[nextOrderIndex],
  };
}

export async function cancelComboTask(comboId, uid) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const combo = await db.collection("comboTasks").findOne({ _id: new ObjectId(comboId), uid });
  if (!combo) return { success: false, message: "Combo task not found" };
  if (combo.status === "completed") return { success: false, message: "Cannot cancel a completed combo" };
  if (combo.status === "cancelled") return { success: false, message: "Already cancelled" };

  // Release the frozen combo capital back to Main Balance.
  await releaseComboAmount(db, uid, Number(combo.frozenAmount || 0));

  await db.collection("users").updateOne(
    { uid },
    { $set: { comboDebt: 0, updatedAt: new Date() } }
  );

  await db.collection("comboTasks").updateOne(
    { _id: new ObjectId(comboId) },
    {
      $set: {
        status: "cancelled",
        cancelledAt: new Date(),
        balanceFrozen: false,
        updatedAt: new Date(),
      },
    }
  );

  return { success: true, message: "Combo task cancelled, frozen balance released" };
}

export async function creditComboCommission(comboId, uid) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const combo = await db.collection("comboTasks").findOne({ _id: new ObjectId(comboId), uid });
  if (!combo) return { success: false, message: "Combo task not found" };
  if (combo.status !== "completed") return { success: false, message: "Combo task is not completed" };

  const user = await db.collection("users").findOne({ uid });
  const balanceBefore = Number(user?.availableBalance || 0);
  const frozenBalance = Number(user?.frozenBalance || 0);
  const commission = combo.totalCommission;

  // Release the frozen combo capital back to Main Balance and add the commission.
  // Fall back to the total required amount so combos created before frozen-amount
  // tracking (or via the legacy freeze path) still return their reserved capital.
  const frozenCapital = Number(combo.frozenAmount || combo.totalRequiredAmount || 0);
  const released = roundCurrency(Math.min(frozenBalance, Math.max(0, frozenCapital)));

  const updateFields = {
    frozenBalance: roundCurrency(frozenBalance - released),
    comboDebt: 0,
    updatedAt: new Date(),
  };
  if (combo.comboStage === 1) {
    updateFields.comboStage = 2;
  }

  await db.collection("users").updateOne(
    { uid },
    {
      $inc: {
        availableBalance: roundCurrency(released + commission),
        totalEarned: commission,
      },
      $set: updateFields,
    }
  );

  const userAfter = await db.collection("users").findOne({ uid });
  const balanceAfter = Number(userAfter?.availableBalance || 0);

  await db.collection("balanceLogs").insertOne({
    uid,
    email: user?.email || "",
    type: "combo_commission",
    amount: commission,
    balanceBefore,
    balanceAfter,
    description: `Combo task completed: ${combo.commissionPercent}% commission $${commission} (frozen $${released} released)`,
    referenceId: String(combo._id),
    referenceType: "combo_task",
    metadata: {
      totalRequired: combo.totalRequiredAmount,
      commissionPercent: combo.commissionPercent,
      commission,
      frozenReleased: released,
      orders: combo.orders,
    },
    createdAt: new Date(),
  });

  return {
    success: true,
    amount: commission,
    commissionAmount: commission,
    frozenReleased: released,
    balanceAfter,
  };
}
