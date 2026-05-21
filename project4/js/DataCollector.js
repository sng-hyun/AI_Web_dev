/**
 * DataCollector
 * Collects spreadsheet data into structured JSON and 2D matrix formats.
 */
const DataCollector = (() => {
  /**
   * Returns a JSON cell list: array of { coordinate, row, col, value } for non-empty cells.
   * @returns {Array<{ coordinate: string, row: number, col: number, value: string }>}
   */
  function toJSONCellList() {
    const allData = SpreadsheetState.getAllCellData();
    return Object.keys(allData).map(key => {
      const { rowIndex, colIndex } = CoordinateUtils.parseKey(key);
      return {
        coordinate: CoordinateUtils.toCoordinate(rowIndex, colIndex),
        row: rowIndex,
        col: colIndex,
        value: allData[key],
      };
    });
  }

  /**
   * Returns a 2D matrix (array of arrays) representing the full grid.
   * Empty cells are represented as empty strings.
   * @returns {string[][]}
   */
  function to2DMatrix() {
    const rows = SpreadsheetState.getRows();
    const cols = SpreadsheetState.getCols();
    const matrix = [];

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push(SpreadsheetState.getCellValue(r, c));
      }
      matrix.push(row);
    }

    return matrix;
  }

  return { toJSONCellList, to2DMatrix };
})();
