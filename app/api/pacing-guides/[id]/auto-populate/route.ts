import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { AutoPopulateRequest, AutoPopulateResponse, SubjectAutoPopulateResult } from '@/lib/auto-populate/types';
import { generateScienceComponents } from '@/lib/auto-populate/science';
import { generateSocialStudiesComponents } from '@/lib/auto-populate/social-studies';
import { generateMathComponents } from '@/lib/auto-populate/math';
import { generateELAComponents } from '@/lib/auto-populate/ela';

/**
 * Helper function to add school days (skipping weekends and blocked dates)
 */
function addSchoolDays(startDateString: string, daysToAdd: number, blockedDates: Set<string>): string {
  const [year, month, day] = startDateString.split('-').map(Number);
  const result = new Date(year, month - 1, day);

  let daysRemaining = daysToAdd;

  while (daysRemaining > 0) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    const dateString = `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`;

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    // Skip blocked curriculum dates
    if (blockedDates.has(dateString)) {
      continue;
    }

    daysRemaining--;
  }

  return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`;
}

/**
 * Helper function to place a component with multi-component expansion support
 * Replicates the logic from /api/scheduled-components to handle metadata.is_multi
 */
async function placeComponent(
  calendarId: string,
  componentKey: string,
  subject: string,
  startDate: string,
  durationDays: number,
  titleOverride: string | null,
  blockedDates: Set<string>
): Promise<number> {
  // Fetch template metadata to check if this is a multi-component
  const templateResult = await pool.query(
    `SELECT metadata, description, display_name, subject, color FROM component_templates WHERE component_key = $1`,
    [componentKey]
  );

  const template = templateResult.rows[0] || {};
  const metadata = template.metadata || {};

  // Auto-populate title for Social Studies unit components
  let finalTitleOverride = titleOverride;
  if (!finalTitleOverride &&
      template.subject === 'social_studies' &&
      (template.display_name?.startsWith('Through Industrialism:') ||
       template.display_name?.startsWith('Through Modern Times:'))) {
    finalTitleOverride = template.description;
  }

  // If this is a multi-component template, expand it into multiple scheduled components
  if (metadata.is_multi && Array.isArray(metadata.sub_components)) {
    let currentDateString = startDate;
    let createdCount = 0;

    // Generate a group_id to link all sub-components together
    const groupIdResult = await pool.query('SELECT gen_random_uuid() as group_id');
    const groupId = groupIdResult.rows[0].group_id;

    for (const subComponent of metadata.sub_components) {
      // Handle rotation number replacement for Module Rotations
      // If titleOverride is "R1" and subComponent.title is "R#, S1", replace R# with R1
      let finalSubComponentTitle = subComponent.title;
      if (titleOverride && /^R\d+$/.test(titleOverride)) {
        // titleOverride is a rotation number like "R1", "R2", etc.
        finalSubComponentTitle = subComponent.title.replace(/R#/g, titleOverride);
      }

      await pool.query(
        `INSERT INTO scheduled_components
         (subject_calendar_id, component_key, subject, start_date, duration_days, title_override, group_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          calendarId,
          componentKey,
          subject,
          currentDateString,
          subComponent.duration,
          finalSubComponentTitle,
          groupId
        ]
      );

      createdCount++;

      // Move to next start date (skip weekends and blocked dates)
      currentDateString = addSchoolDays(currentDateString, subComponent.duration, blockedDates);
    }

    return createdCount;
  }

  // Regular single component creation
  await pool.query(
    `INSERT INTO scheduled_components
     (subject_calendar_id, component_key, subject, start_date, duration_days, title_override)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [calendarId, componentKey, subject, startDate, durationDays, finalTitleOverride || null]
  );

  return 1;
}

/**
 * Auto-Populate Pacing Guide - Main API Route
 *
 * POST /api/pacing-guides/[id]/auto-populate
 *
 * Automatically places curriculum components on all 4 subject calendars
 * based on validated patterns from real school pacing guides.
 *
 * Request Body: AutoPopulateRequest (contains configurations for all subjects)
 * Response: AutoPopulateResponse (placement counts and any errors)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ========================================================================
    // AUTHENTICATION & AUTHORIZATION
    // ========================================================================

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: guideId } = await params;

    // Verify guide belongs to user
    const guideCheck = await pool.query(
      'SELECT user_id, first_day, last_day FROM pacing_guides WHERE id = $1',
      [guideId]
    );

    if (guideCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    if (guideCheck.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // ========================================================================
    // FETCH BLOCKED CURRICULUM DATES
    // ========================================================================

    const blockedDatesResult = await pool.query(
      `SELECT start_date, duration_days
       FROM calendar_events
       WHERE pacing_guide_id = $1 AND blocks_curriculum = true`,
      [guideId]
    );

    // Build a Set of all blocked dates (expanding multi-day events)
    const blockedDates = new Set<string>();
    for (const event of blockedDatesResult.rows) {
      const startDate = event.start_date.toISOString().split('T')[0]; // YYYY-MM-DD
      blockedDates.add(startDate);

      // Add subsequent days if multi-day event
      for (let i = 1; i < event.duration_days; i++) {
        const [year, month, day] = startDate.split('-').map(Number);
        const nextDate = new Date(year, month - 1, day);
        nextDate.setDate(nextDate.getDate() + i);
        const nextDateString = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
        blockedDates.add(nextDateString);
      }
    }

    // ========================================================================
    // PARSE REQUEST BODY
    // ========================================================================

    const config: AutoPopulateRequest = await req.json();

    // ========================================================================
    // AUTO-DETECT FIRST DAY OF SCHOOL FOR STUDENTS
    // ========================================================================

    // Look for calendar events that indicate when students first arrive
    const firstStudentDayResult = await pool.query(
      `SELECT start_date
       FROM calendar_events
       WHERE pacing_guide_id = $1
       AND (
         LOWER(event_name) LIKE '%first day%student%'
         OR LOWER(event_name) LIKE '%student%first day%'
         OR LOWER(event_name) LIKE '%students first day%'
         OR LOWER(event_name) LIKE '%first day for students%'
         OR LOWER(event_name) LIKE '%student arrival%'
       )
       ORDER BY start_date ASC
       LIMIT 1`,
      [guideId]
    );

    // If found, override all subject start dates with the first student day
    if (firstStudentDayResult.rows.length > 0) {
      const firstStudentDay = firstStudentDayResult.rows[0].start_date.toISOString().split('T')[0];
      console.log(`Auto-detected first student day: ${firstStudentDay}`);

      // Override start dates for all enabled subjects
      if (config.science?.enabled) {
        config.science.startDate = firstStudentDay;
      }
      if (config.socialStudies?.enabled) {
        config.socialStudies.startDate = firstStudentDay;
      }
      if (config.math?.enabled) {
        config.math.startDate = firstStudentDay;
      }
      if (config.ela?.enabled) {
        config.ela.startDate = firstStudentDay;
      }
    }

    const results: {
      science: SubjectAutoPopulateResult;
      socialStudies: SubjectAutoPopulateResult;
      math: SubjectAutoPopulateResult;
      ela: SubjectAutoPopulateResult;
    } = {
      science: { success: false, componentCount: 0 },
      socialStudies: { success: false, componentCount: 0 },
      math: { success: false, componentCount: 0 },
      ela: { success: false, componentCount: 0 },
    };

    const errors: string[] = [];
    const warnings: string[] = [];

    // ========================================================================
    // SCIENCE AUTO-POPULATE
    // ========================================================================

    if (config.science?.enabled) {
      try {
        // Get Science calendar ID
        const scienceCalendarResult = await pool.query(
          `SELECT id FROM subject_calendars
           WHERE pacing_guide_id = $1 AND subject = 'science'`,
          [guideId]
        );

        if (scienceCalendarResult.rows.length === 0) {
          throw new Error('Science calendar not found');
        }

        const scienceCalendarId = scienceCalendarResult.rows[0].id;

        // Generate component placements
        const scienceComponents = generateScienceComponents(config.science, blockedDates);

        // Place each component with multi-component expansion support
        let totalCreated = 0;
        for (const componentData of scienceComponents) {
          const created = await placeComponent(
            scienceCalendarId,
            componentData.component_key,
            'science',
            componentData.start_date,
            componentData.duration_days,
            componentData.title_override || null,
            blockedDates
          );
          totalCreated += created;
        }

        results.science = {
          success: true,
          componentCount: totalCreated
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.science = {
          success: false,
          componentCount: 0,
          error: `Science: ${errorMessage}`
        };
        errors.push(`Science: ${errorMessage}`);
      }
    }

    // ========================================================================
    // SOCIAL STUDIES AUTO-POPULATE
    // ========================================================================

    if (config.socialStudies?.enabled) {
      try {
        // Get Social Studies calendar ID
        const socialStudiesCalendarResult = await pool.query(
          `SELECT id FROM subject_calendars
           WHERE pacing_guide_id = $1 AND subject = 'social_studies'`,
          [guideId]
        );

        if (socialStudiesCalendarResult.rows.length === 0) {
          throw new Error('Social Studies calendar not found');
        }

        const socialStudiesCalendarId = socialStudiesCalendarResult.rows[0].id;

        // Generate component placements
        const socialStudiesComponents = generateSocialStudiesComponents(config.socialStudies, blockedDates);

        // Place each component with multi-component expansion support
        let totalCreated = 0;
        for (const componentData of socialStudiesComponents) {
          const created = await placeComponent(
            socialStudiesCalendarId,
            componentData.component_key,
            'social_studies',
            componentData.start_date,
            componentData.duration_days,
            componentData.title_override || null,
            blockedDates
          );
          totalCreated += created;
        }

        results.socialStudies = {
          success: true,
          componentCount: totalCreated
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.socialStudies = {
          success: false,
          componentCount: 0,
          error: `Social Studies: ${errorMessage}`
        };
        errors.push(`Social Studies: ${errorMessage}`);
      }
    }

    // ========================================================================
    // MATH AUTO-POPULATE
    // ========================================================================

    if (config.math?.enabled) {
      try {
        // Get Math calendar ID
        const mathCalendarResult = await pool.query(
          `SELECT id FROM subject_calendars
           WHERE pacing_guide_id = $1 AND subject = 'math'`,
          [guideId]
        );

        if (mathCalendarResult.rows.length === 0) {
          throw new Error('Math calendar not found');
        }

        const mathCalendarId = mathCalendarResult.rows[0].id;

        // Generate component placements
        const mathComponents = generateMathComponents(config.math, blockedDates);

        // Place each component with multi-component expansion support
        let totalCreated = 0;
        for (const componentData of mathComponents) {
          const created = await placeComponent(
            mathCalendarId,
            componentData.component_key,
            'math',
            componentData.start_date,
            componentData.duration_days,
            componentData.title_override || null,
            blockedDates
          );
          totalCreated += created;
        }

        results.math = {
          success: true,
          componentCount: totalCreated
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.math = {
          success: false,
          componentCount: 0,
          error: `Math: ${errorMessage}`
        };
        errors.push(`Math: ${errorMessage}`);
      }
    }

    // ========================================================================
    // ELA AUTO-POPULATE
    // ========================================================================

    if (config.ela?.enabled) {
      try {
        // Get ELA calendar ID
        const elaCalendarResult = await pool.query(
          `SELECT id FROM subject_calendars
           WHERE pacing_guide_id = $1 AND subject = 'ela'`,
          [guideId]
        );

        if (elaCalendarResult.rows.length === 0) {
          throw new Error('ELA calendar not found');
        }

        const elaCalendarId = elaCalendarResult.rows[0].id;

        // Generate component placements
        const elaComponents = generateELAComponents(config.ela, blockedDates);

        // Special handling for ELA: Detect and group 2-day blocks
        // Components with "ELA_GROUP:U#L#|" prefix should be linked with group_id
        let totalCreated = 0;
        let currentGroupMarker: string | null = null;
        let currentGroupId: string | null = null;

        for (const componentData of elaComponents) {
          const title = componentData.title_override || '';
          const groupMatch = title.match(/^ELA_GROUP:([^|]+)\|(.*)$/s); // Added 's' flag to match newlines

          if (groupMatch) {
            // This component has a group marker
            const groupMarker = groupMatch[1]; // e.g., "U1L1"
            const actualTitle = groupMatch[2]; // The real title without prefix

            // If this is a new group, generate a new group_id
            if (groupMarker !== currentGroupMarker) {
              const groupIdResult = await pool.query('SELECT gen_random_uuid() as group_id');
              currentGroupId = groupIdResult.rows[0].group_id;
              currentGroupMarker = groupMarker;
            }

            // Insert component with group_id
            await pool.query(
              `INSERT INTO scheduled_components
               (subject_calendar_id, component_key, subject, start_date, duration_days, title_override, group_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                elaCalendarId,
                componentData.component_key,
                'ela',
                componentData.start_date,
                componentData.duration_days,
                actualTitle,
                currentGroupId
              ]
            );
            totalCreated++;
          } else {
            // Regular component without grouping - use placeComponent helper
            const created = await placeComponent(
              elaCalendarId,
              componentData.component_key,
              'ela',
              componentData.start_date,
              componentData.duration_days,
              componentData.title_override || null,
              blockedDates
            );
            totalCreated += created;

            // Reset group tracking
            currentGroupMarker = null;
            currentGroupId = null;
          }
        }

        results.ela = {
          success: true,
          componentCount: totalCreated
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.ela = {
          success: false,
          componentCount: 0,
          error: `ELA: ${errorMessage}`
        };
        errors.push(`ELA: ${errorMessage}`);
      }
    }

    // ========================================================================
    // RETURN RESULTS
    // ========================================================================

    const response: AutoPopulateResponse = {
      success: errors.length === 0,
      placedComponents: {
        science: results.science.componentCount,
        socialStudies: results.socialStudies.componentCount,
        math: results.math.componentCount,
        ela: results.ela.componentCount
      },
      errors,
      warnings
    };

    return NextResponse.json(response, { status: errors.length === 0 ? 201 : 207 }); // 207 = Multi-Status (some succeeded, some failed)
  } catch (error) {
    console.error('Error in auto-populate:', error);
    return NextResponse.json(
      {
        error: 'Failed to auto-populate pacing guide',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
