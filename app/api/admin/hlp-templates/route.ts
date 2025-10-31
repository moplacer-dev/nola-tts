import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';

// GET /api/admin/hlp-templates - List all HLP module templates with session/enrichment counts
export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const result = await pool.query(`
      SELECT
        m.*,
        COUNT(DISTINCT s.id) as session_count,
        COUNT(DISTINCT e.id) as enrichment_count,
        COUNT(DISTINCT sm.hlp_id) as usage_count
      FROM hlp_module_templates m
      LEFT JOIN hlp_template_sessions s ON s.template_id = m.id
      LEFT JOIN hlp_template_enrichments e ON e.template_id = m.id
      LEFT JOIN hlp_selected_modules sm ON sm.template_id = m.id
      GROUP BY m.id
      ORDER BY m.module_name
    `);

    return NextResponse.json({ templates: result.rows });
  } catch (error) {
    console.error('Error fetching HLP templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/hlp-templates - Create new HLP module template
export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const body = await req.json();
    const { module_name, subject, grade_level, is_active = true } = body;

    if (!module_name) {
      return NextResponse.json(
        { error: 'Module name is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO hlp_module_templates (module_name, subject, grade_level, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [module_name, subject || null, grade_level || null, is_active]
    );

    return NextResponse.json({ template: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating HLP template:', error);

    // Check for unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A module with this name already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
