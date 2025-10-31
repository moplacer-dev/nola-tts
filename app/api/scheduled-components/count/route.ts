import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// GET - Count scheduled instances of a component template
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const componentKey = searchParams.get('component_key');

    if (!componentKey) {
      return NextResponse.json({ error: 'component_key is required' }, { status: 400 });
    }

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM scheduled_components WHERE component_key = $1',
      [componentKey]
    );

    return NextResponse.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error counting scheduled components:', error);
    return NextResponse.json(
      { error: 'Failed to count scheduled components' },
      { status: 500 }
    );
  }
}
