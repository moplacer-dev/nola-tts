/**
 * NOLA ESS Pacing Guide V2: Template Migration Script
 *
 * Purpose: Migrate 162 component templates from V1 to V2 structure
 *
 * Changes:
 * - Add expansion_type and expansion_config
 * - Extract metadata_fields from descriptions/patterns
 * - Set default_blocks_curriculum for base calendar
 * - Determine move_behavior based on subject
 *
 * Run: node scripts/migrate-templates-to-v2.js
 */

const { Pool } = require('pg');

// Database connection (using local PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/nola_ess'
});

// Track migration stats
const stats = {
  total: 0,
  migrated: 0,
  skipped: 0,
  errors: [],
  bySubject: {
    base: 0,
    ela: 0,
    math: 0,
    science: 0,
    social_studies: 0
  },
  byExpansionType: {
    single: 0,
    multi_sequence: 0,
    multi_rotation: 0,
    multi_grouped: 0
  }
};

/**
 * Determine expansion type based on template metadata and subject
 */
function determineExpansionType(template) {
  const metadata = template.metadata || {};

  // Single-day component
  if (!metadata.is_multi) {
    return 'single';
  }

  // Social Studies: Sequential lessons (Unit → Lessons)
  if (template.subject === 'social_studies') {
    return 'multi_sequence';
  }

  // Science/Math rotations: Module Rotation, Blended Science, etc.
  if (template.component_key.includes('rotation') ||
      template.component_key.includes('blended')) {
    return 'multi_rotation';
  }

  // ELA units: Grouped lessons that move together
  if (template.subject === 'ela' && template.component_key.includes('unit')) {
    return 'multi_grouped';
  }

  // Math IPL: Grouped lessons
  if (template.subject === 'math' && template.component_key.includes('ipl')) {
    return 'multi_grouped';
  }

  // Default: multi_grouped
  return 'multi_grouped';
}

/**
 * Generate expansion config from V1 metadata
 */
function generateExpansionConfig(template) {
  const metadata = template.metadata || {};

  // Single component - no config needed
  if (!metadata.is_multi || !metadata.sub_components) {
    return {};
  }

  const expansionType = determineExpansionType(template);

  switch (expansionType) {
    case 'multi_rotation':
      return generateRotationConfig(template);

    case 'multi_sequence':
      return generateSequenceConfig(template);

    case 'multi_grouped':
      return generateGroupedConfig(template);

    default:
      return {};
  }
}

/**
 * Generate rotation config (Science/Math module rotations)
 */
function generateRotationConfig(template) {
  const subComponents = template.metadata.sub_components || [];

  // Extract session pattern from first sub-component
  const firstTitle = subComponents[0]?.title || '';

  // Check if it's a session pattern (S1, S2, etc.)
  if (firstTitle.includes('S1') || firstTitle.includes('Session 1')) {
    return {
      sessions: subComponents.length,
      title_pattern: firstTitle.replace(/\d+/, '{session}').replace('S1', 'S{session}')
    };
  }

  // Check if it's a blended science pattern
  if (template.component_key.includes('blended')) {
    return {
      sessions: subComponents.length,
      title_pattern: 'Blended Science #'
    };
  }

  // Default rotation pattern
  return {
    sessions: subComponents.length,
    title_pattern: 'Session {session}'
  };
}

/**
 * Generate sequence config (Social Studies units)
 */
function generateSequenceConfig(template) {
  const subComponents = template.metadata.sub_components || [];

  return {
    items: subComponents.map(sub => ({
      title: sub.title,
      days: sub.duration || 1
    }))
  };
}

/**
 * Generate grouped config (ELA units, Math IPL)
 */
