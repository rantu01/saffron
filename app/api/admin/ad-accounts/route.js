import { NextResponse } from "next/server";
import { getAllAdAccounts, createAdAccount, updateAdAccount, deleteAdAccount, getUnassignedAdAccounts } from "@/lib/adAccountModel";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUnassigned = searchParams.get("includeUnassigned") === "true";

    if (searchParams.get("unassigned") === "true") {
      const accounts = await getUnassignedAdAccounts();
      return NextResponse.json({ success: true, adAccounts: accounts });
    }

    const adAccounts = await getAllAdAccounts(includeUnassigned);
    return NextResponse.json({ success: true, adAccounts });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, email, name, accountId, budget, status, metaAccountId, metaAccountName, currency, spendCap, assignedBy } = body;

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
    return NextResponse.json({ success: false, message: error.message || "Failed to create" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { _id, ...updates } = body;

    if (!_id) {
      return NextResponse.json({ success: false, message: "_id required" }, { status: 400 });
    }

    const result = await updateAdAccount(_id, updates);
    return NextResponse.json({ success: true, adAccount: result });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "id required" }, { status: 400 });
    }

    await deleteAdAccount(id);
    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to delete" }, { status: 500 });
  }
}
