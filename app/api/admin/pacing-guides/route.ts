import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';

/**
 * GET /api/admin/pacing-guides?userId=<uuid>
 *
 * Admin-only: list all pacing guides belonging to the specified user.
 * Returns the columns the User Documents page actually displays.
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
        id,
        school_name,
        district_name,
        grade_level,
        first_day,
        last_day,
        created_at,
        updated_at
       FROM pacing_guides
       WHERE user_id = $1
       ORDER BY created_at DESC`,
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
