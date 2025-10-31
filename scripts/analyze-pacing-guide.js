/**
 * Script to analyze real pacing guide Excel files and extract patterns
 */

const XLSX = require('xlsx');
const path = require('path');

const filePath = '/Users/moriahplacer/Desktop/mo.vault.2/pacing.guide.3/archived_docs/archive/Pacing Guide Examples/24-25 Pacing Guide  - Block High School (Catahoula) (1).xlsx';

console.log('📊 Analyzing Pacing Guide...\n');
console.log('File:', path.basename(filePath));
console.log('='.repeat(80) + '\n');

try {
  const workbook = XLSX.readFile(filePath);

  console.log('📋 Sheets found:');
  workbook.SheetNames.forEach((name, index) => {
    console.log(`   ${index + 1}. ${name}`);
  });
  console.log('\n' + '='.repeat(80) + '\n');

  // Analyze each sheet
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n📄 SHEET: ${sheetName}`);
    console.log('-'.repeat(80));

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // Show first 30 rows to understand structure
    console.log('\nFirst 30 rows:');
    data.slice(0, 30).forEach((row, index) => {
      const rowNum = index + 1;
      const rowContent = row.slice(0, 10).map(cell => {
        const str = String(cell || '').substring(0, 40);
        return str.padEnd(40, ' ');
      }).join(' | ');
      console.log(`Row ${String(rowNum).padStart(2, '0')}: ${rowContent}`);
    });

    console.log('\n' + '-'.repeat(80));
    console.log(`Total rows: ${data.length}`);
    console.log(`Total columns: ${Math.max(...data.map(row => row.length))}`);

    // Look for component patterns
    console.log('\n🔍 Pattern Analysis:');

    const allCells = data.flat().filter(cell => cell && String(cell).trim());

    // Look for rotation patterns
    const rotationPattern = /R\d+,?\s*S\d+/gi;
    const rotations = allCells.filter(cell => rotationPattern.test(String(cell)));
    if (rotations.length > 0) {
      console.log(`   Found ${rotations.length} rotation references (R#, S#)`);
      console.log(`   Examples: ${rotations.slice(0, 5).join(', ')}`);
    }

    // Look for IPL patterns
    const iplPattern = /IPL|L\d+\s*&\s*L\d+|Lesson\s+\d+/gi;
    const ipls = allCells.filter(cell => iplPattern.test(String(cell)));
    if (ipls.length > 0) {
      console.log(`   Found ${ipls.length} IPL/Lesson references`);
      console.log(`   Examples: ${ipls.slice(0, 5).join(', ')}`);
    }

    // Look for unit patterns
    const unitPattern = /Unit\s*\d+/gi;
    const units = allCells.filter(cell => unitPattern.test(String(cell)));
    if (units.length > 0) {
      console.log(`   Found ${units.length} Unit references`);
      console.log(`   Examples: ${units.slice(0, 5).join(', ')}`);
    }

    // Look for benchmark/assessment patterns
    const assessmentPattern = /benchmark|assessment|quiz|test/gi;
    const assessments = allCells.filter(cell => assessmentPattern.test(String(cell)));
    if (assessments.length > 0) {
      console.log(`   Found ${assessments.length} assessment references`);
      console.log(`   Examples: ${assessments.slice(0, 3).join(', ')}`);
    }

    // Look for date patterns
    const datePattern = /\d{1,2}\/\d{1,2}(\/\d{2,4})?/;
    const dates = allCells.filter(cell => datePattern.test(String(cell)));
    if (dates.length > 0) {
      console.log(`   Found ${dates.length} date references`);
      console.log(`   First date: ${dates[0]}, Last date: ${dates[dates.length - 1]}`);
    }

    console.log('\n' + '='.repeat(80));
  });

} catch (error) {
  console.error('❌ Error reading Excel file:', error.message);
}
