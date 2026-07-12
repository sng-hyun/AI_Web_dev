import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { INVESTMENT_OPINION_OPTIONS } from '../constants/investmentOpinionOptions';
import type {
  CreateStockAnalysisNoteInput,
  StockAnalysisNote,
  StockAnalysisNoteFormErrors,
  StockAnalysisNoteFormValues,
  UpdateStockAnalysisNoteInput,
} from '../types/stockAnalysisNote';
import {
  INITIAL_STOCK_ANALYSIS_NOTE_FORM_VALUES,
  mapStockAnalysisNoteToFormValues,
  normalizeStockAnalysisNoteFormValues,
} from '../utils/stockAnalysisNoteFormMapper';
import { validateStockAnalysisNoteForm } from '../utils/stockAnalysisNoteValidation';
import ValidationMessage from './ValidationMessage';

interface StockAnalysisNoteFormProps {
  editingStockAnalysisNote: StockAnalysisNote | null;
  onCreateStockAnalysisNote: (input: CreateStockAnalysisNoteInput) => void;
  onUpdateStockAnalysisNote: (
    stockAnalysisNoteId: string,
    input: UpdateStockAnalysisNoteInput,
  ) => void;
  onCancelEditing: () => void;
}

export default function StockAnalysisNoteForm({
  editingStockAnalysisNote,
  onCreateStockAnalysisNote,
  onUpdateStockAnalysisNote,
  onCancelEditing,
}: StockAnalysisNoteFormProps) {
  const [formValues, setFormValues] = useState<StockAnalysisNoteFormValues>(
    INITIAL_STOCK_ANALYSIS_NOTE_FORM_VALUES,
  );
  const [formErrors, setFormErrors] = useState<StockAnalysisNoteFormErrors>({});
  const isEditing = editingStockAnalysisNote !== null;

  useEffect(() => {
    if (editingStockAnalysisNote === null) {
      setFormValues(INITIAL_STOCK_ANALYSIS_NOTE_FORM_VALUES);
      setFormErrors({});
      return;
    }

    setFormValues(mapStockAnalysisNoteToFormValues(editingStockAnalysisNote));
    setFormErrors({});
  }, [editingStockAnalysisNote]);

  function handleFormValueChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ): void {
    const fieldName = event.target.name as keyof StockAnalysisNoteFormValues;
    const fieldValue = event.target.value;

    setFormValues((previousFormValues) => ({
      ...previousFormValues,
      [fieldName]: fieldValue,
    }));

    setFormErrors((previousFormErrors) => {
      const { [fieldName]: removedError, ...remainingFormErrors } =
        previousFormErrors;

      void removedError;

      return remainingFormErrors;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const validationResult = validateStockAnalysisNoteForm(formValues);
    setFormErrors(validationResult.errors);

    if (!validationResult.isValid) {
      return;
    }

    const normalizedFormValues =
      normalizeStockAnalysisNoteFormValues(formValues);

    if (normalizedFormValues === null) {
      setFormErrors({
        investmentOpinion: '투자 의견을 선택해 주세요.',
      });
      return;
    }

    if (isEditing) {
      onUpdateStockAnalysisNote(
        editingStockAnalysisNote.id,
        normalizedFormValues,
      );
    } else {
      onCreateStockAnalysisNote(normalizedFormValues);
    }

    setFormValues(INITIAL_STOCK_ANALYSIS_NOTE_FORM_VALUES);
    setFormErrors({});
  }

  function handleCancelEditing(): void {
    onCancelEditing();
    setFormValues(INITIAL_STOCK_ANALYSIS_NOTE_FORM_VALUES);
    setFormErrors({});
  }

  return (
    <form
      className={
        isEditing
          ? 'stock-analysis-note-form stock-analysis-note-form--editing'
          : 'stock-analysis-note-form'
      }
      onSubmit={handleSubmit}
      noValidate
    >
      <h2 className="stock-analysis-note-form__title">
        {isEditing ? '관심종목 분석 노트 수정' : '관심종목 분석 노트 등록'}
      </h2>

      {isEditing ? (
        <p className="stock-analysis-note-form__mode-description">
          {editingStockAnalysisNote.stockName} 분석 노트를 수정하고 있습니다.
        </p>
      ) : null}

      <div className="form-field">
        <label htmlFor="stock-name">종목명</label>
        <input
          id="stock-name"
          name="stockName"
          type="text"
          maxLength={50}
          value={formValues.stockName}
          onChange={handleFormValueChange}
          aria-invalid={Boolean(formErrors.stockName)}
          aria-describedby="stock-name-error"
        />
        <ValidationMessage
          message={formErrors.stockName}
          messageId="stock-name-error"
        />
      </div>

      <div className="form-field">
        <label htmlFor="investment-opinion">투자 의견</label>
        <select
          id="investment-opinion"
          name="investmentOpinion"
          value={formValues.investmentOpinion}
          onChange={handleFormValueChange}
          aria-invalid={Boolean(formErrors.investmentOpinion)}
          aria-describedby="investment-opinion-error"
        >
          <option value="">투자 의견을 선택해 주세요.</option>
          {INVESTMENT_OPINION_OPTIONS.map((investmentOpinionOption) => (
            <option
              key={investmentOpinionOption.value}
              value={investmentOpinionOption.value}
            >
              {investmentOpinionOption.label}
            </option>
          ))}
        </select>
        <ValidationMessage
          message={formErrors.investmentOpinion}
          messageId="investment-opinion-error"
        />
      </div>

      <div className="form-field">
        <label htmlFor="investment-reason">투자 판단 근거</label>
        <textarea
          id="investment-reason"
          name="investmentReason"
          maxLength={1000}
          value={formValues.investmentReason}
          onChange={handleFormValueChange}
          aria-invalid={Boolean(formErrors.investmentReason)}
          aria-describedby="investment-reason-error"
        />
        <ValidationMessage
          message={formErrors.investmentReason}
          messageId="investment-reason-error"
        />
      </div>

      <div className="form-field">
        <label htmlFor="target-price">목표가</label>
        <input
          id="target-price"
          name="targetPrice"
          type="number"
          min={1}
          max={1000000000}
          step={1}
          value={formValues.targetPrice}
          onChange={handleFormValueChange}
          aria-invalid={Boolean(formErrors.targetPrice)}
          aria-describedby="target-price-description target-price-error"
        />
        <p id="target-price-description" className="form-field__description">
          대한민국 원화 기준의 정수를 입력해 주세요.
        </p>
        <ValidationMessage
          message={formErrors.targetPrice}
          messageId="target-price-error"
        />
      </div>

      <div className="form-field">
        <label htmlFor="memo">메모</label>
        <textarea
          id="memo"
          name="memo"
          maxLength={2000}
          value={formValues.memo}
          onChange={handleFormValueChange}
          aria-invalid={Boolean(formErrors.memo)}
          aria-describedby="memo-error"
        />
        <ValidationMessage message={formErrors.memo} messageId="memo-error" />
      </div>

      <div className="stock-analysis-note-form__actions">
        <button
          type="submit"
          className="stock-analysis-note-form__submit-button"
        >
          {isEditing ? '수정 내용 저장' : '분석 노트 등록'}
        </button>

        {isEditing ? (
          <button
            type="button"
            className="stock-analysis-note-form__cancel-button"
            onClick={handleCancelEditing}
          >
            수정 취소
          </button>
        ) : null}
      </div>
    </form>
  );
}
