import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    if (!uid) return NextResponse.json({ success: false, message: 'uid required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saffron');

    const user = await db.collection('users').findOne({ uid }, { projection: { password: 0 } });
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { uid, displayName, avatarUrl, phoneNumber, username } = body;
    if (!uid) return NextResponse.json({ success: false, message: 'uid required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saffron');

    const update = { updatedAt: new Date() };
    if (typeof displayName === 'string') update.displayName = displayName;
    if (typeof avatarUrl === 'string') update.avatarUrl = avatarUrl;
    if (typeof phoneNumber === 'string') update.phoneNumber = phoneNumber;

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
    return NextResponse.json({ success: false, message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { uid } = body;
    if (!uid) return NextResponse.json({ success: false, message: 'uid required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saffron');

    const user = await db.collection('users').findOne({ uid });
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    await db.collection('users').deleteOne({ uid });
    await db.collection('tasks').deleteMany({ assigneeUid: uid });
    await db.collection('deposits').deleteMany({ uid });
    await db.collection('withdrawals').deleteMany({ uid });
    await db.collection('userTaskSets').deleteMany({ uid });
    await db.collection('balanceLogs').deleteMany({ uid });

    return NextResponse.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed' }, { status: 500 });
  }
}