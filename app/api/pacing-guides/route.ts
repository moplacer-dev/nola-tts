import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// Map event names to V2 component keys
function mapEventToComponentKey(eventName: string): string {
  const normalized = eventName.toLowerCase();

  // Known holidays
  if (normalized.includes('labor day')) return 'base_labor_day';
  if (normalized.includes('election day')) return 'base_election_day';
  if (normalized.includes('veterans day')) return 'base_veterans_day';
  if (normalized.includes('thanksgiving')) return 'base_thanksgiving_break';
  if (normalized.includes('winter break') || normalized.includes('christmas')) return 'base_winter_break';
  if (normalized.includes('mlk') || normalized.includes('martin luther king')) return 'base_mlk_day';
  if (normalized.includes('presidents') || normalized.includes('president')) return 'base_presidents_day';
  if (normalized.includes('mardi gras')) return 'base_mardi_gras';
  if (normalized.includes('spring break')) return 'base_spring_break';
  if (normalized.includes('memorial day')) return 'base_memorial_day';

  // Professional development
  if (normalized.includes('pd') || normalized.includes('professional development')) {
    return 'base_pd_day';
  }

  // Testing
  if (normalized.includes('state test') || normalized.includes('leap')) {
    return 'base_state_testing';
  }

  // Default to custom event
  return 'base_custom_event';
}

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

    if (!['7', '8', '9'].includes(grade_level)) {
      return NextResponse.json(
        { error: 'Grade level must be 7, 8, or 9' },
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

    // 2. Create base calendar events (if any) - V2 format
    if (events.length > 0) {
      for (const event of events) {
        // Map event to component_key (for matching templates)
        const componentKey = mapEventToComponentKey(event.event_name || event.event_type);

        // Find matching V2 template
        const templateResult = await client.query(
          `SELECT id FROM component_templates_v2 WHERE component_key = $1`,
          [componentKey]
        );

        const templateId = templateResult.rows[0]?.id || null;

        // Create scheduled_items_v2 entry
        await client.query(
          `INSERT INTO scheduled_items_v2 (
            guide_id, calendar_type, template_id, component_key,
            start_date, duration_days, title_override,
            blocks_curriculum, source, placement_group_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, gen_random_uuid())`,
          [
            guide.id,
            'base',
            templateId,
            componentKey,
            event.start_date,
            event.duration_days || 1,
            event.event_name,
            event.blocks_curriculum || false,
            'pdf_extraction'
          ]
        );
      }
    }

    // Note: V2 doesn't use subject_calendars table - calendar_type is stored per item

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