function generateGroupedConfig(template) {
  const subComponents = template.metadata.sub_components || [];

  // Group consecutive items with same title
  const grouped = [];
  let currentGroup = null;

  for (const sub of subComponents) {
    if (!currentGroup || currentGroup.title !== sub.title) {
      // Start new group
      currentGroup = {
        title: sub.title,
        days: sub.duration || 1,
        repeat: 1
      };
      grouped.push(currentGroup);
    } else {
      // Same title - increment repeat count
      currentGroup.repeat += 1;
    }
  }

  return { items: grouped };
}

/**
 * Extract metadata field names based on template
 */
function extractMetadataFields(template) {
  const fields = [];

  // Rotation number (for module rotations)
  if (template.component_key.includes('rotation') ||
      template.description?.toLowerCase().includes('rotation')) {
    fields.push('rotation_number');
  }

  // Unit number (for units that need numbering)
  if (template.display_name?.includes('Unit #') ||
      template.description?.toLowerCase().includes('unit number')) {
    fields.push('unit_number');
  }

  // Blended science unit
  if (template.component_key === 'science_blended' ||
      template.component_key.includes('blended_science')) {
    fields.push('blended_science_unit');
  }

  return fields;
}

/**
 * Determine if base calendar event should block curriculum by default
 */
function shouldBlockByDefault(eventName) {
  const blockingKeywords = [
    'break', 'holiday', 'vacation', 'no school',
    'christmas', 'thanksgiving', 'spring break', 'winter break',
    'teacher workday', 'professional development', 'inservice',
    'teacher work day', 'pd day', 'staff development',
    'labor day', 'memorial day', 'mlk', 'presidents day'
  ];

  const lower = eventName.toLowerCase();
  return blockingKeywords.some(keyword => lower.includes(keyword));
}

/**
 * Determine move behavior
 */
function determineBehavior(template) {
  // Social Studies: independent (each lesson moves separately)
  if (template.subject === 'social_studies') {
    return 'independent';
  }

  // ELA units: grouped (whole unit moves together)
  if (template.subject === 'ela' && template.component_key.includes('unit')) {
    return 'grouped';
  }

  // Default: independent (most common)
  return 'independent';
}

/**
 * Convert single V1 template to V2 format
 */
function convertTemplate(oldTemplate) {
  const expansionType = determineExpansionType(oldTemplate);

  return {
    component_key: oldTemplate.component_key,
    subject: oldTemplate.subject,
    display_name: oldTemplate.display_name,
    description: oldTemplate.description || null,
    color: oldTemplate.color,
    default_duration_days: oldTemplate.default_duration_days,
    expansion_type: expansionType,
    expansion_config: generateExpansionConfig(oldTemplate),
    metadata_fields: extractMetadataFields(oldTemplate),
    default_blocks_curriculum: oldTemplate.subject === 'base'
      ? shouldBlockByDefault(oldTemplate.display_name)
      : null,
    move_behavior: determineBehavior(oldTemplate),
    category: oldTemplate.category || null,
    is_system: true, // All V1 templates are system templates
    created_at: oldTemplate.created_at
  };
}

/**
 * Insert V2 template into database
 */
async function insertTemplateV2(template) {
  const query = `
    INSERT INTO component_templates_v2 (
      component_key, subject, display_name, description, color,
      default_duration_days, expansion_type, expansion_config,
      metadata_fields, default_blocks_curriculum, move_behavior,
      category, is_system, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (component_key) DO UPDATE SET
      subject = EXCLUDED.subject,
      display_name = EXCLUDED.display_name,
      description = EXCLUDED.description,
      color = EXCLUDED.color,
      default_duration_days = EXCLUDED.default_duration_days,
      expansion_type = EXCLUDED.expansion_type,
      expansion_config = EXCLUDED.expansion_config,
      metadata_fields = EXCLUDED.metadata_fields,
      default_blocks_curriculum = EXCLUDED.default_blocks_curriculum,
      move_behavior = EXCLUDED.move_behavior,
      category = EXCLUDED.category,
      updated_at = NOW()
  `;

  await pool.query(query, [
    template.component_key,
    template.subject,
    template.display_name,
    template.description,
    template.color,
    template.default_duration_days,
    template.expansion_type,
    JSON.stringify(template.expansion_config),
    JSON.stringify(template.metadata_fields),
    template.default_blocks_curriculum,
    template.move_behavior,
    template.category,
    template.is_system,
    template.created_at
  ]);
}

