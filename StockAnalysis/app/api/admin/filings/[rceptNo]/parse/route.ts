import { NextRequest, NextResponse } from "next/server";
import { fetchDartDocumentXml } from "@/lib/dart/document";
import {
  dartMajorStockParserVersion,
  fetchCurrentRatioFromMajorStock,
} from "@/lib/dart/majorstock";
import {
  dartXmlParserVersion,
  parseCurrentRatioFromXml,
} from "@/lib/dart/parser";
import { calculateDirection } from "@/lib/holdings/diff";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ParseSource = "MAJORSTOCK_API" | "XML";

class AdminHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function assertAdminWriteKey(request: NextRequest) {
  const expectedKey = process.env.ADMIN_WRITE_KEY;

  if (!expectedKey) {
    return;
  }

  const actualKey = request.headers.get("x-admin-write-key");

  // 로그인 기능이 아니라 운영 배포 시 쓰기 API를 보호하기 위한 간단한 헤더 검증입니다.
  if (actualKey !== expectedKey) {
    throw new AdminHttpError("관리자 쓰기 키가 올바르지 않습니다.", 401);
  }
}

async function updateJobRun(input: {
  jobRunId: string;
  status: "SUCCESS" | "FAILED";
  message?: string;
  metadata: Record<string, unknown>;
}) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("job_runs")
    .update({
      status: input.status,
      finished_at: new Date().toISOString(),
      message: input.message ?? null,
      metadata: input.metadata,
    })
    .eq("id", input.jobRunId);

  if (error) {
    throw new Error(`작업 실행 상태를 저장하지 못했습니다. ${error.message}`);
  }
}

async function parseCurrentRatio(input: {
  corpCode: string | null;
  rceptNo: string;
}) {
  const reasons: string[] = [];

  try {
    const xml = await fetchDartDocumentXml(input.rceptNo);
    const xmlResult = parseCurrentRatioFromXml(xml);

    if (xmlResult.ok) {
      return {
        ok: true as const,
        currentRatio: xmlResult.currentRatio,
        deltaRatio: xmlResult.deltaRatio,
        reason: null,
        parsedSource: "XML" as ParseSource,
        parserVersion: dartXmlParserVersion,
      };
    }

    reasons.push(xmlResult.reason);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "DART 원문 XML을 읽지 못했습니다.";
    reasons.push(`DART 원문 XML 파싱 실패: ${message}`);
  }

  if (input.corpCode) {
    const majorStockResult = await fetchCurrentRatioFromMajorStock({
      corpCode: input.corpCode,
      rceptNo: input.rceptNo,
    });

    if (majorStockResult.ok) {
      return {
        ok: true as const,
        currentRatio: majorStockResult.currentRatio,
        deltaRatio: majorStockResult.deltaRatio,
        reason: null,
        parsedSource: "MAJORSTOCK_API" as ParseSource,
        parserVersion: dartMajorStockParserVersion,
      };
    }

    reasons.push(majorStockResult.reason);
  } else {
    reasons.push("corp_code가 없어 DART 대량보유 API를 호출하지 못했습니다.");
  }

  return {
    ok: false as const,
    currentRatio: null,
    deltaRatio: null,
    reason: reasons.join(" / "),
    parsedSource: "XML" as ParseSource,
    parserVersion: dartXmlParserVersion,
  };
}

function normalizeDeltaRatio(value: number) {
  return Number(value.toFixed(4));
}

function calculateDisclosureDeltaDirection(deltaRatio: number) {
  const normalizedDeltaRatio = normalizeDeltaRatio(deltaRatio);

  if (normalizedDeltaRatio >= 0.01) {
    return {
      direction: "INCREASE" as const,
      deltaRatio: normalizedDeltaRatio,
    };
  }

  if (normalizedDeltaRatio <= -0.01) {
    return {
      direction: "DECREASE" as const,
      deltaRatio: normalizedDeltaRatio,
    };
  }

  return {
    direction: "UNCHANGED" as const,
    deltaRatio: normalizedDeltaRatio,
  };
}

