import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';

/**
 * GET /api/admin/pacing-guides/[id]
 *
 * Admin-only: fetch the full pacing guide including all scheduled items.
 * Mirrors the user-scoped sibling at /api/pacing-guides/[id], but without
 * the ownership filter — admins can read any guide.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  const { id } = await params;

  try {
    const guideResult = await pool.query(
      `SELECT id, school_name, district_name, grade_level, first_day, last_day, created_at, updated_at, user_id
       FROM pacing_guides
       WHERE id = $1`,
      [id]
    );

    if (guideResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pacing guide not found' },
        { status: 404 }
      );
    }

    const guide = guideResult.rows[0];

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

    return NextResponse.json({
      ...guide,
      scheduled_items: itemsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching pacing guide for admin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pacing guide' },
      { status: 500 }
    );
  }
}
