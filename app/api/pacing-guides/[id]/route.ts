import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// GET - Fetch a single pacing guide with its calendars and events
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the pacing guide
    const guideResult = await pool.query(
      `SELECT id, school_name, district_name, grade_level, first_day, last_day, created_at, updated_at
       FROM pacing_guides
       WHERE id = $1 AND user_id = $2`,
      [id, session.user.id]
    );

    if (guideResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pacing guide not found' },
        { status: 404 }
      );
    }

    const guide = guideResult.rows[0];

    // Fetch subject calendars
    const calendarsResult = await pool.query(
      `SELECT id, subject, created_at
       FROM subject_calendars
       WHERE pacing_guide_id = $1
       ORDER BY CASE subject
         WHEN 'base' THEN 1
         WHEN 'ela' THEN 2
         WHEN 'math' THEN 3
         WHEN 'science' THEN 4
         WHEN 'social_studies' THEN 5
       END`,
      [id]
    );

    // Fetch calendar events
    const eventsResult = await pool.query(
      `SELECT id, event_name, start_date, duration_days, event_type, is_base_event, blocks_curriculum, color
       FROM calendar_events
       WHERE pacing_guide_id = $1
       ORDER BY start_date`,
      [id]
    );

    // Fetch scheduled components for all calendars in this guide
    // LEFT JOIN with component_templates to gracefully handle orphaned components (deleted templates)
    // Use COALESCE to prefer overrides, fall back to template values, then to defaults
    const componentsResult = await pool.query(
      `SELECT
         sc.id,
         sc.subject_calendar_id,
         sc.component_key,
         sc.subject,
         sc.start_date,
         sc.duration_days,
         sc.title_override,
         sc."order",
         sc.notes,
         sc.group_id,
         sc.display_order,
         COALESCE(ct.display_name, 'Deleted Component') as display_name,
         COALESCE(sc.color_override, ct.color, '#6B7280') as color
       FROM scheduled_components sc
       JOIN subject_calendars cal ON sc.subject_calendar_id = cal.id
       LEFT JOIN component_templates ct ON sc.component_key = ct.component_key
       WHERE cal.pacing_guide_id = $1
       ORDER BY sc.start_date, sc.display_order`,
      [id]
    );

    // Combine the data
    const response = {
      ...guide,
      calendars: calendarsResult.rows,
      events: eventsResult.rows,
      scheduled_components: componentsResult.rows,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching pacing guide:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pacing guide' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a pacing guide and all related data
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Start transaction
    await client.query('BEGIN');

    // Verify user owns the pacing guide
    const guideResult = await client.query(
      'SELECT id FROM pacing_guides WHERE id = $1 AND user_id = $2',
      [id, session.user.id]
    );

    if (guideResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Pacing guide not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete in order to respect foreign key constraints:

    // 1. Delete scheduled components (references subject_calendars)
    await client.query(
      `DELETE FROM scheduled_components
       WHERE subject_calendar_id IN (
         SELECT id FROM subject_calendars WHERE pacing_guide_id = $1
       )`,
      [id]
    );

    // 2. Delete calendar events (references pacing_guides)
    await client.query(
      'DELETE FROM calendar_events WHERE pacing_guide_id = $1',
      [id]
    );

    // 3. Delete subject calendars (references pacing_guides)
    await client.query(
      'DELETE FROM subject_calendars WHERE pacing_guide_id = $1',
      [id]
    );

    // 4. Delete the pacing guide itself
    await client.query(
      'DELETE FROM pacing_guides WHERE id = $1',
      [id]
    );

    // Commit transaction
    await client.query('COMMIT');

    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting pacing guide:', error);
    return NextResponse.json(
      { error: 'Failed to delete pacing guide' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
