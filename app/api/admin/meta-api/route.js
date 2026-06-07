import { NextResponse } from "next/server";
import { getMetaSettings, updateMetaSettings } from "@/lib/metaSettingsModel";
import { testConnection } from "@/lib/metaApiService";

export async function GET() {
  try {
    const settings = await getMetaSettings();
    const safe = settings ? {
      businessManagerId: settings.businessManagerId || "",
      appId: settings.appId || "",
      autoSpendCapUpdate: settings.autoSpendCapUpdate || false,
      autoSyncEnabled: settings.autoSyncEnabled || false,
      updatedAt: settings.updatedAt || null,
      hasAccessToken: Boolean(settings.accessToken),
    } : null;
    return NextResponse.json({ success: true, settings: safe });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { businessManagerId, appId, accessToken, autoSpendCapUpdate, autoSyncEnabled } = body;

    const updates = {};
    if (businessManagerId !== undefined) updates.businessManagerId = businessManagerId;
    if (appId !== undefined) updates.appId = appId;
    if (accessToken !== undefined) updates.accessToken = accessToken;
    if (autoSpendCapUpdate !== undefined) updates.autoSpendCapUpdate = Boolean(autoSpendCapUpdate);
    if (autoSyncEnabled !== undefined) updates.autoSyncEnabled = Boolean(autoSyncEnabled);

    const result = await updateMetaSettings(updates);

    if (accessToken || businessManagerId) {
      const test = await testConnection();
      return NextResponse.json({ success: true, settings: result, connectionTest: test });
    }

    return NextResponse.json({ success: true, settings: result });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
