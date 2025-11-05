import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// Helper function to add school days (skipping weekends and blocked dates)
// IMPORTANT: Uses local timezone to avoid UTC parsing issues
function addSchoolDays(
  startDateString: string,
  daysToAdd: number,
  blockedDates: Set<string> = new Set()
): string {
  // Parse as local date (YYYY-MM-DD)
  const [year, month, day] = startDateString.split('-').map(Number);
  const result = new Date(year, month - 1, day); // month is 0-indexed

  let daysRemaining = daysToAdd;

  // Handle both forward and backward shifts
  while (daysRemaining !== 0) {
    if (daysRemaining > 0) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      const dateString = formatDate(result);

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      // Skip blocked dates if provided
      if (blockedDates.has(dateString)) {
        continue;
      }

      // This is a valid school day
      daysRemaining--;
    } else {
      result.setDate(result.getDate() - 1);
      const dayOfWeek = result.getDay();
      const dateString = formatDate(result);

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      // Skip blocked dates if provided
      if (blockedDates.has(dateString)) {
        continue;
      }

      // This is a valid school day
      daysRemaining++;
    }
  }

  return formatDate(result);
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to create a version snapshot before re-pacing
async function createVersionSnapshot(
  guideId: string,
  userId: string,
  daysToShift: number,
  subject: string
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
  const direction = daysToShift > 0 ? '+' : '';
  const subjectLabel = subject === 'all' ? 'All subjects' : subject.toUpperCase();
  const versionLabel = `Version ${versionNumber} (Re-paced ${direction}${daysToShift} days - ${subjectLabel} on ${today})`;

  // Create snapshot of current state
  await pool.query(
    `INSERT INTO pacing_guide_versions (guide_id, version_number, version_label, snapshot_data, created_by)
     SELECT
       $1::uuid as guide_id,
       $2::integer as version_number,
       $3::varchar as version_label,
       jsonb_agg(row_to_json(si)::jsonb) as snapshot_data,
       $4::uuid as created_by
     FROM scheduled_items_v2 si
     WHERE si.guide_id = $1`,
    [guideId, versionNumber, versionLabel, userId]
  );

  console.log('[RE-PACE] Created version snapshot:', {
    versionNumber,
    versionLabel,
  });

  return { versionNumber, versionLabel };
}

