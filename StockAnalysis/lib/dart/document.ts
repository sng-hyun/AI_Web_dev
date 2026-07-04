import "server-only";

import JSZip from "jszip";

function getDartApiKey() {
  const apiKey = process.env.DART_API_KEY;

  if (!apiKey) {
    throw new Error("환경 변수 DART_API_KEY가 설정되지 않았습니다.");
  }

  return apiKey;
}

function decodeXml(bytes: Uint8Array) {
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  const encoding = utf8.match(/encoding=["']([^"']+)["']/i)?.[1]?.toLowerCase();

  if (encoding?.includes("euc-kr") || encoding?.includes("ks_c_5601")) {
    return new TextDecoder("euc-kr").decode(bytes);
  }

  const eucKr = new TextDecoder("euc-kr").decode(bytes);
  const usefulKoreanLabels = [
    "\uBCF4\uC720\uBE44\uC728",
    "\uC8FC\uC2DD\uB4F1\uC758 \uBCF4\uC720\uBE44\uC728",
    "\uC18C\uC720\uBE44\uC728",
    "\uD569\uACC4",
    "\uC774\uBC88\uBCF4\uACE0\uC11C",
  ];
  const utf8Score = usefulKoreanLabels.filter((label) => utf8.includes(label)).length;
  const eucKrScore = usefulKoreanLabels.filter((label) => eucKr.includes(label)).length;

  return eucKrScore > utf8Score ? eucKr : utf8;
}

export async function fetchDartDocumentXml(rceptNo: string) {
  const url = new URL("https://opendart.fss.or.kr/api/document.xml");
  url.searchParams.set("crtfc_key", getDartApiKey());
  url.searchParams.set("rcept_no", rceptNo);

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`DART 원문 요청에 실패했습니다. 상태 코드: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("xml") || contentType.includes("text")) {
    const text = await response.text();

    if (text.includes("<status>")) {
      throw new Error(`DART 원문 응답 오류: ${text}`);
    }

    throw new Error("DART 원문 ZIP 파일이 아닌 응답을 받았습니다.");
  }

  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const xmlFile = Object.values(zip.files).find(
    (file) => !file.dir && file.name.toLowerCase().endsWith(".xml"),
  );

  if (!xmlFile) {
    throw new Error("DART ZIP 파일 안에서 XML 파일을 찾지 못했습니다.");
  }

  return decodeXml(await xmlFile.async("uint8array"));
}
