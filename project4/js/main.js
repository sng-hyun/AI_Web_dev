/**
 * main.js
 * Entry point: initializes the spreadsheet application on DOMContentLoaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  const gridContainer = document.getElementById('grid-container');
  const coordinateDisplay = document.getElementById('coordinate-display');
  const exportBtn = document.getElementById('export-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const validationMsg = document.getElementById('validation-message');
  const addRowsBtn = document.getElementById('add-rows-btn');
  const addRowsInput = document.getElementById('add-rows-input');
  const addColsBtn = document.getElementById('add-cols-btn');
  const addColsInput = document.getElementById('add-cols-input');

  // 1. Render the grid
  GridRenderer.render(gridContainer);

  // 2. Initialize event controller
  EventController.init(
    gridContainer, coordinateDisplay,
    exportBtn, validationMsg, exportCsvBtn,
    addRowsBtn, addRowsInput, addColsBtn, addColsInput
  );
});
