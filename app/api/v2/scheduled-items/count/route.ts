/**
 * GET /api/v2/scheduled-items/count - Count scheduled items by component_key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const component_key = searchParams.get('component_key');

    if (!component_key) {
      return NextResponse.json({ error: 'component_key required' }, { status: 400 });
    }

    // Count scheduled items with this component_key
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM scheduled_items_v2 si
       INNER JOIN pacing_guides pg ON si.guide_id = pg.id
       WHERE si.component_key = $1 AND pg.user_id = $2`,
      [component_key, session.user.id]
    );

    return NextResponse.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Count scheduled items error:', error);
    return NextResponse.json(
      { error: 'Failed to count scheduled items' },
      { status: 500 }
    );
  }
}
