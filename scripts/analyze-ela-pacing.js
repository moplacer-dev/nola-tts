/**
 * Script to analyze ELA pacing guide patterns
 */

const XLSX = require('xlsx');
const path = require('path');

const files = [
  '/Users/moriahplacer/Desktop/mo.vault.2/pacing.guide.3/archived_docs/archive/Pacing Guide Examples/R.10.10LAKESIDE PACING CLENDAR TEMPLATE 24.25.xlsx'
];

console.log('📚 Analyzing ELA Pacing Guides...\n');
console.log('='.repeat(80) + '\n');

files.forEach(filePath => {
  try {
    console.log(`\n📄 File: ${path.basename(filePath)}`);
    console.log('-'.repeat(80));

    const workbook = XLSX.readFile(filePath);

    console.log('\n📋 Sheets found:');
    workbook.SheetNames.forEach((name, index) => {
      console.log(`   ${index + 1}. ${name}`);
    });

    // Focus on ELA sheets
    const elaSheets = workbook.SheetNames.filter(name => 
      name.toLowerCase().includes('ela') || 
      name.toLowerCase().includes('language') ||
      name.toLowerCase().includes('reading')
    );

    if (elaSheets.length === 0) {
      console.log('\n⚠️  No ELA sheets found, analyzing all sheets...');
      elaSheets.push(...workbook.SheetNames);
    }

    elaSheets.forEach(sheetName => {
      console.log(`\n\n📖 SHEET: ${sheetName}`);
      console.log('-'.repeat(80));

      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      console.log('\nFirst 35 rows:');
      data.slice(0, 35).forEach((row, index) => {
        const rowNum = index + 1;
        const rowContent = row.slice(0, 8).map(cell => {
          const str = String(cell || '').substring(0, 35);
          return str.padEnd(35, ' ');
        }).join(' | ');
        console.log(`Row ${String(rowNum).padStart(2, '0')}: ${rowContent}`);
      });

      console.log('\n' + '-'.repeat(80));
      console.log(`Total rows: ${data.length}`);

      // Pattern analysis
      console.log('\n🔍 Pattern Analysis:');

      const allCells = data.flat().filter(cell => cell && String(cell).trim());

      // Look for L!L patterns
      const lilPattern = /L!L|Language\s*!?\s*Live/gi;
      const lils = allCells.filter(cell => lilPattern.test(String(cell)));
      if (lils.length > 0) {
        console.log(`   Found ${lils.length} Language!Live references`);
        console.log(`   Examples: ${lils.slice(0, 5).join(', ').substring(0, 150)}`);
      }

      // Look for TT/WW patterns
      const ttwwPattern = /TT|WT|WW|Text Training|Word Work|Word Training/gi;
      const ttww = allCells.filter(cell => ttwwPattern.test(String(cell)));
      if (ttww.length > 0) {
        console.log(`   Found ${ttww.length} TT/WT/WW references`);
        console.log(`   Examples: ${ttww.slice(0, 5).join(', ').substring(0, 150)}`);
      }

      // Look for Unit/Lesson patterns
      const unitLessonPattern = /Unit\s*\d+.*Lesson\s*\d+/gi;
      const unitLessons = allCells.filter(cell => unitLessonPattern.test(String(cell)));
      if (unitLessons.length > 0) {
        console.log(`   Found ${unitLessons.length} Unit/Lesson references`);
        console.log(`   Examples: ${unitLessons.slice(0, 5).join(', ').substring(0, 150)}`);
      }

      // Look for assessment patterns
      const assessmentPattern = /assessment|PAR|TOSCRF|TWS|EOY|MOY|BOY/gi;
      const assessments = allCells.filter(cell => assessmentPattern.test(String(cell)));
      if (assessments.length > 0) {
        console.log(`   Found ${assessments.length} assessment references`);
        console.log(`   Examples: ${assessments.slice(0, 5).join(', ').substring(0, 150)}`);
      }

      // Look for opening components
      const openingPattern = /startup|orientation|review|rules|procedures|first day|team build/gi;
      const opening = allCells.filter(cell => openingPattern.test(String(cell)));
      if (opening.length > 0) {
        console.log(`   Found ${opening.length} opening component references`);
        console.log(`   Examples: ${opening.slice(0, 5).join(', ').substring(0, 150)}`);
      }

      // Look for closing components
      const closingPattern = /last day|final|end of year|eoy|wrap up|celebration/gi;
      const closing = allCells.filter(cell => closingPattern.test(String(cell)));
      if (closing.length > 0) {
        console.log(`   Found ${closing.length} closing component references`);
        console.log(`   Examples: ${closing.slice(0, 5).join(', ').substring(0, 150)}`);
      }

      // Look for ReadingScape
      const readingScapePattern = /readingscape/gi;
      const readingScape = allCells.filter(cell => readingScapePattern.test(String(cell)));
      if (readingScape.length > 0) {
        console.log(`   Found ${readingScape.length} ReadingScape references`);
      }

      // Look for data conference
      const dataConfPattern = /data conference/gi;
      const dataConf = allCells.filter(cell => dataConfPattern.test(String(cell)));
      if (dataConf.length > 0) {
        console.log(`   Found ${dataConf.length} Data Conference references`);
      }

      console.log('\n' + '='.repeat(80));
    });

  } catch (error) {
    console.error(`❌ Error reading ${path.basename(filePath)}:`, error.message);
  }
});

console.log('\n\n✅ Analysis complete!\n');
