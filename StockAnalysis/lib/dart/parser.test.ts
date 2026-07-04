import { describe, expect, test } from "vitest";
import { parseCurrentRatioFromXml } from "./parser";

const failReason =
  "\uD604\uC7AC \uC9C0\uBD84\uC728\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";

describe("parseCurrentRatioFromXml", () => {
  test("보유비율 라벨 주변의 퍼센트 값을 현재 지분율로 추출한다", () => {
    const xml = `
      <DOCUMENT>
        <TABLE>
          <TR>
            <TD>\uC8FC\uC2DD\uB4F1\uC758 \uBCF4\uC720\uBE44\uC728</TD>
            <TD>9.12%</TD>
          </TR>
        </TABLE>
      </DOCUMENT>
    `;

    expect(parseCurrentRatioFromXml(xml)).toEqual({
      ok: true,
      currentRatio: 9.12,
      deltaRatio: null,
      reason: null,
    });
  });

  test("합계 라벨 주변의 명확한 퍼센트 값을 현재 지분율로 추출한다", () => {
    const xml = `
      <DOCUMENT>
        <TABLE>
          <TR>
            <TD>\uD569\uACC4</TD>
            <TD>1,000</TD>
            <TD>8.94%</TD>
          </TR>
        </TABLE>
      </DOCUMENT>
    `;

    expect(parseCurrentRatioFromXml(xml)).toEqual({
      ok: true,
      currentRatio: 8.94,
      deltaRatio: null,
      reason: null,
    });
  });

  test("이번보고서 행의 비율 값을 현재 지분율로 추출한다", () => {
    const xml = `
      <DOCUMENT>
        <TABLE>
          <TR>
            <TD></TD>
            <TD>\uBCF4\uACE0\uC11C\uC791\uC131 \uAE30\uC900\uC77C</TD>
            <TD>\uD2B9\uC815\uC99D\uAD8C\uB4F1</TD>
            <TD>\uC8FC\uAD8C</TD>
          </TR>
          <TR>
            <TD>\uD2B9\uC815\uC99D\uAD8C\uB4F1\uC758\uC218(\uC8FC)</TD>
            <TD>\uBE44\uC728(%)</TD>
            <TD>\uC8FC\uC2DD\uC218(\uC8FC)</TD>
            <TD>\uBE44\uC728(%)</TD>
          </TR>
          <TR>
            <TD>\uC9C1\uC804\uBCF4\uACE0\uC11C</TD>
            <TD>2026\uB144 03\uC6D4 31\uC77C</TD>
            <TD>6,630,087</TD>
            <TD>12.87</TD>
            <TD>6,630,087</TD>
            <TD>12.87</TD>
          </TR>
          <TR>
            <TD>\uC774\uBC88\uBCF4\uACE0\uC11C</TD>
            <TD>2026\uB144 06\uC6D4 30\uC77C</TD>
            <TD>6,277,630</TD>
            <TD>12.19</TD>
            <TD>6,277,630</TD>
            <TD>12.19</TD>
          </TR>
        </TABLE>
      </DOCUMENT>
    `;

    expect(parseCurrentRatioFromXml(xml)).toEqual({
      ok: true,
      currentRatio: 12.19,
      deltaRatio: -0.68,
      reason: null,
    });
  });

  test("후보 라벨이 없으면 실패 결과를 반환한다", () => {
    const xml =
      "<DOCUMENT><TEXT>\uD655\uC778\uD560 \uC218 \uC5C6\uB294 \uBB38\uC11C</TEXT></DOCUMENT>";

    expect(parseCurrentRatioFromXml(xml)).toEqual({
      ok: false,
      currentRatio: null,
      deltaRatio: null,
      reason: failReason,
    });
  });
});
