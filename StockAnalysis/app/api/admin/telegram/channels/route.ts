import { NextRequest, NextResponse } from "next/server";
import {
  toTelegramChannelResponse,
  type TelegramChannelResponse,
} from "@/lib/telegram/server";
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

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validateChannelInput(input: { name: string; chatId: string }) {
  if (!input.name) {
    throw new AdminHttpError("채널 이름을 입력해 주세요.", 400);
  }

  if (!input.chatId) {
    throw new AdminHttpError("Telegram chat_id를 입력해 주세요.", 400);
  }

  if (input.name.length > 80) {
    throw new AdminHttpError("채널 이름은 80자 이하로 입력해 주세요.", 400);
  }

  if (input.chatId.length > 128) {
    throw new AdminHttpError("Telegram chat_id는 128자 이하로 입력해 주세요.", 400);
  }
}

async function listChannels(): Promise<TelegramChannelResponse[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("telegram_channels")
    .select("id,name,chat_id,enabled,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Telegram 채널을 조회하지 못했습니다. ${error.message}`);
  }

  return (data ?? []).map((row) =>
    toTelegramChannelResponse({
      id: row.id as string,
      name: row.name as string,
      chat_id: row.chat_id as string,
      enabled: row.enabled as boolean | null,
      created_at: row.created_at as string,
    }),
  );
}

export async function GET() {
  try {
    return NextResponse.json({
      items: await listChannels(),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Telegram 채널을 조회하는 중 오류가 발생했습니다.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    assertAdminWriteKey(request);

    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      name?: string;
      chatId?: string;
      enabled?: boolean;
    };
    const supabase = createServerSupabaseClient();

    if (body.id) {
      const updateValues: {
        name?: string;
        enabled?: boolean;
      } = {};
      const name = normalizeText(body.name);

      if (name) {
        updateValues.name = name;
      }

      if (typeof body.enabled === "boolean") {
        updateValues.enabled = body.enabled;
      }

      if (Object.keys(updateValues).length === 0) {
        throw new AdminHttpError("변경할 채널 값이 없습니다.", 400);
      }

      const { data, error } = await supabase
        .from("telegram_channels")
        .update(updateValues)
        .eq("id", body.id)
        .select("id,name,chat_id,enabled,created_at")
        .single();

      if (error || !data) {
        throw new Error(
          `Telegram 채널을 수정하지 못했습니다. ${error?.message ?? ""}`,
        );
      }

      return NextResponse.json({
        item: toTelegramChannelResponse({
          id: data.id as string,
          name: data.name as string,
          chat_id: data.chat_id as string,
          enabled: data.enabled as boolean | null,
          created_at: data.created_at as string,
        }),
      });
    }

    const name = normalizeText(body.name);
    const chatId = normalizeText(body.chatId);
    validateChannelInput({ name, chatId });

    const { data, error } = await supabase
      .from("telegram_channels")
      .insert({
        name,
        chat_id: chatId,
        enabled: body.enabled ?? true,
      })
      .select("id,name,chat_id,enabled,created_at")
      .single();

    if (error || !data) {
      throw new Error(
        `Telegram 채널을 저장하지 못했습니다. ${error?.message ?? ""}`,
      );
    }

    return NextResponse.json({
      item: toTelegramChannelResponse({
        id: data.id as string,
        name: data.name as string,
        chat_id: data.chat_id as string,
        enabled: data.enabled as boolean | null,
        created_at: data.created_at as string,
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Telegram 채널을 저장하는 중 오류가 발생했습니다.";
    const status = error instanceof AdminHttpError ? error.status : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
