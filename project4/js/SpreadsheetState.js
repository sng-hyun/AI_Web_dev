/**
 * SpreadsheetState
 * Manages in-memory state for the spreadsheet grid.
 */
const SpreadsheetState = (() => {
  const DEFAULT_ROWS = 20;
  const DEFAULT_COLS = 10;
  const MAX_CHAR_LENGTH = 10000;

  let rows = DEFAULT_ROWS;
  let cols = DEFAULT_COLS;

  // Sparse object: key = "rowIndex,colIndex", value = string
  let cellData = {};

  // Currently focused cell { rowIndex, colIndex } or null
  let focusedCell = null;

  function getRows() { return rows; }
  function getCols() { return cols; }

  /**
   * Get the value of a cell. Returns empty string if not set.
   * @param {number} rowIndex
   * @param {number} colIndex
   * @returns {string}
   */
  function getCellValue(rowIndex, colIndex) {
    const key = CoordinateUtils.toKey(rowIndex, colIndex);
    return cellData[key] !== undefined ? cellData[key] : '';
  }

  /**
   * Set the value of a cell.
   * Returns { success: boolean, error?: string }
   * @param {number} rowIndex
   * @param {number} colIndex
   * @param {string} value
   */
  function setCellValue(rowIndex, colIndex, value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    if (value.length > MAX_CHAR_LENGTH) {
      return { success: false, error: `입력값이 ${MAX_CHAR_LENGTH.toLocaleString()}자를 초과할 수 없습니다.` };
    }
    const key = CoordinateUtils.toKey(rowIndex, colIndex);
    if (value === '') {
      delete cellData[key];
    } else {
      cellData[key] = value;
    }
    return { success: true };
  }

  /**
   * Get all cell data as a sparse object copy.
   * @returns {Object}
   */
  function getAllCellData() {
    return Object.assign({}, cellData);
  }

  /**
   * Set the currently focused cell.
   * @param {number|null} rowIndex
   * @param {number|null} colIndex
   */
  function setFocusedCell(rowIndex, colIndex) {
    if (rowIndex === null || colIndex === null) {
      focusedCell = null;
    } else {
      focusedCell = { rowIndex, colIndex };
    }
  }

  /**
   * Get the currently focused cell.
   * @returns {{ rowIndex: number, colIndex: number } | null}
   */
  function getFocusedCell() {
    return focusedCell;
  }

  /**
   * Add rows to the grid.
   * @param {number} count - Number of rows to add (must be >= 1)
   * @returns {{ success: boolean, error?: string, newRows: number }}
   */
  function addRows(count) {
    if (!Number.isInteger(count) || count < 1) {
      return { success: false, error: '추가할 행 수는 1 이상의 정수여야 합니다.' };
    }
    if (count > 100) {
      return { success: false, error: '한 번에 최대 100행까지 추가할 수 있습니다.' };
    }
    rows += count;
    return { success: true, newRows: rows };
  }

  /**
   * Add columns to the grid.
   * @param {number} count - Number of columns to add (must be >= 1)
   * @returns {{ success: boolean, error?: string, newCols: number }}
   */
  function addCols(count) {
    if (!Number.isInteger(count) || count < 1) {
      return { success: false, error: '추가할 열 수는 1 이상의 정수여야 합니다.' };
    }
    if (count > 100) {
      return { success: false, error: '한 번에 최대 100열까지 추가할 수 있습니다.' };
    }
    cols += count;
    return { success: true, newCols: cols };
  }

  /**
   * Reset all cell data.
   */
  function reset() {
    cellData = {};
    focusedCell = null;
  }

  return {
    getRows,
    getCols,
    getCellValue,
    setCellValue,
    getAllCellData,
    setFocusedCell,
    getFocusedCell,
    addRows,
    addCols,
    reset,
    MAX_CHAR_LENGTH,
  };
})();
