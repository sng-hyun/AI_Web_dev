"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FilingApiItem, FilingDirection } from "@/lib/filings";

type FilingsResponse = {
  items: FilingApiItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  error?: string;
};

type ParseResponse = {
  ok: boolean;
  rceptNo: string;
  currentRatio: number | null;
  direction: FilingDirection;
  deltaRatio: number | null;
  reason: string | null;
  error?: string;
};

const directionLabels: Record<FilingDirection, string> = {
  INCREASE: "증가",
  DECREASE: "감소",
  UNCHANGED: "변화 없음",
  NEW_BASELINE_REQUIRED: "기준 필요",
  PARSE_FAILED: "파싱 실패",
};

const placeholderCards = ["최근 뉴스", "재무 상태", "업종 분위기"] as const;

function formatRatio(value: number | null, suffix = "%") {
  if (value === null) {
    return "미확인";
  }

  return `${value.toFixed(2)}${suffix}`;
}

export default function DashboardClient() {
  const [items, setItems] = useState<FilingApiItem[]>([]);
  const [adminWriteKey, setAdminWriteKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [parsingRceptNo, setParsingRceptNo] = useState<string | null>(null);
  const [selectedRceptNo, setSelectedRceptNo] = useState<string | null>(null);

  async function loadFilings() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/filings", { cache: "no-store" });
      const payload = (await response.json()) as FilingsResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "공시 데이터를 불러오지 못했습니다.");
      }

      setItems(payload.items);
      setSelectedRceptNo((currentRceptNo) => {
        if (
          currentRceptNo &&
          payload.items.some((item) => item.rceptNo === currentRceptNo)
        ) {
          return currentRceptNo;
        }

        return payload.items[0]?.rceptNo ?? null;
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "공시 데이터를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function parseFiling(rceptNo: string) {
    setMessage(null);
    setError(null);
    setParsingRceptNo(rceptNo);

    try {
      const headers = new Headers();

      if (adminWriteKey.trim()) {
        headers.set("x-admin-write-key", adminWriteKey.trim());
      }

      const response = await fetch(`/api/admin/filings/${rceptNo}/parse`, {
        method: "POST",
        headers,
      });
      const payload = (await response.json()) as ParseResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "재파싱 요청을 처리하지 못했습니다.");
      }

      setMessage(
        payload.ok
          ? `${rceptNo} 재파싱 성공: 현재 지분율 ${formatRatio(
              payload.currentRatio,
            )}`
          : `${rceptNo} 재파싱 실패: ${payload.reason}`,
      );
      await loadFilings();
    } catch (parseError) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : "재파싱 요청을 처리하지 못했습니다.",
      );
    } finally {
      setParsingRceptNo(null);
    }
  }

  useEffect(() => {
    void loadFilings();
  }, []);

  const stats = useMemo(
    () => ({
      total: items.length,
      parseFailed: items.filter((item) => item.direction === "PARSE_FAILED")
        .length,
    }),
    [items],
  );
  const selectedItem = useMemo(
    () => items.find((item) => item.rceptNo === selectedRceptNo) ?? null,
    [items, selectedRceptNo],
  );

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <section className="bg-black px-6 py-8 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-white/60">Dashboard</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
              국민연금 공시 대시보드
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
              기준 파일과 DART 공시 데이터를 바탕으로 종목별 지분율 변동과
              기관 지분 방향을 확인합니다.
            </p>
          </div>
          <nav className="hidden items-center gap-3 md:flex" aria-label="주요 메뉴">
            <Link
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white"
              href="/upload"
            >
              업로드
            </Link>
            <Link
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white"
              href="/settings"
            >
              설정
            </Link>
          </nav>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-zinc-100 p-5">
            <p className="text-sm font-bold text-zinc-500">표시 건수</p>
            <p className="mt-2 text-3xl font-black">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-zinc-100 p-5">
            <p className="text-sm font-bold text-zinc-500">파싱 실패</p>
            <p className="mt-2 text-3xl font-black">{stats.parseFailed}</p>
          </div>
          <label className="grid gap-2 rounded-2xl bg-zinc-100 p-5">
            <span className="text-sm font-bold text-zinc-500">
              관리자 쓰기 키
            </span>
            <input
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-900"
              onChange={(event) => setAdminWriteKey(event.target.value)}
              placeholder="필요한 환경에서만 입력"
              type="password"
              value={adminWriteKey}
            />
          </label>
        </div>

        {message ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
          <table className="min-w-[1080px] divide-y divide-zinc-200">
            <thead className="bg-zinc-100">
              <tr>
                <TableHead>종목명</TableHead>
                <TableHead>종목코드</TableHead>
                <TableHead>기준 지분율</TableHead>
                <TableHead>현재 지분율</TableHead>
                <TableHead>변동폭</TableHead>
                <TableHead>기관 지분 방향</TableHead>
                <TableHead>DART 원문 링크</TableHead>
                <TableHead>작업</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {loading ? (
                <tr>
                  <td className="px-5 py-8 text-sm font-semibold text-zinc-600" colSpan={8}>
                    공시 데이터를 불러오는 중입니다.
                  </td>
                </tr>
              ) : null}

              {!loading && items.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-sm font-semibold text-zinc-600" colSpan={8}>
                    표시할 공시 데이터가 없습니다.
                  </td>
                </tr>
              ) : null}

              {!loading
                ? items.map((item) => (
                    <tr
                      aria-selected={selectedRceptNo === item.rceptNo}
                      className={`cursor-pointer transition hover:bg-zinc-50 ${
                        selectedRceptNo === item.rceptNo ? "bg-zinc-50" : ""
                      }`}
                      key={item.rceptNo}
                      onClick={() => setSelectedRceptNo(item.rceptNo)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedRceptNo(item.rceptNo);
                        }
                      }}
                      tabIndex={0}
                    >
                      <TableCell strong>{item.corpName}</TableCell>
                      <TableCell>{item.stockCode}</TableCell>
                      <TableCell>{formatRatio(item.baselineRatio)}</TableCell>
                      <TableCell>{formatRatio(item.currentRatio)}</TableCell>
                      <TableCell>{formatRatio(item.deltaRatio, "%p")}</TableCell>
                      <TableCell>
                        <DirectionBadge direction={item.direction} />
                      </TableCell>
                      <TableCell>
                        <a
                          className="font-bold text-blue-700 underline-offset-4 hover:underline"
                          href={item.dartViewerUrl}
                          onClick={(event) => event.stopPropagation()}
                          rel="noreferrer"
                          target="_blank"
                        >
                          원문 보기
                        </a>
                      </TableCell>
                      <TableCell>
                        {item.direction === "PARSE_FAILED" ? (
                          <button
                            className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={parsingRceptNo === item.rceptNo}
                            onClick={(event) => {
                              event.stopPropagation();
                              void parseFiling(item.rceptNo);
                            }}
                            type="button"
                          >
                            {parsingRceptNo === item.rceptNo
                              ? "재파싱 중"
                              : "재파싱"}
                          </button>
                        ) : (
                          <span className="text-sm text-zinc-400">완료</span>
                        )}
                      </TableCell>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>

        {selectedItem ? <DisclosureDetailPanel item={selectedItem} /> : null}
      </section>

      <FooterNotice />
    </main>
  );
}

