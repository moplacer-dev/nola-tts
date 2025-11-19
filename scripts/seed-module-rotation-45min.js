/**
 * Seed script: Module Rotation (45-min)
 *
 * This creates a 13-day module rotation for 45-minute class periods
 * where each session takes 1.5 class periods to complete.
 *
 * Run locally: node scripts/seed-module-rotation-45min.js
 * Run on Render: DATABASE_URL="postgresql://..." node scripts/seed-module-rotation-45min.js
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/nola_ess'
});

async function seedModuleRotation45min() {
  console.log('='.repeat(60));
  console.log('Seeding: Module Rotation (45-min)');
  console.log('='.repeat(60));
  console.log('');

  // The 13-day sequence for 7 sessions at 1.5 days per session
  const items = [
    { title: 'R{rotation}, S1', days: 1 },
    { title: 'R{rotation}, S1 + Begin S2', days: 1 },
    { title: 'R{rotation}, S2', days: 1 },
    { title: 'R{rotation}, S2 + Begin S3', days: 1 },
    { title: 'R{rotation}, S3', days: 1 },
    { title: 'R{rotation}, S3 + Begin S4', days: 1 },
    { title: 'R{rotation}, S4', days: 1 },
    { title: 'R{rotation}, S4 + Begin S5', days: 1 },
    { title: 'R{rotation}, S5', days: 1 },
    { title: 'R{rotation}, S5 + Begin S6', days: 1 },
    { title: 'R{rotation}, S6', days: 1 },
    { title: 'R{rotation}, S6 + Begin S7', days: 1 },
    { title: 'R{rotation}, S7', days: 1 },
  ];

  const template = {
    component_key: 'science_module_rotation_45min',
    subject: 'science',
    display_name: 'Module Rotation (45-min)',
    description: '13-day module rotation for 45-minute class periods - each session takes 1.5 class periods',
    color: '#A855F7', // Same purple as regular Module Rotation
    default_duration_days: 13,
    expansion_type: 'multi_sequence', // Use sequence since each day has unique title
    expansion_config: { items },
    metadata_fields: ['rotation_number'],
    default_blocks_curriculum: null,
    move_behavior: 'independent',
    category: 'Modules',
    is_system: true
  };

  try {
    const query = `
      INSERT INTO component_templates_v2 (
        component_key, subject, display_name, description, color,
        default_duration_days, expansion_type, expansion_config,
        metadata_fields, default_blocks_curriculum, move_behavior,
        category, is_system
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
      RETURNING id, component_key, display_name
    `;

    const result = await pool.query(query, [
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
      template.is_system
    ]);

    console.log('✅ Successfully seeded template:');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Key: ${result.rows[0].component_key}`);
    console.log(`   Name: ${result.rows[0].display_name}`);
    console.log('');
    console.log('Template details:');
    console.log(`   Subject: ${template.subject}`);
    console.log(`   Duration: ${template.default_duration_days} days`);
    console.log(`   Expansion type: ${template.expansion_type}`);
    console.log(`   Category: ${template.category}`);
    console.log(`   Color: ${template.color}`);
    console.log('');
    console.log('Day sequence:');
    items.forEach((item, i) => {
      console.log(`   Day ${i + 1}: ${item.title}`);
    });
    console.log('');

    // Verify the insert
    const verifyResult = await pool.query(
      'SELECT COUNT(*) as count FROM component_templates_v2 WHERE subject = $1',
      ['science']
    );
    console.log(`Total science templates: ${verifyResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error seeding template:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed
seedModuleRotation45min()
  .then(() => {
    console.log('');
    console.log('✨ Seed complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  });
