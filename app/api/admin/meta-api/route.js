import { NextResponse } from "next/server";
import { getMetaSettings, updateMetaSettings } from "@/lib/metaSettingsModel";
import { testConnection } from "@/lib/metaApiService";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

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
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to fetch meta settings:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}

export async function PUT(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const body = await request.json();
    const { businessManagerId, appId, accessToken, autoSpendCapUpdate, autoSyncEnabled } = body;

    const updates = {};
    if (businessManagerId !== undefined) updates.businessManagerId = businessManagerId;
    if (appId !== undefined) updates.appId = appId;
    if (accessToken !== undefined) updates.accessToken = accessToken;
    if (autoSpendCapUpdate !== undefined) updates.autoSpendCapUpdate = Boolean(autoSpendCapUpdate);
    if (autoSyncEnabled !== undefined) updates.autoSyncEnabled = Boolean(autoSyncEnabled);

    const result = await updateMetaSettings(updates);

    const safe = result
      ? {
          businessManagerId: result.businessManagerId || "",
          appId: result.appId || "",
          autoSpendCapUpdate: result.autoSpendCapUpdate || false,
          autoSyncEnabled: result.autoSyncEnabled || false,
          updatedAt: result.updatedAt || null,
          hasAccessToken: Boolean(result.accessToken),
        }
      : null;

    if (accessToken || businessManagerId) {
      const test = await testConnection();
      return NextResponse.json({ success: true, settings: safe, connectionTest: test });
    }

    return NextResponse.json({ success: true, settings: safe });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("Failed to update meta settings:", error);
    }
    return NextResponse.json(
      { success: false, message: status === 500 ? "Internal server error." : error.message },
      { status }
    );
  }
}
