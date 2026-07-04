"use client";

import { FormEvent, useState } from "react";

type UploadError = {
  rowNumber: number;
  reason: string;
};

type UploadResult = {
  uploadedFileName: string;
  insertedCount: number;
  rejectedCount: number;
  errors: UploadError[];
  activatedAt: string;
};

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [adminWriteKey, setAdminWriteKey] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setError(null);

    if (!file) {
      setError("업로드할 xlsx 파일을 선택해 주세요.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("xlsx 파일만 업로드할 수 있습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);

    try {
      const headers = new Headers();

      if (adminWriteKey.trim()) {
        headers.set("x-admin-write-key", adminWriteKey.trim());
      }

      const response = await fetch("/api/admin/baselines/upload", {
        method: "POST",
        headers,
        body: formData,
      });
      const payload = (await response.json()) as UploadResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "업로드 요청을 처리하지 못했습니다.");
      }

      setResult(payload);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "업로드 요청을 처리하지 못했습니다.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form
        className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-zinc-900">xlsx 파일</span>
            <input
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-800 file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              type="file"
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
            disabled={isUploading}
            type="submit"
          >
            {isUploading ? "업로드 중" : "기준 파일 업로드"}
          </button>
        </div>
      </form>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}

      {result ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-zinc-950">업로드 결과</h2>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <ResultItem label="파일명" value={result.uploadedFileName} />
            <ResultItem label="활성화 시각" value={result.activatedAt} />
            <ResultItem
              label="삽입 성공"
              value={`${result.insertedCount.toLocaleString("ko-KR")}건`}
            />
            <ResultItem
              label="삽입 실패"
              value={`${result.rejectedCount.toLocaleString("ko-KR")}건`}
            />
          </dl>

          {result.errors.length > 0 ? (
            <div className="mt-6">
              <p className="text-sm font-bold text-zinc-900">실패 사유</p>
              <ul className="mt-3 grid gap-2">
                {result.errors.map((item) => (
                  <li
                    className="rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700"
                    key={`${item.rowNumber}-${item.reason}`}
                  >
                    {item.rowNumber}행: {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
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
