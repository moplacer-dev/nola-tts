import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// GET - List all versions for a pacing guide
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: guideId } = await params;

    // Verify the guide belongs to this user
    const guideCheck = await pool.query(
      'SELECT id, user_id FROM pacing_guides WHERE id = $1',
      [guideId]
    );

    if (guideCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pacing guide not found' },
        { status: 404 }
      );
    }

    if (guideCheck.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all versions for this guide
    const versionsResult = await pool.query(
      `SELECT
        v.id,
        v.version_number,
        v.version_label,
        v.created_at,
        v.created_by,
        u.email as created_by_email,
        u.name as created_by_name,
        jsonb_array_length(v.snapshot_data) as item_count
      FROM pacing_guide_versions v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.guide_id = $1
      ORDER BY v.version_number DESC`,
      [guideId]
    );

    const versions = versionsResult.rows.map(row => ({
      id: row.id,
      version_number: row.version_number,
      version_label: row.version_label,
      created_at: row.created_at,
      item_count: row.item_count || 0,
      created_by: {
        email: row.created_by_email,
        name: row.created_by_name,
      },
    }));

    console.log(`[VERSIONS] Found ${versions.length} versions for guide ${guideId}`);

    return NextResponse.json({
      versions,
      total_count: versions.length,
    });
  } catch (error) {
    console.error('[VERSIONS] Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}
