import { NextRequest, NextResponse } from "next/server";
import { DartScanInputError, runDartScan } from "@/lib/dart/scanner";

export const runtime = "nodejs";

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

export async function POST(request: NextRequest) {
  try {
    assertAdminWriteKey(request);

    const body = (await request.json().catch(() => ({}))) as {
      scanDate?: string;
    };
    const result = await runDartScan({
      scanDate: body.scanDate,
      jobType: "DART_SCAN",
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "DART 수동 스캔 중 오류가 발생했습니다.";
    const status =
      error instanceof AdminHttpError || error instanceof DartScanInputError
        ? error.status
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
