/**
 * PATCH /api/v2/scheduled-items/bulk-move - Move multiple items to new dates
 *
 * Used for multi-drag feature (Phase 7)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

interface BulkMoveUpdate {
  id: string;
  start_date: string;
}

interface BulkMoveRequest {
  updates: BulkMoveUpdate[];
}

/**
 * PATCH - Move multiple scheduled items
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BulkMoveRequest = await req.json();
    const { updates } = body;

    // Validate updates array
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'updates array required with at least one item' },
        { status: 400 }
      );
    }

    // Validate each update has required fields
    for (const update of updates) {
      if (!update.id || !update.start_date) {
        return NextResponse.json(
          { error: 'Each update must have id and start_date' },
          { status: 400 }
        );
      }
    }

    const itemIds = updates.map(u => u.id);

    // Verify ownership of ALL items
    const verifyResult = await pool.query(
      `SELECT si.id
       FROM scheduled_items_v2 si
       JOIN pacing_guides pg ON si.guide_id = pg.id
       WHERE si.id = ANY($1) AND pg.user_id = $2`,
      [itemIds, session.user.id]
    );

    if (verifyResult.rows.length !== itemIds.length) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own all of these items' },
        { status: 403 }
      );
    }

    // Update all items in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let updatedCount = 0;
      for (const update of updates) {
        const result = await client.query(
          `UPDATE scheduled_items_v2
           SET start_date = $1, updated_at = NOW()
           WHERE id = $2`,
          [update.start_date, update.id]
        );

        updatedCount += result.rowCount;
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        updated_count: updatedCount
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk move error:', error);
    return NextResponse.json(
      { error: 'Failed to move items', details: (error as Error).message },
      { status: 500 }
    );
  }
}