function DisclosureDetailPanel({ item }: { item: FilingApiItem }) {
  return (
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-bold text-zinc-500">상세 영역</p>
          <h2 className="mt-2 text-2xl font-black text-zinc-950">
            {item.corpName} ({item.stockCode})
          </h2>
          <p className="mt-2 text-sm font-semibold text-zinc-600">
            공시 기반 변동 신호와 이후 확장 데이터를 함께 확인하는 영역입니다.
          </p>
        </div>
        <DirectionBadge direction={item.direction} />
      </div>

      <dl className="mt-6 grid gap-3 md:grid-cols-4">
        <DetailMetric label="기준 지분율" value={formatRatio(item.baselineRatio)} />
        <DetailMetric label="현재 지분율" value={formatRatio(item.currentRatio)} />
        <DetailMetric label="변동폭" value={formatRatio(item.deltaRatio, "%p")} />
        <DetailMetric label="접수번호" value={item.rceptNo} />
      </dl>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {placeholderCards.map((title) => (
          <PlaceholderCard key={title} title={title} />
        ))}
      </div>
    </section>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-100 p-4">
      <dt className="text-xs font-bold text-zinc-500">{label}</dt>
      <dd className="mt-2 break-words text-sm font-black text-zinc-950">
        {value}
      </dd>
    </div>
  );
}

function PlaceholderCard({ title }: { title: string }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-black text-zinc-950">{title}</h3>
        <span className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-black text-white">
          DATA_PROVIDER_DISABLED
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold leading-6 text-zinc-600">
        MVP에서는 외부 데이터 공급자가 비활성화되어 있습니다. 이후
        뉴스/재무/업종 데이터 연동 시 이 영역에 표시됩니다.
      </p>
    </article>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-5 py-4 text-left text-sm font-bold text-zinc-600">
      {children}
    </th>
  );
}

function TableCell({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={`whitespace-nowrap px-5 py-5 text-sm ${
        strong ? "font-bold text-zinc-950" : "text-zinc-700"
      }`}
    >
      {children}
    </td>
  );
}

function DirectionBadge({ direction }: { direction: FilingDirection }) {
  const style = {
    INCREASE: "bg-emerald-100 text-emerald-800",
    DECREASE: "bg-rose-100 text-rose-800",
    UNCHANGED: "bg-zinc-100 text-zinc-700",
    NEW_BASELINE_REQUIRED: "bg-amber-100 text-amber-800",
    PARSE_FAILED: "bg-zinc-900 text-white",
  }[direction];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${style}`}>
      {directionLabels[direction]}
    </span>
  );
}

function FooterNotice() {
  return (
    <footer className="border-t border-zinc-200 px-6 py-8 text-center text-sm font-semibold text-zinc-600">
      본 서비스는 공시 기반 정보 제공용이며, 특정 종목의 매수·매도 권유가
      아닙니다.
    </footer>
  );
}
