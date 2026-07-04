import { NextRequest, NextResponse } from "next/server";
import { FilingApiItem, FilingDirection } from "@/lib/filings";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type HoldingChangeRow = {
  rcept_no: string;
  rcept_dt: string;
  corp_name: string;
  report_nm: string;
  flr_nm: string;
  stock_code: string;
  baseline_ratio: number | null;
  current_ratio: number | null;
  delta_ratio: number | null;
  direction: FilingDirection;
  dart_viewer_url: string;
};

type NotificationLogRow = {
  rcept_no: string;
  status: "SENT" | "FAILED" | "PENDING" | string;
};

const page = 1;
const pageSize = 50;

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultFromDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return toIsoDate(date);
}

function mapRowToItem(
  row: HoldingChangeRow,
  notificationStatus: FilingApiItem["notificationStatus"],
): FilingApiItem {
  return {
    rceptNo: row.rcept_no,
    stockCode: row.stock_code,
    corpName: row.corp_name,
    reportName: row.report_nm,
    filerName: row.flr_nm,
    baselineRatio: row.baseline_ratio,
    currentRatio: row.current_ratio,
    deltaRatio: row.delta_ratio,
    direction: row.direction,
    dartViewerUrl: row.dart_viewer_url,
    notificationStatus,
  };
}

function getNotificationStatus(
  rceptNo: string,
  logsByRceptNo: Map<string, NotificationLogRow[]>,
): FilingApiItem["notificationStatus"] {
  const logs = logsByRceptNo.get(rceptNo) ?? [];

  if (logs.some((log) => log.status === "SENT")) {
    return "SENT";
  }

  if (logs.some((log) => log.status === "FAILED")) {
    return "FAILED";
  }

  return "NOT_SENT";
}

function getEmptyResponse() {
  return {
    items: [],
    page,
    pageSize,
    totalCount: 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from") || getDefaultFromDate();
    const to = searchParams.get("to") || toIsoDate(new Date());
    const direction = searchParams.get("direction");
    const q = searchParams.get("q")?.trim();

    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("recent_holding_changes_30d")
      .select(
        "rcept_no,rcept_dt,stock_code,corp_name,report_nm,flr_nm,baseline_ratio,current_ratio,delta_ratio,direction,dart_viewer_url",
        { count: "exact" },
      )
      .gte("rcept_dt", from)
      .lte("rcept_dt", to)
      .order("rcept_dt", { ascending: false })
      .order("created_at", { ascending: false })
      .range(0, pageSize - 1);

    if (direction) {
      query = query.eq("direction", direction);
    }

    if (q) {
      const escapedQuery = q.replaceAll(",", "\\,");
      query = query.or(
        `stock_code.ilike.%${escapedQuery}%,corp_name.ilike.%${escapedQuery}%,report_nm.ilike.%${escapedQuery}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Supabase 공시 데이터를 조회하지 못했습니다. ${error.message}`);
    }

    if (!data || data.length === 0) {
      return NextResponse.json(getEmptyResponse());
    }

    const rows = data as unknown as HoldingChangeRow[];
    const rceptNos = [...new Set(rows.map((row) => row.rcept_no))];
    const logsByRceptNo = new Map<string, NotificationLogRow[]>();

    if (rceptNos.length > 0) {
      const { data: notificationLogs, error: notificationLogError } =
        await supabase
          .from("notification_logs")
          .select("rcept_no,status")
          .in("rcept_no", rceptNos)
          .eq("provider", "TELEGRAM");

      if (notificationLogError) {
        throw new Error(
          `알림 발송 상태를 조회하지 못했습니다. ${notificationLogError.message}`,
        );
      }

      for (const log of (notificationLogs ?? []) as unknown as NotificationLogRow[]) {
        const logs = logsByRceptNo.get(log.rcept_no) ?? [];
        logs.push(log);
        logsByRceptNo.set(log.rcept_no, logs);
      }
    }

    return NextResponse.json({
      items: rows.map((row) =>
        mapRowToItem(row, getNotificationStatus(row.rcept_no, logsByRceptNo)),
      ),
      page,
      pageSize,
      totalCount: count ?? data.length,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "공시 데이터를 조회하는 중 오류가 발생했습니다.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
