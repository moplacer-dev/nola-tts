/**
 * Migration Script: Fix blocks_curriculum flag for existing calendar events
 *
 * This script updates calendar events that should block curriculum but don't have
 * the flag set. This is needed for events created before the auto-detection logic
 * was added.
 *
 * Run with: node scripts/fix-blocked-dates.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/nola_ess',
});

// Same logic as in app/dashboard/guides/[id]/page.tsx
const shouldBlockCurriculum = (eventName) => {
  const lowerName = eventName.toLowerCase();
  const blockingKeywords = [
    'break', 'winter break', 'spring break', 'thanksgiving',
    'no school', 'half day', 'holiday',
    'labor day', 'mlk', 'martin luther king', 'veterans day', 'memorial day',
    'presidents', 'juneteenth', 'election day',
    'first day for students', 'last day for students'
  ];
  return blockingKeywords.some(keyword => lowerName.includes(keyword));
};

async function fixBlockedDates() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking for calendar events that should block curriculum...\n');

    // Find all calendar events
    const allEvents = await client.query(
      `SELECT id, event_name, blocks_curriculum, start_date, duration_days
       FROM calendar_events
       ORDER BY start_date`
    );

    console.log(`Found ${allEvents.rows.length} total calendar events\n`);

    // Find events that should block but don't
    const needsFixing = allEvents.rows.filter(event =>
      shouldBlockCurriculum(event.event_name) && !event.blocks_curriculum
    );

    if (needsFixing.length === 0) {
      console.log('✅ All events are correctly configured!');
      console.log('   No updates needed.');
      return;
    }

    console.log(`❗ Found ${needsFixing.length} events that need updating:\n`);

    needsFixing.forEach((event, index) => {
      console.log(`   ${index + 1}. "${event.event_name}" on ${event.start_date.toISOString().split('T')[0]} (${event.duration_days} days)`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('These events will be updated to blocks_curriculum = true');
    console.log('='.repeat(60) + '\n');

    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      readline.question('Update these events? (yes/no): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Migration cancelled.');
      return;
    }

    // Update events
    console.log('\n🔧 Updating events...\n');

    let updateCount = 0;
    for (const event of needsFixing) {
      await client.query(
        `UPDATE calendar_events
         SET blocks_curriculum = true
         WHERE id = $1`,
        [event.id]
      );
      updateCount++;
      console.log(`   ✓ Updated "${event.event_name}"`);
    }

    console.log(`\n✅ Successfully updated ${updateCount} events!`);

    // Show summary
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION');
    console.log('='.repeat(60) + '\n');

    const verification = await client.query(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN blocks_curriculum = true THEN 1 ELSE 0 END) as blocking
       FROM calendar_events`
    );

    console.log(`Total events: ${verification.rows[0].total}`);
    console.log(`Events that block curriculum: ${verification.rows[0].blocking}`);
    console.log(`Events that don't block: ${verification.rows[0].total - verification.rows[0].blocking}`);

  } catch (error) {
    console.error('❌ Error fixing blocked dates:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixBlockedDates();
