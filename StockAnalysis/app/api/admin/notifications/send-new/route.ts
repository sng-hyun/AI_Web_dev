import { NextRequest, NextResponse } from "next/server";
import type { FilingDirection } from "@/lib/filings";
import {
  sendTelegramMessage,
  telegramDirectionLabels,
} from "@/lib/telegram/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type NotificationRow = {
  rcept_no: string;
  rcept_dt: string;
  stock_code: string;
  corp_name: string;
  report_nm: string;
  baseline_ratio: number | null;
  current_ratio: number | null;
  delta_ratio: number | null;
  direction: FilingDirection;
  dart_viewer_url: string;
};

type TelegramChannelRow = {
  id: string;
  name: string;
  chat_id: string;
};

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

function formatRatio(value: number | null, suffix = "%") {
  if (value === null) {
    return "미확인";
  }

  return `${Number(value).toFixed(2)}${suffix}`;
}

function buildNotificationMessage(row: NotificationRow) {
  return [
    "[국민연금 대량보유 변동 공시]",
    `종목: ${row.corp_name} (${row.stock_code})`,
    `공시: ${row.report_nm}`,
    `접수일: ${row.rcept_dt}`,
    `기준 지분율: ${formatRatio(row.baseline_ratio)}`,
    `현재 지분율: ${formatRatio(row.current_ratio)}`,
    `변동폭: ${formatRatio(row.delta_ratio, "%p")}`,
    `기관 지분 방향: ${telegramDirectionLabels[row.direction]}`,
    `DART 원문: ${row.dart_viewer_url}`,
    "",
    "※ 본 메시지는 공시 기반 정보 제공이며, 특정 종목의 매수·매도 권유가 아닙니다.",
  ].join("\n");
}

function normalizeLimit(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 50;
  }

  return Math.min(Math.max(Math.trunc(value), 1), 100);
}

async function createPendingLog(input: {
  rceptNo: string;
  channelId: string;
}) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notification_logs")
    .insert({
      rcept_no: input.rceptNo,
      channel_id: input.channelId,
      provider: "TELEGRAM",
      status: "PENDING",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return null;
    }

    throw new Error(`알림 발송 로그를 생성하지 못했습니다. ${error.message}`);
  }

  return data?.id as string;
}

async function updateNotificationLog(input: {
  logId: string;
  status: "SENT" | "FAILED";
  errorMessage?: string;
}) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("notification_logs")
    .update({
      status: input.status,
      sent_at: input.status === "SENT" ? new Date().toISOString() : null,
      error_message: input.errorMessage ?? null,
    })
    .eq("id", input.logId);

  if (error) {
    throw new Error(`알림 발송 로그를 갱신하지 못했습니다. ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertAdminWriteKey(request);

    const body = (await request.json().catch(() => ({}))) as {
      limit?: number;
    };
    const limit = normalizeLimit(body.limit);
    const supabase = createServerSupabaseClient();
    const { data: channels, error: channelError } = await supabase
      .from("telegram_channels")
      .select("id,name,chat_id")
      .eq("enabled", true)
      .order("created_at", { ascending: false });

    if (channelError) {
      throw new Error(
        `활성화된 Telegram 채널을 조회하지 못했습니다. ${channelError.message}`,
      );
    }

    if (!channels || channels.length === 0) {
      return NextResponse.json({
        ok: true,
        checkedCount: 0,
        sentCount: 0,
        skippedDuplicateCount: 0,
        failedCount: 0,
        message: "활성화된 Telegram 채널이 없습니다.",
      });
    }

    const { data: filings, error: filingError } = await supabase
      .from("recent_holding_changes_30d")
      .select(
        "rcept_no,rcept_dt,stock_code,corp_name,report_nm,baseline_ratio,current_ratio,delta_ratio,direction,dart_viewer_url",
      )
      .order("rcept_dt", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filingError) {
      throw new Error(`알림 대상 공시를 조회하지 못했습니다. ${filingError.message}`);
    }

    let sentCount = 0;
    let skippedDuplicateCount = 0;
    let failedCount = 0;
    const results: Array<{
      rceptNo: string;
      channelId: string;
      status: "SENT" | "FAILED" | "SKIPPED_DUPLICATE";
      errorMessage?: string;
    }> = [];

    for (const filing of (filings ?? []) as unknown as NotificationRow[]) {
      for (const channel of channels as unknown as TelegramChannelRow[]) {
        const logId = await createPendingLog({
          rceptNo: filing.rcept_no,
          channelId: channel.id,
        });

        if (!logId) {
          skippedDuplicateCount += 1;
          results.push({
            rceptNo: filing.rcept_no,
            channelId: channel.id,
            status: "SKIPPED_DUPLICATE",
          });
          continue;
        }

        try {
          await sendTelegramMessage({
            chatId: channel.chat_id,
            text: buildNotificationMessage(filing),
          });
          await updateNotificationLog({
            logId,
            status: "SENT",
          });
          sentCount += 1;
          results.push({
            rceptNo: filing.rcept_no,
            channelId: channel.id,
            status: "SENT",
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Telegram 알림 전송 중 오류가 발생했습니다.";
          await updateNotificationLog({
            logId,
            status: "FAILED",
            errorMessage,
          });
          failedCount += 1;
          results.push({
            rceptNo: filing.rcept_no,
            channelId: channel.id,
            status: "FAILED",
            errorMessage,
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      checkedCount: (filings ?? []).length,
      channelCount: channels.length,
      sentCount,
      skippedDuplicateCount,
      failedCount,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "신규 Telegram 알림을 발송하는 중 오류가 발생했습니다.";
    const status = error instanceof AdminHttpError ? error.status : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
