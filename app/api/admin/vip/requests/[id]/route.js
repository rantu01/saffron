import { NextResponse } from "next/server";
import { approveVipRequest, rejectVipRequest } from "@/lib/vipModel";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { action, adminUid, note } = body;

    let result;
    if (action === "approve") {
      result = await approveVipRequest(id, { adminUid, note });
    } else if (action === "reject") {
      result = await rejectVipRequest(id, { adminUid, note });
    } else {
      return NextResponse.json(
        { success: false, message: "action must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, request: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to resolve VIP request." },
      { status: 400 }
    );
  }
}
