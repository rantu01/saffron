import clientPromise from "./mongodb";

const DB_NAME = process.env.MONGODB_DB_NAME || "saffron";

async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

function generateReferralCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function createUniqueReferralCode(db) {
  const invitationCodesCollection = db.collection("invitationCodes");
  let code = generateReferralCode();
  let retries = 0;
  while (await invitationCodesCollection.findOne({ code })) {
    code = generateReferralCode();
    retries++;
    if (retries > 10) {
      throw new Error("Failed to generate unique referral code");
    }
  }
  return code;
}

async function getUsersCollection() {
  const db = await getDb();
  return db.collection("users");
}

export async function ensureUserIndexes() {
  const db = await getDb();
  const collection = db.collection("users");
  await collection.createIndex({ username: 1 }, { unique: true, sparse: true });
}

ensureUserIndexes().catch((err) => {
  console.error("Failed to create user indexes:", err);
});

export async function getUserByUid(uid) {
  if (!uid) return null;

  const collection = await getUsersCollection();
  return collection.findOne({ uid }, { projection: { password: 0 } });
}

export async function getUserByUsername(username) {
  if (!username) return null;

  const collection = await getUsersCollection();
  return collection.findOne(
    { username: username.trim().toLowerCase() },
    { projection: { password: 0 } }
  );
}

export async function checkUsernameExists(username) {
  if (!username) return false;

  const collection = await getUsersCollection();
  const existing = await collection.findOne(
    { username: username.trim().toLowerCase() },
    { projection: { _id: 1 } }
  );
  return !!existing;
}

export async function updateUserByUid(uid, updates) {
  if (!uid) return null;

  const collection = await getUsersCollection();
  await collection.updateOne(
    { uid },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    }
  );

  return getUserByUid(uid);
}

export async function syncAuthenticatedUser({ uid, email, displayName = "", phoneNumber = "", invitationCode = "", username = "" }) {
  if (!uid || !email) {
    throw new Error("uid and email are required.");
  }

  const db = await getDb();
  const usersCollection = db.collection("users");
  const invitationCodesCollection = db.collection("invitationCodes");
  const existingUser = await usersCollection.findOne({ uid });
  const now = new Date();

  const isNewUser = !existingUser;
  const normalizedCode = typeof invitationCode === "string" ? invitationCode.trim().toUpperCase() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  let inviterUid = existingUser?.inviterUid || "";
  let inviterEmail = existingUser?.inviterEmail || "";
  let invitationId = existingUser?.invitationId || null;
  let accountType = existingUser?.accountType || "main";
  let isDemoAccount = Boolean(existingUser?.isDemoAccount || existingUser?.accountType === "demo");
  let demoProfitSharePercent = Number(existingUser?.demoProfitSharePercent || 20);

  if (normalizedCode) {
    const invitationDoc = await invitationCodesCollection.findOne({
      code: normalizedCode,
      isActive: true,
    });

    if (!invitationDoc || invitationDoc.usedByUid) {
      throw new Error("Invalid or already used invitation code.");
    }

    inviterUid = invitationDoc.createdByUid || "";
    inviterEmail = invitationDoc.createdByEmail || "";
    invitationId = invitationDoc._id;
    accountType = "demo";
    isDemoAccount = true;
    demoProfitSharePercent = 20;

    await invitationCodesCollection.updateOne(
      { _id: invitationDoc._id },
      {
        $set: {
          usedByUid: uid,
          usedByEmail: normalizedEmail,
          usedAt: now,
          updatedAt: now,
        },
      }
    );
  }

  const welcomeBonusReceived = existingUser?.welcomeBonusReceived || false;

  await usersCollection.updateOne(
    { uid },
    {
      $set: {
        email: normalizedEmail,
        username: (username || "").trim().toLowerCase(),
        displayName: displayName || "",
        phoneNumber: phoneNumber || "",
        invitationCode: normalizedCode || existingUser?.invitationCode || "",
        invitationId,
        inviterUid,
        inviterEmail,
        accountType,
        isDemoAccount,
        accountStatus: existingUser?.accountStatus || "active",
        freezeReason: existingUser?.freezeReason || null,
        freezeThreshold: Number(existingUser?.freezeThreshold || 0),
        freezeContext: existingUser?.freezeContext || null,
        demoProfitSharePercent,
        lastLoginAt: now,
        updatedAt: now,
      },
      $setOnInsert: {
        role: "user",
        availableBalance: 0,
        frozenBalance: 0,
        totalEarned: 0,
        totalDemoProfitShared: 0,
        welcomeBonusReceived: false,
        createdAt: now,
      },
    },
    { upsert: true }
  );

  if (isNewUser || !welcomeBonusReceived) {
    const WELCOME_BONUS = 5;

    await usersCollection.updateOne(
      { uid, welcomeBonusReceived: { $ne: true } },
      {
        $inc: { availableBalance: WELCOME_BONUS, totalEarned: WELCOME_BONUS },
        $set: { welcomeBonusReceived: true, updatedAt: now },
      }
    );

    await db.collection("balanceLogs").insertOne({
      uid,
      email: normalizedEmail,
      type: "credit",
      amount: WELCOME_BONUS,
      balanceBefore: 0,
      balanceAfter: WELCOME_BONUS,
      description: "Welcome signup bonus",
      referenceId: null,
      referenceType: "welcome_bonus",
      metadata: {},
      createdAt: now,
    });

    await db.collection("notifications").insertOne({
      uid,
      type: "welcome_bonus",
      title: "Welcome Bonus Received!",
      message: `Welcome! You've received a $${WELCOME_BONUS} signup bonus.`,
      isRead: false,
      metadata: { amount: WELCOME_BONUS },
      createdAt: now,
    });
  }

  if (isNewUser) {
    const myCode = await createUniqueReferralCode(db);
    const now2 = new Date();

    await invitationCodesCollection.insertOne({
      code: myCode,
      isActive: true,
      createdByUid: uid,
      createdByEmail: normalizedEmail,
      createdByName: displayName || "",
      usedByUid: null,
      usedByEmail: null,
      usedAt: null,
      createdAt: now2,
      updatedAt: now2,
    });

    await usersCollection.updateOne(
      { uid },
      { $set: { referralCode: myCode, updatedAt: now2 } }
    );
  }

  const user = await getUserByUid(uid);
  return { ...user, isNewUser: isNewUser || !welcomeBonusReceived };
}

