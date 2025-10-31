import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';

// GET /api/admin/hlp-templates/:id - Get template with sessions and enrichments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const { id } = await params;

    // Get template
    const templateResult = await pool.query(
      'SELECT * FROM hlp_module_templates WHERE id = $1',
      [id]
    );

    if (templateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Get sessions
    const sessionsResult = await pool.query(
      `SELECT * FROM hlp_template_sessions
       WHERE template_id = $1
       ORDER BY session_number`,
      [id]
    );

    // Get enrichments
    const enrichmentsResult = await pool.query(
      `SELECT * FROM hlp_template_enrichments
       WHERE template_id = $1
       ORDER BY enrichment_number`,
      [id]
    );

    return NextResponse.json({
      template: templateResult.rows[0],
      sessions: sessionsResult.rows,
      enrichments: enrichmentsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/hlp-templates/:id - Update template
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { module_name, subject, grade_level, is_active } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (module_name !== undefined) {
      updates.push(`module_name = $${paramCount++}`);
      values.push(module_name);
    }
    if (subject !== undefined) {
      updates.push(`subject = $${paramCount++}`);
      values.push(subject);
    }
    if (grade_level !== undefined) {
      updates.push(`grade_level = $${paramCount++}`);
      values.push(grade_level);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE hlp_module_templates
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating template:', error);

    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A module with this name already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/hlp-templates/:id - Delete template (cascades to sessions/enrichments)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const { id } = await params;

    const result = await pool.query(
      'DELETE FROM hlp_module_templates WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
