import { NextResponse } from "next/server";
import { getWhatsAppSettings, updateWhatsAppSettings, getNotificationLogs } from "@/lib/whatsappSettingsModel";
import { requireFirebaseAuth, requireAdminUser } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const settings = await getWhatsAppSettings();
    const safe = settings
      ? {
          enabled: settings.enabled || false,
          phoneNumberId: settings.phoneNumberId || "",
          businessAccountId: settings.businessAccountId || "",
          notifyOnDeposit: settings.notifyOnDeposit ?? true,
          notifyOnWithdrawal: settings.notifyOnWithdrawal ?? true,
          notifyOnTaskComplete: settings.notifyOnTaskComplete ?? true,
          notifyOnBalanceFreeze: settings.notifyOnBalanceFreeze ?? true,
          updatedAt: settings.updatedAt || null,
          hasAccessToken: Boolean(settings.accessToken),
        }
      : null;

    return NextResponse.json({ success: true, settings: safe });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("WhatsApp settings error:", error);
    }
    return NextResponse.json({ success: false, message: status === 500 ? "Internal server error." : error.message }, { status });
  }
}

export async function PUT(request) {
  try {
    const authContext = await requireFirebaseAuth(request);
    requireAdminUser(authContext.user);

    const body = await request.json();
    const { enabled, phoneNumberId, businessAccountId, accessToken, notifyOnDeposit, notifyOnWithdrawal, notifyOnTaskComplete, notifyOnBalanceFreeze } = body;

    const updates = {};
    if (enabled !== undefined) updates.enabled = Boolean(enabled);
    if (phoneNumberId !== undefined) updates.phoneNumberId = phoneNumberId;
    if (businessAccountId !== undefined) updates.businessAccountId = businessAccountId;
    if (accessToken !== undefined) updates.accessToken = accessToken;
    if (notifyOnDeposit !== undefined) updates.notifyOnDeposit = Boolean(notifyOnDeposit);
    if (notifyOnWithdrawal !== undefined) updates.notifyOnWithdrawal = Boolean(notifyOnWithdrawal);
    if (notifyOnTaskComplete !== undefined) updates.notifyOnTaskComplete = Boolean(notifyOnTaskComplete);
    if (notifyOnBalanceFreeze !== undefined) updates.notifyOnBalanceFreeze = Boolean(notifyOnBalanceFreeze);

    const result = await updateWhatsAppSettings(updates);
    const safe = result
      ? {
          enabled: result.enabled || false,
          phoneNumberId: result.phoneNumberId || "",
          businessAccountId: result.businessAccountId || "",
          notifyOnDeposit: result.notifyOnDeposit ?? true,
          notifyOnWithdrawal: result.notifyOnWithdrawal ?? true,
          notifyOnTaskComplete: result.notifyOnTaskComplete ?? true,
          notifyOnBalanceFreeze: result.notifyOnBalanceFreeze ?? true,
          hasAccessToken: Boolean(result.accessToken),
          updatedAt: result.updatedAt,
        }
      : null;

    return NextResponse.json({ success: true, settings: safe });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    if (status === 500) {
      console.error("WhatsApp settings error:", error);
    }
    return NextResponse.json({ success: false, message: status === 500 ? "Internal server error." : error.message }, { status });
  }
}
