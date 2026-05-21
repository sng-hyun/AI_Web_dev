/**
 * CoordinateUtils
 * Utility functions for converting between row/col indices and spreadsheet coordinates.
 */
const CoordinateUtils = (() => {
  /**
   * Convert a zero-based column index to a letter (0 -> 'A', 1 -> 'B', ...)
   * @param {number} colIndex
   * @returns {string}
   */
  function colIndexToLetter(colIndex) {
    let result = '';
    let n = colIndex;
    do {
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return result;
  }

  /**
   * Convert a zero-based row index and col index to a coordinate string (e.g., "A1")
   * @param {number} rowIndex
   * @param {number} colIndex
   * @returns {string}
   */
  function toCoordinate(rowIndex, colIndex) {
    return `${colIndexToLetter(colIndex)}${rowIndex + 1}`;
  }

  /**
   * Parse a cell key "rowIndex,colIndex" into an object
   * @param {string} key
   * @returns {{ rowIndex: number, colIndex: number }}
   */
  function parseKey(key) {
    const [r, c] = key.split(',').map(Number);
    return { rowIndex: r, colIndex: c };
  }

  /**
   * Create a cell key from row and col indices
   * @param {number} rowIndex
   * @param {number} colIndex
   * @returns {string}
   */
  function toKey(rowIndex, colIndex) {
    return `${rowIndex},${colIndex}`;
  }

  return { colIndexToLetter, toCoordinate, parseKey, toKey };
})();
