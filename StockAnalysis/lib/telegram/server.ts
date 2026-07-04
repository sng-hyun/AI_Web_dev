import "server-only";

import type { FilingDirection } from "@/lib/filings";

export type TelegramChannelResponse = {
  id: string;
  name: string;
  maskedChatId: string;
  enabled: boolean;
  createdAt: string;
};

export const telegramDirectionLabels: Record<FilingDirection, string> = {
  INCREASE: "증가",
  DECREASE: "감소",
  UNCHANGED: "유지",
  NEW_BASELINE_REQUIRED: "기준값 필요",
  PARSE_FAILED: "파싱 실패",
};

function getTelegramBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("환경 변수 TELEGRAM_BOT_TOKEN이 설정되지 않았습니다.");
  }

  return token;
}

export function maskChatId(chatId: string) {
  const normalized = chatId.trim();

  if (normalized.length <= 4) {
    return "*".repeat(normalized.length);
  }

  if (normalized.startsWith("@")) {
    return `${normalized.slice(0, 3)}***${normalized.slice(-2)}`;
  }

  return `${normalized.slice(0, 2)}***${normalized.slice(-3)}`;
}

export function toTelegramChannelResponse(row: {
  id: string;
  name: string;
  chat_id: string;
  enabled: boolean | null;
  created_at: string;
}): TelegramChannelResponse {
  return {
    id: row.id,
    name: row.name,
    maskedChatId: maskChatId(row.chat_id),
    enabled: row.enabled ?? true,
    createdAt: row.created_at,
  };
}

export async function sendTelegramMessage(input: {
  chatId: string;
  text: string;
}) {
  const response = await fetch(
    `https://api.telegram.org/bot${getTelegramBotToken()}/sendMessage`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chat_id: input.chatId,
        text: input.text,
        disable_web_page_preview: true,
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    description?: string;
  } | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload?.description ??
        `Telegram 메시지 전송에 실패했습니다. 상태 코드: ${response.status}`,
    );
  }
}
