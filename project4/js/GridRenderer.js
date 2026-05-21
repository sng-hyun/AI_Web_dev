/**
 * GridRenderer
 * Responsible for building and updating the spreadsheet grid DOM.
 */
const GridRenderer = (() => {
  let tableEl = null;
  let colHeaderCells = []; // th elements for column headers (index 0 = row-header corner)
  let rowHeaderCells = []; // th elements for row headers

  /**
   * Build the full grid table and append it to the container.
   * @param {HTMLElement} container
   */
  function render(container) {
    const rows = SpreadsheetState.getRows();
    const cols = SpreadsheetState.getCols();

    // Clear container
    container.textContent = '';

    tableEl = document.createElement('table');
    tableEl.className = 'spreadsheet-table';
    tableEl.setAttribute('role', 'grid');

    colHeaderCells = [];
    rowHeaderCells = [];

    // ── Column header row ──────────────────────────────────────────────
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Corner cell (top-left blank)
    const cornerTh = document.createElement('th');
    cornerTh.className = 'header-cell corner-cell';
    cornerTh.setAttribute('aria-label', 'corner');
    headerRow.appendChild(cornerTh);
    colHeaderCells.push(cornerTh); // index 0 = corner

    for (let c = 0; c < cols; c++) {
      const th = document.createElement('th');
      th.className = 'header-cell col-header';
      th.textContent = CoordinateUtils.colIndexToLetter(c);
      th.dataset.colIndex = c;
      headerRow.appendChild(th);
      colHeaderCells.push(th); // index c+1
    }

    thead.appendChild(headerRow);
    tableEl.appendChild(thead);

    // ── Data rows ──────────────────────────────────────────────────────
    const tbody = document.createElement('tbody');

    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr');
      tr.dataset.rowIndex = r;

      // Row header
      const rowTh = document.createElement('th');
      rowTh.className = 'header-cell row-header';
      rowTh.textContent = r + 1;
      rowTh.dataset.rowIndex = r;
      tr.appendChild(rowTh);
      rowHeaderCells.push(rowTh);

      // Data cells
      for (let c = 0; c < cols; c++) {
        const td = document.createElement('td');
        td.className = 'data-cell';
        td.dataset.rowIndex = r;
        td.dataset.colIndex = c;
        td.setAttribute('tabindex', '0');
        td.setAttribute('role', 'gridcell');
        td.setAttribute('aria-label', CoordinateUtils.toCoordinate(r, c));

        // Inner input for editing
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'cell-input';
        input.setAttribute('maxlength', SpreadsheetState.MAX_CHAR_LENGTH);
        input.setAttribute('aria-hidden', 'true');
        input.tabIndex = -1;
        td.appendChild(input);

        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

    tableEl.appendChild(tbody);
    container.appendChild(tableEl);
  }

  /**
   * Update the highlight on row/column headers based on the focused cell.
   * @param {number|null} rowIndex
   * @param {number|null} colIndex
   */
  function updateHeaderHighlight(rowIndex, colIndex) {
    // Remove all existing highlights
    colHeaderCells.forEach(th => th.classList.remove('header-active'));
    rowHeaderCells.forEach(th => th.classList.remove('header-active'));

    if (rowIndex === null || colIndex === null) return;

    // Highlight column header (colHeaderCells[0] is corner, so col c is at index c+1)
    if (colHeaderCells[colIndex + 1]) {
      colHeaderCells[colIndex + 1].classList.add('header-active');
    }
    // Highlight row header
    if (rowHeaderCells[rowIndex]) {
      rowHeaderCells[rowIndex].classList.add('header-active');
    }
  }

  /**
   * Set or remove the focused visual state on a cell td element.
   * @param {number|null} prevRow
   * @param {number|null} prevCol
   * @param {number|null} nextRow
   * @param {number|null} nextCol
   */
  function updateCellFocus(prevRow, prevCol, nextRow, nextCol) {
    if (prevRow !== null && prevCol !== null) {
      const prevTd = getCellElement(prevRow, prevCol);
      if (prevTd) prevTd.classList.remove('cell-focused');
    }
    if (nextRow !== null && nextCol !== null) {
      const nextTd = getCellElement(nextRow, nextCol);
      if (nextTd) nextTd.classList.add('cell-focused');
    }
  }

  /**
   * Get the td element for a given row/col.
   * @param {number} rowIndex
   * @param {number} colIndex
   * @returns {HTMLElement|null}
   */
  function getCellElement(rowIndex, colIndex) {
    if (!tableEl) return null;
    return tableEl.querySelector(
      `td[data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`
    );
  }

  /**
   * Update the displayed value of a cell (uses textContent via input.value).
   * @param {number} rowIndex
   * @param {number} colIndex
   * @param {string} value
   */
  function setCellDisplay(rowIndex, colIndex, value) {
    const td = getCellElement(rowIndex, colIndex);
    if (!td) return;
    const input = td.querySelector('.cell-input');
    if (input) {
      input.value = value;
    }
  }

  /**
   * Create a single data cell <td> element.
   * @param {number} rowIndex
   * @param {number} colIndex
   * @returns {HTMLTableCellElement}
   */
  function createDataCell(rowIndex, colIndex) {
    const td = document.createElement('td');
    td.className = 'data-cell';
    td.dataset.rowIndex = rowIndex;
    td.dataset.colIndex = colIndex;
    td.setAttribute('tabindex', '0');
    td.setAttribute('role', 'gridcell');
    td.setAttribute('aria-label', CoordinateUtils.toCoordinate(rowIndex, colIndex));

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'cell-input';
    input.setAttribute('maxlength', SpreadsheetState.MAX_CHAR_LENGTH);
    input.setAttribute('aria-hidden', 'true');
    input.tabIndex = -1;
    td.appendChild(input);

    return td;
  }

  /**
   * Append new rows to the bottom of the grid (DOM only, state already updated).
   * @param {number} startRowIndex - First new row index (0-based)
   * @param {number} count - Number of rows to append
   */
  function appendRows(startRowIndex, count) {
    if (!tableEl) return;
    const tbody = tableEl.querySelector('tbody');
    if (!tbody) return;

    const cols = SpreadsheetState.getCols();

    for (let r = startRowIndex; r < startRowIndex + count; r++) {
      const tr = document.createElement('tr');
      tr.dataset.rowIndex = r;

      // Row header
      const rowTh = document.createElement('th');
      rowTh.className = 'header-cell row-header';
      rowTh.textContent = r + 1;
      rowTh.dataset.rowIndex = r;
      tr.appendChild(rowTh);
      rowHeaderCells.push(rowTh);

      // Data cells
      for (let c = 0; c < cols; c++) {
        tr.appendChild(createDataCell(r, c));
      }

      tbody.appendChild(tr);
    }
  }

  /**
   * Append new columns to the right of the grid (DOM only, state already updated).
   * @param {number} startColIndex - First new column index (0-based)
   * @param {number} count - Number of columns to append
   */
  function appendCols(startColIndex, count) {
    if (!tableEl) return;
    const thead = tableEl.querySelector('thead');
    const tbody = tableEl.querySelector('tbody');
    if (!thead || !tbody) return;

    const headerRow = thead.querySelector('tr');
    const rows = SpreadsheetState.getRows();

    // Add column header cells
    for (let c = startColIndex; c < startColIndex + count; c++) {
      const th = document.createElement('th');
      th.className = 'header-cell col-header';
      th.textContent = CoordinateUtils.colIndexToLetter(c);
      th.dataset.colIndex = c;
      headerRow.appendChild(th);
      colHeaderCells.push(th); // colHeaderCells[0] = corner, so push appends correctly
    }

    // Add data cells to each existing row
    const bodyRows = tbody.querySelectorAll('tr');
    bodyRows.forEach((tr, rIdx) => {
      for (let c = startColIndex; c < startColIndex + count; c++) {
        tr.appendChild(createDataCell(rIdx, c));
      }
    });
  }

  return {
    render,
    updateHeaderHighlight,
    updateCellFocus,
    getCellElement,
    setCellDisplay,
    appendRows,
    appendCols,
  };
})();
