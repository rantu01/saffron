import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { deleteUserRelatedData } from "@/lib/userCleanup";
import { requireFirebaseAuth } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const { searchParams } = new URL(request.url);
    const uid = authContext.uid;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saffron');

    const user = await db.collection('users').findOne({ uid }, { projection: { password: 0 } });
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json({ success: false, message: status === 500 ? "Internal server error." : error.message }, { status });
  }
}

export async function PATCH(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const body = await request.json();
    const { displayName, avatarUrl, phoneNumber, username, walletAddress, walletNetwork, preferredLanguage } = body;
    const uid = authContext.uid;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saffron');

    const update = { updatedAt: new Date() };
    if (typeof displayName === 'string') update.displayName = displayName;
    if (typeof avatarUrl === 'string') update.avatarUrl = avatarUrl;
    if (typeof phoneNumber === 'string') update.phoneNumber = phoneNumber;
    if (typeof walletAddress === 'string') update.walletAddress = walletAddress.trim();
    if (typeof walletNetwork === 'string' && walletNetwork.trim()) update.walletNetwork = walletNetwork.trim();
    if (typeof preferredLanguage === 'string' && ['en', 'fr', 'es'].includes(preferredLanguage)) update.preferredLanguage = preferredLanguage;

    if (typeof username === 'string' && username.trim()) {
      const normalizedUsername = username.trim().toLowerCase();
      const existing = await db.collection('users').findOne(
        { username: normalizedUsername, uid: { $ne: uid } },
        { projection: { _id: 1 } }
      );
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'This username is already taken by another user.' },
          { status: 409 }
        );
      }
      update.username = normalizedUsername;
    }

    await db.collection('users').updateOne({ uid }, { $set: update });

    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json({ success: false, message: status === 500 ? "Internal server error." : error.message }, { status });
  }
}

export async function DELETE(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const body = await request.json().catch(() => ({}));
    const uid = authContext.uid;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saffron');

    const user = await db.collection('users').findOne({ uid });
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    await db.collection('users').deleteOne({ uid });

    const { failed } = await deleteUserRelatedData(db, uid);
    if (failed.length) {
      console.error(`Related data cleanup incomplete for ${uid}:`, failed);
    }

    return NextResponse.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json({ success: false, message: status === 500 ? "Internal server error." : error.message }, { status });
  }
}