import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';

// POST /api/admin/hlp-templates/:id/sessions - Create or update session
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const { id: templateId } = await params;
    const body = await req.json();
    const { session_number, focus, objectives, materials, teacher_prep, assessments } = body;

    if (!session_number || !focus || !objectives) {
      return NextResponse.json(
        { error: 'Session number, focus, and objectives are required' },
        { status: 400 }
      );
    }

    if (session_number < 1 || session_number > 7) {
      return NextResponse.json(
        { error: 'Session number must be between 1 and 7' },
        { status: 400 }
      );
    }

    // Upsert session (insert or update if exists)
    const result = await pool.query(
      `INSERT INTO hlp_template_sessions
       (template_id, session_number, focus, objectives, materials, teacher_prep, assessments)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (template_id, session_number)
       DO UPDATE SET
         focus = EXCLUDED.focus,
         objectives = EXCLUDED.objectives,
         materials = EXCLUDED.materials,
         teacher_prep = EXCLUDED.teacher_prep,
         assessments = EXCLUDED.assessments,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [templateId, session_number, focus, objectives, materials || null, teacher_prep || null, assessments || null]
    );

    return NextResponse.json({ session: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating session:', error);
    return NextResponse.json(
      { error: 'Failed to save session' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/hlp-templates/:id/sessions/:sessionNumber
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const { id: templateId } = await params;
    const { searchParams } = new URL(req.url);
    const sessionNumber = searchParams.get('session_number');

    if (!sessionNumber) {
      return NextResponse.json(
        { error: 'Session number is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'DELETE FROM hlp_template_sessions WHERE template_id = $1 AND session_number = $2 RETURNING *',
      [templateId, parseInt(sessionNumber)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
