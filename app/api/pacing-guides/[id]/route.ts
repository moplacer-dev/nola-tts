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

    // Fetch all scheduled items (V2) - replaces both calendar_events and scheduled_components
    const itemsResult = await pool.query(
      `SELECT
         si.id,
         si.guide_id,
         si.calendar_type,
         si.template_id,
         si.component_key,
         si.start_date,
         si.duration_days,
         si.title_override,
         si.color_override,
         si.metadata,
         si.blocks_curriculum,
         si.source,
         si.placement_group_id,
         si.display_order,
         si.created_at,
         t.display_name,
         t.color as template_color,
         t.expansion_type,
         t.expansion_config,
         t.default_duration_days,
         t.metadata_fields
       FROM scheduled_items_v2 si
       LEFT JOIN component_templates_v2 t ON si.template_id = t.id
       WHERE si.guide_id = $1
       ORDER BY si.start_date, si.display_order`,
      [id]
    );

    // Note: V2 doesn't use separate tables for calendars/events/components
    // Everything is in scheduled_items_v2 with calendar_type field

    // Combine the data (V2 format)
    const response = {
      ...guide,
      scheduled_items: itemsResult.rows,
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

    // Delete in order to respect foreign key constraints (V2):

    // 1. Delete all scheduled items (V2 - replaces components, events, calendars)
    await client.query(
      'DELETE FROM scheduled_items_v2 WHERE guide_id = $1',
      [id]
    );

    // 2. Delete the pacing guide itself
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
