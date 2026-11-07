import { NextResponse } from "next/server";
import { assignAdAccount, unassignAdAccount } from "@/lib/adAccountModel";
import { getUserByUid } from "@/lib/userModel";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const body = await request.json();
    const { accountIds, uid } = body;
    const assignedBy = authContext.uid;

    if (!accountIds || !uid || !assignedBy) {
      return NextResponse.json({ success: false, message: "accountIds, uid, and assignedBy are required" }, { status: 400 });
    }

    const user = await getUserByUid(uid);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found with this UID" }, { status: 404 });
    }

    const ids = Array.isArray(accountIds) ? accountIds : [accountIds];
    const results = [];
    const errors = [];

    for (const accountId of ids) {
      try {
        const result = await assignAdAccount(accountId, uid, user.email || "", assignedBy);
        results.push(result);
      } catch (err) {
        errors.push({ accountId, message: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      assigned: results.length,
      errors: errors.length,
      adAccounts: results,
      errorDetails: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to assign ad accounts:", error);
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
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json({ success: false, message: "accountId required" }, { status: 400 });
    }

    const result = await unassignAdAccount(accountId);
    return NextResponse.json({ success: true, adAccount: result });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to unassign ad account:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
