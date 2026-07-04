import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type UploadError = {
  rowNumber: number;
  reason: string;
};

type ParsedBaselineRow = {
  stock_code: string;
  corp_name: string;
  report_base_date: string;
  baseline_ratio: number;
  source_file_name: string;
  active: boolean;
};

type ExcelJsonRow = Record<string, unknown> & {
  __rowNum__?: number;
};

class UploadHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const requiredColumns = [
  "발행기관",
  "발행기관명",
  "보고서 작성기준일",
  "지분율",
] as const;

function assertAdminWriteKey(request: NextRequest) {
  const expectedKey = process.env.ADMIN_WRITE_KEY;

  if (!expectedKey) {
    return;
  }

  const actualKey = request.headers.get("x-admin-write-key");

  // 로그인 기능이 아니라 운영 배포 시 쓰기 API를 보호하기 위한 간단한 헤더 검증입니다.
  if (actualKey !== expectedKey) {
    throw new UploadHttpError("관리자 쓰기 키가 올바르지 않습니다.", 401);
  }
}

function toSeoulOffsetIso(date: Date) {
  const seoulDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return seoulDate.toISOString().replace("Z", "+09:00");
}

function normalizeHeader(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeFullWidthAlphaNumeric(value: string) {
  return value.replace(/[０-９Ａ-Ｚａ-ｚ]/g, (letter) =>
    String.fromCharCode(letter.charCodeAt(0) - 0xfee0),
  );
}

function normalizeStockCode(value: unknown) {
  if (value === null || value === undefined || value === "") {
    throw new Error("발행기관 값이 비어 있습니다.");
  }

  let text =
    typeof value === "number" ? String(Math.trunc(value)) : String(value).trim();
  text = normalizeFullWidthAlphaNumeric(text)
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
    const candidates = [...text.matchAll(/(?<![0-9A-Z])[0-9A-Z]{6}(?![0-9A-Z])/g)].map(
      (match) => match[0],
    );
    const uniqueCandidates = [...new Set(candidates)];

    if (uniqueCandidates.length === 1) {
      return uniqueCandidates[0];
    }

    throw new Error(
      `발행기관 값 "${text}"은 숫자와 영문으로 된 6자리 종목코드로 변환할 수 있어야 합니다.`,
    );
  }

  return text.padStart(6, "0");
}

function parseRatio(value: unknown) {
  if (value === null || value === undefined || value === "") {
    throw new Error("지분율 값이 비어 있습니다.");
  }

  if (typeof value === "number") {
    return value > 0 && value <= 1 ? value * 100 : value;
  }

  const normalized = String(value)
    .replace("%", "")
    .replaceAll(",", "")
    .trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error("지분율을 숫자로 변환할 수 없습니다.");
  }

  return parsed;
}

function parseExcelSerialDate(value: number) {
  const parsed = XLSX.SSF.parse_date_code(value);

  if (!parsed) {
    throw new Error("보고서 작성기준일을 날짜로 변환할 수 없습니다.");
  }

  return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(
    parsed.d,
  ).padStart(2, "0")}`;
}

function parseReportBaseDate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    throw new Error("보고서 작성기준일 값이 비어 있습니다.");
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    return parseExcelSerialDate(value);
  }

  const text = String(value).trim();

  if (/^\d{8}$/.test(text)) {
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
  }

  const normalized = text.replace(/[./]/g, "-");
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("보고서 작성기준일을 날짜로 변환할 수 없습니다.");
  }

  return parsed.toISOString().slice(0, 10);
}

function getRequiredCell(
  row: Record<string, unknown>,
  column: (typeof requiredColumns)[number],
) {
  const entry = Object.entries(row).find(
    ([key]) => normalizeHeader(key) === column,
  );

  return entry?.[1];
}

function getExcelRowNumber(row: ExcelJsonRow, fallbackIndex: number) {
  return typeof row.__rowNum__ === "number" ? row.__rowNum__ + 1 : fallbackIndex + 2;
}

function parseRows(rows: ExcelJsonRow[], fileName: string) {
  const parsedRows: ParsedBaselineRow[] = [];
  const errors: UploadError[] = [];

  rows.forEach((row, index) => {
    const rowNumber = getExcelRowNumber(row, index);

    try {
      for (const column of requiredColumns) {
        if (getRequiredCell(row, column) === undefined) {
          throw new Error(`필수 컬럼 ${column} 값이 없습니다.`);
        }
      }

      const parsedRow: ParsedBaselineRow = {
        stock_code: normalizeStockCode(getRequiredCell(row, "발행기관")),
        corp_name: String(getRequiredCell(row, "발행기관명") ?? "").trim(),
        report_base_date: parseReportBaseDate(
          getRequiredCell(row, "보고서 작성기준일"),
        ),
        baseline_ratio: parseRatio(getRequiredCell(row, "지분율")),
        source_file_name: fileName,
        active: true,
      };

      if (!parsedRow.corp_name) {
        throw new Error("발행기관명 값이 비어 있습니다.");
      }

      parsedRows.push(parsedRow);
    } catch (error) {
      errors.push({
        rowNumber,
        reason:
          error instanceof Error
            ? error.message
            : "행을 파싱하는 중 오류가 발생했습니다.",
      });
    }
  });

  return { parsedRows, errors };
}

export async function POST(request: NextRequest) {
  try {
    assertAdminWriteKey(request);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "업로드할 xlsx 파일을 찾을 수 없습니다." },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json(
        { error: "xlsx 파일만 업로드할 수 있습니다." },
        { status: 400 },
      );
    }

    const workbook = XLSX.read(await file.arrayBuffer(), {
      type: "array",
      cellDates: true,
    });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return NextResponse.json(
        { error: "첫 번째 시트를 찾을 수 없습니다." },
        { status: 400 },
      );
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<ExcelJsonRow>(worksheet, {
      defval: "",
      raw: false,
    });

    const headers = Object.keys(rows[0] ?? {}).map(normalizeHeader);
    const missingColumns = requiredColumns.filter(
      (column) => !headers.includes(column),
    );

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `필수 컬럼이 없습니다: ${missingColumns.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const { parsedRows, errors } = parseRows(rows, file.name);

    if (parsedRows.length === 0) {
      return NextResponse.json({
        uploadedFileName: file.name,
        insertedCount: 0,
        rejectedCount: errors.length,
        errors,
        activatedAt: toSeoulOffsetIso(new Date()),
      });
    }

    const supabase = createServerSupabaseClient();
    const { error: deactivateError } = await supabase
      .from("baseline_holdings")
      .update({ active: false })
      .eq("active", true);

    if (deactivateError) {
      throw new Error(
        `기존 기준 데이터를 비활성화하지 못했습니다. ${deactivateError.message}`,
      );
    }

    const { error: insertError } = await supabase
      .from("baseline_holdings")
      .insert(parsedRows);

    if (insertError) {
      throw new Error(`새 기준 데이터를 저장하지 못했습니다. ${insertError.message}`);
    }

    return NextResponse.json({
      uploadedFileName: file.name,
      insertedCount: parsedRows.length,
      rejectedCount: errors.length,
      errors,
      activatedAt: toSeoulOffsetIso(new Date()),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "기준 파일 업로드 중 오류가 발생했습니다.";
    const status = error instanceof UploadHttpError ? error.status : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
