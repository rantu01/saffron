import { NextResponse } from "next/server";
import { getAdAccountsByUid, createAdAccount } from "@/lib/adAccountModel";
import clientPromise from "@/lib/mongodb";
import { requireFirebaseAuth } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const uid = authContext.uid;

    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    const adAccounts = await getAdAccountsByUid(uid);

    const totalBudget = adAccounts.reduce((s, a) => s + Number(a.budget || 0), 0);
    const totalSpent = adAccounts.reduce((s, a) => s + Number(a.spent || 0), 0);
    const activeCount = adAccounts.filter((a) => a.status === "active").length;

    return NextResponse.json({
      success: true,
      adAccounts,
      summary: {
        total: adAccounts.length,
        active: activeCount,
        totalBudget,
        totalSpent,
        remainingBudget: totalBudget - totalSpent,
      },
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to fetch ad accounts:", error);
    }
    return NextResponse.json({ success: false, message: status === 500 ? "Internal server error." : error.message }, { status });
  }
}

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);

    const body = await request.json();
    const { email, name, accountId, budget, status } = body;
    const uid = authContext.uid;

    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    const adAccount = await createAdAccount({ uid, email, name, accountId, budget, status });

    return NextResponse.json({ success: true, adAccount });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to create ad account:", error);
    }
    return NextResponse.json({ success: false, message: status === 500 ? "Internal server error." : error.message }, { status });
  }
}
