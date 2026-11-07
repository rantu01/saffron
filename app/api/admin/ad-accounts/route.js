import { NextResponse } from "next/server";
import { getAllAdAccounts, createAdAccount, updateAdAccount, deleteAdAccount, getUnassignedAdAccounts } from "@/lib/adAccountModel";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const { searchParams } = new URL(request.url);
    const includeUnassigned = searchParams.get("includeUnassigned") === "true";

    if (searchParams.get("unassigned") === "true") {
      const accounts = await getUnassignedAdAccounts();
      return NextResponse.json({ success: true, adAccounts: accounts });
    }

    const adAccounts = await getAllAdAccounts(includeUnassigned);
    return NextResponse.json({ success: true, adAccounts });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to fetch ad accounts:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const body = await request.json();
    const { uid, email, name, accountId, budget, status, metaAccountId, metaAccountName, currency, spendCap } = body;
    const assignedBy = authContext.uid;

    const adAccount = await createAdAccount({
      uid: uid || "",
      email: email || "",
      name,
      accountId,
      budget,
      status,
      metaAccountId,
      metaAccountName,
      currency,
      spendCap,
      assignedBy,
    });

    return NextResponse.json({ success: true, adAccount });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to create ad account:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}

export async function PATCH(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const body = await request.json();
    const { _id, ...updates } = body;

    if (!_id) {
      return NextResponse.json({ success: false, message: "_id required" }, { status: 400 });
    }

    const result = await updateAdAccount(_id, updates);
    return NextResponse.json({ success: true, adAccount: result });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to update ad account:", error);
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "id required" }, { status: 400 });
    }

    await deleteAdAccount(id);
    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to delete ad account:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
