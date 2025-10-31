import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// Helper function to add school days (skipping weekends and blocked curriculum dates)
// IMPORTANT: Uses local timezone to avoid UTC parsing issues
function addSchoolDays(startDateString: string, daysToAdd: number, blockedDates: Set<string> = new Set()): string {
  console.log(`[addSchoolDays] Input: ${startDateString}, adding ${daysToAdd} days`);
  console.log(`[addSchoolDays] Blocked dates: ${Array.from(blockedDates).join(', ')}`);

  // Parse as local date (YYYY-MM-DD)
  const [year, month, day] = startDateString.split('-').map(Number);
  const result = new Date(year, month - 1, day); // month is 0-indexed

  let daysRemaining = daysToAdd;

  // Keep moving forward until we've added the correct number of school days
  while (daysRemaining > 0) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
    const dateString = `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`;

    console.log(`[addSchoolDays] Checking ${dateString} (${dayName})`);

    // Check if this is a weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log(`[addSchoolDays] Weekend - skipping`);
      continue;
    }

    // Check if this date is blocked by a calendar event
    if (blockedDates.has(dateString)) {
      console.log(`[addSchoolDays] Blocked curriculum date - skipping`);
      continue;
    }

    // This is a valid school day
    daysRemaining--;
    console.log(`[addSchoolDays] Counted as school day, ${daysRemaining} remaining`);
  }

  const outputDate = `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`;
  console.log(`[addSchoolDays] Output: ${outputDate}`);
  return outputDate;
}

