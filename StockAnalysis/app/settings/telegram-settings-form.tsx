"use client";

import { FormEvent, useEffect, useState } from "react";

type TelegramChannel = {
  id: string;
  name: string;
  maskedChatId: string;
  enabled: boolean;
  createdAt: string;
};

type SendNewResult = {
  ok: boolean;
  checkedCount: number;
  channelCount?: number;
  sentCount: number;
  skippedDuplicateCount: number;
  failedCount: number;
  message?: string;
};

export default function TelegramSettingsForm() {
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [name, setName] = useState("");
  const [chatId, setChatId] = useState("");
  const [adminWriteKey, setAdminWriteKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [workingChannelId, setWorkingChannelId] = useState<string | null>(null);
  const [isSendingNew, setIsSendingNew] = useState(false);

  async function loadChannels() {
    const response = await fetch("/api/admin/telegram/channels", {
      cache: "no-store",
    });
    const payload = (await response.json()) as {
      items?: TelegramChannel[];
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? "Telegram 채널을 불러오지 못했습니다.");
    }

    setChannels(payload.items ?? []);
  }

  function buildHeaders() {
    const headers = new Headers({
      "content-type": "application/json",
    });

    if (adminWriteKey.trim()) {
      headers.set("x-admin-write-key", adminWriteKey.trim());
    }

    return headers;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/telegram/channels", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          name,
          chatId,
          enabled: true,
        }),
      });
      const payload = (await response.json()) as {
        item?: TelegramChannel;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Telegram 채널을 저장하지 못했습니다.");
      }

      setName("");
      setChatId("");
      setMessage("Telegram 채널을 저장했습니다.");
      await loadChannels();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Telegram 채널을 저장하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function updateEnabled(channel: TelegramChannel) {
    setMessage(null);
    setError(null);
    setWorkingChannelId(channel.id);

    try {
      const response = await fetch("/api/admin/telegram/channels", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          id: channel.id,
          enabled: !channel.enabled,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Telegram 채널 상태를 변경하지 못했습니다.");
      }

      setMessage("Telegram 채널 상태를 변경했습니다.");
      await loadChannels();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Telegram 채널 상태를 변경하지 못했습니다.",
      );
    } finally {
      setWorkingChannelId(null);
    }
  }

  async function sendTest(channel: TelegramChannel) {
    setMessage(null);
    setError(null);
    setWorkingChannelId(channel.id);

    try {
      const response = await fetch("/api/admin/telegram/test", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          channelId: channel.id,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Telegram 테스트 알림을 보내지 못했습니다.");
      }

      setMessage("Telegram 테스트 알림을 보냈습니다.");
    } catch (testError) {
      setError(
        testError instanceof Error
          ? testError.message
          : "Telegram 테스트 알림을 보내지 못했습니다.",
      );
    } finally {
      setWorkingChannelId(null);
    }
  }

  async function sendNewNotifications() {
    setMessage(null);
    setError(null);
    setIsSendingNew(true);

    try {
      const response = await fetch("/api/admin/notifications/send-new", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          limit: 50,
        }),
      });
      const payload = (await response.json()) as SendNewResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "신규 Telegram 알림을 보내지 못했습니다.");
      }

      setMessage(
        payload.message ??
          `신규 알림 처리 완료: 발송 ${payload.sentCount.toLocaleString(
            "ko-KR",
          )}건, 중복 제외 ${payload.skippedDuplicateCount.toLocaleString(
            "ko-KR",
          )}건, 실패 ${payload.failedCount.toLocaleString("ko-KR")}건`,
      );
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "신규 Telegram 알림을 보내지 못했습니다.",
      );
    } finally {
      setIsSendingNew(false);
    }
  }

  useEffect(() => {
    loadChannels().catch((loadError) => {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Telegram 채널을 불러오지 못했습니다.",
      );
    });
  }, []);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-bold text-zinc-950">Telegram 알림</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            공시 기반 변동 신호를 활성화된 채널로 발송합니다.
          </p>
        </div>
        <span className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600">
          서버 전송
        </span>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-zinc-900">관리자 쓰기 키</span>
          <input
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-900"
            onChange={(event) => setAdminWriteKey(event.target.value)}
            placeholder="ADMIN_WRITE_KEY가 설정된 환경에서만 필요합니다."
            type="password"
            value={adminWriteKey}
          />
        </label>

        <form className="grid gap-3 rounded-2xl bg-zinc-50 p-4" onSubmit={handleCreate}>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-zinc-900">채널 이름</span>
            <input
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-900"
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 운영 알림"
              value={name}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-zinc-900">Telegram chat_id</span>
            <input
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-900"
              onChange={(event) => setChatId(event.target.value)}
              placeholder="저장 후에는 마스킹되어 표시됩니다."
              type="password"
              value={chatId}
            />
          </label>

          <button
            className="rounded-full bg-black px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "저장 중" : "채널 저장"}
          </button>
        </form>

        <button
          className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSendingNew}
          onClick={() => void sendNewNotifications()}
          type="button"
        >
          {isSendingNew ? "알림 발송 중" : "신규 알림 발송"}
        </button>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        {channels.length === 0 ? (
          <div className="rounded-2xl bg-zinc-100 p-5 text-sm font-semibold text-zinc-600">
            저장된 Telegram 채널이 없습니다.
          </div>
        ) : null}

        {channels.map((channel) => (
          <div
            className="grid gap-4 rounded-2xl border border-zinc-200 p-5 md:grid-cols-[1fr_auto]"
            key={channel.id}
          >
            <div>
              <p className="text-base font-black text-zinc-950">{channel.name}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                {channel.maskedChatId}
              </p>
              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                  channel.enabled
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {channel.enabled ? "활성" : "비활성"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={workingChannelId === channel.id}
                onClick={() => void updateEnabled(channel)}
                type="button"
              >
                {channel.enabled ? "비활성화" : "활성화"}
              </button>
              <button
                className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={workingChannelId === channel.id}
                onClick={() => void sendTest(channel)}
                type="button"
              >
                테스트
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
