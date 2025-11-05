import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

/**
 * POST - Add AI-extracted events directly to base calendar
 * This endpoint creates scheduled_items_v2 with exact durations from AI extraction,
 * bypassing the template expansion logic.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: guideId } = await params;
    const body = await req.json();
    const { events } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      );
    }

    // Verify guide ownership
    const guideCheck = await pool.query(
      'SELECT id FROM pacing_guides WHERE id = $1 AND user_id = $2',
      [guideId, session.user.id]
    );

    if (guideCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    // Get all base templates to match component_keys
    const templatesResult = await pool.query(
      'SELECT id, component_key FROM component_templates_v2 WHERE subject = $1',
      ['base']
    );

    const templateMap = new Map();
    for (const template of templatesResult.rows) {
      templateMap.set(template.component_key, template.id);
    }

    // Insert all events
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const event of events) {
        const componentKey = event.matched_template || 'base_custom_event';
        const templateId = templateMap.get(componentKey);

        if (!templateId) {
          console.warn(`Template not found for ${componentKey}, skipping event: ${event.event_name}`);
          continue;
        }

        await client.query(
          `INSERT INTO scheduled_items_v2 (
            guide_id, calendar_type, template_id, component_key,
            start_date, duration_days, title_override,
            blocks_curriculum, source, placement_group_id, display_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, gen_random_uuid(), 0)`,
          [
            guideId,
            'base',
            templateId,
            componentKey,
            event.start_date,
            event.duration_days || 1,
            event.event_name,
            true, // All base calendar events block curriculum
            'pdf_extraction'
          ]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        count: events.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Add extracted events error:', error);
    return NextResponse.json(
      { error: 'Failed to add extracted events' },
      { status: 500 }
    );
  }
}
