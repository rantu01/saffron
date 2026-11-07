import { NextResponse } from "next/server";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";
import { publishComboConfigVersion } from "@/lib/comboConfig";

export async function POST(request, { params }) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);
    const { id } = await params;
    const result = await publishComboConfigVersion(id, { actorUid: authContext.uid });
    return NextResponse.json({ success: true, version: result });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}