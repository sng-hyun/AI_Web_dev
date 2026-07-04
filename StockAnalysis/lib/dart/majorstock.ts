import "server-only";

export const dartMajorStockParserVersion = "majorstock-api-mvp-1";

type DartMajorStockItem = {
  rcept_no?: string;
  rcept_dt?: string;
  corp_code?: string;
  corp_name?: string;
  report_tp?: string;
  repror?: string;
  stkqy?: string;
  stkqy_irds?: string;
  stkrt?: string;
  stkrt_irds?: string;
  ctr_stkqy?: string;
  ctr_stkrt?: string;
  report_resn?: string;
};

type DartMajorStockResponse = {
  status: string;
  message: string;
  list?: DartMajorStockItem[];
};

export type DartMajorStockParseResult =
  | {
      ok: true;
      currentRatio: number;
      deltaRatio: number | null;
      reason: null;
    }
  | {
      ok: false;
      currentRatio: null;
      deltaRatio: null;
      reason: string;
    };

function getDartApiKey() {
  const apiKey = process.env.DART_API_KEY;

  if (!apiKey) {
    throw new Error("환경 변수 DART_API_KEY가 설정되지 않았습니다.");
  }

  return apiKey;
}

function parseRatio(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value.replace("%", "").replaceAll(",", "").trim());

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return null;
  }

  return Number(parsed.toFixed(4));
}

function parseDeltaRatio(value?: string) {
  if (!value) {
    return null;
  }

  const normalized = value
    .replace("%", "")
    .replaceAll(",", "")
    .replace(/\u25B3/g, "-")
    .replace(/\u2212/g, "-")
    .trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Number(parsed.toFixed(4));
}

export async function fetchCurrentRatioFromMajorStock(input: {
  corpCode: string;
  rceptNo: string;
}): Promise<DartMajorStockParseResult> {
  const url = new URL("https://opendart.fss.or.kr/api/majorstock.json");
  url.searchParams.set("crtfc_key", getDartApiKey());
  url.searchParams.set("corp_code", input.corpCode);

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`DART 대량보유 API 요청에 실패했습니다. 상태 코드: ${response.status}`);
  }

  const data = (await response.json()) as DartMajorStockResponse;

  if (data.status === "013") {
    return {
      ok: false,
      currentRatio: null,
      deltaRatio: null,
      reason: "DART 대량보유 API에서 조회된 데이터가 없습니다.",
    };
  }

  if (data.status !== "000") {
    return {
      ok: false,
      currentRatio: null,
      deltaRatio: null,
      reason: `DART 대량보유 API 응답 오류: ${data.message}`,
    };
  }

  const matched = (data.list ?? []).find(
    (item) => item.rcept_no === input.rceptNo,
  );

  if (!matched) {
    return {
      ok: false,
      currentRatio: null,
      deltaRatio: null,
      reason: "DART 대량보유 API에서 해당 접수번호를 찾지 못했습니다.",
    };
  }

  const currentRatio = parseRatio(matched.stkrt);

  if (currentRatio === null) {
    return {
      ok: false,
      currentRatio: null,
      deltaRatio: null,
      reason: "DART 대량보유 API에서 보유비율을 숫자로 변환하지 못했습니다.",
    };
  }

  return {
    ok: true,
    currentRatio,
    deltaRatio: parseDeltaRatio(matched.stkrt_irds),
    reason: null,
  };
}
