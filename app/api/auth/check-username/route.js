import { NextResponse } from "next/server";
import { checkUsernameExists } from "@/lib/userModel";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== "string" || !username.trim()) {
      return NextResponse.json(
        { success: false, message: "Username is required." },
        { status: 400 }
      );
    }

    const exists = await checkUsernameExists(username);

    return NextResponse.json({ success: true, available: !exists });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Check failed." },
      { status: 500 }
    );
  }
}
