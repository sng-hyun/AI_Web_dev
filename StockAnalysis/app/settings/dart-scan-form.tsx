"use client";

import { FormEvent, useState } from "react";

type DartScanResult = {
  jobRunId: string;
  status: "SUCCESS" | "FAILED" | "RATE_LIMITED";
  scanDate: string;
  fetchedCount: number;
  nationalPensionCount: number;
  insertedCount: number;
  skippedDuplicateCount: number;
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function DartScanForm() {
  const [scanDate, setScanDate] = useState(todayString());
  const [adminWriteKey, setAdminWriteKey] = useState("");
  const [result, setResult] = useState<DartScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setError(null);
    setIsRunning(true);

    try {
      const headers = new Headers({
        "content-type": "application/json",
      });

      if (adminWriteKey.trim()) {
        headers.set("x-admin-write-key", adminWriteKey.trim());
      }

      const response = await fetch("/api/admin/jobs/dart-scan/run", {
        method: "POST",
        headers,
        body: JSON.stringify({ scanDate }),
      });
      const payload = (await response.json()) as DartScanResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "DART 수동 스캔을 실행하지 못했습니다.");
      }

      setResult(payload);
    } catch (scanError) {
      setError(
        scanError instanceof Error
          ? scanError.message
          : "DART 수동 스캔을 실행하지 못했습니다.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-bold text-zinc-950">DART 수동 스캔</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            선택한 날짜의 대량보유 공시 중 보고자가 국민연금공단인 공시만
            저장합니다.
          </p>
        </div>
        <span className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600">
          서버 작업
        </span>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-bold text-zinc-900">조회일</span>
          <input
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-900"
            onChange={(event) => setScanDate(event.target.value)}
            type="date"
            value={scanDate}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-zinc-900">
            관리자 쓰기 키
          </span>
          <input
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-900"
            onChange={(event) => setAdminWriteKey(event.target.value)}
            placeholder="ADMIN_WRITE_KEY가 설정된 환경에서만 필요합니다."
            type="password"
            value={adminWriteKey}
          />
        </label>

        <button
          className="rounded-full bg-black px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isRunning}
          type="submit"
        >
          {isRunning ? "스캔 실행 중" : "DART 수동 스캔"}
        </button>
      </form>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}

      {result ? (
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <ResultItem label="작업 ID" value={result.jobRunId} />
          <ResultItem label="상태" value={result.status} />
          <ResultItem label="조회일" value={result.scanDate} />
          <ResultItem
            label="DART 응답 건수"
            value={`${result.fetchedCount.toLocaleString("ko-KR")}건`}
          />
          <ResultItem
            label="국민연금공단 공시"
            value={`${result.nationalPensionCount.toLocaleString("ko-KR")}건`}
          />
          <ResultItem
            label="신규 저장"
            value={`${result.insertedCount.toLocaleString("ko-KR")}건`}
          />
          <ResultItem
            label="중복 제외"
            value={`${result.skippedDuplicateCount.toLocaleString("ko-KR")}건`}
          />
        </dl>
      ) : null}
    </section>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-100 p-4">
      <dt className="text-xs font-bold text-zinc-500">{label}</dt>
      <dd className="mt-2 break-words text-base font-black text-zinc-950">
        {value}
      </dd>
    </div>
  );
}