// POST - Create a scheduled component
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subject_calendar_id, component_key, subject, start_date, duration_days, title_override } = await req.json();

    // Verify the calendar belongs to a guide owned by this user
    const calendarCheck = await pool.query(
      `SELECT sc.id, sc.pacing_guide_id, pg.user_id
       FROM subject_calendars sc
       JOIN pacing_guides pg ON sc.pacing_guide_id = pg.id
       WHERE sc.id = $1`,
      [subject_calendar_id]
    );

    if (calendarCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Calendar not found' },
        { status: 404 }
      );
    }

    if (calendarCheck.rows[0].user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const pacingGuideId = calendarCheck.rows[0].pacing_guide_id;

    // Fetch blocked curriculum dates from calendar events
    const blockedDatesResult = await pool.query(
      `SELECT start_date, duration_days
       FROM calendar_events
       WHERE pacing_guide_id = $1 AND blocks_curriculum = true`,
      [pacingGuideId]
    );

    // Build a Set of all blocked dates (expanding multi-day events)
    const blockedDates = new Set<string>();
    for (const event of blockedDatesResult.rows) {
      const startDate = event.start_date.toISOString().split('T')[0]; // YYYY-MM-DD
      blockedDates.add(startDate);

      // Add subsequent days if multi-day event
      for (let i = 1; i < event.duration_days; i++) {
        const nextDate = addSchoolDays(startDate, i, new Set()); // Use empty set to avoid recursion
        blockedDates.add(nextDate);
      }
    }

    console.log('[BLOCKED DATES]', Array.from(blockedDates));

    // Check if this is a multi-component template and get template info (including color)
    const templateCheck = await pool.query(
      `SELECT metadata, description, display_name, subject, color FROM component_templates WHERE component_key = $1`,
      [component_key]
    );

    const template = templateCheck.rows[0] || {};
    const metadata = template.metadata || {};

    console.log('[TEMPLATE CHECK]', {
      component_key,
      hasTemplate: !!template,
      templateColor: template.color,
      templateName: template.display_name
    });

    // Auto-populate title for Social Studies unit components (Through Industrialism/Modern Times)
    let finalTitleOverride = title_override;
    if (!finalTitleOverride &&
        template.subject === 'social_studies' &&
        (template.display_name?.startsWith('Through Industrialism:') ||
         template.display_name?.startsWith('Through Modern Times:'))) {
      finalTitleOverride = template.description;
    }

    // Auto-populate title for Group 1 & 2 WT component (show description instead of display_name)
    if (!finalTitleOverride && component_key === 'ela_group_wt_both') {
      finalTitleOverride = template.description;
    }

    // If this is a multi-component template, create multiple scheduled components
    if (metadata.is_multi && Array.isArray(metadata.sub_components)) {
      console.log('[MULTI-COMPONENT] Creating multiple components for:', component_key);
      console.log('[MULTI-COMPONENT] Start date:', start_date);
      console.log('[MULTI-COMPONENT] Sub-components:', metadata.sub_components);

      // VALIDATION: Check if start_date is a blocked curriculum date
      if (blockedDates.has(start_date)) {
        return NextResponse.json(
          {
            error: 'Cannot place component on blocked curriculum date',
            blocked_dates: [start_date],
            message: `Cannot start component on ${start_date} - this is a blocked curriculum date. Please choose a different start date.`
          },
          { status: 400 }
        );
      }

      const createdComponents: any[] = [];
      let currentDateString = start_date;

      // Generate a group_id to link all sub-components together
      // EXCEPTION: Social Studies components should NOT have a group_id
      // This allows them to be moved/edited independently after placement
      let groupId = null;
      if (subject !== 'social_studies') {
        const groupIdResult = await pool.query('SELECT gen_random_uuid() as group_id');
        groupId = groupIdResult.rows[0].group_id;
        console.log('[MULTI-COMPONENT] Generated group_id:', groupId);
      } else {
        console.log('[MULTI-COMPONENT] Social Studies - skipping group_id for independent components');
      }

      for (let i = 0; i < metadata.sub_components.length; i++) {
        const subComponent = metadata.sub_components[i];

        console.log(`[MULTI-COMPONENT] Creating ${i + 1}/${metadata.sub_components.length}: ${subComponent.title} on ${currentDateString}`);

        // Get the next display_order for this cell
        const displayOrderResult = await pool.query(
          `SELECT COALESCE(MAX(display_order), 0) + 1 as next_order
           FROM scheduled_components
           WHERE subject_calendar_id = $1 AND start_date = $2`,
          [subject_calendar_id, currentDateString]
        );
        const nextDisplayOrder = displayOrderResult.rows[0].next_order;

        const result = await pool.query(
          `INSERT INTO scheduled_components
           (subject_calendar_id, component_key, subject, start_date, duration_days, title_override, group_id, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, subject_calendar_id, component_key, subject, start_date, duration_days, title_override, color_override, "order", notes, group_id, display_order, created_at`,
          [
            subject_calendar_id,
            component_key,
            subject,
            currentDateString,
            subComponent.duration,
            subComponent.title,
            groupId,
            nextDisplayOrder
          ]
        );

        // Add template fields for immediate display on frontend
        const componentWithTemplate = {
          ...result.rows[0],
          display_name: template.display_name || 'Component',
          color: template.color || '#6B7280',
        };
        createdComponents.push(componentWithTemplate);
        console.log(`[MULTI-COMPONENT] Created component ID: ${result.rows[0].id}`, {
          color: componentWithTemplate.color,
          display_name: componentWithTemplate.display_name
        });

        // Move to next start date (skip weekends and blocked dates)
        currentDateString = addSchoolDays(currentDateString, subComponent.duration, blockedDates);
        console.log(`[MULTI-COMPONENT] Next date: ${currentDateString}`);
      }

      console.log('[MULTI-COMPONENT] Created total components:', createdComponents.length);
      return NextResponse.json(createdComponents, { status: 201 });
    }

    // Regular single component creation

    // VALIDATION: Check if component would overlap with blocked curriculum dates
    const componentDates: string[] = [start_date];
    let currentCheckDate = start_date;

    // Build array of all dates this component will occupy
    for (let i = 1; i < duration_days; i++) {
      currentCheckDate = addSchoolDays(currentCheckDate, 1, new Set()); // Don't skip blocked when building range
      componentDates.push(currentCheckDate);
    }

    // Check for overlap with blocked dates
    const blockedOverlap = componentDates.filter(date => blockedDates.has(date));
    if (blockedOverlap.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot place component on blocked curriculum date',
          blocked_dates: blockedOverlap,
          message: `This component would overlap with ${blockedOverlap.length} blocked curriculum date(s): ${blockedOverlap.join(', ')}. Please choose a different date.`
        },
        { status: 400 }
      );
    }

    // Get the next display_order for this cell
    const displayOrderResult = await pool.query(
      `SELECT COALESCE(MAX(display_order), 0) + 1 as next_order
       FROM scheduled_components
       WHERE subject_calendar_id = $1 AND start_date = $2`,
      [subject_calendar_id, start_date]
    );
    const nextDisplayOrder = displayOrderResult.rows[0].next_order;

    const result = await pool.query(
      `INSERT INTO scheduled_components
       (subject_calendar_id, component_key, subject, start_date, duration_days, title_override, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, subject_calendar_id, component_key, subject, start_date, duration_days, title_override, color_override, "order", notes, display_order, created_at`,
      [subject_calendar_id, component_key, subject, start_date, duration_days, finalTitleOverride || null, nextDisplayOrder]
    );

    // Add template fields for immediate display on frontend
    const componentWithTemplate = {
      ...result.rows[0],
      display_name: template.display_name || 'Component',
      color: template.color || '#6B7280',
    };

    return NextResponse.json(componentWithTemplate, { status: 201 });
  } catch (error) {
    console.error('Error creating scheduled component:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduled component' },
      { status: 500 }
    );
  }
}
