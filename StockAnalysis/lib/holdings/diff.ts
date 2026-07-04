import {
  DirectionCalculationInput,
  DirectionCalculationResult,
  HoldingChangeDraft,
} from "./types";

function normalizeRatio(value: number) {
  return Number(value.toFixed(4));
}

export function calculateDirection({
  baselineRatio,
  currentRatio,
}: DirectionCalculationInput): DirectionCalculationResult {
  if (baselineRatio === null) {
    return {
      direction: "NEW_BASELINE_REQUIRED",
      deltaRatio: null,
    };
  }

  if (currentRatio === null) {
    return {
      direction: "PARSE_FAILED",
      deltaRatio: null,
    };
  }

  const deltaRatio = normalizeRatio(currentRatio - baselineRatio);

  if (deltaRatio >= 0.01) {
    return {
      direction: "INCREASE",
      deltaRatio,
    };
  }

  if (deltaRatio <= -0.01) {
    return {
      direction: "DECREASE",
      deltaRatio,
    };
  }

  return {
    direction: "UNCHANGED",
    deltaRatio,
  };
}

export function createPendingParseHoldingChange(input: {
  rceptNo: string;
  stockCode: string;
  baselineRatio: number | null;
}): HoldingChangeDraft {
  return {
    rcept_no: input.rceptNo,
    stock_code: input.stockCode,
    baseline_ratio: input.baselineRatio,
    current_ratio: null,
    delta_ratio: null,
    direction: "PARSE_FAILED",
    parsed_source: null,
  };
}
