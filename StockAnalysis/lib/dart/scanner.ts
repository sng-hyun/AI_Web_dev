import "server-only";

import { createPendingParseHoldingChange } from "@/lib/holdings/diff";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DartListItem = {
  rcept_no: string;
  rcept_dt: string;
  corp_code?: string;
  stock_code?: string;
  corp_name: string;
  report_nm: string;
  flr_nm: string;
};

type DartListResponse = {
  status: string;
  message: string;
  list?: DartListItem[];
  total_count?: string;
};

export type DartScanStatus = "SUCCESS" | "FAILED" | "RATE_LIMITED";

type DartFilingInsertRow = {
  rcept_no: string;
  rcept_dt: string;
  corp_code: string | null;
  stock_code: string | null;
  corp_name: string;
  report_nm: string;
  flr_nm: string;
  dart_viewer_url: string;
  raw_status: string;
};

export type DartScanResult = {
  jobRunId: string;
  status: DartScanStatus;
  scanDate: string;
  fetchedCount: number;
  nationalPensionCount: number;
  insertedCount: number;
  skippedDuplicateCount: number;
  holdingChangeCreatedCount: number;
};

export class DartScanInputError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getDartApiKey() {
  const apiKey = process.env.DART_API_KEY;

  if (!apiKey) {
    throw new Error("환경 변수 DART_API_KEY가 설정되지 않았습니다.");
  }

  return apiKey;
}

export function getKstDate(date = new Date()) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000);
}

export function toKstDateString(date = new Date()) {
  return getKstDate(date).toISOString().slice(0, 10);
}

export function isKstBusinessScanTime(date = new Date()) {
  const kstDate = getKstDate(date);
  const day = kstDate.getUTCDay();
  const hour = kstDate.getUTCHours();
  const minute = kstDate.getUTCMinutes();
  const minutesOfDay = hour * 60 + minute;
  const startMinutes = 9 * 60;
  const endMinutes = 18 * 60 + 30;

  return day >= 1 && day <= 5 && minutesOfDay >= startMinutes && minutesOfDay <= endMinutes;
}

export function normalizeScanDate(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    return toKstDateString(new Date());
  }

  if (/^\d{8}$/.test(text)) {
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  throw new DartScanInputError(
    "scanDate는 YYYY-MM-DD 또는 YYYYMMDD 형식이어야 합니다.",
    400,
  );
}

function toDartDate(value: string) {
  return value.replaceAll("-", "");
}

function toSqlDateFromDartDate(value: string) {
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }

  return value;
}

function normalizeStockCode(value?: string) {
  if (!value) {
    return null;
  }

  let text = value
    .trim()
    .replace(/[０-９Ａ-Ｚａ-ｚ]/g, (letter) =>
      String.fromCharCode(letter.charCodeAt(0) - 0xfee0),
    )
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replaceAll(",", "")
    .replace(/^'/, "")
    .trim()
    .toUpperCase();

  if (/^A[0-9A-Z]{6}$/.test(text)) {
    text = text.slice(1);
  }

  if (/^A\s+[0-9A-Z]{6}$/.test(text)) {
    text = text.replace(/^A\s+/, "");
  }

  if (/^\d+\.0+$/.test(text)) {
    text = text.split(".")[0];
  }

  if (!/^[0-9A-Z]{1,6}$/.test(text)) {
    return null;
  }

  return text.padStart(6, "0");
}

function buildDartViewerUrl(rceptNo: string) {
  return `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${rceptNo}`;
}

async function fetchDartList(scanDate: string) {
  const dartDate = toDartDate(scanDate);
  const url = new URL("https://opendart.fss.or.kr/api/list.json");

  url.searchParams.set("crtfc_key", getDartApiKey());
  url.searchParams.set("bgn_de", dartDate);
  url.searchParams.set("end_de", dartDate);
  url.searchParams.set("pblntf_ty", "D");
  url.searchParams.set("pblntf_detail_ty", "D001");
  url.searchParams.set("page_count", "100");

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`DART 요청이 실패했습니다. 상태 코드: ${response.status}`);
  }

  return (await response.json()) as DartListResponse;
}

async function updateJobRun(
  jobRunId: string,
  status: DartScanStatus,
  metadata: Record<string, unknown>,
  message?: string,
) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("job_runs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      message: message ?? null,
      metadata,
    })
    .eq("id", jobRunId);

  if (error) {
    throw new Error(`작업 실행 상태를 저장하지 못했습니다. ${error.message}`);
  }
}

