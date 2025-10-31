import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { HLPDetails, ModuleWithData } from '@/lib/hlp/types';

/**
 * GET /api/horizontal-lesson-plans/[id]
 *
 * Get complete HLP details with all modules, sessions, and enrichments
 *
 * Returns: HLPDetails
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: hlpId } = await params;

    // 1. Fetch HLP record and verify ownership
    const hlpResult = await pool.query(
      `SELECT * FROM horizontal_lesson_plans
       WHERE id = $1 AND user_id = $2`,
      [hlpId, session.user.id]
    );

    if (hlpResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Horizontal Lesson Plan not found' },
        { status: 404 }
      );
    }

    const hlp = hlpResult.rows[0];

    // 2. Fetch selected modules with template data
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

    // 3. Fetch all sessions for selected modules
    const templateIds = modulesResult.rows.map((m: any) => m.id);

    let sessions = [];
    if (templateIds.length > 0) {
      const sessionsResult = await pool.query(
        `SELECT * FROM hlp_template_sessions
         WHERE template_id = ANY($1)
         ORDER BY template_id, session_number ASC`,
        [templateIds]
      );
      sessions = sessionsResult.rows;
    }

    // 4. Fetch all enrichments for selected modules
    let enrichments = [];
    if (templateIds.length > 0) {
      const enrichmentsResult = await pool.query(
        `SELECT * FROM hlp_template_enrichments
         WHERE template_id = ANY($1)
         ORDER BY template_id, enrichment_number ASC`,
        [templateIds]
      );
      enrichments = enrichmentsResult.rows;
    }

    // 5. Combine data into ModuleWithData structure
    const modules: ModuleWithData[] = modulesResult.rows.map((moduleRow: any) => ({
      template: {
        id: moduleRow.id,
        module_name: moduleRow.module_name,
        subject: moduleRow.subject,
        grade_level: moduleRow.grade_level,
        is_active: moduleRow.is_active,
        created_at: new Date(moduleRow.created_at),
        updated_at: new Date(moduleRow.updated_at),
      },
      module_number: moduleRow.module_number,
      sessions: sessions
        .filter((s: any) => s.template_id === moduleRow.id)
        .map((s: any) => ({
          id: s.id,
          template_id: s.template_id,
          session_number: s.session_number,
          focus: s.focus,
          objectives: s.objectives,
          materials: s.materials,
          teacher_prep: s.teacher_prep,
          assessments: s.assessments,
          created_at: new Date(s.created_at),
          updated_at: new Date(s.updated_at),
        })),
      enrichments: enrichments
        .filter((e: any) => e.template_id === moduleRow.id)
        .map((e: any) => ({
          id: e.id,
          template_id: e.template_id,
          enrichment_number: e.enrichment_number,
          title: e.title,
          description: e.description,
          created_at: new Date(e.created_at),
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
    console.error('Error fetching HLP details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Horizontal Lesson Plan details' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/horizontal-lesson-plans/[id]
 *
 * Delete an HLP and all its selected modules
 *
 * Returns: Success message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: hlpId } = await params;

    // Use transaction for atomic delete
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Verify ownership
      const hlpResult = await client.query(
        `SELECT id FROM horizontal_lesson_plans
         WHERE id = $1 AND user_id = $2`,
        [hlpId, session.user.id]
      );

      if (hlpResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Horizontal Lesson Plan not found' },
          { status: 404 }
        );
      }

      // 2. Delete selected modules (foreign key cascade should handle this, but explicit is safer)
      await client.query(
        `DELETE FROM hlp_selected_modules WHERE hlp_id = $1`,
        [hlpId]
      );

      // 3. Delete HLP record
      await client.query(
        `DELETE FROM horizontal_lesson_plans WHERE id = $1`,
        [hlpId]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Horizontal Lesson Plan deleted successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error deleting HLP:', error);
    return NextResponse.json(
      { error: 'Failed to delete Horizontal Lesson Plan' },
      { status: 500 }
    );
  }
}
