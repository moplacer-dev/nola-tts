/**
 * POST /api/v2/scheduled-items - Create scheduled items (drag from library)
 * GET /api/v2/scheduled-items - List scheduled items for a guide
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { expandTemplate, generatePlacementGroupId } from '@/lib/v2/template-expansion';
import {
  CreateScheduledItemsRequest,
  CreateScheduledItemsResponse,
  GetScheduledItemsResponse,
  ScheduledItem
} from '@/types/v2';

/**
 * POST - Create scheduled items (drag from library)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateScheduledItemsRequest = await req.json();
    const { guide_id, calendar_type, template_id, start_date, metadata, placement_group_id } = body;

    // Validate required fields
    if (!guide_id || !calendar_type || !template_id || !start_date) {
      return NextResponse.json(
        { error: 'Missing required fields: guide_id, calendar_type, template_id, start_date' },
        { status: 400 }
      );
    }

    // Verify guide ownership
    const guideCheck = await pool.query(
      'SELECT id FROM pacing_guides WHERE id = $1 AND user_id = $2',
      [guide_id, session.user.id]
    );

    if (guideCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    // Get template
    const templateResult = await pool.query(
      'SELECT * FROM component_templates_v2 WHERE id = $1',
      [template_id]
    );

    if (templateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = templateResult.rows[0];

    // Get blocked dates (base calendar events that block curriculum)
    const blockedDatesResult = await pool.query(
      `SELECT start_date, duration_days
       FROM scheduled_items_v2
       WHERE guide_id = $1 AND calendar_type = 'base' AND blocks_curriculum = true`,
      [guide_id]
    );

    const blockedDates = new Set<string>();
    for (const event of blockedDatesResult.rows) {
      // Parse date safely (PostgreSQL DATE comes as string YYYY-MM-DD or Date object)
      let dateString = event.start_date;
      if (dateString instanceof Date) {
        const y = dateString.getFullYear();
        const m = String(dateString.getMonth() + 1).padStart(2, '0');
        const d = String(dateString.getDate()).padStart(2, '0');
        dateString = `${y}-${m}-${d}`;
      }

      const [year, month, day] = dateString.split('-').map(Number);
      const startDate = new Date(year, month - 1, day);

      // Add SCHOOL DAYS only (skip weekends) - matches client-side logic
      let schoolDaysAdded = 0;
      const currentDate = new Date(startDate);

      while (schoolDaysAdded < event.duration_days) {
        const dayOfWeek = currentDate.getDay();

        // Only block weekdays (Mon-Fri = 1-5, skip Sat=6, Sun=0)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const y = currentDate.getFullYear();
          const m = String(currentDate.getMonth() + 1).padStart(2, '0');
          const d = String(currentDate.getDate()).padStart(2, '0');
          blockedDates.add(`${y}-${m}-${d}`);
          schoolDaysAdded++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Generate placement group ID (or use provided one for Extend feature)
    const placementGroupId = placement_group_id || generatePlacementGroupId();

    // Expand template into scheduled items
    const items = expandTemplate(
      template,
      start_date,
      placementGroupId,
      blockedDates,
      guide_id,
      calendar_type,
      metadata
    );

    // Insert all items in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertedItems: ScheduledItem[] = [];
      for (const item of items) {
        const result = await client.query(
          `INSERT INTO scheduled_items_v2 (
            guide_id, calendar_type, template_id, component_key,
            start_date, duration_days, placement_group_id, group_index,
            display_order, source, title_override, metadata, blocks_curriculum
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *`,
          [
            item.guide_id,
            item.calendar_type,
            item.template_id,
            item.component_key,
            item.start_date,
            item.duration_days,
            item.placement_group_id,
            item.group_index,
            0, // display_order
            item.source,
            item.title_override || null,
            JSON.stringify(item.metadata || {}),
            item.blocks_curriculum || false
          ]
        );

        insertedItems.push(result.rows[0]);
      }

      await client.query('COMMIT');

      const response: CreateScheduledItemsResponse = {
        success: true,
        items: insertedItems,
        count: insertedItems.length
      };

      return NextResponse.json(response);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create scheduled items error:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduled items', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET - List scheduled items for a guide
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const guide_id = searchParams.get('guide_id');
    const calendar_type = searchParams.get('calendar_type');

    if (!guide_id) {
      return NextResponse.json({ error: 'guide_id required' }, { status: 400 });
    }

    // Verify guide ownership
    const guideCheck = await pool.query(
      'SELECT id FROM pacing_guides WHERE id = $1 AND user_id = $2',
      [guide_id, session.user.id]
    );

    if (guideCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    // Build query with template details
    let query = `
      SELECT si.*, ct.display_name, ct.color, ct.expansion_type, ct.metadata_fields
      FROM scheduled_items_v2 si
      LEFT JOIN component_templates_v2 ct ON si.template_id = ct.id
      WHERE si.guide_id = $1
    `;
    const params: string[] = [guide_id];

    if (calendar_type) {
      query += ` AND si.calendar_type = $2`;
      params.push(calendar_type);
    }

    query += ` ORDER BY si.start_date, si.display_order`;

    const result = await pool.query(query, params);

    // Format dates as YYYY-MM-DD strings to avoid timezone issues
    const items = result.rows.map(row => ({
      ...row,
      start_date: row.start_date instanceof Date
        ? row.start_date.toISOString().split('T')[0]
        : row.start_date
    }));

    const response: GetScheduledItemsResponse = {
      items,
      count: items.length
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('List scheduled items error:', error);
    return NextResponse.json(
      { error: 'Failed to list scheduled items' },
      { status: 500 }
    );
  }
}
