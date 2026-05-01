import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';
import { HLPDetails, ModuleWithData } from '@/lib/hlp/types';

/**
 * GET /api/admin/horizontal-lesson-plans/[id]
 *
 * Admin-only: fetch the full HLP with selected modules, sessions, and enrichments.
 * Mirrors the user-scoped sibling at /api/horizontal-lesson-plans/[id], but
 * without the ownership filter.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  const { id: hlpId } = await params;

  try {
    const hlpResult = await pool.query(
      `SELECT * FROM horizontal_lesson_plans WHERE id = $1`,
      [hlpId]
    );

    if (hlpResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Horizontal Lesson Plan not found' },
        { status: 404 }
      );
    }

    const hlp = hlpResult.rows[0];

    const modulesResult = await pool.query(
      `SELECT
        sm.module_number,
        m.id,
        m.module_name,
        m.subject,
        m.grade_level,
        m.is_active,
        m.created_at,
        m.updated_at
      FROM hlp_selected_modules sm
      JOIN hlp_module_templates m ON sm.template_id = m.id
      WHERE sm.hlp_id = $1
      ORDER BY sm.module_number ASC`,
      [hlpId]
    );

    const templateIds = modulesResult.rows.map((m: { id: string }) => m.id);

    let sessions: Array<Record<string, unknown>> = [];
    let enrichments: Array<Record<string, unknown>> = [];
    if (templateIds.length > 0) {
      const sessionsResult = await pool.query(
        `SELECT * FROM hlp_template_sessions
         WHERE template_id = ANY($1)
         ORDER BY template_id, session_number ASC`,
        [templateIds]
      );
      sessions = sessionsResult.rows;

      const enrichmentsResult = await pool.query(
        `SELECT * FROM hlp_template_enrichments
         WHERE template_id = ANY($1)
         ORDER BY template_id, enrichment_number ASC`,
        [templateIds]
      );
      enrichments = enrichmentsResult.rows;
    }

    const modules: ModuleWithData[] = modulesResult.rows.map((moduleRow: Record<string, unknown>) => ({
      template: {
        id: moduleRow.id as string,
        module_name: moduleRow.module_name as string,
        subject: moduleRow.subject as string,
        grade_level: moduleRow.grade_level as string,
        is_active: moduleRow.is_active as boolean,
        created_at: new Date(moduleRow.created_at as string),
        updated_at: new Date(moduleRow.updated_at as string),
      },
      module_number: moduleRow.module_number as number,
      sessions: sessions
        .filter((s) => s.template_id === moduleRow.id)
        .map((s) => ({
          id: s.id as string,
          template_id: s.template_id as string,
          session_number: s.session_number as number,
          focus: s.focus as string,
          objectives: s.objectives as string,
          materials: s.materials as string,
          teacher_prep: s.teacher_prep as string,
          assessments: s.assessments as string,
          created_at: new Date(s.created_at as string),
          updated_at: new Date(s.updated_at as string),
        })),
      enrichments: enrichments
        .filter((e) => e.template_id === moduleRow.id)
        .map((e) => ({
          id: e.id as string,
          template_id: e.template_id as string,
          enrichment_number: e.enrichment_number as number,
          title: e.title as string,
          description: e.description as string,
          created_at: new Date(e.created_at as string),
        })),
    }));

    const response: HLPDetails = {
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
      modules,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching HLP for admin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Horizontal Lesson Plan' },
      { status: 500 }
    );
  }
}
