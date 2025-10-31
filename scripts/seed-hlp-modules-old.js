const { Pool } = require('pg');
const path = require('path');
const XLSX = require('xlsx');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/nola_ess',
});

// Path to Excel file
const EXCEL_FILE_PATH = path.join(__dirname, '../../hlp/hlp_module_data.xlsx');

async function seedHLPModules() {
  const client = await pool.connect();

  try {
    console.log('Starting HLP module template seed...');

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

    // Read sessions sheet (skip first title row)
    const sessionsSheetName = sheetNames.find(name => name.toLowerCase().includes('session')) || sheetNames[1];
    const sessionsSheet = workbook.Sheets[sessionsSheetName];
    const sessionRecords = XLSX.utils.sheet_to_json(sessionsSheet, { range: 1 }); // Skip row 0 (title)

    // Read enrichments sheet
    const enrichmentsSheetName = sheetNames.find(name => name.toLowerCase().includes('enrich')) || sheetNames[0];
    const enrichmentsSheet = workbook.Sheets[enrichmentsSheetName];
    const enrichmentRecords = XLSX.utils.sheet_to_json(enrichmentsSheet);

    console.log(`Parsed ${sessionRecords.length} session records`);
    console.log(`Parsed ${enrichmentRecords.length} enrichment records`);

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

    console.log('\n📝 Next Steps:');
    console.log('  1. Use admin UI to assign subject and grade_level to modules');
    console.log('  2. Update database schema to change module limit from 5 to 10');
    console.log('  3. Install docx library: npm install docx pizzip docxtemplater');

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
