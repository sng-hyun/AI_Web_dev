export type HoldingDirection =
  | "INCREASE"
  | "DECREASE"
  | "UNCHANGED"
  | "NEW_BASELINE_REQUIRED"
  | "PARSE_FAILED";

export type DirectionCalculationInput = {
  baselineRatio: number | null;
  currentRatio: number | null;
};

export type DirectionCalculationResult = {
  direction: HoldingDirection;
  deltaRatio: number | null;
};

export type HoldingChangeDraft = {
  rcept_no: string;
  stock_code: string;
  baseline_ratio: number | null;
  current_ratio: number | null;
  delta_ratio: number | null;
  direction: HoldingDirection;
  parsed_source: "XML" | "MAJORSTOCK_API" | "MANUAL" | "MOCK" | null;
};
