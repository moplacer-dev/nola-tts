import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';

/**
 * GET /api/admin/component-templates
 * List all component templates (system and user-created)
 */
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const result = await pool.query(
      `SELECT
        ct.id,
        ct.component_key,
        ct.subject,
        ct.display_name,
        ct.default_duration_days,
        ct.color,
        ct.description,
        ct.is_active,
        ct.user_id,
        ct.metadata,
        ct.created_at,
        COALESCE(u.name, 'System') as creator_name,
        COUNT(sc.id) as usage_count
       FROM component_templates ct
       LEFT JOIN users u ON ct.user_id = u.id
       LEFT JOIN scheduled_components sc ON sc.component_key = ct.component_key
       GROUP BY ct.id, u.name
       ORDER BY ct.subject, ct.display_name`
    );

    return NextResponse.json({ templates: result.rows });
  } catch (error) {
    console.error('Error fetching component templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch component templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/component-templates
 * Create a new system component template
 */
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const body = await request.json();
    const { component_key, subject, display_name, default_duration_days, color, description, metadata } = body;

    // Validation
    if (!component_key || !subject || !display_name || !color) {
      return NextResponse.json(
        { error: 'Missing required fields: component_key, subject, display_name, color' },
        { status: 400 }
      );
    }

    if (!['base', 'ela', 'math', 'science', 'social_studies'].includes(subject)) {
      return NextResponse.json(
        { error: 'Invalid subject' },
        { status: 400 }
      );
    }

    // Check if component_key already exists
    const existingTemplate = await pool.query(
      'SELECT id FROM component_templates WHERE component_key = $1',
      [component_key]
    );

    if (existingTemplate.rows.length > 0) {
      return NextResponse.json(
        { error: 'Component key already exists' },
        { status: 400 }
      );
    }

    // Create template (user_id = NULL for system templates)
    const result = await pool.query(
      `INSERT INTO component_templates (
        component_key,
        subject,
        display_name,
        default_duration_days,
        color,
        description,
        metadata,
        is_active,
        user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NULL)
      RETURNING *`,
      [
        component_key,
        subject,
        display_name,
        default_duration_days || 1,
        color,
        description || null,
        metadata || null,
      ]
    );

    return NextResponse.json({
      message: 'Template created successfully',
      template: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating component template:', error);
    return NextResponse.json(
      { error: 'Failed to create component template' },
      { status: 500 }
    );
  }
}
