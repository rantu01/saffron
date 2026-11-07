import { NextResponse } from "next/server";
import { fetchAdAccountsFromBM, syncAllAdAccounts } from "@/lib/metaApiService";
import { saveMetaAdAccounts, getMetaAdAccounts, getSyncLogs, createSyncLog } from "@/lib/metaSettingsModel";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function POST(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const body = await request.json();
    const { action } = body;

    if (action === "fetch-accounts") {
      const accounts = await fetchAdAccountsFromBM();
      await saveMetaAdAccounts(accounts);
      await createSyncLog({ type: "info", message: `Fetched ${accounts.length} ad accounts from Meta BM` });
      return NextResponse.json({ success: true, accounts, count: accounts.length });
    }

    if (action === "sync-spend") {
      const result = await syncAllAdAccounts();
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "test-connection") {
      const { testConnection } = await import("@/lib/metaApiService");
      const result = await testConnection();
      return NextResponse.json({ success: result.success, message: result.message, connectionTest: result });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to sync meta data:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "meta-accounts") {
      const accounts = await getMetaAdAccounts();
      return NextResponse.json({ success: true, accounts });
    }

    if (type === "logs") {
      const logs = await getSyncLogs();
      return NextResponse.json({ success: true, logs });
    }

    return NextResponse.json({ success: false, message: "Invalid type parameter" }, { status: 400 });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to fetch meta sync data:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
