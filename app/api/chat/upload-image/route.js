import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    const uid = formData.get("uid");

    if (!file || !uid) {
      return NextResponse.json({ success: false, message: "Image file and uid are required." }, { status: 400 });
    }

    if (typeof file === "string" || !file.type || !ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: "Only JPG, JPEG, PNG, and WEBP images are allowed." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: "Image is too large. Maximum size is 5 MB." },
        { status: 400 }
      );
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filename = `${uid}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "chat-images");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const imageUrl = `/uploads/chat-images/${filename}`;

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Image upload failed." }, { status: 500 });
  }
}
