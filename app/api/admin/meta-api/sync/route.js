import { NextResponse } from "next/server";
import { fetchAdAccountsFromBM, syncAllAdAccounts } from "@/lib/metaApiService";
import { saveMetaAdAccounts, getMetaAdAccounts, getSyncLogs, createSyncLog } from "@/lib/metaSettingsModel";

export async function POST(request) {
  try {
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
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
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
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
