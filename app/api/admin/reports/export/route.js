import { NextResponse } from "next/server";
import { getFinancialReport, getUserActivityReport, getAdSpendReport, generateCSV, generatePDFHtml } from "@/lib/reportService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "financial";
    const format = searchParams.get("format") || "csv";
    const period = searchParams.get("period") || "daily";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let data, title, columns, summary;

    switch (type) {
      case "financial": {
        data = await getFinancialReport(period, startDate, endDate);
        title = `Financial Report (${period})`;
        columns = [
          { label: "Date", key: "date" },
          { label: "Deposits", accessor: (r) => `$${Number(r.deposits).toFixed(2)}` },
          { label: "Deposit Count", key: "depositCount" },
          { label: "Withdrawals", accessor: (r) => `$${Number(r.withdrawals).toFixed(2)}` },
          { label: "Withdrawal Count", key: "withdrawalCount" },
          { label: "Net", accessor: (r) => `$${(Number(r.deposits) - Number(r.withdrawals)).toFixed(2)}` },
        ];
        summary = {
          "Total Deposits": `$${Number(data.summary.totalDeposits).toFixed(2)}`,
          "Total Withdrawals": `$${Number(data.summary.totalWithdrawals).toFixed(2)}`,
          "Net Revenue": `$${Number(data.summary.net).toFixed(2)}`,
        };
        data = data.rows;
        break;
      }
      case "users": {
        data = await getUserActivityReport(startDate, endDate);
        title = "User Activity Report";
        columns = [
          { label: "Name", key: "displayName" },
          { label: "Email", key: "email" },
          { label: "Type", key: "accountType" },
          { label: "Balance", accessor: (r) => `$${Number(r.balance).toFixed(2)}` },
          { label: "Total Earned", accessor: (r) => `$${Number(r.totalEarned).toFixed(2)}` },
          { label: "Tasks Done", key: "tasksCompleted" },
          { label: "Tasks Earned", accessor: (r) => `$${Number(r.tasksEarned).toFixed(2)}` },
          { label: "Deposits", key: "deposits" },
          { label: "Deposit Total", accessor: (r) => `$${Number(r.depositTotal).toFixed(2)}` },
          { label: "Withdrawals", key: "withdrawals" },
          { label: "Withdrawal Total", accessor: (r) => `$${Number(r.withdrawalTotal).toFixed(2)}` },
        ];
        summary = { "Total Users": data.total };
        data = data.rows;
        break;
      }
      case "ad-spend": {
        data = await getAdSpendReport(startDate, endDate);
        title = "Ad Spend Report";
        columns = [
          { label: "Name", key: "name" },
          { label: "Account ID", key: "metaAccountId" },
          { label: "Status", key: "status" },
          { label: "Budget", accessor: (r) => `$${Number(r.budget).toFixed(2)}` },
          { label: "Spent", accessor: (r) => `$${Number(r.spent).toFixed(2)}` },
          { label: "Utilization", accessor: (r) => `${r.budget > 0 ? ((r.spent / r.budget) * 100).toFixed(1) : 0}%` },
          { label: "User", key: "email" },
          { label: "Last Synced", accessor: (r) => r.lastSyncedAt ? new Date(r.lastSyncedAt).toLocaleDateString() : "-" },
        ];
        summary = {
          "Total Accounts": data.summary.totalAccounts,
          "Total Budget": `$${Number(data.summary.totalBudget).toFixed(2)}`,
          "Total Spent": `$${Number(data.summary.totalSpent).toFixed(2)}`,
          "Utilization": `${data.summary.utilization.toFixed(1)}%`,
        };
        data = data.rows;
        break;
      }
      default:
        return NextResponse.json({ success: false, message: "Invalid report type" }, { status: 400 });
    }

    if (format === "csv") {
      const csv = generateCSV(data, columns);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${title.replace(/\s+/g, "_")}.csv"`,
        },
      });
    }

    if (format === "pdf") {
      const html = generatePDFHtml(title, data, columns, summary);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="${title.replace(/\s+/g, "_")}.html"`,
        },
      });
    }

    return NextResponse.json({ success: false, message: "Invalid format" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
