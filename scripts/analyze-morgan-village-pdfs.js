/**
 * Analyze Morgan Village PDF pacing guides
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = [
  'MATHEMATICS PACING CALENDAR MORGAN VILLAGE 24.25. DRAFT.pdf',
  'R. 10.14.24 SCIENCE PACING CALENDAR  BASED ON 55 MINUTES. MORGAN VILLAGE.pdf',
  'SCIENCE PACING CALENDAR  2024.2025  MORGAN VILLAGE. DRAFT.pdf',
  'SOCIAL STUDIES PACING CALENDAR MORGAN VILLAGE 24.25. DRAFT.pdf'
];

const baseDir = '/Users/moriahplacer/Desktop/mo.vault.2/pacing.guide.3/archived_docs/archive/Pacing Guide Examples';

console.log('📊 Analyzing Morgan Village PDF Pacing Guides');
console.log('='.repeat(80) + '\n');

let filesProcessed = 0;

files.forEach((filename, index) => {
  const filePath = path.join(baseDir, filename);
  const tempFile = `/tmp/morgan-${index}.txt`;
  
  console.log(`\n📄 File ${index + 1}/${files.length}: ${filename}`);
  console.log('-'.repeat(80));
  
  exec(`pdftotext "${filePath}" "${tempFile}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error converting PDF: ${error.message}`);
      filesProcessed++;
      return;
    }
    
    try {
      const text = fs.readFileSync(tempFile, 'utf8');
      const lines = text.split('\n').filter(line => line.trim().length > 2);
      
      console.log(`\nFirst 40 lines:\n`);
      lines.slice(0, 40).forEach((line, i) => {
        console.log(`${String(i + 1).padStart(2, '0')}: ${line.substring(0, 100)}`);
      });
      
      console.log(`\n📊 Total lines: ${lines.length}\n`);
      
      // Pattern detection
      console.log('🔍 Pattern Analysis:\n');
      
      // Science patterns
      const rotationPattern = /R\d+[,\s]+S\d+/gi;
      const rotations = lines.filter(line => rotationPattern.test(line));
      if (rotations.length > 0) {
        console.log(`   🔬 Found ${rotations.length} rotation references (R#, S#)`);
        console.log(`      Examples: ${rotations.slice(0, 5).map(r => r.substring(0, 50)).join(' | ')}`);
      }
      
      // Math patterns
      const iplPattern = /IPL|Equations|Properties|Linear|Exponents|Fractions|Systems/gi;
      const ipls = lines.filter(line => iplPattern.test(line));
      if (ipls.length > 0) {
        console.log(`   ➕ Found ${ipls.length} IPL/Math unit references`);
        console.log(`      Examples: ${ipls.slice(0, 3).map(r => r.substring(0, 50)).join(' | ')}`);
      }
      
      // Social Studies patterns
      const unitPattern = /Unit\s+\d+|Lesson\s+\d+/gi;
      const units = lines.filter(line => unitPattern.test(line));
      if (units.length > 0) {
        console.log(`   🌍 Found ${units.length} Unit/Lesson references`);
        console.log(`      Examples: ${units.slice(0, 3).map(r => r.substring(0, 50)).join(' | ')}`);
      }
      
      // Opening components
      const openingPattern = /first day|staff pd|establish|procedures|orientation|startup|benchmark/gi;
      const opening = lines.filter(line => openingPattern.test(line));
      if (opening.length > 0) {
        console.log(`   🎬 Found ${opening.length} opening component references`);
        console.log(`      Examples: ${opening.slice(0, 3).map(r => r.substring(0, 50)).join(' | ')}`);
      }
      
      // Assessment patterns
      const assessmentPattern = /benchmark|assessment|pear|steps|diagnostic|quiz|test/gi;
      const assessments = lines.filter(line => assessmentPattern.test(line));
      if (assessments.length > 0) {
        console.log(`   📝 Found ${assessments.length} assessment references`);
      }
      
      // Blended Science / Module patterns
      const scienceSpecialPattern = /blended science|module orientation|discovery day/gi;
      const scienceSpecial = lines.filter(line => scienceSpecialPattern.test(line));
      if (scienceSpecial.length > 0) {
        console.log(`   🧪 Found ${scienceSpecial.length} Science-specific patterns`);
        console.log(`      Examples: ${scienceSpecial.slice(0, 3).map(r => r.substring(0, 50)).join(' | ')}`);
      }
      
      console.log('\n' + '='.repeat(80));
      
      // Clean up
      fs.unlinkSync(tempFile);
      
    } catch (err) {
      console.error(`❌ Error reading temp file: ${err.message}`);
    }
    
    filesProcessed++;
    if (filesProcessed === files.length) {
      console.log('\n\n✅ All files analyzed!\n');
    }
  });
});

// Wait for all to complete
setTimeout(() => {
  if (filesProcessed < files.length) {
    console.log(`\n⏳ Still processing... (${filesProcessed}/${files.length} complete)`);
  }
}, 5000);

