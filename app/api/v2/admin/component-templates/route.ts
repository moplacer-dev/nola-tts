import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';

/**
 * GET /api/v2/admin/component-templates
 * List all component templates (system and user-created) for admin dashboard
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
        ct.expansion_type,
        ct.expansion_config,
        ct.metadata_fields,
        ct.category,
        ct.is_system,
        ct.created_by as user_id,
        ct.created_at,
        ct.updated_at,
        COALESCE(u.name, 'System') as creator_name,
        COUNT(si.id) as usage_count
       FROM component_templates_v2 ct
       LEFT JOIN users u ON ct.created_by = u.id
       LEFT JOIN scheduled_items_v2 si ON si.component_key = ct.component_key
       GROUP BY ct.id, u.name
       ORDER BY ct.subject, ct.display_name`
    );

    // Note: V2 doesn't have is_active field - all templates are active
    // Map to match admin page expectations
    const templates = result.rows.map(row => ({
      ...row,
      is_active: true, // V2 templates are always active
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching component templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch component templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/admin/component-templates
 * Create a new system component template
 */
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const body = await request.json();
    const {
      component_key,
      subject,
      display_name,
      default_duration_days,
      color,
      description,
      expansion_type = 'single',
      expansion_config = {},
      metadata_fields = [],
      category,
    } = body;

    // Validation
    if (!component_key || !subject || !display_name || !color) {
      return NextResponse.json(
        { error: 'Missing required fields: component_key, subject, display_name, color' },
        { status: 400 }
      );
    }

    // Check for duplicate component_key
    const existing = await pool.query(
      'SELECT id FROM component_templates_v2 WHERE component_key = $1',
      [component_key]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Component key already exists' },
        { status: 400 }
      );
    }

    // Insert new template
    const result = await pool.query(
      `INSERT INTO component_templates_v2 (
        component_key,
        subject,
        display_name,
        description,
        color,
        default_duration_days,
        expansion_type,
        expansion_config,
        metadata_fields,
        category,
        is_system
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        component_key,
        subject,
        display_name,
        description || null,
        color,
        default_duration_days || 1,
        expansion_type,
        expansion_config,
        metadata_fields,
        category || null,
        true, // is_system = true for admin-created templates
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
