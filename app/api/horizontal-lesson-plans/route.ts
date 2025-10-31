import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import {
  CreateHLPRequest,
  CreateHLPResponse,
  HLPListResponse,
  HLPListItem,
  ValidationError,
} from '@/lib/hlp/types';

/**
 * POST /api/horizontal-lesson-plans
 *
 * Create a new Horizontal Lesson Plan
 * Body: CreateHLPRequest
 *
 * Returns: CreateHLPResponse
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateHLPRequest = await request.json();
    const { school_name, teacher_name, school_year, subject, selected_module_ids } = body;

    // Validate input
    const errors: ValidationError[] = [];

    if (!school_name?.trim()) {
      errors.push({ field: 'school_name', message: 'School name is required' });
    }
    if (!teacher_name?.trim()) {
      errors.push({ field: 'teacher_name', message: 'Teacher name is required' });
    }
    if (!school_year?.trim()) {
      errors.push({ field: 'school_year', message: 'School year is required' });
    }
    if (!subject?.trim()) {
      errors.push({ field: 'subject', message: 'Subject is required' });
    }
    if (!selected_module_ids || selected_module_ids.length === 0) {
      errors.push({ field: 'selected_module_ids', message: 'At least one module must be selected' });
    }
    if (selected_module_ids && selected_module_ids.length > 10) {
      errors.push({ field: 'selected_module_ids', message: 'Maximum 10 modules allowed' });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    // Use transaction to create HLP and selected modules atomically
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Create HLP record
      const hlpResult = await client.query(
        `INSERT INTO horizontal_lesson_plans
          (user_id, school_name, teacher_name, school_year, subject)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [session.user.id, school_name, teacher_name, school_year, subject]
      );

      const hlp = hlpResult.rows[0];

      // 2. Create selected module records
      const selectedModulesPromises = selected_module_ids.map((templateId, index) =>
        client.query(
          `INSERT INTO hlp_selected_modules
            (hlp_id, template_id, module_number)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [hlp.id, templateId, index + 1]
        )
      );

      const selectedModulesResults = await Promise.all(selectedModulesPromises);
      const selectedModules = selectedModulesResults.map((result: any) => result.rows[0]);

      await client.query('COMMIT');

      const response: CreateHLPResponse = {
        hlp: {
          id: hlp.id,
          user_id: hlp.user_id,
          school_name: hlp.school_name,
          teacher_name: hlp.teacher_name,
          school_year: hlp.school_year,
          subject: hlp.subject,
          created_at: new Date(hlp.created_at),
          updated_at: new Date(hlp.updated_at),
        },
        selected_modules: selectedModules.map((sm: any) => ({
          id: sm.id,
          hlp_id: sm.hlp_id,
          template_id: sm.template_id,
          module_number: sm.module_number,
          created_at: new Date(sm.created_at),
        })),
      };

      return NextResponse.json(response, { status: 201 });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating HLP:', error);
    return NextResponse.json(
      { error: 'Failed to create Horizontal Lesson Plan' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/horizontal-lesson-plans
 *
 * List all HLPs for the current user
 *
 * Returns: HLPListResponse
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's HLPs with module counts and names
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
      [session.user.id]
    );

    const hlps: HLPListItem[] = result.rows.map((row: any) => ({
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
    console.error('Error fetching HLPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Horizontal Lesson Plans' },
      { status: 500 }
    );
  }
}
