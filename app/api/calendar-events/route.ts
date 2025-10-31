import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// POST - Create a new calendar event
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { pacing_guide_id, event_name, event_type, start_date, duration_days, blocks_curriculum, color } = body;

    // Validate required fields
    if (!pacing_guide_id || !event_name || !start_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the pacing guide belongs to this user
    const authCheck = await pool.query(
      'SELECT id FROM pacing_guides WHERE id = $1 AND user_id = $2',
      [pacing_guide_id, session.user.id]
    );

    if (authCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pacing guide not found or unauthorized' },
        { status: 404 }
      );
    }

    // DEBUG: Log what we're about to insert
    const eventData = {
      pacing_guide_id,
      event_name,
      event_type: event_type || 'other',
      start_date,
      duration_days: duration_days || 1,
      blocks_curriculum: blocks_curriculum || false,
      color: color || '#6B7280',
    };
    console.log('=== DEBUG: Attempting to create event ===');
    console.log('Event data:', eventData);

    // Create the calendar event
    const result = await pool.query(
      `INSERT INTO calendar_events (
        pacing_guide_id,
        event_name,
        event_type,
        start_date,
        duration_days,
        is_base_event,
        blocks_curriculum,
        color
      ) VALUES ($1, $2, $3, $4, $5, true, $6, $7)
      RETURNING id, event_name, event_type, start_date, duration_days, is_base_event, blocks_curriculum, color`,
      [
        pacing_guide_id,
        event_name,
        event_type || 'other',
        start_date,
        duration_days || 1,
        blocks_curriculum || false,
        color || '#6B7280',
      ]
    );

    console.log(`=== SUCCESS: Created event ID ${result.rows[0].id} for "${event_name}" on ${start_date} ===`);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('=== ERROR: Failed to create calendar event ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Check if it's a database constraint error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Database error code:', (error as any).code);
      console.error('Database error detail:', (error as any).detail);
      console.error('Database error constraint:', (error as any).constraint);
    }

    return NextResponse.json(
      { error: 'Failed to create calendar event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
