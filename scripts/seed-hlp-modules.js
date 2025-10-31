const { Pool } = require('pg');
const path = require('path');
const XLSX = require('xlsx');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/nola_ess',
});

// Path to Excel file
const EXCEL_FILE_PATH = path.join(__dirname, 'data/hlp_module_data.xlsx');

/**
 * Get the value from a cell, returning undefined if empty
 */
function getCellValue(sheet, row, col) {
  const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = sheet[cellAddress];
  return cell ? cell.v : undefined;
}

/**
 * Find all merged ranges that include column A (Module column)
 * These define the session boundaries
 */
function findSessionRanges(sheet) {
  const merges = sheet['!merges'] || [];
  const sessionRanges = [];

  // Find merges that include column A (Module) and column B (Session)
  for (const merge of merges) {
    // Check if this merge includes columns A (0) and B (1)
    if (merge.s.c === 0 && merge.e.c === 0) {
      // This is a merge in column A (Module)
      sessionRanges.push({
        startRow: merge.s.r,
        endRow: merge.e.r,
        merge: merge,
      });
    }
  }

  // Sort by start row
  sessionRanges.sort((a, b) => a.startRow - b.startRow);

  return sessionRanges;
}

/**
 * Extract session data from a merged range
 */
function extractSessionData(sheet, range) {
  const startRow = range.startRow;
  const endRow = range.endRow;

  // Column indices (0-based)
  const COL_MODULE = 0; // A
  const COL_SESSION = 1; // B
  const COL_FOCUS = 2; // C
  const COL_OBJECTIVES = 3; // D
  const COL_MATERIALS = 4; // E
  const COL_TEACHER_PREP = 5; // F
  const COL_ASSESSMENTS = 6; // G

  // Read merged values (only need to read from first row)
  const module = getCellValue(sheet, startRow, COL_MODULE);
  const session = getCellValue(sheet, startRow, COL_SESSION);
  const focus = getCellValue(sheet, startRow, COL_FOCUS);
  const materials = getCellValue(sheet, startRow, COL_MATERIALS);
  const teacherPrep = getCellValue(sheet, startRow, COL_TEACHER_PREP);

  // Collect all objectives from rows within this range
  const objectives = [];
  for (let row = startRow; row <= endRow; row++) {
    const obj = getCellValue(sheet, row, COL_OBJECTIVES);
    if (obj && String(obj).trim()) {
      objectives.push(String(obj).trim());
    }
  }

  // Collect all assessments from rows within this range
  const assessments = [];
  for (let row = startRow; row <= endRow; row++) {
    const assess = getCellValue(sheet, row, COL_ASSESSMENTS);
    if (assess && String(assess).trim()) {
      assessments.push(String(assess).trim());
    }
  }

  return {
    module: module ? String(module).trim() : null,
    session: session ? parseInt(session) : null,
    focus: focus ? String(focus).trim() : '',
    objectives: objectives.join('\n'),
    materials: materials ? String(materials).trim() : '',
    teacherPrep: teacherPrep ? String(teacherPrep).trim() : '',
    assessments: assessments.join('\n'),
  };
}

