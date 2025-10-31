import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * POST /api/scheduled-components/[id]/reorder
 * Move a component up or down within its cell
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { direction } = await request.json();

    if (!direction || !['up', 'down'].includes(direction)) {
      return NextResponse.json(
        { error: 'Invalid direction. Must be "up" or "down"' },
        { status: 400 }
      );
    }

    // Get the component and its current position
    const componentResult = await pool.query(
      `SELECT id, subject_calendar_id, start_date, display_order
       FROM scheduled_components
       WHERE id = $1`,
      [id]
    );

    if (componentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }

    const component = componentResult.rows[0];
    const { subject_calendar_id, start_date, display_order } = component;

    // Get all components in the same cell, sorted by display_order
    const cellComponentsResult = await pool.query(
      `SELECT id, display_order
       FROM scheduled_components
       WHERE subject_calendar_id = $1 AND start_date = $2
       ORDER BY display_order ASC`,
      [subject_calendar_id, start_date]
    );

    const cellComponents = cellComponentsResult.rows;

    // Find the current component's index in the sorted list
    const currentIndex = cellComponents.findIndex((c) => c.id === id);

    if (currentIndex === -1) {
      return NextResponse.json(
        { error: 'Component not found in cell' },
        { status: 404 }
      );
    }

    // Check if move is valid
    if (direction === 'up' && currentIndex === 0) {
      return NextResponse.json(
        { error: 'Component is already at the top' },
        { status: 400 }
      );
    }

    if (direction === 'down' && currentIndex === cellComponents.length - 1) {
      return NextResponse.json(
        { error: 'Component is already at the bottom' },
        { status: 400 }
      );
    }

    // Determine the swap target
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentComponent = cellComponents[currentIndex];
    const swapComponent = cellComponents[swapIndex];

    // Swap the display_order values
    await pool.query('BEGIN');

    try {
      // Temporarily set one to a very high number to avoid unique constraint issues
      await pool.query(
        `UPDATE scheduled_components
         SET display_order = 999999
         WHERE id = $1`,
        [currentComponent.id]
      );

      // Update the swap component to take the current component's position
      await pool.query(
        `UPDATE scheduled_components
         SET display_order = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [currentComponent.display_order, swapComponent.id]
      );

      // Update the current component to take the swap component's position
      await pool.query(
        `UPDATE scheduled_components
         SET display_order = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [swapComponent.display_order, currentComponent.id]
      );

      await pool.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Component moved ${direction}`,
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error reordering component:', error);
    return NextResponse.json(
      { error: 'Failed to reorder component' },
      { status: 500 }
    );
  }
}
