import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

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

  const allowed = ["enabled", "probability", "minOrders", "maxOrders", "commissionPercent", "progressionLevels", "positions", "demoPositions", "mainPositions", "userPositionOverrides", "firstComboMin", "firstComboMax", "secondComboMin", "secondComboMax", "profitThreshold", "daysUntilFirstCombo"];
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

export function isEligibleForFirstCombo(user, config) {
  if (!config.enabled) return false;
  if (!user) return false;
  const stage = Number(user.comboStage || 0);
  if (stage !== 0) return false;
  const profitThreshold = config.profitThreshold || 120;
  const daysThreshold = config.daysUntilFirstCombo || 4;
  const totalEarned = Number(user.totalEarned || 0);
  const createdAt = user.createdAt ? new Date(user.createdAt) : null;
  const daysSinceCreation = createdAt ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24) : 0;
  return totalEarned >= profitThreshold && daysSinceCreation >= daysThreshold;
}

export function isEligibleForSecondCombo(user) {
  if (!user) return false;
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

export function getComboCommission(orders, commissionPercent) {
  return roundCurrency(getComboTotalRequired(orders) * (commissionPercent || 6) / 100);
}

export function getProgressionLevel(setNumber) {
  if (setNumber <= 3) return 1;
  if (setNumber <= 6) return 2;
  return 3;
}

export function getComboPosition(config, setNumber, uid, accountType = "main") {
  // 1. Per-user override takes highest priority — use first position
  if (config.userPositionOverrides && config.userPositionOverrides[uid]) {
    const overrides = config.userPositionOverrides[uid];
    if (overrides.length > 0) return overrides[0];
  }

  // 2. Account-type specific positions — use first position
  if (accountType === "demo" && config.demoPositions && config.demoPositions.length > 0) {
    return config.demoPositions[0];
  }
  if ((accountType === "main" || !accountType) && config.mainPositions && config.mainPositions.length > 0) {
    return config.mainPositions[0];
  }

  // 3. Fallback to global positions — use first position
  const positions = config.positions || [8, 19, 27];
  if (positions.length === 0) return null;
  return positions[0];
}

export async function createStageComboTask(uid, setNumber, config, stage) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const user = await db.collection("users").findOne({ uid }, { projection: { accountType: 1, comboStage: 1 } });
  const accountType = user?.accountType || "main";

  const position = getComboPosition(config, setNumber, uid, accountType);
  if (position === null) return null;

  const orderAmount = generateStageOrderAmount(stage, config);

  const orders = [
    {
      orderNumber: 1,
      requiredAmount: orderAmount,
      status: "pending",
      completedAt: null,
    },
  ];

  const commissionPercent = COMBO_COMMISSION_PERCENT;
  const totalRequired = roundCurrency(orderAmount);
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
    comboStage: stage,
    debtCreated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("comboTasks").insertOne(comboTask);

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

  const user = await db.collection("users").findOne({ uid });
  const availableBalance = Number(user?.availableBalance || 0);
  const currentDebt = Number(user?.comboDebt || 0);
  const requiredAmount = order.requiredAmount;

  if (currentDebt > 0) {
    return {
      success: false,
      insufficientBalance: true,
      message: `Please clear your debt of $${currentDebt.toFixed(2)} by depositing before starting new orders.`,
      requiredAmount,
      comboDebt: currentDebt,
      status: "waiting_balance",
    };
  }

  const isFirstOrder = combo.status === "pending" && orderIndex === 0;
  if (isFirstOrder) {
    if (combo.comboStage === 1 && !combo.debtCreated) {
      const frozenBalance = availableBalance;
      const comboDebt = requiredAmount;

      await db.collection("users").updateOne(
        { uid },
        {
          $set: {
            availableBalance: 0,
            frozenBalance,
            comboDebt,
            updatedAt: new Date(),
          },
        }
      );

      await db.collection("comboTasks").updateOne(
        { _id: new ObjectId(comboId) },
        {
          $set: {
            status: "waiting_balance",
            debtCreated: true,
            updatedAt: new Date(),
          },
        }
      );

      return {
        success: false,
        insufficientBalance: true,
        message: `First combo order initiated. Negative balance of $${comboDebt.toFixed(2)} created. Please deposit to cover it and continue.`,
        requiredAmount,
        currentBalance: frozenBalance,
        additionalRequired: comboDebt,
        comboDebt,
        status: "waiting_balance",
      };
    }

    const newBalance = roundCurrency(availableBalance - requiredAmount);
    let comboDebt = 0;
    let newAvailable = newBalance;

    if (newBalance < 0) {
      comboDebt = Math.abs(newBalance);
      newAvailable = 0;
    }

    await db.collection("users").updateOne(
      { uid },
      {
        $set: {
          availableBalance: newAvailable,
          comboDebt,
          updatedAt: new Date(),
        },
      }
    );

    if (comboDebt > 0) {
      await db.collection("comboTasks").updateOne(
        { _id: new ObjectId(comboId) },
        { $set: { status: "waiting_balance", updatedAt: new Date() } }
      );
      return {
        success: false,
        insufficientBalance: true,
        message: `Insufficient balance. Please deposit $${comboDebt.toFixed(2)} to cover the negative balance and continue.`,
        requiredAmount,
        currentBalance: availableBalance,
        additionalRequired: comboDebt,
        comboDebt,
        status: "waiting_balance",
      };
    }
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

  const user = await db.collection("users").findOne({ uid });
  const comboDebt = Number(user?.comboDebt || 0);

  if (comboDebt > 0) {
    return {
      success: false,
      insufficientBalance: true,
      message: `Please clear your debt of $${comboDebt.toFixed(2)} by depositing before completing this order.`,
      comboDebt,
      status: "waiting_balance",
    };
  }

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

  // Refund the first order amount if it was started
  const firstOrder = combo.orders[0];
  let refundAmount = 0;
  if (firstOrder && firstOrder.status !== "pending") {
    refundAmount = firstOrder.requiredAmount || 0;
  }

  const user = await db.collection("users").findOne({ uid });
  const currentDebt = Number(user?.comboDebt || 0);

  let balanceChange = refundAmount;
  let newDebt = currentDebt;

  if (currentDebt > 0) {
    const debtCleared = Math.min(currentDebt, refundAmount);
    newDebt = roundCurrency(currentDebt - debtCleared);
    balanceChange = roundCurrency(refundAmount - debtCleared);
  }

  await db.collection("users").updateOne(
    { uid },
    {
      $inc: { availableBalance: balanceChange },
      $set: { comboDebt: newDebt, updatedAt: new Date() },
    }
  );

  await db.collection("comboTasks").updateOne(
    { _id: new ObjectId(comboId) },
    {
      $set: {
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  return { success: true, message: "Combo task cancelled, balance refunded" };
}

export async function creditComboCommission(comboId, uid) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const combo = await db.collection("comboTasks").findOne({ _id: new ObjectId(comboId), uid });
  if (!combo) return { success: false, message: "Combo task not found" };
  if (combo.status !== "completed") return { success: false, message: "Combo task is not completed" };

  const user = await db.collection("users").findOne({ uid });
  const balanceBefore = Number(user?.availableBalance || 0);
  const currentDebt = Number(user?.comboDebt || 0);
  const commission = combo.totalCommission;

  let netCredit = commission;
  let debtCleared = 0;
  let availableCredit = commission;

  if (currentDebt > 0) {
    debtCleared = Math.min(currentDebt, commission);
    availableCredit = roundCurrency(commission - debtCleared);
    netCredit = roundCurrency(availableCredit - currentDebt);
  }

  const updateFields = {
    comboDebt: Math.max(0, roundCurrency(currentDebt - debtCleared)),
    updatedAt: new Date(),
  };
  if (combo.comboStage === 1) {
    updateFields.comboStage = 2;
  }

  await db.collection("users").updateOne(
    { uid },
    {
      $inc: {
        availableBalance: availableCredit,
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
    description: `Combo task completed: ${combo.commissionPercent}% commission $${commission}${debtCleared > 0 ? ` ($${debtCleared} applied to debt)` : ""}`,
    referenceId: String(combo._id),
    referenceType: "combo_task",
    metadata: {
      totalRequired: combo.totalRequiredAmount,
      commissionPercent: combo.commissionPercent,
      commission,
      debtCleared,
      orders: combo.orders,
    },
    createdAt: new Date(),
  });

  return {
    success: true,
    amount: commission,
    commissionAmount: commission,
    debtCleared,
    balanceAfter,
  };
}
