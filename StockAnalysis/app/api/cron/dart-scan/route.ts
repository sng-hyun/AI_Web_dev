import { NextRequest, NextResponse } from "next/server";
import {
  isKstBusinessScanTime,
  runDartScan,
  toKstDateString,
} from "@/lib/dart/scanner";

export const runtime = "nodejs";

function assertCronAuthorization(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false as const,
        status: 503,
        message: "production 환경에서는 CRON_SECRET이 설정되어 있어야 합니다.",
      };
    }

    return {
      ok: true as const,
    };
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${secret}`) {
    return {
      ok: false as const,
      status: 401,
      message: "Cron 인증 헤더가 올바르지 않습니다.",
    };
  }

  return {
    ok: true as const,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authorizationResult = assertCronAuthorization(request);

    if (!authorizationResult.ok) {
      return NextResponse.json(
        { error: authorizationResult.message },
        { status: authorizationResult.status },
      );
    }

    const now = new Date();
    const scanDate = toKstDateString(now);

    if (!isKstBusinessScanTime(now)) {
      return NextResponse.json({
        ok: true,
        status: "SKIPPED_OUT_OF_WINDOW",
        scanDate,
        message: "한국 시간 기준 평일 09:00~18:30 사이가 아니어서 자동 스캔을 건너뜁니다.",
      });
    }

    const result = await runDartScan({
      scanDate,
      jobType: "DART_CRON_SCAN",
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Cron DART 자동 스캔 중 오류가 발생했습니다.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
