import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { resolveFrozenBalanceState } from "@/lib/userModel";

export async function GET(request) {
  try {
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
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch users." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
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

    return NextResponse.json({
      success: true,
      message: "Demo account created successfully.",
      user: { ...demoUser, password: undefined },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create demo account." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
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
      if (accountStatus === "active" && freezeReason === undefined) {
        update.freezeReason = null;
        update.freezeThreshold = 0;
        update.freezeContext = null;
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

    if (typeof referralCodeReusable === "boolean") {
      await db.collection("invitationCodes").updateMany(
        { createdByUid: uid, isActive: true },
        { $set: { reusable: referralCodeReusable, updatedAt: new Date() } }
      );
    }

    if (availableBalance !== undefined) {
      await resolveFrozenBalanceState(uid);
    }

    return NextResponse.json({ success: true, message: "User updated successfully." });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "User update failed." },
      { status: 500 }
    );
  }
}