async function getActiveBaselineRatioMap(stockCodes: string[]) {
  if (stockCodes.length === 0) {
    return new Map<string, number>();
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("baseline_holdings")
    .select("stock_code,baseline_ratio")
    .eq("active", true)
    .in("stock_code", stockCodes);

  if (error) {
    throw new Error(`기준 지분율을 조회하지 못했습니다. ${error.message}`);
  }

  return new Map(
    (data ?? []).map((row) => [
      row.stock_code as string,
      Number(row.baseline_ratio),
    ]),
  );
}

async function createPendingHoldingChanges(rowsToInsert: DartFilingInsertRow[]) {
  const stockCodes = Array.from(
    new Set(
      rowsToInsert
        .map((row) => row.stock_code)
        .filter((stockCode): stockCode is string => Boolean(stockCode)),
    ),
  );
  const baselineRatioMap = await getActiveBaselineRatioMap(stockCodes);
  const holdingChangeRows = rowsToInsert
    .filter((row) => row.stock_code)
    .map((row) =>
      createPendingParseHoldingChange({
        rceptNo: row.rcept_no,
        stockCode: row.stock_code as string,
        baselineRatio: baselineRatioMap.get(row.stock_code as string) ?? null,
      }),
    );

  if (holdingChangeRows.length === 0) {
    return 0;
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("holding_changes")
    .insert(holdingChangeRows);

  if (error) {
    throw new Error(`보유 변동 초안을 저장하지 못했습니다. ${error.message}`);
  }

  return holdingChangeRows.length;
}

export async function runDartScan(input: {
  scanDate?: string;
  jobType?: string;
}): Promise<DartScanResult> {
  const scanDate = normalizeScanDate(input.scanDate);
  const supabase = createServerSupabaseClient();
  let jobRunId: string | null = null;

  try {
    const { data: jobRun, error: jobRunError } = await supabase
      .from("job_runs")
      .insert({
        job_type: input.jobType ?? "DART_SCAN",
        status: "RUNNING",
        metadata: { scanDate },
      })
      .select("id")
      .single();

    if (jobRunError || !jobRun) {
      throw new Error(
        `작업 실행 기록을 생성하지 못했습니다. ${jobRunError?.message ?? ""}`,
      );
    }

    jobRunId = jobRun.id as string;

    const dartResponse = await fetchDartList(scanDate);
    const fetchedCount = dartResponse.list?.length ?? 0;

    if (dartResponse.status === "020") {
      const metadata = {
        scanDate,
        fetchedCount,
        nationalPensionCount: 0,
        insertedCount: 0,
        skippedDuplicateCount: 0,
        holdingChangeCreatedCount: 0,
        dartStatus: dartResponse.status,
        dartMessage: dartResponse.message,
      };

      await updateJobRun(jobRunId, "RATE_LIMITED", metadata, dartResponse.message);

      return {
        jobRunId,
        status: "RATE_LIMITED",
        scanDate,
        fetchedCount,
        nationalPensionCount: 0,
        insertedCount: 0,
        skippedDuplicateCount: 0,
        holdingChangeCreatedCount: 0,
      };
    }

    if (dartResponse.status !== "000" && dartResponse.status !== "013") {
      throw new Error(`DART 응답 오류: ${dartResponse.message}`);
    }

    const nationalPensionFilings = (dartResponse.list ?? []).filter(
      (item) => item.flr_nm === "국민연금공단",
    );
    const uniqueNationalPensionFilings = Array.from(
      new Map(nationalPensionFilings.map((item) => [item.rcept_no, item])).values(),
    );
    const uniqueRceptNos = uniqueNationalPensionFilings.map(
      (item) => item.rcept_no,
    );
    let existingRceptNos = new Set<string>();

    if (uniqueRceptNos.length > 0) {
      const { data: existingRows, error: existingError } = await supabase
        .from("dart_filings")
        .select("rcept_no")
        .in("rcept_no", uniqueRceptNos);

      if (existingError) {
        throw new Error(`기존 DART 공시를 확인하지 못했습니다. ${existingError.message}`);
      }

      existingRceptNos = new Set(
        (existingRows ?? []).map((row) => row.rcept_no as string),
      );
    }

    const rowsToInsert: DartFilingInsertRow[] = uniqueNationalPensionFilings
      .filter((item) => !existingRceptNos.has(item.rcept_no))
      .map((item) => ({
        rcept_no: item.rcept_no,
        rcept_dt: toSqlDateFromDartDate(item.rcept_dt),
        corp_code: item.corp_code ?? null,
        stock_code: normalizeStockCode(item.stock_code),
        corp_name: item.corp_name,
        report_nm: item.report_nm,
        flr_nm: item.flr_nm,
        dart_viewer_url: buildDartViewerUrl(item.rcept_no),
        raw_status: dartResponse.status,
      }));

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("dart_filings")
        .insert(rowsToInsert);

      if (insertError) {
        throw new Error(`DART 공시를 저장하지 못했습니다. ${insertError.message}`);
      }
    }

    const holdingChangeCreatedCount =
      await createPendingHoldingChanges(rowsToInsert);
    const insertedCount = rowsToInsert.length;
    const skippedDuplicateCount =
      nationalPensionFilings.length - insertedCount;
    const metadata = {
      scanDate,
      fetchedCount,
      nationalPensionCount: nationalPensionFilings.length,
      insertedCount,
      skippedDuplicateCount,
      holdingChangeCreatedCount,
      dartStatus: dartResponse.status,
      dartMessage: dartResponse.message,
    };

    await updateJobRun(jobRunId, "SUCCESS", metadata, dartResponse.message);

    return {
      jobRunId,
      status: "SUCCESS",
      scanDate,
      fetchedCount,
      nationalPensionCount: nationalPensionFilings.length,
      insertedCount,
      skippedDuplicateCount,
      holdingChangeCreatedCount,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "DART 스캔 중 오류가 발생했습니다.";

    if (jobRunId) {
      await updateJobRun(
        jobRunId,
        "FAILED",
        {
          scanDate,
          error: message,
        },
        message,
      );
    }

    throw new Error(message);
  }
}