function calculateParsedDirection(input: {
  baselineRatio: number | null;
  currentRatio: number;
  parsedDeltaRatio: number | null;
}) {
  if (input.baselineRatio !== null) {
    return calculateDirection({
      baselineRatio: input.baselineRatio,
      currentRatio: input.currentRatio,
    });
  }

  if (input.parsedDeltaRatio !== null) {
    return calculateDisclosureDeltaDirection(input.parsedDeltaRatio);
  }

  return {
    direction: "NEW_BASELINE_REQUIRED" as const,
    deltaRatio: null,
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ rceptNo: string }> },
) {
  let jobRunId: string | null = null;
  const { rceptNo } = await context.params;

  try {
    assertAdminWriteKey(request);

    if (!/^\d{14}$/.test(rceptNo)) {
      throw new AdminHttpError("접수번호 형식이 올바르지 않습니다.", 400);
    }

    const supabase = createServerSupabaseClient();
    const { data: holdingChange, error: holdingChangeError } = await supabase
      .from("holding_changes")
      .select("id,baseline_ratio,dart_filings(corp_code)")
      .eq("rcept_no", rceptNo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (holdingChangeError) {
      throw new Error(
        `보유 변동 데이터를 조회하지 못했습니다. ${holdingChangeError.message}`,
      );
    }

    if (!holdingChange) {
      throw new AdminHttpError("재파싱할 보유 변동 데이터를 찾지 못했습니다.", 404);
    }

    const { data: jobRun, error: jobRunError } = await supabase
      .from("job_runs")
      .insert({
        job_type: "DART_RATIO_PARSE",
        status: "RUNNING",
        metadata: { rceptNo },
      })
      .select("id")
      .single();

    if (jobRunError || !jobRun) {
      throw new Error(
        `작업 실행 기록을 생성하지 못했습니다. ${jobRunError?.message ?? ""}`,
      );
    }

    jobRunId = jobRun.id as string;

    const baselineRatio =
      holdingChange.baseline_ratio === null
        ? null
        : Number(holdingChange.baseline_ratio);
    const dartFiling = Array.isArray(holdingChange.dart_filings)
      ? holdingChange.dart_filings[0]
      : holdingChange.dart_filings;
    const corpCode =
      typeof dartFiling?.corp_code === "string" ? dartFiling.corp_code : null;
    const parseResult = await parseCurrentRatio({ corpCode, rceptNo });

    if (!parseResult.ok) {
      const { error: updateError } = await supabase
        .from("holding_changes")
        .update({
          current_ratio: null,
          delta_ratio: null,
          direction: "PARSE_FAILED",
          parsed_source: parseResult.parsedSource,
          parser_version: parseResult.parserVersion,
        })
        .eq("id", holdingChange.id);

      if (updateError) {
        throw new Error(`파싱 실패 상태를 저장하지 못했습니다. ${updateError.message}`);
      }

      await updateJobRun({
        jobRunId,
        status: "FAILED",
        message: parseResult.reason,
        metadata: {
          rceptNo,
          ok: false,
          reason: parseResult.reason,
          parsedSource: parseResult.parsedSource,
          parserVersion: parseResult.parserVersion,
        },
      });

      return NextResponse.json({
        ok: false,
        rceptNo,
        currentRatio: null,
        direction: "PARSE_FAILED",
        deltaRatio: null,
        reason: parseResult.reason,
      });
    }

    const directionResult = calculateParsedDirection({
      baselineRatio,
      currentRatio: parseResult.currentRatio,
      parsedDeltaRatio: parseResult.deltaRatio,
    });
    const { error: updateError } = await supabase
      .from("holding_changes")
      .update({
        current_ratio: parseResult.currentRatio,
        delta_ratio: directionResult.deltaRatio,
        direction: directionResult.direction,
        parsed_source: parseResult.parsedSource,
        parser_version: parseResult.parserVersion,
      })
      .eq("id", holdingChange.id);

    if (updateError) {
      throw new Error(`파싱 결과를 저장하지 못했습니다. ${updateError.message}`);
    }

    await updateJobRun({
      jobRunId,
      status: "SUCCESS",
      metadata: {
        rceptNo,
        ok: true,
        currentRatio: parseResult.currentRatio,
        direction: directionResult.direction,
        deltaRatio: directionResult.deltaRatio,
        disclosureDeltaRatio: parseResult.deltaRatio,
        parsedSource: parseResult.parsedSource,
        parserVersion: parseResult.parserVersion,
      },
    });

    return NextResponse.json({
      ok: true,
      rceptNo,
      currentRatio: parseResult.currentRatio,
      direction: directionResult.direction,
      deltaRatio: directionResult.deltaRatio,
      reason: null,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "DART 지분율 재파싱 중 오류가 발생했습니다.";
    const status = error instanceof AdminHttpError ? error.status : 500;

    if (jobRunId) {
      try {
        await updateJobRun({
          jobRunId,
          status: "FAILED",
          message,
          metadata: {
            rceptNo,
            ok: false,
            reason: message,
          },
        });
      } catch {
        return NextResponse.json(
          { error: `${message} 작업 실패 상태를 저장하지 못했습니다.` },
          { status },
        );
      }
    }

    return NextResponse.json({ error: message }, { status });
  }
}
