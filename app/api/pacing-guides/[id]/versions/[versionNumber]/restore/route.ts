import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// Helper function to create a version snapshot before restoring
async function createVersionSnapshot(
  guideId: string,
  userId: string,
  restoringVersionNumber: number
): Promise<{ versionNumber: number; versionLabel: string }> {
  // Get next version number
  const versionResult = await pool.query(
    `SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
     FROM pacing_guide_versions
     WHERE guide_id = $1`,
    [guideId]
  );
  const versionNumber = versionResult.rows[0].next_version;

  // Create version label
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const versionLabel = `Version ${versionNumber} (Restored Version ${restoringVersionNumber} on ${today})`;

  // Create snapshot of current state BEFORE restoring
  const snapshotResult = await pool.query(
    `SELECT jsonb_agg(row_to_json(si)::jsonb) as snapshot_data
     FROM scheduled_items_v2 si
     WHERE si.guide_id = $1`,
    [guideId]
  );

  const snapshotData = snapshotResult.rows[0]?.snapshot_data || '[]';

  // Insert the snapshot
  await pool.query(
    `INSERT INTO pacing_guide_versions (guide_id, version_number, version_label, snapshot_data, created_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [guideId, versionNumber, versionLabel, snapshotData, userId]
  );

  console.log('[RESTORE] Created backup snapshot:', {
    versionNumber,
    versionLabel,
  });

  return { versionNumber, versionLabel };
}

// POST - Restore a specific version
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: guideId, versionNumber } = await params;
    const versionNum = parseInt(versionNumber, 10);

    if (isNaN(versionNum)) {
      return NextResponse.json(
        { error: 'Invalid version number' },
        { status: 400 }
      );
    }

    console.log('[RESTORE] Request:', { guideId, versionNumber: versionNum });

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

    // Fetch the version to restore
    const versionResult = await pool.query(
      `SELECT id, version_number, version_label, snapshot_data
       FROM pacing_guide_versions
       WHERE guide_id = $1 AND version_number = $2`,
      [guideId, versionNum]
    );

    if (versionResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Version ${versionNum} not found` },
        { status: 404 }
      );
    }

    const versionToRestore = versionResult.rows[0];
    const snapshotData = versionToRestore.snapshot_data;

    if (!snapshotData || !Array.isArray(snapshotData)) {
      return NextResponse.json(
        { error: 'Invalid snapshot data' },
        { status: 500 }
      );
    }

    console.log('[RESTORE] Found version:', {
      version_number: versionToRestore.version_number,
      version_label: versionToRestore.version_label,
      items_count: snapshotData.length,
    });

    // Create a backup snapshot of current state BEFORE restoring
    const { versionNumber: backupVersionNumber, versionLabel: backupVersionLabel } =
      await createVersionSnapshot(guideId, session.user.id, versionNum);

    // Execute the restore in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete all current scheduled items for this guide
      const deleteResult = await client.query(
        'DELETE FROM scheduled_items_v2 WHERE guide_id = $1',
        [guideId]
      );

      console.log('[RESTORE] Deleted', deleteResult.rowCount, 'current items');

      // Restore items from snapshot
      let restoredCount = 0;

      for (const item of snapshotData) {
        // Re-insert each item (generate new UUIDs for ids)
        await client.query(
          `INSERT INTO scheduled_items_v2 (
            guide_id,
            calendar_type,
            template_id,
            component_key,
            start_date,
            duration_days,
            display_order,
            placement_group_id,
            group_index,
            blocks_curriculum,
            title_override,
            color_override,
            metadata,
            notes,
            source,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            guideId, // Always use current guide_id
            item.calendar_type,
            item.template_id,
            item.component_key,
            item.start_date,
            item.duration_days || 1,
            item.display_order || 0,
            item.placement_group_id,
            item.group_index,
            item.blocks_curriculum || false,
            item.title_override,
            item.color_override,
            JSON.stringify(item.metadata || {}),
            item.notes,
            item.source || 'library',
            item.created_at || new Date(),
            new Date(), // Update timestamp
          ]
        );
        restoredCount++;
      }

      await client.query('COMMIT');

      console.log('[RESTORE] Successfully restored', restoredCount, 'items');

      return NextResponse.json({
        success: true,
        message: `Restored ${versionToRestore.version_label}`,
        items_restored: restoredCount,
        backup_version_created: backupVersionNumber,
        backup_version_label: backupVersionLabel,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[RESTORE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to restore version' },
      { status: 500 }
    );
  }
}
