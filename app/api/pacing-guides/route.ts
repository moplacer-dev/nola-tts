import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// GET - Fetch all pacing guides for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT id, school_name, district_name, grade_level, first_day, last_day, created_at, updated_at
       FROM pacing_guides
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [session.user.id]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching pacing guides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pacing guides' },
      { status: 500 }
    );
  }
}

// POST - Create a new pacing guide with events and calendars
export async function POST(req: NextRequest) {
  const client = await pool.connect();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { school_name, district_name, grade_level, first_day, last_day, events = [] } = body;

    // Validation
    if (!school_name || !district_name || !grade_level || !first_day || !last_day) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!['7', '8'].includes(grade_level)) {
      return NextResponse.json(
        { error: 'Grade level must be 7 or 8' },
        { status: 400 }
      );
    }

    // Start transaction
    await client.query('BEGIN');

    // 1. Create pacing guide
    const guideResult = await client.query(
      `INSERT INTO pacing_guides (user_id, school_name, district_name, grade_level, first_day, last_day)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, school_name, district_name, grade_level, first_day, last_day, created_at, updated_at`,
      [session.user.id, school_name, district_name, grade_level, first_day, last_day]
    );

    const guide = guideResult.rows[0];

    // 2. Create calendar events (if any)
    if (events.length > 0) {
      for (const event of events) {
        await client.query(
          `INSERT INTO calendar_events (pacing_guide_id, event_name, start_date, duration_days, event_type, is_base_event)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [guide.id, event.event_name, event.start_date, event.duration_days, event.event_type, true]
        );
      }
    }

    // 3. Create 5 subject calendars (Base, ELA, Math, Science, Social Studies)
    const subjects = ['base', 'ela', 'math', 'science', 'social_studies'];
    for (const subject of subjects) {
      await client.query(
        `INSERT INTO subject_calendars (pacing_guide_id, subject)
         VALUES ($1, $2)`,
        [guide.id, subject]
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    return NextResponse.json(guide, { status: 201 });
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error creating pacing guide:', error);
    return NextResponse.json(
      { error: 'Failed to create pacing guide' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
