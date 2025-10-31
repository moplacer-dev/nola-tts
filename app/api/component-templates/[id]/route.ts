import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// PATCH - Update a custom component template
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { display_name, default_duration_days, color, update_existing } = await req.json();

    // Verify template exists and belongs to user
    const templateCheck = await pool.query(
      'SELECT * FROM component_templates WHERE id = $1',
      [id]
    );

    if (templateCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const template = templateCheck.rows[0];

    // Only allow editing custom templates (user_id IS NOT NULL)
    if (template.user_id === null) {
      return NextResponse.json(
        { error: 'System templates cannot be edited' },
        { status: 403 }
      );
    }

    // Verify ownership
    if (template.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own templates' },
        { status: 403 }
      );
    }

    // Validation
    if (default_duration_days && (default_duration_days < 1 || default_duration_days > 50)) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 50 days' },
        { status: 400 }
      );
    }

    if (color) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorRegex.test(color)) {
        return NextResponse.json(
          { error: 'Invalid color format. Must be hex code (e.g., #9333EA)' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate name if changing name
    if (display_name && display_name !== template.display_name) {
      const duplicateCheck = await pool.query(
        `SELECT id FROM component_templates
         WHERE user_id = $1 AND subject = $2 AND LOWER(display_name) = LOWER($3) AND id != $4`,
        [session.user.id, template.subject, display_name, id]
      );

      if (duplicateCheck.rows.length > 0) {
        return NextResponse.json(
          { error: 'You already have a component with this name for this subject' },
          { status: 400 }
        );
      }
    }

    // Build update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (display_name) {
      updateFields.push(`display_name = $${paramCount}`);
      values.push(display_name);
      paramCount++;
    }

    if (default_duration_days) {
      updateFields.push(`default_duration_days = $${paramCount}`);
      values.push(default_duration_days);
      paramCount++;
    }

    if (color) {
      updateFields.push(`color = $${paramCount}`);
      values.push(color);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    // Update the template
    const updateResult = await pool.query(
      `UPDATE component_templates
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    // If update_existing is true, update all scheduled instances
    if (update_existing) {
      const updateInstanceFields: string[] = [];
      const instanceValues: any[] = [];
      let instanceParamCount = 1;

      // Clear title_override if display_name changed (so instances inherit new template name)
      if (display_name) {
        updateInstanceFields.push(`title_override = NULL`);
      }

      if (color) {
        updateInstanceFields.push(`color_override = $${instanceParamCount}`);
        instanceValues.push(color);
        instanceParamCount++;
      }

      if (default_duration_days) {
        updateInstanceFields.push(`duration_days = $${instanceParamCount}`);
        instanceValues.push(default_duration_days);
        instanceParamCount++;
      }

      if (updateInstanceFields.length > 0) {
        instanceValues.push(template.component_key);

        await pool.query(
          `UPDATE scheduled_components
           SET ${updateInstanceFields.join(', ')}
           WHERE component_key = $${instanceParamCount}`,
          instanceValues
        );
      }
    }

    return NextResponse.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Error updating component template:', error);
    return NextResponse.json(
      { error: 'Failed to update component template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a custom component template
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify template exists and belongs to user
    const templateCheck = await pool.query(
      'SELECT * FROM component_templates WHERE id = $1',
      [id]
    );

    if (templateCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const template = templateCheck.rows[0];

    // Only allow deleting custom templates
    if (template.user_id === null) {
      return NextResponse.json(
        { error: 'System templates cannot be deleted' },
        { status: 403 }
      );
    }

    // Verify ownership
    if (template.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own templates' },
        { status: 403 }
      );
    }

    // Delete the template (instances will remain as standalone)
    await pool.query(
      'DELETE FROM component_templates WHERE id = $1',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting component template:', error);
    return NextResponse.json(
      { error: 'Failed to delete component template' },
      { status: 500 }
    );
  }
}
