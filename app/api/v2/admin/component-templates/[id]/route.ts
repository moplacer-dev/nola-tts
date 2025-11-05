import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';

/**
 * PATCH /api/v2/admin/component-templates/:id
 * Update a component template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const body = await request.json();
    const {
      display_name,
      default_duration_days,
      color,
      description,
      expansion_type,
      expansion_config,
      metadata_fields,
      category,
      is_active, // Note: V2 doesn't store this, but we accept it for compatibility
    } = body;
    const { id: templateId } = await params;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (display_name !== undefined) {
      updates.push(`display_name = $${paramCount}`);
      values.push(display_name);
      paramCount++;
    }

    if (default_duration_days !== undefined) {
      updates.push(`default_duration_days = $${paramCount}`);
      values.push(default_duration_days);
      paramCount++;
    }

    if (color !== undefined) {
      updates.push(`color = $${paramCount}`);
      values.push(color);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (expansion_type !== undefined) {
      updates.push(`expansion_type = $${paramCount}`);
      values.push(expansion_type);
      paramCount++;
    }

    if (expansion_config !== undefined) {
      updates.push(`expansion_config = $${paramCount}`);
      values.push(expansion_config);
      paramCount++;
    }

    if (metadata_fields !== undefined) {
      updates.push(`metadata_fields = $${paramCount}`);
      values.push(metadata_fields);
      paramCount++;
    }

    if (category !== undefined) {
      updates.push(`category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }

    // Note: is_active is ignored in V2 - templates are always active

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add template ID as last parameter
    values.push(templateId);

    const query = `
      UPDATE component_templates_v2
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Template updated successfully',
      template: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating component template:', error);
    return NextResponse.json(
      { error: 'Failed to update component template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/admin/component-templates/:id
 * Delete a component template
 *
 * Note: V2 doesn't have soft delete (is_active field), so this is a hard delete.
 * We check for usage first to prevent deleting templates that are in use.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const { id: templateId } = await params;

    // Check if template exists
    const templateCheck = await pool.query(
      'SELECT id, component_key, is_system FROM component_templates_v2 WHERE id = $1',
      [templateId]
    );

    if (templateCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const template = templateCheck.rows[0];

    // Check if template is being used
    const usageCheck = await pool.query(
      'SELECT COUNT(*) as count FROM scheduled_items_v2 WHERE component_key = $1',
      [template.component_key]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template: it is currently being used in pacing guides' },
        { status: 400 }
      );
    }

    // Hard delete (V2 doesn't have soft delete)
    await pool.query(
      'DELETE FROM component_templates_v2 WHERE id = $1',
      [templateId]
    );

    return NextResponse.json({
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting component template:', error);
    return NextResponse.json(
      { error: 'Failed to delete component template' },
      { status: 500 }
    );
  }
}
