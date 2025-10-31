import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// DELETE - Bulk delete scheduled components
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { component_ids } = await req.json();

    if (!Array.isArray(component_ids) || component_ids.length === 0) {
      return NextResponse.json(
        { error: 'component_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    // Verify all components belong to calendars owned by this user
    const verifyQuery = `
      SELECT sc.id
      FROM scheduled_components sc
      JOIN subject_calendars cal ON sc.subject_calendar_id = cal.id
      JOIN pacing_guides pg ON cal.pacing_guide_id = pg.id
      WHERE sc.id = ANY($1) AND pg.user_id = $2
    `;

    const verifyResult = await pool.query(verifyQuery, [component_ids, session.user.id]);

    if (verifyResult.rows.length !== component_ids.length) {
      return NextResponse.json(
        { error: 'One or more components not found or unauthorized' },
        { status: 403 }
      );
    }

    // Delete all components in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const deleteResult = await client.query(
        'DELETE FROM scheduled_components WHERE id = ANY($1) RETURNING id',
        [component_ids]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        deleted_count: deleteResult.rows.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete components' },
      { status: 500 }
    );
  }
}
