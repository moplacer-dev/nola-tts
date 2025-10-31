import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// PATCH - Update a calendar event
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
    const body = await req.json();
    const { event_name, start_date, duration_days, event_type, blocks_curriculum, color } = body;

    // Verify the event belongs to a guide owned by this user
    const authCheck = await pool.query(
      `SELECT ce.id
       FROM calendar_events ce
       JOIN pacing_guides pg ON ce.pacing_guide_id = pg.id
       WHERE ce.id = $1 AND pg.user_id = $2`,
      [id, session.user.id]
    );

    if (authCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Calendar event not found or unauthorized' },
        { status: 404 }
      );
    }

    // Build dynamic update query based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (event_name !== undefined) {
      updates.push(`event_name = $${paramCount}`);
      values.push(event_name);
      paramCount++;
    }

    if (start_date !== undefined) {
      updates.push(`start_date = $${paramCount}`);
      values.push(start_date);
      paramCount++;
    }

    if (duration_days !== undefined) {
      updates.push(`duration_days = $${paramCount}`);
      values.push(duration_days);
      paramCount++;
    }

    if (event_type !== undefined) {
      updates.push(`event_type = $${paramCount}`);
      values.push(event_type);
      paramCount++;
    }

    if (blocks_curriculum !== undefined) {
      updates.push(`blocks_curriculum = $${paramCount}`);
      values.push(blocks_curriculum);
      paramCount++;
    }

    if (color !== undefined) {
      updates.push(`color = $${paramCount}`);
      values.push(color);
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

    // Add event ID as last parameter
    values.push(id);

    const query = `
      UPDATE calendar_events
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, event_name, start_date, duration_days, event_type, is_base_event, blocks_curriculum, color
    `;

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a calendar event
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

    // Verify the event belongs to a guide owned by this user
    const authCheck = await pool.query(
      `SELECT ce.id
       FROM calendar_events ce
       JOIN pacing_guides pg ON ce.pacing_guide_id = pg.id
       WHERE ce.id = $1 AND pg.user_id = $2`,
      [id, session.user.id]
    );

    if (authCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Calendar event not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the event
    await pool.query('DELETE FROM calendar_events WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}
