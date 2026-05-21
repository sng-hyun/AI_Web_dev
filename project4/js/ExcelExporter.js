/**
 * ExcelExporter
 * Exports the spreadsheet data as an Excel .xlsx file using SheetJS.
 */
const ExcelExporter = (() => {
  /**
   * Generate a filename with the given extension.
   * Format: spreadsheet-yyyyMMdd-HHmmss.<ext>
   * @param {string} ext - File extension without dot (e.g. 'xlsx', 'csv')
   * @returns {string}
   */
  function generateFilename(ext) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const yyyy = now.getFullYear();
    const MM = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const HH = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    return `spreadsheet-${yyyy}${MM}${dd}-${HH}${mm}${ss}.${ext}`;
  }

  /**
   * Show a visible error message in the UI.
   * @param {string} message
   */
  function showError(message) {
    let errorEl = document.getElementById('export-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.id = 'export-error';
      errorEl.className = 'export-error';
      const toolbar = document.querySelector('.toolbar');
      if (toolbar) {
        toolbar.appendChild(errorEl);
      } else {
        document.body.appendChild(errorEl);
      }
    }
    errorEl.textContent = message;
    errorEl.style.display = 'block';

    // Auto-hide after 5 seconds
    clearTimeout(errorEl._hideTimer);
    errorEl._hideTimer = setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }

  /**
   * Export the current spreadsheet data as an .xlsx file.
   */
  function exportToXlsx() {
    // Check if SheetJS is loaded
    if (typeof XLSX === 'undefined') {
      showError('SheetJS 라이브러리가 로드되지 않았습니다. 내보내기를 수행할 수 없습니다.');
      return;
    }

    try {
      const matrix = DataCollector.to2DMatrix();

      // Build worksheet from 2D array (empty cells become empty strings)
      const ws = XLSX.utils.aoa_to_sheet(matrix);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      // Generate filename
      const filename = generateFilename('xlsx');

      // Trigger download
      XLSX.writeFile(wb, filename);
    } catch (err) {
      showError(`내보내기 중 오류가 발생했습니다: ${err.message}`);
    }
  }

  /**
   * Escape a single cell value for CSV (RFC 4180).
   * Wraps in double-quotes if the value contains comma, newline, or double-quote.
   * @param {string} value
   * @returns {string}
   */
  function escapeCsvCell(value) {
    if (value === '' || value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /**
   * Export the current spreadsheet data as a .csv file (no external library needed).
   */
  function exportToCsv() {
    try {
      const matrix = DataCollector.to2DMatrix();

      // Build CSV string
      const csvContent = matrix
        .map(row => row.map(escapeCsvCell).join(','))
        .join('\r\n');

      // Create Blob with UTF-8 BOM for Excel compatibility
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

      // Generate filename
      const filename = generateFilename('csv');

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      showError(`CSV 내보내기 중 오류가 발생했습니다: ${err.message}`);
    }
  }

  return { exportToXlsx, exportToCsv };
})();