// POST - Re-pace scheduled items with versioning
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: guideId } = await params;
    const { subject, days_to_shift, start_from_date } = await req.json();

    console.log('[RE-PACE] Request:', {
      guideId,
      subject,
      days_to_shift,
      start_from_date,
    });

    // Validate input
    if (!days_to_shift || days_to_shift === 0) {
      return NextResponse.json(
        { error: 'days_to_shift must be a non-zero number' },
        { status: 400 }
      );
    }

    if (!['ela', 'math', 'science', 'social_studies', 'all'].includes(subject)) {
      return NextResponse.json({ error: 'Invalid subject' }, { status: 400 });
    }

    // Verify the guide belongs to this user
    const guideCheck = await pool.query(
      'SELECT id, user_id, first_day, last_day FROM pacing_guides WHERE id = $1',
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

    const guide = guideCheck.rows[0];
    const firstDay = new Date(guide.first_day);
    const lastDay = new Date(guide.last_day);

    console.log('[RE-PACE] School year:', {
      first_day: formatDate(firstDay),
      last_day: formatDate(lastDay),
    });

    // Fetch blocked curriculum dates (from base calendar)
    const blockedDatesResult = await pool.query(
      `SELECT start_date, duration_days
       FROM scheduled_items_v2
       WHERE guide_id = $1 AND calendar_type = 'base' AND blocks_curriculum = true`,
      [guideId]
    );

    // Build a Set of all blocked dates (expanding multi-day events)
    const blockedDates = new Set<string>();
    for (const event of blockedDatesResult.rows) {
      const startDate = formatDate(new Date(event.start_date));
      blockedDates.add(startDate);

      // Add subsequent days if multi-day event
      for (let i = 1; i < event.duration_days; i++) {
        const nextDate = addSchoolDays(startDate, i, new Set());
        blockedDates.add(nextDate);
      }
    }

    console.log('[RE-PACE] Blocked dates:', Array.from(blockedDates).slice(0, 10), '...');

    // Build query to fetch items to shift (subject calendars only, NOT base)
    let itemsQuery = `
      SELECT si.id, si.calendar_type, si.component_key, si.start_date,
             si.title_override, si.display_order,
             ct.display_name
      FROM scheduled_items_v2 si
      LEFT JOIN component_templates_v2 ct ON si.component_key = ct.component_key
      WHERE si.guide_id = $1 AND si.calendar_type != 'base'
    `;

    const queryParams: any[] = [guideId];
    let paramCount = 2;

    // Filter by subject if not "all"
    if (subject !== 'all') {
      itemsQuery += ` AND si.calendar_type = $${paramCount}`;
      queryParams.push(subject);
      paramCount++;
    }

    // Filter by start_from_date if provided
    if (start_from_date) {
      itemsQuery += ` AND si.start_date >= $${paramCount}`;
      queryParams.push(start_from_date);
      paramCount++;
    }

    itemsQuery += ' ORDER BY si.start_date, si.display_order, si.id';

    console.log('[RE-PACE] Query:', itemsQuery);
    console.log('[RE-PACE] Params:', queryParams);

    const itemsResult = await pool.query(itemsQuery, queryParams);
    const items = itemsResult.rows;

    console.log('[RE-PACE] Found items to shift:', items.length);

    if (items.length === 0) {
      return NextResponse.json({
        affected_count: 0,
        warnings: ['No items found matching the criteria'],
      });
    }

    // Calculate new dates for each item
    const updatedItems: any[] = [];
    const warnings: string[] = [];

    for (const item of items) {
      const currentDate = formatDate(new Date(item.start_date));
      const newDate = addSchoolDays(currentDate, days_to_shift, blockedDates);
      const newDateObj = new Date(newDate);

      // Check if new date is within school year
      if (newDateObj < firstDay) {
        warnings.push(
          `Item "${item.title_override || item.display_name}" would be scheduled before the first day of school (${formatDate(firstDay)})`
        );
      } else if (newDateObj > lastDay) {
        warnings.push(
          `Item "${item.title_override || item.display_name}" would be scheduled after the last day of school (${formatDate(lastDay)})`
        );
      }

      updatedItems.push({
        id: item.id,
        new_start_date: newDate,
        old_start_date: currentDate,
        title: item.title_override || item.display_name,
      });
    }

    console.log('[RE-PACE] Calculated', updatedItems.length, 'new dates');
    console.log('[RE-PACE] Warnings:', warnings);

    // If there are critical warnings (items before first day), prevent execution
    const criticalWarnings = warnings.filter((w) =>
      w.includes('before the first day')
    );
    if (criticalWarnings.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot apply changes: Some items would be scheduled before the first day of school',
          warnings,
        },
        { status: 400 }
      );
    }

    // Create version snapshot BEFORE making changes
    const { versionNumber, versionLabel } = await createVersionSnapshot(
      guideId,
      session.user.id,
      days_to_shift,
      subject
    );

    // Execute the bulk update in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const update of updatedItems) {
        await client.query(
          `UPDATE scheduled_items_v2
           SET start_date = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [update.new_start_date, update.id]
        );
      }

      await client.query('COMMIT');

      console.log(
        '[RE-PACE] Successfully updated',
        updatedItems.length,
        'items'
      );

      return NextResponse.json({
        success: true,
        affected_count: updatedItems.length,
        version_created: versionNumber,
        version_label: versionLabel,
        warnings,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[RE-PACE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to re-pace schedule' },
      { status: 500 }
    );
  }
}
