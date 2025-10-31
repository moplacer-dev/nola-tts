const path = require('path');
const XLSX = require('xlsx');

// Path to Excel file
const EXCEL_FILE_PATH = path.join(__dirname, '../../hlp/hlp_module_data.xlsx');

console.log('Examining Excel file structure...\n');

// Read Excel file
const workbook = XLSX.readFile(EXCEL_FILE_PATH);
const sessionsSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('session'));
const sheet = workbook.Sheets[sessionsSheetName];

console.log(`Sheet: ${sessionsSheetName}`);
console.log(`Range: ${sheet['!ref']}`);
console.log(`Total Merged Ranges: ${(sheet['!merges'] || []).length}\n`);

// Find Weather v1.1, Session 1 rows
console.log('Looking for Weather v1.1, Session 1 data...\n');

const range = XLSX.utils.decode_range(sheet['!ref']);

// Find the row with Weather v1.1
for (let row = 0; row <= Math.min(range.e.r, 50); row++) {
  const moduleCell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
  const sessionCell = sheet[XLSX.utils.encode_cell({ r: row, c: 1 })];

  if (moduleCell && moduleCell.v === 'Weather v1.1' && sessionCell && sessionCell.v === 1) {
    console.log(`Found Weather v1.1, Session 1 at row ${row}\n`);

    // Print all cells in this row
    for (let col = 0; col <= Math.min(range.e.c, 10); col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = sheet[cellAddr];
      const colName = XLSX.utils.encode_col(col);

      console.log(`Column ${colName} (${cellAddr}):`);
      if (cell) {
        console.log(`  Value: "${cell.v}"`);
        console.log(`  Type: ${cell.t}`);
      } else {
        console.log(`  Value: <empty>`);
      }
      console.log('');
    }

    // Check merged ranges that include this row
    console.log('Merged ranges including this row:');
    const merges = sheet['!merges'] || [];
    for (const merge of merges) {
      if (row >= merge.s.r && row <= merge.e.r) {
        console.log(`  ${XLSX.utils.encode_cell(merge.s)} to ${XLSX.utils.encode_cell(merge.e)}`);
        console.log(`    Rows ${merge.s.r}-${merge.e.r}, Cols ${merge.s.c}-${merge.e.c}`);

        // Show value in source cell
        const sourceAddr = XLSX.utils.encode_cell(merge.s);
        const sourceCell = sheet[sourceAddr];
        if (sourceCell) {
          console.log(`    Source value: "${sourceCell.v}"`);
        }
      }
    }

    // Check the next 5 rows to see if they're also part of the same session
    console.log('\n\nNext 5 rows (to check for multi-line structure):');
    for (let r = row + 1; r <= row + 5; r++) {
      console.log(`\nRow ${r}:`);
      for (let col = 0; col <= 5; col++) {
        const addr = XLSX.utils.encode_cell({ r, c: col });
        const cell = sheet[addr];
        const colName = XLSX.utils.encode_col(col);
        if (cell) {
          console.log(`  ${colName}: "${String(cell.v).substring(0, 50)}..."`);
        }
      }
    }

    break;
  }
}
