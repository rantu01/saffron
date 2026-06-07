import { NextResponse } from "next/server";
import { getAdAccountsByUid, createAdAccount } from "@/lib/adAccountModel";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

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
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch ad accounts" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, email, name, accountId, budget, status } = body;

    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    const adAccount = await createAdAccount({ uid, email, name, accountId, budget, status });

    return NextResponse.json({ success: true, adAccount });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to create ad account" }, { status: 500 });
  }
}
