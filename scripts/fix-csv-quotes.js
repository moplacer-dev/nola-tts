const fs = require('fs');
const path = require('path');

const SESSION_CSV_PATH = path.join(__dirname, '../data/hlp/star_academy_sessions.csv');
const SESSION_CSV_FIXED_PATH = path.join(__dirname, '../data/hlp/star_academy_sessions_fixed.csv');

console.log('Fixing CSV quote issues...');

// Read the file
const content = fs.readFileSync(SESSION_CSV_PATH, 'utf8');

// Fix the CSV by properly escaping quotes inside quoted fields
// Strategy: Replace any standalone " inside a quoted field with ""
const lines = content.split('\n');
const fixedLines = [];

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  // Skip empty lines
  if (!line.trim()) {
    fixedLines.push(line);
    continue;
  }

  // Process each field manually to fix quote issues
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  let j = 0;

  while (j < line.length) {
    const char = line[j];

    if (char === '"') {
      // Check if this is a start/end quote or an embedded quote
      if (!inQuotes) {
        // Starting a quoted field
        inQuotes = true;
        currentField += char;
      } else {
        // We're inside quotes - check what comes next
        const nextChar = line[j + 1];

        if (nextChar === '"') {
          // Already escaped quote - keep both
          currentField += '""';
          j++; // Skip the next quote
        } else if (nextChar === ',' || nextChar === undefined || nextChar === '\r') {
          // This is the closing quote
          inQuotes = false;
          currentField += char;
        } else {
          // This is an unescaped quote inside the field - escape it
          currentField += '""';
        }
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }

    j++;
  }

  // Add the last field
  if (currentField) {
    fields.push(currentField);
  }

  // Rejoin the fields
  fixedLines.push(fields.join(','));

  if ((i + 1) % 50 === 0) {
    console.log(`  Processed ${i + 1} lines...`);
  }
}

// Write the fixed file
fs.writeFileSync(SESSION_CSV_FIXED_PATH, fixedLines.join('\n'), 'utf8');

console.log(`\n✓ Fixed CSV written to: ${SESSION_CSV_FIXED_PATH}`);
console.log(`  Original lines: ${lines.length}`);
console.log(`  Fixed lines: ${fixedLines.length}`);
