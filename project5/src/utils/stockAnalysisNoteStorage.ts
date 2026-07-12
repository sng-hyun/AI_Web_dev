import {
  STOCK_ANALYSIS_NOTE_SCHEMA_VERSION,
  STOCK_ANALYSIS_NOTE_STORAGE_KEY,
} from '../constants/stockAnalysisNoteStorage';
import type {
  InvestmentOpinion,
  StockAnalysisNote,
  StockAnalysisNoteStorageData,
  StockAnalysisNoteStorageLoadResult,
  StockAnalysisNoteStorageSaveResult,
} from '../types/stockAnalysisNote';

const VALID_INVESTMENT_OPINIONS: InvestmentOpinion[] = [
  'BUY',
  'HOLD',
  'SELL',
  'WATCH',
];

function isRecord(candidateValue: unknown): candidateValue is Record<string, unknown> {
  return (
    typeof candidateValue === 'object' &&
    candidateValue !== null &&
    !Array.isArray(candidateValue)
  );
}

function isInvestmentOpinion(
  candidateValue: unknown,
): candidateValue is InvestmentOpinion {
  return (
    typeof candidateValue === 'string' &&
    VALID_INVESTMENT_OPINIONS.some(
      (validInvestmentOpinion) => validInvestmentOpinion === candidateValue,
    )
  );
}

function isValidIsoDateString(candidateValue: unknown): candidateValue is string {
  if (typeof candidateValue !== 'string' || candidateValue.trim().length === 0) {
    return false;
  }

  const timestamp = Date.parse(candidateValue);

  if (!Number.isFinite(timestamp)) {
    return false;
  }

  try {
    return new Date(candidateValue).toISOString() === candidateValue;
  } catch {
    return false;
  }
}

function isValidTargetPrice(candidateValue: unknown): candidateValue is number | null {
  return (
    candidateValue === null ||
    (typeof candidateValue === 'number' &&
      Number.isFinite(candidateValue) &&
      Number.isInteger(candidateValue) &&
      candidateValue >= 1 &&
      candidateValue <= 1_000_000_000)
  );
}

function isValidMemo(candidateValue: unknown): candidateValue is string | null {
  return (
    candidateValue === null ||
    (typeof candidateValue === 'string' && candidateValue.length <= 2000)
  );
}

export function isValidStockAnalysisNote(
  candidateValue: unknown,
): candidateValue is StockAnalysisNote {
  if (!isRecord(candidateValue)) {
    return false;
  }

  return (
    typeof candidateValue.id === 'string' &&
    candidateValue.id.trim().length > 0 &&
    typeof candidateValue.stockName === 'string' &&
    candidateValue.stockName.trim().length > 0 &&
    candidateValue.stockName.length <= 50 &&
    isInvestmentOpinion(candidateValue.investmentOpinion) &&
    typeof candidateValue.investmentReason === 'string' &&
    candidateValue.investmentReason.trim().length >= 10 &&
    candidateValue.investmentReason.length <= 1000 &&
    isValidTargetPrice(candidateValue.targetPrice) &&
    isValidMemo(candidateValue.memo) &&
    isValidIsoDateString(candidateValue.createdAt) &&
    isValidIsoDateString(candidateValue.updatedAt)
  );
}

export function isValidStockAnalysisNoteStorageData(
  candidateValue: unknown,
): candidateValue is StockAnalysisNoteStorageData {
  if (!isRecord(candidateValue)) {
    return false;
  }

  if (candidateValue.schemaVersion !== STOCK_ANALYSIS_NOTE_SCHEMA_VERSION) {
    return false;
  }

  if (!Array.isArray(candidateValue.stockAnalysisNotes)) {
    return false;
  }

  const stockAnalysisNoteIds = new Set<string>();

  for (const candidateStockAnalysisNote of candidateValue.stockAnalysisNotes) {
    if (!isValidStockAnalysisNote(candidateStockAnalysisNote)) {
      return false;
    }

    if (stockAnalysisNoteIds.has(candidateStockAnalysisNote.id)) {
      return false;
    }

    stockAnalysisNoteIds.add(candidateStockAnalysisNote.id);
  }

  return true;
}

export function loadStockAnalysisNotes(): StockAnalysisNoteStorageLoadResult {
  try {
    const storedStockAnalysisNotes = window.localStorage.getItem(
      STOCK_ANALYSIS_NOTE_STORAGE_KEY,
    );

    if (storedStockAnalysisNotes === null) {
      return {
        stockAnalysisNotes: [],
        errorMessage: null,
      };
    }

    const parsedStorageData: unknown = JSON.parse(storedStockAnalysisNotes);

    if (!isValidStockAnalysisNoteStorageData(parsedStorageData)) {
      return {
        stockAnalysisNotes: [],
        errorMessage:
          '저장된 분석 노트 데이터의 형식이 올바르지 않아 빈 목록으로 시작합니다.',
      };
    }

    return {
      stockAnalysisNotes: parsedStorageData.stockAnalysisNotes,
      errorMessage: null,
    };
  } catch {
    return {
      stockAnalysisNotes: [],
      errorMessage: '저장된 분석 노트를 불러오지 못해 빈 목록으로 시작합니다.',
    };
  }
}

export function saveStockAnalysisNotes(
  stockAnalysisNotes: StockAnalysisNote[],
): StockAnalysisNoteStorageSaveResult {
  try {
    const storageData: StockAnalysisNoteStorageData = {
      schemaVersion: STOCK_ANALYSIS_NOTE_SCHEMA_VERSION,
      stockAnalysisNotes,
    };

    window.localStorage.setItem(
      STOCK_ANALYSIS_NOTE_STORAGE_KEY,
      JSON.stringify(storageData),
    );

    return {
      isSuccessful: true,
      errorMessage: null,
    };
  } catch {
    return {
      isSuccessful: false,
      errorMessage: '분석 노트를 브라우저 저장소에 저장하지 못했습니다.',
    };
  }
}
