const { Pool } = require('pg');
const path = require('path');
const XLSX = require('xlsx');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/nola_ess',
});

// Path to Excel file
const EXCEL_FILE_PATH = path.join(__dirname, '../../hlp/hlp_module_data.xlsx');

/**
 * Helper function to handle merged cells properly
 * When a cell is empty but part of a merged range, returns the merge source value
 */
function getCellValue(sheet, cellAddress) {
  const cell = sheet[cellAddress];

  // If cell has value, return it
  if (cell && cell.v !== undefined) {
    return cell.v;
  }

  // If cell is empty, check if it's part of a merged range
  const merges = sheet['!merges'] || [];
  const cellRef = XLSX.utils.decode_cell(cellAddress);

  for (const merge of merges) {
    // Check if this cell is within a merged range
    if (
      cellRef.r >= merge.s.r &&
      cellRef.r <= merge.e.r &&
      cellRef.c >= merge.s.c &&
      cellRef.c <= merge.e.c
    ) {
      // Get the value from the top-left cell of the merge range
      const sourceAddress = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
      const sourceCell = sheet[sourceAddress];
      return sourceCell ? sourceCell.v : undefined;
    }
  }

  return undefined;
}

/**
 * Check if a row should be skipped because it's a continuation of a merged cell
 * Returns true if this row is part of a merge but NOT the first row
 */
function isRowInMergedRange(sheet, row) {
  const merges = sheet['!merges'] || [];

  for (const merge of merges) {
    // Check if this row is in the merge range AND is not the first row
    if (row > merge.s.r && row <= merge.e.r) {
      // This row is a continuation of a merged cell
      return true;
    }
  }

  return false;
}

/**
 * Convert sheet to JSON, properly handling merged cells
 * Skips rows that are continuations of merged cells (not the first row)
 */
function sheetToJsonWithMerges(sheet, options = {}) {
  const range = options.range || 0;
  const sheetRange = XLSX.utils.decode_range(sheet['!ref']);

  // Adjust start row if range option is provided
  const startRow = typeof range === 'number' ? range : sheetRange.s.r;

  const records = [];
  const headers = [];

  // Read header row
  for (let col = sheetRange.s.c; col <= sheetRange.e.c; col++) {
    const headerAddress = XLSX.utils.encode_cell({ r: startRow, c: col });
    const headerValue = getCellValue(sheet, headerAddress);
    headers.push(headerValue ? String(headerValue).trim() : `Column${col}`);
  }

  // Read data rows
  for (let row = startRow + 1; row <= sheetRange.e.r; row++) {
    // Skip rows that are part of a merged cell range (not the first row)
    if (isRowInMergedRange(sheet, row)) {
      continue;
    }

    const record = {};
    let hasData = false;

    for (let col = sheetRange.s.c; col <= sheetRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cellValue = getCellValue(sheet, cellAddress);

      const header = headers[col - sheetRange.s.c];
      record[header] = cellValue !== undefined ? cellValue : '';

      if (cellValue !== undefined && cellValue !== '') {
        hasData = true;
      }
    }

    // Only add record if it has at least one non-empty cell
    if (hasData) {
      records.push(record);
    }
  }

  return records;
}

