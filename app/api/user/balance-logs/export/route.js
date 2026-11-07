import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireFirebaseAuth } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    const { searchParams } = new URL(request.url);
    const requestedUid = searchParams.get("uid");
    const isAdmin = authContext.user?.role === "admin" || authContext.user?.role === "Admin";
    const uid = isAdmin && requestedUid ? requestedUid : authContext.uid;
    const type = searchParams.get("type") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const query = {};
    query.uid = uid;
    if (type && type !== "all") query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const logs = await db
      .collection("balanceLogs")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const header = "Date,Type,Amount,Balance Before,Balance After,Description,Reference\n";
    const rows = logs.map((log) => {
      const date = new Date(log.createdAt).toISOString();
      const type = log.type || "unknown";
      const amount = Number(log.amount || 0).toFixed(2);
      const before = Number(log.balanceBefore || 0).toFixed(2);
      const after = Number(log.balanceAfter || 0).toFixed(2);
      const desc = (log.description || "").replace(/,/g, " ");
      const ref = log.referenceId || "";
      return `${date},${type},${amount},${before},${after},${desc},${ref}`;
    }).join("\n");

    const csv = header + rows;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="balance-history-${uid.slice(0, 8)}.csv"`,
      },
    });
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
