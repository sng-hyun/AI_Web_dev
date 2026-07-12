import type {
  InvestmentOpinion,
  StockAnalysisNoteFormErrors,
  StockAnalysisNoteFormValues,
  StockAnalysisNoteValidationResult,
} from '../types/stockAnalysisNote';

const INVESTMENT_OPINIONS: InvestmentOpinion[] = ['BUY', 'HOLD', 'SELL', 'WATCH'];
const TARGET_PRICE_PATTERN = /^\d+$/;

function isValidInvestmentOpinion(
  investmentOpinion: StockAnalysisNoteFormValues['investmentOpinion'],
): investmentOpinion is InvestmentOpinion {
  return INVESTMENT_OPINIONS.some(
    (validInvestmentOpinion) => validInvestmentOpinion === investmentOpinion,
  );
}

function isValidTargetPrice(targetPrice: string): boolean {
  const trimmedTargetPrice = targetPrice.trim();

  if (trimmedTargetPrice === '') {
    return true;
  }

  if (!TARGET_PRICE_PATTERN.test(trimmedTargetPrice)) {
    return false;
  }

  const numericTargetPrice = Number(trimmedTargetPrice);

  return (
    Number.isFinite(numericTargetPrice) &&
    Number.isInteger(numericTargetPrice) &&
    numericTargetPrice >= 1 &&
    numericTargetPrice <= 1_000_000_000
  );
}

export function validateStockAnalysisNoteForm(
  formValues: StockAnalysisNoteFormValues,
): StockAnalysisNoteValidationResult {
  const errors: StockAnalysisNoteFormErrors = {};
  const trimmedStockName = formValues.stockName.trim();
  const trimmedInvestmentReason = formValues.investmentReason.trim();

  if (trimmedStockName.length === 0) {
    errors.stockName = '종목명을 입력해 주세요.';
  } else if (trimmedStockName.length > 50) {
    errors.stockName = '종목명은 50자 이하로 입력해 주세요.';
  }

  if (!isValidInvestmentOpinion(formValues.investmentOpinion)) {
    errors.investmentOpinion = '투자 의견을 선택해 주세요.';
  }

  if (trimmedInvestmentReason.length === 0) {
    errors.investmentReason = '투자 판단 근거를 입력해 주세요.';
  } else if (trimmedInvestmentReason.length < 10) {
    errors.investmentReason = '투자 판단 근거는 10자 이상 입력해 주세요.';
  } else if (trimmedInvestmentReason.length > 1000) {
    errors.investmentReason =
      '투자 판단 근거는 1,000자 이하로 입력해 주세요.';
  }

  if (!isValidTargetPrice(formValues.targetPrice)) {
    errors.targetPrice =
      '목표가는 1 이상 10억 이하의 정수로 입력해 주세요.';
  }

  if (formValues.memo.trim().length > 2000) {
    errors.memo = '메모는 2,000자 이하로 입력해 주세요.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
