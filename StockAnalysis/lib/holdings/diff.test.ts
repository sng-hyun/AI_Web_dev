import { describe, expect, test } from "vitest";
import { calculateDirection } from "./diff";

describe("calculateDirection", () => {
  test("8.94에서 9.12로 증가하면 INCREASE와 +0.18을 반환한다", () => {
    expect(
      calculateDirection({ baselineRatio: 8.94, currentRatio: 9.12 }),
    ).toEqual({
      direction: "INCREASE",
      deltaRatio: 0.18,
    });
  });

  test("8.94에서 8.50으로 감소하면 DECREASE와 -0.44를 반환한다", () => {
    expect(
      calculateDirection({ baselineRatio: 8.94, currentRatio: 8.5 }),
    ).toEqual({
      direction: "DECREASE",
      deltaRatio: -0.44,
    });
  });

  test("8.940에서 8.944로 변하면 UNCHANGED를 반환한다", () => {
    expect(
      calculateDirection({ baselineRatio: 8.94, currentRatio: 8.944 }),
    ).toEqual({
      direction: "UNCHANGED",
      deltaRatio: 0.004,
    });
  });

  test("기준 지분율이 없으면 NEW_BASELINE_REQUIRED를 반환한다", () => {
    expect(
      calculateDirection({ baselineRatio: null, currentRatio: 9.12 }),
    ).toEqual({
      direction: "NEW_BASELINE_REQUIRED",
      deltaRatio: null,
    });
  });

  test("현재 지분율이 없으면 PARSE_FAILED를 반환한다", () => {
    expect(
      calculateDirection({ baselineRatio: 8.94, currentRatio: null }),
    ).toEqual({
      direction: "PARSE_FAILED",
      deltaRatio: null,
    });
  });
});
