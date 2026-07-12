import { useEffect, useRef, useState } from 'react';
import './App.css';
import StockAnalysisNoteForm from './components/StockAnalysisNoteForm';
import StockAnalysisNoteList from './components/StockAnalysisNoteList';
import type {
  CreateStockAnalysisNoteInput,
  StockAnalysisNote,
  StockAnalysisNoteStorageLoadResult,
  UpdateStockAnalysisNoteInput,
} from './types/stockAnalysisNote';
import {
  createStockAnalysisNote,
  updateStockAnalysisNote,
} from './utils/stockAnalysisNoteFactory';
import {
  loadStockAnalysisNotes,
  saveStockAnalysisNotes,
} from './utils/stockAnalysisNoteStorage';

function App() {
  const [initialStorageLoadResult] = useState<StockAnalysisNoteStorageLoadResult>(
    () => loadStockAnalysisNotes(),
  );
  const [stockAnalysisNotes, setStockAnalysisNotes] = useState<
    StockAnalysisNote[]
  >(initialStorageLoadResult.stockAnalysisNotes);
  const [editingStockAnalysisNoteId, setEditingStockAnalysisNoteId] = useState<
    string | null
  >(null);
  const [storageErrorMessage, setStorageErrorMessage] = useState<string | null>(
    initialStorageLoadResult.errorMessage,
  );
  const lastPersistedStockAnalysisNotesRef = useRef(stockAnalysisNotes);

  const editingStockAnalysisNote =
    stockAnalysisNotes.find(
      (stockAnalysisNote) =>
        stockAnalysisNote.id === editingStockAnalysisNoteId,
    ) ?? null;

  useEffect(() => {
    if (lastPersistedStockAnalysisNotesRef.current === stockAnalysisNotes) {
      return;
    }

    const storageSaveResult = saveStockAnalysisNotes(stockAnalysisNotes);

    lastPersistedStockAnalysisNotesRef.current = stockAnalysisNotes;
    setStorageErrorMessage(storageSaveResult.errorMessage);
  }, [stockAnalysisNotes]);

  function handleCreateStockAnalysisNote(
    input: CreateStockAnalysisNoteInput,
  ): void {
    const newStockAnalysisNote = createStockAnalysisNote(input);

    setStockAnalysisNotes((previousStockAnalysisNotes) => [
      newStockAnalysisNote,
      ...previousStockAnalysisNotes,
    ]);
    setEditingStockAnalysisNoteId(null);
  }

  function handleStartEditingStockAnalysisNote(
    stockAnalysisNoteId: string,
  ): void {
    const hasMatchingStockAnalysisNote = stockAnalysisNotes.some(
      (stockAnalysisNote) => stockAnalysisNote.id === stockAnalysisNoteId,
    );

    setEditingStockAnalysisNoteId(
      hasMatchingStockAnalysisNote ? stockAnalysisNoteId : null,
    );
  }

  function handleUpdateStockAnalysisNote(
    stockAnalysisNoteId: string,
    input: UpdateStockAnalysisNoteInput,
  ): void {
    setStockAnalysisNotes((previousStockAnalysisNotes) =>
      previousStockAnalysisNotes.map((stockAnalysisNote) =>
        stockAnalysisNote.id === stockAnalysisNoteId
          ? updateStockAnalysisNote(stockAnalysisNote, input)
          : stockAnalysisNote,
      ),
    );
    setEditingStockAnalysisNoteId(null);
  }

  function handleCancelEditingStockAnalysisNote(): void {
    setEditingStockAnalysisNoteId(null);
  }

  function handleDeleteStockAnalysisNote(stockAnalysisNoteId: string): void {
    const stockAnalysisNoteToDelete = stockAnalysisNotes.find(
      (stockAnalysisNote) => stockAnalysisNote.id === stockAnalysisNoteId,
    );

    if (!stockAnalysisNoteToDelete) {
      return;
    }

    const shouldDeleteStockAnalysisNote = window.confirm(
      `"${stockAnalysisNoteToDelete.stockName}" 분석 노트를 삭제하시겠습니까? 삭제한 데이터는 현재 실행 중인 화면에서 복구할 수 없습니다.`,
    );

    if (!shouldDeleteStockAnalysisNote) {
      return;
    }

    setStockAnalysisNotes((previousStockAnalysisNotes) =>
      previousStockAnalysisNotes.filter(
        (stockAnalysisNote) => stockAnalysisNote.id !== stockAnalysisNoteId,
      ),
    );

    if (editingStockAnalysisNoteId === stockAnalysisNoteId) {
      setEditingStockAnalysisNoteId(null);
    }
  }

  return (
    <main className="app">
      <header className="app__header">
        <h1>주식 관심종목 분석 노트</h1>
        <p className="app__description">
          관심 종목의 투자 의견과 판단 근거를 기록하고 검토합니다.
        </p>
      </header>

      {storageErrorMessage ? (
        <section
          className="storage-error-message"
          role="alert"
          aria-live="assertive"
        >
          <strong>저장소 오류</strong>
          <p>{storageErrorMessage}</p>
        </section>
      ) : null}

      <StockAnalysisNoteForm
        editingStockAnalysisNote={editingStockAnalysisNote}
        onCreateStockAnalysisNote={handleCreateStockAnalysisNote}
        onUpdateStockAnalysisNote={handleUpdateStockAnalysisNote}
        onCancelEditing={handleCancelEditingStockAnalysisNote}
      />

      <StockAnalysisNoteList
        stockAnalysisNotes={stockAnalysisNotes}
        editingStockAnalysisNoteId={editingStockAnalysisNoteId}
        onEditStockAnalysisNote={handleStartEditingStockAnalysisNote}
        onDeleteStockAnalysisNote={handleDeleteStockAnalysisNote}
      />
    </main>
  );
}

export default App;
