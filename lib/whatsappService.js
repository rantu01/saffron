import { getWhatsAppSettings, logNotification } from "./whatsappSettingsModel";

const GRAPH_API_BASE = "https://graph.facebook.com/v22.0";

function formatPhone(phone) {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("880")) cleaned = `+${cleaned}`;
    else if (cleaned.startsWith("0")) cleaned = `+88${cleaned}`;
    else cleaned = `+${cleaned}`;
  }
  return cleaned;
}

export async function sendWhatsAppMessage(phone, message) {
  const settings = await getWhatsAppSettings();
  if (!settings?.enabled) {
    await logNotification({
      type: "skipped",
      channel: "whatsapp",
      phone,
      message,
      reason: "WhatsApp notifications are disabled in settings",
    });
    return { success: false, skipped: true, reason: "Notifications disabled" };
  }

  if (!settings.phoneNumberId || !settings.accessToken) {
    await logNotification({
      type: "error",
      channel: "whatsapp",
      phone,
      message,
      reason: "WhatsApp API not configured (missing phoneNumberId or accessToken)",
    });
    return { success: false, error: "WhatsApp API not configured" };
  }

  const to = formatPhone(phone);
  const url = `${GRAPH_API_BASE}/${settings.phoneNumberId}/messages?access_token=${settings.accessToken}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: message },
      }),
    });

    const data = await res.json();

    if (data.error) {
      await logNotification({
        type: "error",
        channel: "whatsapp",
        phone: to,
        message,
        reason: data.error.message,
        meta: data.error,
      });
      return { success: false, error: data.error.message };
    }

    await logNotification({
      type: "sent",
      channel: "whatsapp",
      phone: to,
      message,
      meta: { msgId: data.messages?.[0]?.id },
    });

    return { success: true, msgId: data.messages?.[0]?.id };
  } catch (err) {
    await logNotification({
      type: "error",
      channel: "whatsapp",
      phone: to,
      message,
      reason: err.message,
    });
    return { success: false, error: err.message };
  }
}

export async function sendDepositApproved(phone, userName, amount, balance) {
  const msg = `✅ *Deposit Approved*\n\nHi ${userName},\n\nYour deposit of *$${parseFloat(amount).toFixed(2)}* has been approved and credited to your wallet.\n\nCurrent Balance: *$${parseFloat(balance).toFixed(2)}*\n\nThank you for choosing Saffron Edge!`;
  return sendWhatsAppMessage(phone, msg);
}

export async function sendDepositRejected(phone, userName, amount, reason) {
  const msg = `❌ *Deposit Rejected*\n\nHi ${userName},\n\nYour deposit request of *$${parseFloat(amount).toFixed(2)}* has been rejected.\n\nReason: ${reason || "Not specified"}\n\nPlease contact support for more information.`;
  return sendWhatsAppMessage(phone, msg);
}

export async function sendWithdrawalApproved(phone, userName, amount, wallet) {
  const msg = `✅ *Withdrawal Approved*\n\nHi ${userName},\n\nYour withdrawal of *$${parseFloat(amount).toFixed(2)}* has been approved.\n\nSent to: ${wallet || "Your wallet address"}\n\nFunds should arrive shortly. Thank you for using Saffron Edge!`;
  return sendWhatsAppMessage(phone, msg);
}

export async function sendWithdrawalRejected(phone, userName, amount, reason) {
  const msg = `❌ *Withdrawal Rejected*\n\nHi ${userName},\n\nYour withdrawal request of *$${parseFloat(amount).toFixed(2)}* has been rejected.\n\nReason: ${reason || "Not specified"}\n\nPlease contact support for more information.`;
  return sendWhatsAppMessage(phone, msg);
}

export async function sendTaskCompleted(phone, userName, taskTitle, earned, balance) {
  const msg = `🎉 *Task Completed*\n\nHi ${userName},\n\nYou have completed: *${taskTitle || "Task"}*\n\nEarned: *$${parseFloat(earned).toFixed(2)}*\nCurrent Balance: *$${parseFloat(balance).toFixed(2)}*\n\nKeep up the great work!`;
  return sendWhatsAppMessage(phone, msg);
}

export async function sendBalanceFrozen(phone, userName, requiredBalance, currentBalance) {
  const msg = `⚠️ *Account Frozen*\n\nHi ${userName},\n\nYour account has been temporarily frozen.\n\nRequired Balance: *$${parseFloat(requiredBalance).toFixed(2)}*\nCurrent Balance: *$${parseFloat(currentBalance).toFixed(2)}*\n\nPlease deposit funds to continue using our services.`;
  return sendWhatsAppMessage(phone, msg);
}
