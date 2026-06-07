import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("avatar");
    const uid = formData.get("uid");

    if (!file || !uid) {
      return NextResponse.json({ success: false, message: "File and uid required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || "png";
    const filename = `${uid}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Upload failed" }, { status: 500 });
  }
}
