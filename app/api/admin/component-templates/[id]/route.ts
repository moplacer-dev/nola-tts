import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import pool from '@/lib/db';

/**
 * PATCH /api/admin/component-templates/:id
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
    const { display_name, default_duration_days, color, description, is_active } = body;
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

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

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
      UPDATE component_templates
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
 * DELETE /api/admin/component-templates/:id
 * Delete a component template (soft delete by setting is_active = false)
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
      'SELECT id, component_key, user_id FROM component_templates WHERE id = $1',
      [templateId]
    );

    if (templateCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Soft delete (deactivate) instead of hard delete to preserve historical data
    await pool.query(
      'UPDATE component_templates SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [templateId]
    );

    return NextResponse.json({
      message: 'Template deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting component template:', error);
    return NextResponse.json(
      { error: 'Failed to delete component template' },
      { status: 500 }
    );
  }
}
