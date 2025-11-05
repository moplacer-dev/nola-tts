/**
 * GET /api/v2/scheduled-items/[id] - Get a single scheduled item
 * PATCH /api/v2/scheduled-items/[id] - Update a scheduled item
 * DELETE /api/v2/scheduled-items/[id] - Delete a scheduled item
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UpdateScheduledItemRequest, ScheduledItemResponse } from '@/types/v2';

/**
 * GET - Get a single scheduled item
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get item with guide ownership check
    const result = await pool.query(
      `SELECT si.*
       FROM scheduled_items_v2 si
       JOIN pacing_guides pg ON si.guide_id = pg.id
       WHERE si.id = $1 AND pg.user_id = $2`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const response: ScheduledItemResponse = {
      success: true,
      item: result.rows[0]
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get scheduled item error:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduled item' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a scheduled item
 */
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
    const body: UpdateScheduledItemRequest = await req.json();

    // Verify ownership
    const ownershipCheck = await pool.query(
      `SELECT si.id
       FROM scheduled_items_v2 si
       JOIN pacing_guides pg ON si.guide_id = pg.id
       WHERE si.id = $1 AND pg.user_id = $2`,
      [id, session.user.id]
    );

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Get the current item to check placement_group_id
    const currentItem = await pool.query(
      'SELECT * FROM scheduled_items_v2 WHERE id = $1',
      [id]
    );

    if (currentItem.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const item = currentItem.rows[0];

    // GROUPED METADATA UPDATE: If metadata is changing and item has placement_group_id,
    // update ALL items in the group
    if (body.metadata !== undefined && item.placement_group_id) {
      // Get all items in the same placement group
      const groupItems = await pool.query(
        'SELECT * FROM scheduled_items_v2 WHERE placement_group_id = $1',
        [item.placement_group_id]
      );

      // Update metadata for all items in group
      // NOTE: We only update metadata, NOT title_override
      // Titles contain placeholders like "R{rotation}, S3" which are substituted dynamically on display
      for (const groupItem of groupItems.rows) {
        await pool.query(
          `UPDATE scheduled_items_v2
           SET metadata = $1
           WHERE id = $2`,
          [JSON.stringify(body.metadata), groupItem.id]
        );
      }

      // If title_override is also being updated, update it for the single item
      // (not the whole group, since each item can have a different title)
      if (body.title_override !== undefined) {
        await pool.query(
          `UPDATE scheduled_items_v2
           SET title_override = $1
           WHERE id = $2`,
          [body.title_override, id]
        );
      }

      // Return the updated original item
      const updatedItem = await pool.query(
        'SELECT * FROM scheduled_items_v2 WHERE id = $1',
        [id]
      );

      return NextResponse.json({
        success: true,
        item: updatedItem.rows[0],
        groupUpdated: true,
        itemsUpdated: groupItems.rows.length
      });
    }

    // SINGLE ITEM UPDATE: For other fields or items without placement_group_id
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.start_date !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(body.start_date);
    }

    if (body.title_override !== undefined) {
      updates.push(`title_override = $${paramIndex++}`);
      values.push(body.title_override);
    }

    if (body.color_override !== undefined) {
      updates.push(`color_override = $${paramIndex++}`);
      values.push(body.color_override);
    }

    if (body.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(body.metadata));
    }

    if (body.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(body.notes);
    }

    if (body.display_order !== undefined) {
      updates.push(`display_order = $${paramIndex++}`);
      values.push(body.display_order);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    // Add id as final parameter
    values.push(id);

    const query = `
      UPDATE scheduled_items_v2
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    const response: ScheduledItemResponse = {
      success: true,
      item: result.rows[0]
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Update scheduled item error:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a scheduled item
 */
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

    // Delete with ownership check
    const result = await pool.query(
      `DELETE FROM scheduled_items_v2
       WHERE id = $1
       AND guide_id IN (
         SELECT id FROM pacing_guides WHERE user_id = $2
       )
       RETURNING id`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const response: ScheduledItemResponse = {
      success: true,
      message: 'Item deleted successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Delete scheduled item error:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled item' },
      { status: 500 }
    );
  }
}
