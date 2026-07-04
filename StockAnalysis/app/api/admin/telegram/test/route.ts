import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
      channelId?: string;
    };

    if (!body.channelId) {
      throw new AdminHttpError("테스트할 Telegram 채널을 선택해 주세요.", 400);
    }

    const supabase = createServerSupabaseClient();
    const { data: channel, error } = await supabase
      .from("telegram_channels")
      .select("id,name,chat_id")
      .eq("id", body.channelId)
      .single();

    if (error || !channel) {
      throw new Error(
        `Telegram 채널을 조회하지 못했습니다. ${error?.message ?? ""}`,
      );
    }

    await sendTelegramMessage({
      chatId: channel.chat_id as string,
      text: [
        "[국민연금 대량보유 변동 공시]",
        `채널: ${channel.name as string}`,
        "Telegram 테스트 알림입니다.",
        "",
        "※ 본 메시지는 공시 기반 정보 제공이며, 특정 종목의 매수·매도 권유가 아닙니다.",
      ].join("\n"),
    });

    return NextResponse.json({
      ok: true,
      channelId: channel.id,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Telegram 테스트 알림을 전송하는 중 오류가 발생했습니다.";
    const status = error instanceof AdminHttpError ? error.status : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
