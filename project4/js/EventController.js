/**
 * EventController
 * Manages all user interactions via event delegation on the grid container.
 * Does NOT attach listeners to individual cells.
 *
 * Edit modes:
 *   - Navigation mode (single click / arrow key): typing overwrites cell,
 *     arrow keys move between cells.
 *   - Edit mode (double click / F2): cursor moves inside text,
 *     arrow keys move the text cursor (default browser behaviour).
 */
const EventController = (() => {
  let gridContainer = null;
  let coordinateDisplay = null;
  let exportBtn = null;
  let exportCsvBtn = null;
  let validationMsg = null;
  let addRowsBtn = null;
  let addRowsInput = null;
  let addColsBtn = null;
  let addColsInput = null;

  // Track the currently active (editing) cell input
  let activeInput = null;
  let activeRow = null;
  let activeCol = null;

  /**
   * true  = Edit mode   (double-click / F2): arrow keys move text cursor
   * false = Navigation mode (single-click): arrow keys move between cells
   */
  let isEditMode = false;

  /**
   * Initialize event listeners.
   * @param {HTMLElement} container - The grid container element
   * @param {HTMLElement} coordDisplay - Element to show current coordinate
   * @param {HTMLElement} exportButton - Export (.xlsx) button element
   * @param {HTMLElement} validationMessage - Element to show validation messages
   * @param {HTMLElement} csvExportButton - Export (.csv) button element
   * @param {HTMLElement} addRowsButton - Add rows button
   * @param {HTMLInputElement} addRowsInputEl - Add rows number input
   * @param {HTMLElement} addColsButton - Add cols button
   * @param {HTMLInputElement} addColsInputEl - Add cols number input
   */
  function init(container, coordDisplay, exportButton, validationMessage, csvExportButton,
                addRowsButton, addRowsInputEl, addColsButton, addColsInputEl) {
    gridContainer = container;
    coordinateDisplay = coordDisplay;
    exportBtn = exportButton;
    exportCsvBtn = csvExportButton;
    validationMsg = validationMessage;
    addRowsBtn = addRowsButton;
    addRowsInput = addRowsInputEl;
    addColsBtn = addColsButton;
    addColsInput = addColsInputEl;

    // Event delegation: single click → navigation mode
    gridContainer.addEventListener('click', onGridClick);

    // Event delegation: double click → edit mode
    gridContainer.addEventListener('dblclick', onGridDblClick);

    // Event delegation: input changes (for live value capture)
    gridContainer.addEventListener('input', onGridInput);

    // Event delegation: keydown for navigation and commit
    gridContainer.addEventListener('keydown', onGridKeydown);

    // Excel export button
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        commitActiveInput();
        ExcelExporter.exportToXlsx();
      });
    }

    // CSV export button
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        commitActiveInput();
        ExcelExporter.exportToCsv();
      });
    }

    // Add rows button
    if (addRowsBtn) {
      addRowsBtn.addEventListener('click', () => {
        commitActiveInput();
        const count = parseInt(addRowsInput ? addRowsInput.value : '1', 10);
        const prevRows = SpreadsheetState.getRows();
        const result = SpreadsheetState.addRows(count);
        if (!result.success) {
          showValidation(result.error);
          return;
        }
        GridRenderer.appendRows(prevRows, count);
        hideValidation();
      });
    }

    // Add cols button
    if (addColsBtn) {
      addColsBtn.addEventListener('click', () => {
        commitActiveInput();
        const count = parseInt(addColsInput ? addColsInput.value : '1', 10);
        const prevCols = SpreadsheetState.getCols();
        const result = SpreadsheetState.addCols(count);
        if (!result.success) {
          showValidation(result.error);
          return;
        }
        GridRenderer.appendCols(prevCols, count);
        hideValidation();
      });
    }

    // Click outside grid to deselect
    document.addEventListener('click', onDocumentClick);
  }

  // ── Click handlers ──────────────────────────────────────────────────

  /**
   * Single click: enter navigation mode.
   * Focuses the cell and shows existing value in input, but keeps td focused.
   * @param {MouseEvent} e
   */
  function onGridClick(e) {
    // Ignore if this click is part of a double-click (handled by dblclick)
    const td = e.target.closest('td.data-cell');
    if (!td) return;

    const rowIndex = parseInt(td.dataset.rowIndex, 10);
    const colIndex = parseInt(td.dataset.colIndex, 10);

    // If we were in edit mode on a different cell, commit first
    if (activeInput && (activeRow !== rowIndex || activeCol !== colIndex)) {
      commitActiveInput();
      isEditMode = false;
    }

    // If clicking the same cell that is already in edit mode, do nothing
    if (isEditMode && activeRow === rowIndex && activeCol === colIndex) {
      return;
    }

    // Enter navigation mode for this cell
    isEditMode = false;
    focusCellNavMode(rowIndex, colIndex, td);
  }

  /**
   * Double click: enter edit mode.
   * Focuses the input element so arrow keys move the text cursor.
   * @param {MouseEvent} e
   */
  function onGridDblClick(e) {
    const td = e.target.closest('td.data-cell');
    if (!td) return;

    const rowIndex = parseInt(td.dataset.rowIndex, 10);
    const colIndex = parseInt(td.dataset.colIndex, 10);

    isEditMode = true;
    enterEditMode(td, rowIndex, colIndex);
  }

  // ── Input handler ───────────────────────────────────────────────────

  /**
   * Handle input events on cell inputs (event delegation).
   * @param {InputEvent} e
   */
  function onGridInput(e) {
    const input = e.target;
    if (!input.classList.contains('cell-input')) return;

    const td = input.closest('td.data-cell');
    if (!td) return;

    const rowIndex = parseInt(td.dataset.rowIndex, 10);
    const colIndex = parseInt(td.dataset.colIndex, 10);
    const value = input.value;

    // Validate length
    if (value.length > SpreadsheetState.MAX_CHAR_LENGTH) {
      input.value = value.slice(0, SpreadsheetState.MAX_CHAR_LENGTH);
      showValidation(`입력값이 ${SpreadsheetState.MAX_CHAR_LENGTH.toLocaleString()}자를 초과할 수 없습니다.`);
      return;
    }

    hideValidation();

    // Store value in state (plain text, no HTML interpretation)
    const result = SpreadsheetState.setCellValue(rowIndex, colIndex, input.value);
    if (!result.success) {
      showValidation(result.error);
    }
  }

  // ── Keydown handler ─────────────────────────────────────────────────

  /**
   * Handle keydown events on the grid (event delegation).
   * @param {KeyboardEvent} e
   */
  function onGridKeydown(e) {
    const target = e.target;
    const isCellInput = target.classList.contains('cell-input');
    const td = target.closest('td.data-cell');

    if (!td) return;

    const rowIndex = parseInt(td.dataset.rowIndex, 10);
    const colIndex = parseInt(td.dataset.colIndex, 10);

    // ── Enter: commit and move down ──────────────────────────────────
    if (e.key === 'Enter') {
      // During IME composition, let the browser complete the character first
      if (e.isComposing) return;
      e.preventDefault();
      commitActiveInput();
      isEditMode = false;
      navigateTo(rowIndex + 1, colIndex);
      return;
    }

    // ── Tab: commit and move right ───────────────────────────────────
    if (e.key === 'Tab') {
      e.preventDefault();
      commitActiveInput();
      isEditMode = false;
      navigateTo(rowIndex, colIndex + 1);
      return;
    }

    // ── Escape: revert and exit edit mode ────────────────────────────
    if (e.key === 'Escape') {
      // During IME composition, let the browser cancel the character first
      if (e.isComposing) return;
      e.preventDefault();
      if (isCellInput) {
        // Revert to stored value
        target.value = SpreadsheetState.getCellValue(rowIndex, colIndex);
        activeInput = null;
        activeRow = null;
        activeCol = null;
      }
      isEditMode = false;
      td.focus();
      return;
    }

    // ── Arrow keys ───────────────────────────────────────────────────
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' || e.key === 'ArrowRight') {

      if (isEditMode) {
        // Edit mode: let the browser handle cursor movement inside the input
        return;
      }

      // Navigation mode: commit and move to adjacent cell
      e.preventDefault();
      commitActiveInput();

      if (e.key === 'ArrowUp')    navigateTo(rowIndex - 1, colIndex);
      if (e.key === 'ArrowDown')  navigateTo(rowIndex + 1, colIndex);
      if (e.key === 'ArrowLeft')  navigateTo(rowIndex, colIndex - 1);
      if (e.key === 'ArrowRight') navigateTo(rowIndex, colIndex + 1);
      return;
    }

    // ── F2: enter edit mode (works regardless of whether input or td is focused) ──
    if (e.key === 'F2' && !isEditMode) {
      e.preventDefault();
      isEditMode = true;
      enterEditMode(td, rowIndex, colIndex);
      return;
    }

    // ── Delete / Backspace: clear entire cell in navigation mode ─────
    // In edit mode the browser handles character deletion normally.
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditMode) {
      e.preventDefault();
      SpreadsheetState.setCellValue(rowIndex, colIndex, '');
      GridRenderer.setCellDisplay(rowIndex, colIndex, '');
      // Also clear the active input element if present
      if (activeInput) activeInput.value = '';
      return;
    }

    // ── Printable character in navigation mode ───────────────────────
    // Overwrite the cell: clear existing value and let the browser/IME
    // insert the typed character naturally.
    // Do NOT call e.preventDefault() — that would break IME composition.
    // Do NOT write e.key into input.value — that would corrupt Korean first char.
    if (!isEditMode && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      prepareNavModeInput(td, rowIndex, colIndex);
      // Show the caret now that the user has started typing
      const inp = td.querySelector('.cell-input');
      if (inp) inp.style.caretColor = 'auto';
      // Do NOT return — let the keydown propagate so the browser inserts the char
    }
  }

  // ── Cell focus helpers ──────────────────────────────────────────────

  /**
   * Focus a cell in navigation mode:
   * - input receives DOM focus immediately (so IME can start composing from the first key)
   * - cursor is placed at the end of the existing value
   * - arrow keys still move between cells because isEditMode === false
   * @param {number} rowIndex
   * @param {number} colIndex
   * @param {HTMLElement} td
   */
  function focusCellNavMode(rowIndex, colIndex, td) {
    const prev = SpreadsheetState.getFocusedCell();
    const prevRow = prev ? prev.rowIndex : null;
    const prevCol = prev ? prev.colIndex : null;

    SpreadsheetState.setFocusedCell(rowIndex, colIndex);

    // Update coordinate display (synchronous, within 100ms)
    if (coordinateDisplay) {
      coordinateDisplay.textContent = CoordinateUtils.toCoordinate(rowIndex, colIndex);
    }

    GridRenderer.updateHeaderHighlight(rowIndex, colIndex);
    GridRenderer.updateCellFocus(prevRow, prevCol, rowIndex, colIndex);

    // Load stored value into the input
    const input = td.querySelector('.cell-input');
    if (input) {
      input.value = SpreadsheetState.getCellValue(rowIndex, colIndex);
    }

    // Track as active
    activeInput = input;
    activeRow = rowIndex;
    activeCol = colIndex;

    // Give DOM focus to the INPUT (not td) so that IME composition starts
    // correctly from the very first keystroke.
    // Arrow-key navigation still works because isEditMode === false.
    if (input) {
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    } else {
      td.focus();
    }
  }

  /**
   * Enter edit mode for a cell:
   * - input receives DOM focus
   * - cursor (caret) becomes visible
   * - cursor placed at end of text
   * @param {HTMLElement} td
   * @param {number} rowIndex
   * @param {number} colIndex
   */
  function enterEditMode(td, rowIndex, colIndex) {
    // Make sure cell is visually focused first
    const prev = SpreadsheetState.getFocusedCell();
    const prevRow = prev ? prev.rowIndex : null;
    const prevCol = prev ? prev.colIndex : null;

    SpreadsheetState.setFocusedCell(rowIndex, colIndex);

    if (coordinateDisplay) {
      coordinateDisplay.textContent = CoordinateUtils.toCoordinate(rowIndex, colIndex);
    }

    GridRenderer.updateHeaderHighlight(rowIndex, colIndex);
    GridRenderer.updateCellFocus(prevRow, prevCol, rowIndex, colIndex);

    const input = td.querySelector('.cell-input');
    if (!input) return;

    input.value = SpreadsheetState.getCellValue(rowIndex, colIndex);
    activeInput = input;
    activeRow = rowIndex;
    activeCol = colIndex;

    // Show the text cursor in edit mode
    input.style.caretColor = 'auto';

    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }

  /**
   * Prepare navigation-mode input: clear the cell value so the next typed
   * character overwrites it. The input already has DOM focus (given by
   * focusCellNavMode), so we only need to clear the value here.
   * We do NOT call input.focus() again — it is already focused.
   * @param {HTMLElement} td
   * @param {number} rowIndex
   * @param {number} colIndex
   */
  function prepareNavModeInput(td, rowIndex, colIndex) {
    const input = td.querySelector('.cell-input');
    if (!input) return;

    // Clear existing value (navigation-mode typing overwrites the cell)
    input.value = '';
    SpreadsheetState.setCellValue(rowIndex, colIndex, '');

    activeInput = input;
    activeRow = rowIndex;
    activeCol = colIndex;

    // input is already focused — do NOT call input.focus() here.
    // Calling focus() during a keydown event would restart the event cycle
    // and could still cause the first IME character to be lost.
    input.setSelectionRange(0, 0);
  }

  /**
   * Navigate to a cell by row/col, clamped to grid bounds.
   * @param {number} rowIndex
   * @param {number} colIndex
   */
  function navigateTo(rowIndex, colIndex) {
    const maxRow = SpreadsheetState.getRows() - 1;
    const maxCol = SpreadsheetState.getCols() - 1;

    rowIndex = Math.max(0, Math.min(rowIndex, maxRow));
    colIndex = Math.max(0, Math.min(colIndex, maxCol));

    const td = GridRenderer.getCellElement(rowIndex, colIndex);
    if (td) {
      isEditMode = false;
      focusCellNavMode(rowIndex, colIndex, td);
    }
  }

  /**
   * Commit the current active input value to state.
   */
  function commitActiveInput() {
    if (!activeInput) return;

    const value = activeInput.value;
    const result = SpreadsheetState.setCellValue(activeRow, activeCol, value);

    if (!result.success) {
      showValidation(result.error);
      activeInput.value = value.slice(0, SpreadsheetState.MAX_CHAR_LENGTH);
      SpreadsheetState.setCellValue(activeRow, activeCol, activeInput.value);
    } else {
      hideValidation();
    }

    activeInput = null;
    activeRow = null;
    activeCol = null;
  }

  /**
   * Handle clicks outside the grid to deselect.
   * @param {MouseEvent} e
   */
  function onDocumentClick(e) {
    if (gridContainer && !gridContainer.contains(e.target)) {
      commitActiveInput();
      isEditMode = false;
      const prev = SpreadsheetState.getFocusedCell();
      if (prev) {
        GridRenderer.updateCellFocus(prev.rowIndex, prev.colIndex, null, null);
        GridRenderer.updateHeaderHighlight(null, null);
        SpreadsheetState.setFocusedCell(null, null);
        if (coordinateDisplay) {
          coordinateDisplay.textContent = '—';
        }
      }
    }
  }

  /**
   * Show a validation message.
   * @param {string} message
   */
  function showValidation(message) {
    if (!validationMsg) return;
    validationMsg.textContent = message;
    validationMsg.style.display = 'block';
    clearTimeout(validationMsg._hideTimer);
    validationMsg._hideTimer = setTimeout(() => {
      validationMsg.style.display = 'none';
    }, 4000);
  }

  /**
   * Hide the validation message.
   */
  function hideValidation() {
    if (!validationMsg) return;
    validationMsg.style.display = 'none';
  }

  return { init };
})();
