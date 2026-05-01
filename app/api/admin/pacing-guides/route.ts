import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';

/**
 * GET /api/admin/pacing-guides?userId=<uuid>
 *
 * Admin-only: list all pacing guides belonging to the specified user.
 * Returns the same shape as GET /api/pacing-guides for the user-scoped view.
 */
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `SELECT
        pg.id,
        pg.school_name,
        pg.district_name,
        pg.grade_level,
        pg.first_day,
        pg.last_day,
        pg.created_at,
        pg.updated_at,
        MAX(v.version_number) as current_version,
        MAX(v.created_at) as last_repaced_at
       FROM pacing_guides pg
       LEFT JOIN pacing_guide_versions v ON pg.id = v.guide_id
       WHERE pg.user_id = $1
       GROUP BY pg.id, pg.school_name, pg.district_name, pg.grade_level, pg.first_day, pg.last_day, pg.created_at, pg.updated_at
       ORDER BY pg.created_at DESC`,
      [userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching pacing guides for user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pacing guides' },
      { status: 500 }
    );
  }
}
