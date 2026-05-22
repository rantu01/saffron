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
    const { uid, displayName, avatarUrl } = body;
    if (!uid) return NextResponse.json({ success: false, message: 'uid required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'saffron');

    const update = { updatedAt: new Date() };
    if (typeof displayName === 'string') update.displayName = displayName;
    if (typeof avatarUrl === 'string') update.avatarUrl = avatarUrl;

    await db.collection('users').updateOne({ uid }, { $set: update });

    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed' }, { status: 500 });
  }
}