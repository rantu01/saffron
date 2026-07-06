import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

const DB_NAME = process.env.MONGODB_DB_NAME || "saffron";

export const NORMAL_COMMISSION_RATE = 0.005;

const DEFAULT_CONFIG = {
  enabled: true,
  probability: 0.25,
  minOrders: 2,
  maxOrders: 5,
  commissionPercent: 5,
  positions: [8, 18, 27],
  progressionLevels: [
    { level: 1, minAmountPerOrder: 20, maxAmountPerOrder: 100 },
    { level: 2, minAmountPerOrder: 100, maxAmountPerOrder: 500 },
    { level: 3, minAmountPerOrder: 500, maxAmountPerOrder: 2000 },
  ],
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
  return rest;
}

export async function updateComboConfig(updates) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const allowed = ["enabled", "probability", "minOrders", "maxOrders", "commissionPercent", "progressionLevels", "positions"];
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

export function getComboPosition(config, setNumber, uid) {
  const positions = config.positions || [8, 19, 27];
  if (positions.length === 0) return null;
  const seed = ((uid || "").length * 7 + setNumber * 13) % positions.length;
  return positions[seed % positions.length];
}

export async function createComboTask(uid, setNumber, config, userBalance) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const progressionLevel = getProgressionLevel(setNumber);
  const position = getComboPosition(config, setNumber, uid);
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
  let frozenBalance = Number(user?.frozenBalance || 0);
  const requiredAmount = order.requiredAmount;

  const isFirstOrder = combo.status === "pending" && orderIndex === 0;
  if (isFirstOrder) {
    if (frozenBalance >= requiredAmount) {
      // Already enough frozen, proceed
    } else if (availableBalance + frozenBalance >= requiredAmount) {
      const needed = roundCurrency(requiredAmount - frozenBalance);
      const freezeFromAvailable = Math.min(availableBalance, needed);
      await db.collection("users").updateOne(
        { uid },
        {
          $inc: { availableBalance: -freezeFromAvailable },
          $set: { frozenBalance: frozenBalance + freezeFromAvailable, updatedAt: new Date() },
        }
      );
      frozenBalance = frozenBalance + freezeFromAvailable;
    } else {
      await db.collection("comboTasks").updateOne(
        { _id: new ObjectId(comboId) },
        { $set: { status: "waiting_balance", updatedAt: new Date() } }
      );
      return {
        success: false,
        insufficientBalance: true,
        message: "Insufficient balance",
        requiredAmount,
        currentBalance: availableBalance + frozenBalance,
        additionalRequired: roundCurrency(requiredAmount - (availableBalance + frozenBalance)),
        status: "waiting_balance",
      };
    }
  }

  if (frozenBalance < requiredAmount) {
    if (availableBalance + frozenBalance >= requiredAmount) {
      const needed = roundCurrency(requiredAmount - frozenBalance);
      const freezeFromAvailable = Math.min(availableBalance, needed);
      await db.collection("users").updateOne(
        { uid },
        {
          $inc: { availableBalance: -freezeFromAvailable },
          $set: { frozenBalance: frozenBalance + freezeFromAvailable, updatedAt: new Date() },
        }
      );
      frozenBalance = frozenBalance + freezeFromAvailable;
    } else {
      await db.collection("comboTasks").updateOne(
        { _id: new ObjectId(comboId) },
        {
          $set: {
            status: "waiting_balance",
            updatedAt: new Date(),
          },
        }
      );

      return {
        success: false,
        insufficientBalance: true,
        message: "Insufficient balance",
        requiredAmount,
        currentBalance: frozenBalance,
        additionalRequired: roundCurrency(requiredAmount - (availableBalance + frozenBalance)),
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
    frozenBalance,
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
  const availableBalance = Number(user?.availableBalance || 0);
  let frozenBalance = Number(user?.frozenBalance || 0);

  if (frozenBalance < order.requiredAmount) {
    if (availableBalance + frozenBalance >= order.requiredAmount) {
      const needed = roundCurrency(order.requiredAmount - frozenBalance);
      const freezeFromAvailable = Math.min(availableBalance, needed);
      await db.collection("users").updateOne(
        { uid },
        {
          $inc: { availableBalance: -freezeFromAvailable },
          $set: { frozenBalance: frozenBalance + freezeFromAvailable, updatedAt: new Date() },
        }
      );
      frozenBalance = frozenBalance + freezeFromAvailable;
    } else {
      await db.collection("comboTasks").updateOne(
        { _id: new ObjectId(comboId) },
        {
          $set: {
            status: "waiting_balance",
            updatedAt: new Date(),
          },
        }
      );
      return {
        success: false,
        insufficientBalance: true,
        message: "Insufficient frozen balance to complete this order",
        requiredAmount: order.requiredAmount,
        currentBalance: frozenBalance,
        additionalRequired: Math.max(0, roundCurrency(order.requiredAmount - (availableBalance + frozenBalance))),
        status: "waiting_balance",
      };
    }
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

  await unfreezeUserBalanceForCombo(uid);

  return { success: true, message: "Combo task cancelled, funds unfrozen" };
}

export async function creditComboCommission(comboId, uid) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const combo = await db.collection("comboTasks").findOne({ _id: new ObjectId(comboId), uid });
  if (!combo) return { success: false, message: "Combo task not found" };
  if (combo.status !== "completed") return { success: false, message: "Combo task is not completed" };

  const user = await db.collection("users").findOne({ uid });
  const balanceBefore = Number(user?.availableBalance || 0);
  const frozenAmount = Number(user?.frozenBalance || 0);

  await db.collection("users").updateOne(
    { uid },
    {
      $inc: {
        availableBalance: frozenAmount + combo.totalCommission,
        totalEarned: frozenAmount + combo.totalCommission,
      },
      $set: {
        frozenBalance: 0,
        updatedAt: new Date(),
      },
    }
  );

  const userAfter = await db.collection("users").findOne({ uid });
  const balanceAfter = Number(userAfter?.availableBalance || 0);

  await db.collection("balanceLogs").insertOne({
    uid,
    email: user?.email || "",
    type: "combo_commission",
    amount: frozenAmount + combo.totalCommission,
    balanceBefore,
    balanceAfter,
    description: `Combo task completed: frozen $${frozenAmount} released + ${combo.commissionPercent}% commission $${combo.totalCommission}`,
    referenceId: String(combo._id),
    referenceType: "combo_task",
    metadata: {
      totalRequired: combo.totalRequiredAmount,
      commissionPercent: combo.commissionPercent,
      commission: combo.totalCommission,
      frozenReleased: frozenAmount,
      orders: combo.orders,
    },
    createdAt: new Date(),
  });

  return {
    success: true,
    amount: frozenAmount + combo.totalCommission,
    frozenReleased: frozenAmount,
    commissionAmount: combo.totalCommission,
    balanceAfter,
  };
}
