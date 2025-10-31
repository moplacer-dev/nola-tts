const XLSX = require('xlsx');
const path = require('path');

const EXCEL_FILE_PATH = path.join(__dirname, '../../hlp/hlp_module_data.xlsx');

console.log('Checking Excel file structure...\n');

const workbook = XLSX.readFile(EXCEL_FILE_PATH);
const sheetNames = workbook.SheetNames;

console.log(`Sheets: ${sheetNames.join(', ')}\n`);

// Check sessions sheet
const sessionsSheetName = sheetNames.find(name => name.toLowerCase().includes('session')) || sheetNames[1];
const sessionsSheet = workbook.Sheets[sessionsSheetName];
const sessionRecords = XLSX.utils.sheet_to_json(sessionsSheet, { header: 1 });

console.log(`Sessions sheet: "${sessionsSheetName}"`);
console.log(`Headers:`, sessionRecords[0]);
console.log(`First data row:`, sessionRecords[1]);
console.log();

// Check enrichments sheet
const enrichmentsSheetName = sheetNames.find(name => name.toLowerCase().includes('enrich')) || sheetNames[0];
const enrichmentsSheet = workbook.Sheets[enrichmentsSheetName];
const enrichmentRecords = XLSX.utils.sheet_to_json(enrichmentsSheet, { header: 1 });

console.log(`Enrichments sheet: "${enrichmentsSheetName}"`);
console.log(`Headers:`, enrichmentRecords[0]);
console.log(`First data row:`, enrichmentRecords[1]);
