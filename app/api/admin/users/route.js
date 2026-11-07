import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getUserByUid, resolveFrozenBalanceState } from "@/lib/userModel";
import { createBalanceLog } from "@/lib/balanceLog";
import { deleteUserRelatedData } from "@/lib/userCleanup";
import { requireAdminUser, requireFirebaseAuth } from "@/lib/apiAuth";
import { createActivityLog } from "@/lib/activityLog";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    let query = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      query = {
        $or: [
          { email: regex },
          { displayName: regex },
          { username: regex },
          { uid: regex },
        ],
      };
    }

    const [users, total] = await Promise.all([
      db
        .collection("users")
        .find(query)
        .project({ password: 0 })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      db.collection("users").countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;

    if (status === 500) {
      console.error("Failed to fetch users:", error);
    }

    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const body = await request.json();
    const { uid, email: inputEmail, password } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "uid is required." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, message: "password is required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const originalUser = await db.collection("users").findOne({ uid });
    if (!originalUser) {
      return NextResponse.json(
        { success: false, message: "Original user not found." },
        { status: 404 }
      );
    }

    const demoEmail = inputEmail || `demo_${originalUser.email || originalUser.uid}`;

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password, returnSecureToken: true }),
      }
    );

    const firebaseData = await firebaseRes.json();

    if (!firebaseRes.ok) {
      return NextResponse.json(
        { success: false, message: firebaseData.error?.message || "Failed to create Firebase auth user." },
        { status: 400 }
      );
    }

    const demoUid = firebaseData.localId;
    const now = new Date();

    const demoUser = {
      uid: demoUid,
      email: demoEmail,
      displayName: `${originalUser.displayName || originalUser.email || "User"} (Demo)`,
      phoneNumber: "",
      invitationCode: "",
      invitationId: null,
      inviterUid: uid,
      inviterEmail: originalUser.email || "",
      accountType: "demo",
      isDemoAccount: true,
      accountStatus: "active",
      freezeReason: null,
      freezeThreshold: 0,
      freezeContext: null,
      demoProfitSharePercent: 20,
      role: "user",
      availableBalance: 0,
      totalEarned: 0,
      totalDemoProfitShared: 0,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("users").insertOne(demoUser);

    try {
      await createActivityLog({
        actorUid: authContext.uid,
        actorEmail: authContext.user?.email || "",
        actorRole: authContext.user?.role || "",
        action: "user.demo.create",
        targetType: "user",
        targetId: demoUser.uid,
        targetSnapshot: { uid: demoUser.uid, email: demoUser.email, accountType: "demo" },
        before: null,
        after: { uid: demoUser.uid, email: demoUser.email },
        reason: "",
        metadata: { originalUid: body?.uid },
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
        userAgent: request.headers.get("user-agent") || "",
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Demo account created successfully.",
      user: { ...demoUser, password: undefined },
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;

    if (status === 500) {
      console.error("Failed to create demo account:", error);
    }

    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}

export async function PATCH(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const body = await request.json();
    const {
      uid,
      role,
      availableBalance,
      accountStatus,
      accountType,
      isDemoAccount,
      freezeReason,
      freezeThreshold,
      inviterUid,
      inviterEmail,
      demoProfitSharePercent,
      referralCodeReusable,
    } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "uid is required." },
        { status: 400 }
      );
    }

    const update = { updatedAt: new Date() };
    let balanceBefore = null;

    if (availableBalance !== undefined) {
      const existingUser = await getUserByUid(uid);
      if (!existingUser) {
        return NextResponse.json(
          { success: false, message: "User not found." },
          { status: 404 }
        );
      }
      balanceBefore = Number(existingUser.availableBalance || 0);
    }

    if (typeof role === "string" && role) {
      update.role = role;
    }
    if (availableBalance !== undefined) {
      const numericBalance = Number(availableBalance);
      if (Number.isNaN(numericBalance)) {
        return NextResponse.json(
          { success: false, message: "availableBalance must be a number." },
          { status: 400 }
        );
      }
      update.availableBalance = numericBalance;
    }

    if (typeof accountStatus === "string" && accountStatus) {
      update.accountStatus = accountStatus;
      update.isFrozen = accountStatus === "frozen";
      update.statusActorUid = authContext.uid;
      update.statusUpdatedAt = new Date();
      if (freezeReason !== undefined) {
        update.statusReason = freezeReason || null;
      } else if (body?.statusReason !== undefined) {
        update.statusReason = body.statusReason || null;
      }
      if (accountStatus === "active" && freezeReason === undefined && body?.statusReason === undefined) {
        update.freezeReason = null;
        update.freezeThreshold = 0;
        update.freezeContext = null;
        update.statusReason = null;
      }
    }

    if (typeof accountType === "string" && accountType) {
      update.accountType = accountType;
      update.isDemoAccount = accountType === "demo";
    }

    if (typeof isDemoAccount === "boolean") {
      update.isDemoAccount = isDemoAccount;
      update.accountType = isDemoAccount ? "demo" : "main";
    }

    if (freezeReason !== undefined) {
      update.freezeReason = freezeReason || null;
    }

    if (freezeThreshold !== undefined) {
      const numericThreshold = Number(freezeThreshold);
      if (Number.isNaN(numericThreshold)) {
        return NextResponse.json(
          { success: false, message: "freezeThreshold must be a number." },
          { status: 400 }
        );
      }
      update.freezeThreshold = numericThreshold;
    }

    if (typeof inviterUid === "string") {
      update.inviterUid = inviterUid;
    }

    if (typeof inviterEmail === "string") {
      update.inviterEmail = inviterEmail;
    }

    if (demoProfitSharePercent !== undefined) {
      const numericPercent = Number(demoProfitSharePercent);
      if (Number.isNaN(numericPercent)) {
        return NextResponse.json(
          { success: false, message: "demoProfitSharePercent must be a number." },
          { status: 400 }
        );
      }
      update.demoProfitSharePercent = numericPercent;
    }

    if (typeof referralCodeReusable === "boolean") {
      update.referralCodeReusable = referralCodeReusable;
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    await db.collection("users").updateOne({ uid }, { $set: update });

    if (availableBalance !== undefined && balanceBefore !== null) {
      const balanceAfter = Number(update.availableBalance || 0);
      const delta = balanceAfter - balanceBefore;

      if (delta !== 0) {
        await createBalanceLog({
          uid,
          email: body.email || "",
          type: "admin_adjustment",
          amount: delta,
          balanceBefore,
          balanceAfter,
          description:
            body.description?.trim() ||
            `Available balance set by admin: $${balanceBefore.toFixed(2)} → $${balanceAfter.toFixed(2)}`,
          referenceId: authContext.uid,
          referenceType: "admin_adjustment",
          metadata: { actorUid: authContext.uid, source: "admin_users_patch" },
        });
      }
    }

    if (typeof referralCodeReusable === "boolean") {
      await db.collection("invitationCodes").updateMany(
        { createdByUid: uid, isActive: true },
        { $set: { reusable: referralCodeReusable, updatedAt: new Date() } }
      );
    }

    if (availableBalance !== undefined) {
      await resolveFrozenBalanceState(uid);
    }

    try {
      await createActivityLog({
        actorUid: authContext.uid,
        actorEmail: authContext.user?.email || "",
        actorRole: authContext.user?.role || "",
        action: "user.update",
        targetType: "user",
        targetId: uid,
        targetSnapshot: { uid },
        before: null,
        after: { accountStatus, availableBalance, role, freezeThreshold, demoProfitSharePercent },
        reason: body?.freezeReason || body?.reason || "",
        metadata: { fields: Object.keys(body || {}) },
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
        userAgent: request.headers.get("user-agent") || "",
      });
    } catch {}

    return NextResponse.json({ success: true, message: "User updated successfully." });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;

    if (status === 500) {
      console.error("Failed to update admin user:", error);
    }

    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}

export async function DELETE(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid") || (await request.json().then((b) => b.uid));

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "uid is required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const deletedUser = await db.collection("users").findOneAndDelete({ uid });

    if (!deletedUser) {
      return NextResponse.json(
        { success: false, message: "User not found in database." },
        { status: 404 }
      );
    }

    let firebaseDeleted = false;
    try {
      const { getAdminAuth } = await import("@/lib/firebaseAdmin");
      const adminAuth = getAdminAuth();
      await adminAuth.deleteUser(uid);
      firebaseDeleted = true;
    } catch (fbError) {
      const code = fbError?.errorInfo?.code || fbError?.code;
      if (code === "auth/user-not-found") {
        console.warn(`Firebase auth user ${uid} did not exist. Proceeding with MongoDB deletion only.`);
      } else {
        console.error(`Firebase deleteUser failed for ${uid}:`, fbError?.message || fbError);
      }
    }

    try {
      const { failed } = await deleteUserRelatedData(db, uid);
      if (failed.length) {
        console.error(`Related data cleanup incomplete for ${uid}:`, failed);
      }
    } catch (cleanupError) {
      console.error(`Related data cleanup failed for ${uid}:`, cleanupError?.message || cleanupError);
    }

    try {
      await createActivityLog({
        actorUid: authContext.uid,
        actorEmail: authContext.user?.email || "",
        actorRole: authContext.user?.role || "",
        action: "user.delete",
        targetType: "user",
        targetId: uid,
        targetSnapshot: { uid },
        before: { exists: true },
        after: { exists: false },
        reason: "",
        metadata: { firebaseDeleted },
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
        userAgent: request.headers.get("user-agent") || "",
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "User deleted successfully.",
      firebaseDeleted,
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;

    if (status === 500) {
      console.error("Failed to delete admin user:", error);
    }

    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
