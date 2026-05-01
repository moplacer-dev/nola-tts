import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';
import { HLPListItem, HLPListResponse } from '@/lib/hlp/types';

interface HLPRow {
  id: string;
  school_name: string;
  teacher_name: string;
  school_year: string;
  subject: string;
  created_at: string | Date;
  module_count: string;
  module_names: string[] | null;
}

/**
 * GET /api/admin/horizontal-lesson-plans?userId=<uuid>
 *
 * Admin-only: list all HLPs belonging to the specified user.
 * Returns the same shape as GET /api/horizontal-lesson-plans for the user-scoped view.
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
        h.id,
        h.school_name,
        h.teacher_name,
        h.school_year,
        h.subject,
        h.created_at,
        COUNT(sm.id) as module_count,
        ARRAY_AGG(m.module_name ORDER BY sm.module_number) as module_names
      FROM horizontal_lesson_plans h
      LEFT JOIN hlp_selected_modules sm ON h.id = sm.hlp_id
      LEFT JOIN hlp_module_templates m ON sm.template_id = m.id
      WHERE h.user_id = $1
      GROUP BY h.id, h.school_name, h.teacher_name, h.school_year, h.subject, h.created_at
      ORDER BY h.created_at DESC`,
      [userId]
    );

    const hlps: HLPListItem[] = result.rows.map((row: HLPRow) => ({
      id: row.id,
      school_name: row.school_name,
      teacher_name: row.teacher_name,
      school_year: row.school_year,
      subject: row.subject,
      module_count: parseInt(row.module_count),
      module_names: row.module_names || [],
      created_at: new Date(row.created_at),
    }));

    const response: HLPListResponse = { hlps };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching HLPs for user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Horizontal Lesson Plans' },
      { status: 500 }
    );
  }
}