/**
 * Main migration function
 */
async function migrateTemplates() {
  console.log('='.repeat(60));
  console.log('NOLA ESS V2: Template Migration');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Fetch all V1 templates
    console.log('📥 Fetching V1 templates from component_templates...');
    const result = await pool.query('SELECT * FROM component_templates ORDER BY subject, component_key');
    const oldTemplates = result.rows;

    stats.total = oldTemplates.length;
    console.log(`✓ Found ${stats.total} templates\n`);

    // Show breakdown by subject
    const subjectCounts = {};
    oldTemplates.forEach(t => {
      subjectCounts[t.subject] = (subjectCounts[t.subject] || 0) + 1;
    });

    console.log('Breakdown by subject:');
    Object.entries(subjectCounts).forEach(([subject, count]) => {
      console.log(`  ${subject.padEnd(15)} : ${count} templates`);
    });
    console.log('');

    // Migrate each template
    console.log('🔄 Migrating templates to V2...\n');

    for (const oldTemplate of oldTemplates) {
      try {
        const newTemplate = convertTemplate(oldTemplate);
        await insertTemplateV2(newTemplate);

        stats.migrated++;
        stats.bySubject[newTemplate.subject]++;
        stats.byExpansionType[newTemplate.expansion_type]++;

        console.log(`✓ ${oldTemplate.component_key.padEnd(30)} → ${newTemplate.expansion_type}`);
      } catch (error) {
        stats.errors.push({
          template: oldTemplate.component_key,
          error: error.message
        });
        console.error(`✗ ${oldTemplate.component_key.padEnd(30)} → ERROR: ${error.message}`);
      }
    }

    // Print summary
    console.log('');
    console.log('='.repeat(60));
    console.log('Migration Complete!');
    console.log('='.repeat(60));
    console.log('');
    console.log(`Total templates: ${stats.total}`);
    console.log(`Migrated: ${stats.migrated}`);
    console.log(`Errors: ${stats.errors.length}`);
    console.log('');

    console.log('By Subject:');
    Object.entries(stats.bySubject).forEach(([subject, count]) => {
      console.log(`  ${subject.padEnd(15)} : ${count}`);
    });
    console.log('');

    console.log('By Expansion Type:');
    Object.entries(stats.byExpansionType).forEach(([type, count]) => {
      console.log(`  ${type.padEnd(15)} : ${count}`);
    });
    console.log('');

    if (stats.errors.length > 0) {
      console.log('❌ Errors encountered:');
      stats.errors.forEach(err => {
        console.log(`  ${err.template}: ${err.error}`);
      });
      console.log('');
    }

    // Verification query
    console.log('🔍 Verifying migration...');
    const verifyResult = await pool.query('SELECT COUNT(*) as count FROM component_templates_v2 WHERE is_system = true');
    const v2Count = parseInt(verifyResult.rows[0].count);

    console.log(`V1 templates: ${stats.total}`);
    console.log(`V2 templates: ${v2Count}`);

    if (v2Count >= stats.total) {
      console.log('✅ Migration successful! All templates migrated.');
    } else {
      console.log(`⚠️  Warning: V2 has ${stats.total - v2Count} fewer templates than V1`);
    }

    console.log('');
    console.log('Next steps:');
    console.log('1. Review migrated templates: SELECT * FROM component_templates_v2;');
    console.log('2. Spot-check expansion configs for accuracy');
    console.log('3. Proceed to Phase 3: Build Core API Endpoints');
    console.log('');

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
migrateTemplates()
  .then(() => {
    console.log('✨ Template migration completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