export function isDemoUser(user) {
  return Boolean(user?.isDemoAccount) || user?.accountType === "demo";
}

export async function freezeUserForBalance(uid, freezeThreshold, freezeContext = {}) {
  return updateUserByUid(uid, {
    accountStatus: "frozen",
    isFrozen: true,
    freezeReason: "balance_requirement",
    freezeThreshold: Number(freezeThreshold || 0),
    freezeContext,
    frozenAt: new Date(),
  });
}

export async function unfreezeUser(uid) {
  return updateUserByUid(uid, {
    accountStatus: "active",
    isFrozen: false,
    freezeReason: null,
    freezeThreshold: 0,
    freezeContext: null,
    unfrozenAt: new Date(),
  });
}

export async function resolveFrozenBalanceState(uid) {
  const user = await getUserByUid(uid);
  if (!user || user.accountStatus !== "frozen") {
    return user;
  }

  if (user.freezeReason !== "balance_requirement") {
    return user;
  }

  const availableBalance = Number(user.availableBalance || 0);
  const freezeThreshold = Number(user.freezeThreshold || 0);

  if (availableBalance >= freezeThreshold) {
    return unfreezeUser(uid);
  }

  return user;
}

export async function creditUserBalance(uid, amount, { autoResolveFreeze = true } = {}) {
  const collection = await getUsersCollection();
  const numericAmount = Number(amount || 0);

  const result = await collection.findOneAndUpdate(
    { uid },
    {
      $inc: {
        availableBalance: numericAmount,
        totalEarned: numericAmount > 0 ? numericAmount : 0,
      },
      $set: {
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  if (!result.value) {
    return null;
  }

  if (!autoResolveFreeze) {
    return result.value;
  }

  return resolveFrozenBalanceState(uid);
}

export async function debitUserBalance(uid, amount, { autoResolveFreeze = false } = {}) {
  return creditUserBalance(uid, -Math.abs(Number(amount || 0)), { autoResolveFreeze });
}

export function canUserWithdraw(user) {
  if (!user) return false;
  if (user.accountStatus === "frozen") return false;
  return !isDemoUser(user);
}