export type FilingDirection =
  | "INCREASE"
  | "DECREASE"
  | "UNCHANGED"
  | "NEW_BASELINE_REQUIRED"
  | "PARSE_FAILED";

export type FilingApiItem = {
  rceptNo: string;
  stockCode: string;
  corpName: string;
  reportName: string;
  filerName: string;
  baselineRatio: number | null;
  currentRatio: number | null;
  deltaRatio: number | null;
  direction: FilingDirection;
  dartViewerUrl: string;
  notificationStatus: "NOT_SENT" | "SENT" | "FAILED";
};