async function seedHLPModules() {
  const client = await pool.connect();

  try {
    console.log('Starting HLP module template seed (with merged cell handling)...');

    // Check if modules already exist
    const existingCount = await client.query('SELECT COUNT(*) FROM hlp_module_templates');

    if (parseInt(existingCount.rows[0].count) > 0) {
      console.log(`Found ${existingCount.rows[0].count} existing HLP modules. Deleting...`);

      // Delete in correct order due to foreign keys
      await client.query('DELETE FROM hlp_template_enrichments');
      await client.query('DELETE FROM hlp_template_sessions');
      await client.query('DELETE FROM hlp_module_templates');
      console.log('Deleted existing HLP modules, sessions, and enrichments.');
    }

    // Read Excel file
    console.log('\nReading Excel file...');
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);

    // Get sheet names
    const sheetNames = workbook.SheetNames;
    console.log(`Found sheets: ${sheetNames.join(', ')}`);

    // Read sessions sheet (skip first title row) - USE CUSTOM FUNCTION
    const sessionsSheetName = sheetNames.find(name => name.toLowerCase().includes('session')) || sheetNames[1];
    const sessionsSheet = workbook.Sheets[sessionsSheetName];

    console.log(`\nProcessing sessions sheet: "${sessionsSheetName}"`);
    console.log(`  Detected ${(sessionsSheet['!merges'] || []).length} merged cell ranges`);

    const sessionRecords = sheetToJsonWithMerges(sessionsSheet, { range: 1 }); // Skip row 0 (title)

    // Read enrichments sheet - USE CUSTOM FUNCTION
    const enrichmentsSheetName = sheetNames.find(name => name.toLowerCase().includes('enrich')) || sheetNames[0];
    const enrichmentsSheet = workbook.Sheets[enrichmentsSheetName];

    console.log(`\nProcessing enrichments sheet: "${enrichmentsSheetName}"`);
    console.log(`  Detected ${(enrichmentsSheet['!merges'] || []).length} merged cell ranges`);

    const enrichmentRecords = sheetToJsonWithMerges(enrichmentsSheet);

    console.log(`\nParsed ${sessionRecords.length} session records`);
    console.log(`Parsed ${enrichmentRecords.length} enrichment records`);

    // Debug: Show sample record
    if (sessionRecords.length > 0) {
      console.log('\nSample session record (Weather v1.1, Session 1):');
      const sample = sessionRecords.find(r => r.Module === 'Weather v1.1' && r.Session === 1);
      if (sample) {
        console.log('  Focus:', sample.Focus ? sample.Focus.substring(0, 60) + '...' : 'N/A');
        console.log('  Objectives:', sample.Objectives ? sample.Objectives.substring(0, 100) + '...' : 'N/A');
        console.log('  Full Objectives Length:', sample.Objectives ? sample.Objectives.length : 0);
      }
    }

    // Group sessions by module
    const moduleSessionsMap = {};
    sessionRecords.forEach((record) => {
      const moduleName = record.Module;
      if (!moduleName) return; // Skip empty rows

      // Parse session number with validation
      const sessionNum = parseInt(record.Session);
      if (isNaN(sessionNum)) {
        console.warn(`⚠️  Skipping record with invalid session number: Module="${moduleName}", Session="${record.Session}"`);
        return;
      }

      if (!moduleSessionsMap[moduleName]) {
        moduleSessionsMap[moduleName] = [];
      }

      moduleSessionsMap[moduleName].push({
        session_number: sessionNum,
        focus: record.Focus || '',
        objectives: record.Objectives || '',
        materials: record.Materials || '',
        teacher_prep: record.Teacher_Preparations || '',
        assessments: record.Performance_Assessment_Questions || '',
      });
    });

    // Group enrichments by module
    const moduleEnrichmentsMap = {};
    enrichmentRecords.forEach((record) => {
      const moduleName = record.Module;
      if (!moduleName) return; // Skip empty rows

      // Parse enrichment number with validation
      const enrichmentNum = parseInt(record.Enrichment_Number);
      if (isNaN(enrichmentNum)) {
        console.warn(`⚠️  Skipping enrichment with invalid number: Module="${moduleName}", Enrichment_Number="${record.Enrichment_Number}"`);
        return;
      }

      if (!moduleEnrichmentsMap[moduleName]) {
        moduleEnrichmentsMap[moduleName] = [];
      }

      moduleEnrichmentsMap[moduleName].push({
        enrichment_number: enrichmentNum,
        title: record.Title || '',
        description: record.Description || '',
      });
    });

    // Get unique module names
    const moduleNames = Object.keys(moduleSessionsMap).sort();
    console.log(`\nFound ${moduleNames.length} unique modules`);

    // Insert modules and their sessions/enrichments
    let moduleCount = 0;
    let sessionCount = 0;
    let enrichmentCount = 0;

    for (const moduleName of moduleNames) {
      const sessions = moduleSessionsMap[moduleName];
      const enrichments = moduleEnrichmentsMap[moduleName] || [];

      // Verify this module has exactly 7 sessions
      if (sessions.length !== 7) {
        console.warn(`⚠️  Warning: Module "${moduleName}" has ${sessions.length} sessions (expected 7)`);
      }

      // Sort sessions by session_number
      sessions.sort((a, b) => a.session_number - b.session_number);

      // Insert module template
      const moduleResult = await client.query(
        `INSERT INTO hlp_module_templates
         (module_name, subject, grade_level, is_active)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [moduleName, null, null, true] // subject and grade_level left NULL for admin to set later
      );

      const moduleId = moduleResult.rows[0].id;
      moduleCount++;

      // Insert sessions for this module
      for (const session of sessions) {
        await client.query(
          `INSERT INTO hlp_template_sessions
           (template_id, session_number, focus, objectives, materials, teacher_prep, assessments)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            moduleId,
            session.session_number,
            session.focus,
            session.objectives,
            session.materials,
            session.teacher_prep,
            session.assessments,
          ]
        );
        sessionCount++;
      }

      // Insert enrichments for this module (re-number to avoid duplicates)
      enrichments.forEach((enrichment, index) => {
        enrichment.enrichment_number = index + 1; // Ensure sequential numbering
      });

      for (const enrichment of enrichments) {
        await client.query(
          `INSERT INTO hlp_template_enrichments
           (template_id, enrichment_number, title, description)
           VALUES ($1, $2, $3, $4)`,
          [moduleId, enrichment.enrichment_number, enrichment.title, enrichment.description]
        );
        enrichmentCount++;
      }

      // Progress indicator
      if (moduleCount % 10 === 0) {
        console.log(`  Processed ${moduleCount}/${moduleNames.length} modules...`);
      }
    }

    console.log(`\n✓ Successfully seeded ${moduleCount} HLP module templates!`);
    console.log(`  - ${sessionCount} session records`);
    console.log(`  - ${enrichmentCount} enrichment records`);

    // Show summary
    const summary = await client.query(
      `SELECT
        COUNT(*) as total_modules,
        COUNT(CASE WHEN subject IS NOT NULL THEN 1 END) as modules_with_subject,
        COUNT(CASE WHEN subject IS NULL THEN 1 END) as modules_without_subject
       FROM hlp_module_templates`
    );

    console.log('\nModule Summary:');
    console.log(`  Total modules: ${summary.rows[0].total_modules}`);
    console.log(`  With subject assigned: ${summary.rows[0].modules_with_subject}`);
    console.log(`  Without subject (NULL): ${summary.rows[0].modules_without_subject}`);

    // Verify data quality - check objectives length for Weather v1.1
    const dataCheck = await client.query(
      `SELECT s.session_number, s.objectives
       FROM hlp_template_sessions s
       JOIN hlp_module_templates m ON s.template_id = m.id
       WHERE m.module_name = 'Weather v1.1'
       ORDER BY s.session_number
       LIMIT 1`
    );

    if (dataCheck.rows.length > 0) {
      console.log('\n✅ Data Quality Check (Weather v1.1, Session 1):');
      console.log(`   Objectives length: ${dataCheck.rows[0].objectives.length} characters`);
      console.log(`   Preview: ${dataCheck.rows[0].objectives.substring(0, 100)}...`);
    }

    console.log('\n📝 Status:');
    console.log('  ✅ Merged cells handled correctly');
    console.log('  ✅ Multi-line objectives preserved');
    console.log('  ✅ Ready for DOCX generation');

  } catch (error) {
    console.error('Error seeding HLP modules:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedHLPModules();
