/**
 * PATCH /api/v2/scheduled-items/bulk-update-color - Update color for multiple items
 *
 * Used for bulk color change feature
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

interface BulkUpdateColorRequest {
  item_ids: string[];
  color_override: string;
}

/**
 * PATCH - Update color for multiple scheduled items
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BulkUpdateColorRequest = await req.json();
    const { item_ids, color_override } = body;

    // Validate inputs
    if (!Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json(
        { error: 'item_ids array required with at least one item' },
        { status: 400 }
      );
    }

    if (!color_override || !/^#[0-9A-F]{6}$/i.test(color_override)) {
      return NextResponse.json(
        { error: 'color_override must be a valid hex color (e.g., #FF5733)' },
        { status: 400 }
      );
    }

    // Verify ownership of ALL items
    const verifyResult = await pool.query(
      `SELECT si.id
       FROM scheduled_items_v2 si
       JOIN pacing_guides pg ON si.guide_id = pg.id
       WHERE si.id = ANY($1) AND pg.user_id = $2`,
      [item_ids, session.user.id]
    );

    if (verifyResult.rows.length !== item_ids.length) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own all of these items' },
        { status: 403 }
      );
    }

    // Update all items in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE scheduled_items_v2
         SET color_override = $1, updated_at = NOW()
         WHERE id = ANY($2)`,
        [color_override, item_ids]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        updated_count: item_ids.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk update color error:', error);
    return NextResponse.json(
      { error: 'Failed to update colors', details: (error as Error).message },
      { status: 500 }
    );
  }
}
