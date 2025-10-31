const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const SESSION_CSV_PATH = path.join(__dirname, '../data/hlp/star_academy_sessions.csv');
const SESSION_CSV_FIXED_PATH = path.join(__dirname, '../data/hlp/star_academy_sessions_cleaned.csv');

console.log('Re-writing CSV file with proper formatting...');

// Read the file
const content = fs.readFileSync(SESSION_CSV_PATH, 'utf8');

try {
  // Parse with very lenient settings
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    from_line: 2, // Skip title line
    relax_quotes: true,
    escape: '"',
    relax: true,
    on_record: (record) => {
      // Clean up any undefined or null values
      Object.keys(record).forEach(key => {
        if (record[key] === undefined || record[key] === null) {
          record[key] = '';
        }
      });
      return record;
    }
  });

  console.log(`Parsed ${records.length} records`);

  // Write back out with proper CSV formatting
  const output = stringify(records, {
    header: true,
    quoted: true, // Quote all fields
    quoted_string: true,
  });

  fs.writeFileSync(SESSION_CSV_FIXED_PATH, output, 'utf8');

  console.log(`✓ Cleaned CSV written to: ${SESSION_CSV_FIXED_PATH}`);
  console.log(`  Total records: ${records.length}`);

} catch (error) {
  console.error('Error:', error.message);
  console.error('Trying alternative method...');

  // If that fails, try reading line by line and cleaning manually
  const lines = content.split('\n');
  const cleanedLines = [];

  // Add title line
  cleanedLines.push('star_academy_sessions');

  // Add header
  cleanedLines.push('Module,Session,Focus,Objectives,Materials,Teacher_Preparations,Performance_Assessment_Questions');

  // Process data lines
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      // Very simple cleaning: just ensure the line has some structure
      cleanedLines.push(line);
    }
  }

  fs.writeFileSync(SESSION_CSV_FIXED_PATH, cleanedLines.join('\n'), 'utf8');
  console.log(`✓ Basic cleaning complete. Records: ${cleanedLines.length - 2}`);
}
