import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { generateHLPDocument, generateFilename } from '@/lib/hlp/generator';
import { DOCXGenerationData } from '@/lib/hlp/types';

/**
 * POST /api/horizontal-lesson-plans/[id]/generate
 *
 * Generate and download DOCX file for an HLP
 *
 * Returns: DOCX file (binary)
 */
export async function POST(
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
    console.log('🟣 [API] Starting document generation for HLP ID:', hlpId);

    // Extract export options from query parameters (defaults to true for backward compatibility)
    const { searchParams } = new URL(request.url);
    const exportOptions = {
      includeFocus: searchParams.get('include_focus') !== 'false',
      includeGoals: searchParams.get('include_goals') !== 'false',
      includeMaterials: searchParams.get('include_materials') !== 'false',
      includeTeacherPrep: searchParams.get('include_teacher_prep') !== 'false',
      includePBA: searchParams.get('include_pba') !== 'false',
      includeEnrichments: searchParams.get('include_enrichments') !== 'false',
    };
    console.log('🟣 [API] Export options:', exportOptions);

    // 1. Fetch HLP record and verify ownership
    console.log('🟣 [API] Fetching HLP record...');
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
    console.log('🟣 [API] HLP record found:', hlp.school_name, hlp.subject);

    // 2. Fetch selected modules with template data
    console.log('🟣 [API] Fetching selected modules...');
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

    if (modulesResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No modules selected for this HLP' },
        { status: 400 }
      );
    }

    // 3. Fetch all sessions for selected modules
    const templateIds = modulesResult.rows.map((m: any) => m.id);
    console.log('🟣 [API] Found', modulesResult.rows.length, 'modules. Fetching sessions...');

    const sessionsResult = await pool.query(
      `SELECT * FROM hlp_template_sessions
       WHERE template_id = ANY($1)
       ORDER BY template_id, session_number ASC`,
      [templateIds]
    );

    const sessions = sessionsResult.rows;
    console.log('🟣 [API] Found', sessions.length, 'sessions. Fetching enrichments...');

    // 4. Fetch all enrichments for selected modules
    const enrichmentsResult = await pool.query(
      `SELECT * FROM hlp_template_enrichments
       WHERE template_id = ANY($1)
       ORDER BY template_id, enrichment_number ASC`,
      [templateIds]
    );

    const enrichments = enrichmentsResult.rows;

    // 5. Build generation data structure
    const generationData: DOCXGenerationData = {
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
      modules: modulesResult.rows.map((moduleRow: any) => ({
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
      })),
    };

    // 6. Verify all modules have 7 sessions
    for (const moduleData of generationData.modules) {
      if (moduleData.sessions.length !== 7) {
        return NextResponse.json(
          {
            error: `Module "${moduleData.template.module_name}" has incomplete session data (${moduleData.sessions.length}/7 sessions)`,
          },
          { status: 500 }
        );
      }
    }

    // 7. Generate DOCX document
    console.log('🟣 [API] Calling generateHLPDocument...');
    const buffer = await generateHLPDocument(generationData, exportOptions);
    console.log('🟣 [API] Document generated successfully, buffer size:', buffer.length);

    // 8. Generate filename
    const filename = generateFilename(generationData);

    // 9. Return DOCX file with proper headers
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('===========================================');
    console.error('ERROR GENERATING HLP DOCUMENT');
    console.error('Error Message:', errorMessage);
    console.error('Error Stack:', errorStack);
    console.error('Error Object:', error);
    console.error('===========================================');

    return NextResponse.json(
      {
        error: 'Failed to generate Horizontal Lesson Plan document',
        details: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}
