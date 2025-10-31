import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// Helper function to add school days (skipping weekends and optionally blocked dates)
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

// POST - Bulk adjust scheduled components
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
    const {
      subject,
      days_to_shift,
      start_from_date,
      respect_blocked_dates,
      preview_only,
    } = await req.json();

    console.log('[BULK ADJUST] Request:', {
      guideId,
      subject,
      days_to_shift,
      start_from_date,
      respect_blocked_dates,
      preview_only,
    });

    // Validate input
    if (!days_to_shift || days_to_shift === 0) {
      return NextResponse.json(
        { error: 'days_to_shift must be a non-zero number' },
        { status: 400 }
      );
    }

    if (!['ela', 'math', 'science', 'social_studies', 'all'].includes(subject)) {
      return NextResponse.json(
        { error: 'Invalid subject' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const guide = guideCheck.rows[0];
    const firstDay = new Date(guide.first_day);
    const lastDay = new Date(guide.last_day);

    console.log('[BULK ADJUST] School year:', {
      first_day: formatDate(firstDay),
      last_day: formatDate(lastDay),
    });

    // Fetch blocked curriculum dates if respect_blocked_dates is true
    let blockedDates = new Set<string>();
    if (respect_blocked_dates) {
      const blockedDatesResult = await pool.query(
        `SELECT start_date, duration_days
         FROM calendar_events
         WHERE pacing_guide_id = $1 AND blocks_curriculum = true`,
        [guideId]
      );

      // Build a Set of all blocked dates (expanding multi-day events)
      for (const event of blockedDatesResult.rows) {
        const startDate = formatDate(new Date(event.start_date));
        blockedDates.add(startDate);

        // Add subsequent days if multi-day event
        for (let i = 1; i < event.duration_days; i++) {
          const nextDate = addSchoolDays(startDate, i, new Set());
          blockedDates.add(nextDate);
        }
      }

      console.log('[BULK ADJUST] Blocked dates:', Array.from(blockedDates));
    }

    // Build query to fetch components to adjust
    let componentsQuery = `
      SELECT sc.id, sc.subject_calendar_id, sc.component_key, sc.subject, sc.start_date,
             sc.duration_days, sc.title_override, sc."order", sc.notes, sc.group_id, sc.color_override,
             ct.display_name, ct.color as template_color,
             scal.subject as calendar_subject
      FROM scheduled_components sc
      LEFT JOIN component_templates ct ON sc.component_key = ct.component_key
      JOIN subject_calendars scal ON sc.subject_calendar_id = scal.id
      WHERE scal.pacing_guide_id = $1
    `;

    const queryParams: any[] = [guideId];
    let paramCount = 2;

    // Filter by subject if not "all"
    if (subject !== 'all') {
      componentsQuery += ` AND scal.subject = $${paramCount}`;
      queryParams.push(subject);
      paramCount++;
    }

    // Filter by start_from_date if provided
    if (start_from_date) {
      componentsQuery += ` AND sc.start_date >= $${paramCount}`;
      queryParams.push(start_from_date);
      paramCount++;
    }

    componentsQuery += ' ORDER BY sc.start_date, sc.display_order, sc.id';

    console.log('[BULK ADJUST] Query:', componentsQuery);
    console.log('[BULK ADJUST] Params:', queryParams);

    const componentsResult = await pool.query(componentsQuery, queryParams);
    const components = componentsResult.rows;

    console.log('[BULK ADJUST] Found components:', components.length);

    if (components.length === 0) {
      return NextResponse.json({
        affected_count: 0,
        sample_changes: [],
        warnings: ['No components found matching the criteria'],
        components: [],
      });
    }

    // Calculate new dates for each component
    const updatedComponents: any[] = [];
    const sampleChanges: any[] = [];
    const warnings: string[] = [];
    const processedGroupIds = new Set<string>();

    for (const component of components) {
      const currentDate = formatDate(new Date(component.start_date));
      const newDate = addSchoolDays(currentDate, days_to_shift, blockedDates);
      const newDateObj = new Date(newDate);

      // Check if new date is within school year
      if (newDateObj < firstDay) {
        warnings.push(
          `Component "${component.title_override || component.display_name}" would be scheduled before the first day of school (${formatDate(firstDay)})`
        );
      } else if (newDateObj > lastDay) {
        warnings.push(
          `Component "${component.title_override || component.display_name}" would be scheduled after the last day of school (${formatDate(lastDay)})`
        );
      }

      updatedComponents.push({
        id: component.id,
        new_start_date: newDate,
        old_start_date: currentDate,
        title: component.title_override || component.display_name,
      });

      // Add to sample changes (first 5)
      if (sampleChanges.length < 5) {
        sampleChanges.push({
          id: component.id,
          title: component.title_override || component.display_name,
          old_date: currentDate,
          new_date: newDate,
        });
      }
    }

    console.log('[BULK ADJUST] Calculated', updatedComponents.length, 'new dates');
    console.log('[BULK ADJUST] Warnings:', warnings);

    // If preview_only, return the preview data
    if (preview_only) {
      return NextResponse.json({
        affected_count: updatedComponents.length,
        sample_changes: sampleChanges,
        warnings,
      });
    }

    // If there are critical warnings (components before first day), prevent execution
    const criticalWarnings = warnings.filter(w => w.includes('before the first day'));
    if (criticalWarnings.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot apply changes: Some components would be scheduled before the first day of school',
          warnings,
        },
        { status: 400 }
      );
    }

    // Execute the bulk update in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const update of updatedComponents) {
        await client.query(
          `UPDATE scheduled_components
           SET start_date = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [update.new_start_date, update.id]
        );
      }

      await client.query('COMMIT');

      console.log('[BULK ADJUST] Successfully updated', updatedComponents.length, 'components');

      // Fetch the updated components to return
      const updatedIds = updatedComponents.map(u => u.id);
      const finalResult = await pool.query(
        `SELECT sc.id, sc.subject_calendar_id, sc.component_key, sc.subject, sc.start_date,
                sc.duration_days, sc.title_override, sc."order", sc.notes, sc.group_id,
                ct.display_name,
                COALESCE(sc.color_override, ct.color, '#6B7280') as color
         FROM scheduled_components sc
         LEFT JOIN component_templates ct ON sc.component_key = ct.component_key
         WHERE sc.id = ANY($1::uuid[])`,
        [updatedIds]
      );

      return NextResponse.json({
        affected_count: updatedComponents.length,
        sample_changes: sampleChanges,
        warnings,
        components: finalResult.rows,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[BULK ADJUST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to adjust schedule' },
      { status: 500 }
    );
  }
}