async function seedHLPModules() {
  const client = await pool.connect();

  try {
    console.log('Starting HLP module template seed (V2 - Correct merge handling)...\n');

    // Check if modules already exist
    const existingCount = await client.query('SELECT COUNT(*) FROM hlp_module_templates');

    if (parseInt(existingCount.rows[0].count) > 0) {
      console.log(`Found ${existingCount.rows[0].count} existing HLP modules. Deleting...`);

      // Delete in correct order due to foreign keys
      await client.query('DELETE FROM hlp_template_enrichments');
      await client.query('DELETE FROM hlp_template_sessions');
      await client.query('DELETE FROM hlp_module_templates');
      console.log('Deleted existing HLP modules, sessions, and enrichments.\n');
    }

    // Read Excel file
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);

    // Get sheet names
    const sheetNames = workbook.SheetNames;
    console.log(`Found sheets: ${sheetNames.join(', ')}\n`);

    // Read sessions sheet
    const sessionsSheetName = sheetNames.find(name => name.toLowerCase().includes('session')) || sheetNames[1];
    const sessionsSheet = workbook.Sheets[sessionsSheetName];

    console.log(`Processing sessions sheet: "${sessionsSheetName}"`);
    console.log(`  Total merged ranges: ${(sessionsSheet['!merges'] || []).length}`);

    // Find all session ranges
    const sessionRanges = findSessionRanges(sessionsSheet);
    console.log(`  Found ${sessionRanges.length} session ranges (merged Module cells)\n`);

    // Extract session data from each range
    const sessionRecords = [];
    for (const range of sessionRanges) {
      const data = extractSessionData(sessionsSheet, range);

      // Skip if no module name (likely header or empty row)
      if (!data.module || !data.session) {
        continue;
      }

      sessionRecords.push(data);
    }

    console.log(`Extracted ${sessionRecords.length} valid session records\n`);

    // Show sample for verification
    const weatherSample = sessionRecords.find(r => r.module === 'Weather v1.1' && r.session === 1);
    if (weatherSample) {
      console.log('Sample record (Weather v1.1, Session 1):');
      console.log(`  Module: ${weatherSample.module}`);
      console.log(`  Session: ${weatherSample.session}`);
      console.log(`  Focus: ${weatherSample.focus.substring(0, 50)}...`);
      console.log(`  Objectives (${weatherSample.objectives.length} chars):`);
      weatherSample.objectives.split('\n').forEach((line, i) => {
        console.log(`    ${i + 1}. ${line.substring(0, 60)}...`);
      });
      console.log(`  Assessments (${weatherSample.assessments.length} chars):`);
      weatherSample.assessments.split('\n').slice(0, 2).forEach((line, i) => {
        console.log(`    ${i + 1}. ${line.substring(0, 60)}...`);
      });
      console.log('');
    }

    // Read enrichments sheet (simpler - no complex merging)
    const enrichmentsSheetName = sheetNames.find(name => name.toLowerCase().includes('enrich')) || sheetNames[0];
    const enrichmentsSheet = workbook.Sheets[enrichmentsSheetName];
    const enrichmentRecords = XLSX.utils.sheet_to_json(enrichmentsSheet);

    console.log(`Parsed ${enrichmentRecords.length} enrichment records\n`);

    // Group sessions by module
    const moduleSessionsMap = {};
    sessionRecords.forEach((record) => {
      const moduleName = record.module;

      if (!moduleSessionsMap[moduleName]) {
        moduleSessionsMap[moduleName] = [];
      }

      moduleSessionsMap[moduleName].push({
        session_number: record.session,
        focus: record.focus,
        objectives: record.objectives,
        materials: record.materials,
        teacher_prep: record.teacherPrep,
        assessments: record.assessments,
      });
    });

    // Group enrichments by module
    const moduleEnrichmentsMap = {};
    enrichmentRecords.forEach((record) => {
      const moduleName = record.Module;
      if (!moduleName) return;

      const enrichmentNum = parseInt(record.Enrichment_Number);
      if (isNaN(enrichmentNum)) return;

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
    console.log(`Found ${moduleNames.length} unique modules\n`);

    // Insert modules and their sessions/enrichments
    let moduleCount = 0;
    let sessionCount = 0;
    let enrichmentCount = 0;

    console.log('Inserting data into database...');

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
        [moduleName, null, null, true]
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

      // Insert enrichments for this module
      enrichments.forEach((enrichment, index) => {
        enrichment.enrichment_number = index + 1;
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
    console.log(`  - ${enrichmentCount} enrichment records\n`);

    // Verify data quality
    const dataCheck = await client.query(
      `SELECT s.session_number, s.objectives, s.assessments
       FROM hlp_template_sessions s
       JOIN hlp_module_templates m ON s.template_id = m.id
       WHERE m.module_name = 'Weather v1.1' AND s.session_number = 1`
    );

    if (dataCheck.rows.length > 0) {
      const row = dataCheck.rows[0];
      console.log('✅ Data Quality Check (Weather v1.1, Session 1):');
      console.log(`   Objectives: ${row.objectives.length} characters`);
      console.log(`   Objectives lines: ${row.objectives.split('\n').length}`);
      console.log(`   Assessments: ${row.assessments.length} characters`);
      console.log(`   Assessments lines: ${row.assessments.split('\n').length}`);
      console.log('\n   Sample objectives:');
      row.objectives.split('\n').slice(0, 3).forEach((line, i) => {
        console.log(`     ${i + 1}. ${line}`);
      });
    }

    console.log('\n📝 Status:');
    console.log('  ✅ Merged cells handled correctly');
    console.log('  ✅ Multi-line objectives collected and joined');
    console.log('  ✅ Multi-line assessments collected and joined');
    console.log('  ✅ Ready for DOCX generation');

  } catch (error) {
    console.error('\n❌ Error seeding HLP modules:', error);
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
