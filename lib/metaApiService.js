import { getMetaSettings, createSyncLog } from "./metaSettingsModel";
import { updateAdAccount, getAllAdAccounts } from "./adAccountModel";

const GRAPH_API_BASE = "https://graph.facebook.com/v22.0";

async function getAccessToken() {
  const settings = await getMetaSettings();
  if (!settings?.accessToken) {
    throw new Error("Meta API access token not configured. Please configure in Meta API Settings.");
  }
  return settings.accessToken;
}

export async function testConnection() {
  const settings = await getMetaSettings();
  if (!settings?.accessToken) {
    return { success: false, message: "Access token not configured" };
  }
  if (!settings?.businessManagerId) {
    return { success: false, message: "Business Manager ID not configured" };
  }
  const url = `${GRAPH_API_BASE}/${settings.businessManagerId}?fields=id,name&access_token=${settings.accessToken}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) {
      return { success: false, message: data.error.message };
    }
    return { success: true, message: `Connected to BM: ${data.name || data.id}` };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function fetchAdAccountsFromBM() {
  const settings = await getMetaSettings();
  if (!settings?.businessManagerId) throw new Error("Business Manager ID not configured");
  const token = await getAccessToken();
  const bmId = settings.businessManagerId;

  let allAccounts = [];
  let url = `${GRAPH_API_BASE}/${bmId}/ad_accounts?fields=id,name,account_status,currency,balance,spend_cap,amount_spent,disable_reason&limit=100&access_token=${token}`;

  while (url) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) throw new Error(`Meta API error: ${data.error.message}`);

    const accounts = (data.data || []).map((acc) => ({
      metaAccountId: acc.id,
      name: acc.name || `Ad Account ${acc.id}`,
      accountStatus: acc.account_status,
      currency: acc.currency || "USD",
      balance: acc.balance || 0,
      spendCap: acc.spend_cap || 0,
      amountSpent: acc.amount_spent || 0,
      disableReason: acc.disable_reason || null,
    }));

    allAccounts = [...allAccounts, ...accounts];
    url = data.paging?.next || null;
  }

  return allAccounts;
}

export async function fetchAdAccountInsights(metaAccountIdRaw) {
  const token = await getAccessToken();
  const accountId = metaAccountIdRaw.replace("act_", "");
  const url = `${GRAPH_API_BASE}/act_${accountId}/insights?fields=spend,impressions,clicks,cpc,ctr,cpm,cpp&date_preset=this_month&level=account&limit=1&access_token=${token}`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(`Meta API error: ${data.error.message}`);

  if (data.data && data.data.length > 0) {
    const d = data.data[0];
    return {
      spend: parseFloat(d.spend || 0),
      impressions: parseInt(d.impressions || 0),
      clicks: parseInt(d.clicks || 0),
      cpc: parseFloat(d.cpc || 0),
      ctr: parseFloat(d.ctr || 0),
      cpm: parseFloat(d.cpm || 0),
      dateStart: d.date_start,
      dateEnd: d.date_end,
    };
  }
  return { spend: 0, impressions: 0, clicks: 0, cpc: 0, ctr: 0, cpm: 0, dateStart: null, dateEnd: null };
}

export async function updateSpendCap(metaAccountIdRaw, newCapInDollars) {
  const token = await getAccessToken();
  const accountId = metaAccountIdRaw.replace("act_", "");
  const capInCents = Math.round(parseFloat(newCapInDollars || 0) * 100);
  const url = `${GRAPH_API_BASE}/act_${accountId}?access_token=${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ spend_cap: capInCents }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Meta API error: ${data.error.message}`);
  return data;
}

export async function syncAllAdAccounts() {
  const startTime = Date.now();
  const logEntries = [];
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  try {
    const settings = await getMetaSettings();
    if (!settings?.autoSpendCapUpdate) {
      await createSyncLog({ type: "info", message: "Auto spend cap update is disabled in settings" });
    }

    const allAccounts = await getAllAdAccounts();
    if (allAccounts.length === 0) {
      await createSyncLog({ type: "info", message: "No assigned ad accounts found to sync" });
      return { success: true, synced: 0, errors: 0 };
    }

    for (const acc of allAccounts) {
      if (!acc.metaAccountId) {
        errorCount++;
        errors.push(`${acc.name || acc.accountId}: No Meta Account ID`);
        continue;
      }
      try {
        const insights = await fetchAdAccountInsights(acc.metaAccountId);
        const updateData = {
          spent: insights.spend,
          lastSyncedAt: new Date(),
          syncStatus: "synced",
          lastInsights: {
            impressions: insights.impressions,
            clicks: insights.clicks,
            cpc: insights.cpc,
            ctr: insights.ctr,
            cpm: insights.cpm,
            dateStart: insights.dateStart,
            dateEnd: insights.dateEnd,
          },
        };

        await updateAdAccount(acc._id.toString(), updateData);
        successCount++;

        if (settings?.autoSpendCapUpdate && acc.budget > 0) {
          const spent = insights.spend;
          const budget = Number(acc.budget || 0);
          if (spent >= budget * 0.95) {
            const newCap = budget * 1.2;
            try {
              await updateSpendCap(acc.metaAccountId, newCap);
              logEntries.push(`Auto cap updated for ${acc.name}: $${budget} -> $${newCap}`);
            } catch (capErr) {
              logEntries.push(`Auto cap update failed for ${acc.name}: ${capErr.message}`);
            }
          }
        }
      } catch (accErr) {
        errorCount++;
        errors.push(`${acc.name || acc.accountId}: ${accErr.message}`);
        await updateAdAccount(acc._id.toString(), {
          syncStatus: "error",
          syncError: accErr.message,
          lastSyncedAt: new Date(),
        });
      }
    }

    const duration = Date.now() - startTime;
    const summary = `Sync completed in ${duration}ms. ${successCount} success, ${errorCount} errors.`;
    await createSyncLog({
      type: errorCount > 0 ? "warning" : "success",
      message: summary,
      details: { successCount, errorCount, errors: errors.slice(0, 10), logEntries: logEntries.slice(0, 20) },
      duration,
    });

    return { success: true, synced: successCount, errors: errorCount, duration };
  } catch (err) {
    await createSyncLog({ type: "error", message: `Sync failed: ${err.message}`, details: { stack: err.stack } });
    return { success: false, message: err.message };
  }
}
