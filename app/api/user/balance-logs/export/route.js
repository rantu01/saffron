import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const type = searchParams.get("type") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!uid) {
      return NextResponse.json({ success: false, message: "uid required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "saffron");

    const query = {};
    if (uid && uid !== "all") query.uid = uid;
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
    return NextResponse.json(
      { success: false, message: error.message || "Export failed" },
      { status: 500 }
    );
  }
}
