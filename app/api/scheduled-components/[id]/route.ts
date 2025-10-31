import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// PATCH - Update a scheduled component
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updates = await req.json();

    // Verify the component belongs to a guide owned by this user
    const ownershipCheck = await pool.query(
      `SELECT sc.id, sc.group_id, sc.title_override, pg.user_id
       FROM scheduled_components sc
       JOIN subject_calendars scal ON sc.subject_calendar_id = scal.id
       JOIN pacing_guides pg ON scal.pacing_guide_id = pg.id
       WHERE sc.id = $1`,
      [id]
    );

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }

    if (ownershipCheck.rows[0].user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const component = ownershipCheck.rows[0];

    // If updating start_date, validate against blocked curriculum dates
    if (updates.start_date) {
      // Get the pacing guide ID
      const guideQuery = await pool.query(
        `SELECT scal.pacing_guide_id
         FROM scheduled_components sc
         JOIN subject_calendars scal ON sc.subject_calendar_id = scal.id
         WHERE sc.id = $1`,
        [id]
      );
      const pacingGuideId = guideQuery.rows[0]?.pacing_guide_id;

      if (pacingGuideId) {
        // Fetch blocked curriculum dates
        const blockedDatesResult = await pool.query(
          `SELECT start_date, duration_days
           FROM calendar_events
           WHERE pacing_guide_id = $1 AND blocks_curriculum = true`,
          [pacingGuideId]
        );

        // Helper to add school days
        const addSchoolDays = (startDateString: string, daysToAdd: number, blockedDates: Set<string> = new Set()): string => {
          const [year, month, day] = startDateString.split('-').map(Number);
          const result = new Date(year, month - 1, day);
          let daysRemaining = daysToAdd;

          while (daysRemaining > 0) {
            result.setDate(result.getDate() + 1);
            const dayOfWeek = result.getDay();
            const dateString = `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`;

            if (dayOfWeek === 0 || dayOfWeek === 6) continue;
            if (blockedDates.has(dateString)) continue;

            daysRemaining--;
          }

          return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`;
        };

        // Build set of blocked dates
        const blockedDates = new Set<string>();
        for (const event of blockedDatesResult.rows) {
          const startDate = event.start_date.toISOString().split('T')[0];
          blockedDates.add(startDate);
          for (let i = 1; i < event.duration_days; i++) {
            const nextDate = addSchoolDays(startDate, i, new Set());
            blockedDates.add(nextDate);
          }
        }

        // Get current component's duration
        const durationQuery = await pool.query(
          'SELECT duration_days FROM scheduled_components WHERE id = $1',
          [id]
        );
        const duration_days = durationQuery.rows[0]?.duration_days || 1;

        // Build array of dates this component will occupy
        const componentDates: string[] = [updates.start_date];
        let currentCheckDate = updates.start_date;
        for (let i = 1; i < duration_days; i++) {
          currentCheckDate = addSchoolDays(currentCheckDate, 1, new Set());
          componentDates.push(currentCheckDate);
        }

        // Check for overlap with blocked dates
        const blockedOverlap = componentDates.filter(date => blockedDates.has(date));
        if (blockedOverlap.length > 0) {
          return NextResponse.json(
            {
              error: 'Cannot move component to blocked curriculum date',
              blocked_dates: blockedOverlap,
              message: `This component would overlap with ${blockedOverlap.length} blocked curriculum date(s): ${blockedOverlap.join(', ')}. Please choose a different date.`
            },
            { status: 400 }
          );
        }
      }
    }

    // Handle group rotation updates (e.g., changing R# to R1 for all sessions in a rotation)
    if (updates.update_group_rotation && component.group_id && updates.title_override) {
      console.log('[GROUP ROTATION UPDATE] Updating rotation number for group:', component.group_id);

      // Extract rotation number from the new title (e.g., "R1, S3" -> "R1")
      const rotationMatch = updates.title_override.match(/^(R\d+),/);
      if (rotationMatch) {
        const newRotationNumber = rotationMatch[1];
        console.log('[GROUP ROTATION UPDATE] New rotation number:', newRotationNumber);

        // Build the UPDATE query dynamically to include color if provided
        let updateQuery = `UPDATE scheduled_components
           SET title_override = REGEXP_REPLACE(title_override, '^R[#0-9]+', $1, 'g'),
               updated_at = CURRENT_TIMESTAMP`;

        const queryParams: any[] = [newRotationNumber];

        // If color is provided, update color_override for all components in the group
        if (updates.color) {
          updateQuery += `, color_override = $${queryParams.length + 1}`;
          queryParams.push(updates.color);
          console.log('[GROUP ROTATION UPDATE] Also updating color to:', updates.color);
        }

        updateQuery += ` WHERE group_id = $${queryParams.length + 1}`;
        queryParams.push(component.group_id);

        await pool.query(updateQuery, queryParams);

        // Fetch all updated components in the group with computed color
        const groupResult = await pool.query(
          `SELECT sc.id, sc.subject_calendar_id, sc.component_key, sc.subject, sc.start_date, sc.duration_days,
                  sc.title_override, sc."order", sc.notes, sc.group_id, sc.updated_at, sc.display_order,
                  ct.display_name,
                  COALESCE(sc.color_override, ct.color, '#6B7280') as color
           FROM scheduled_components sc
           LEFT JOIN component_templates ct ON sc.component_key = ct.component_key
           WHERE sc.group_id = $1
           ORDER BY sc.start_date, sc.display_order`,
          [component.group_id]
        );

        return NextResponse.json(groupResult.rows);
      }
    }

    // Handle TT/WW Lesson Block updates (e.g., changing Unit # and Lesson # for all days in block)
    if (updates.update_group_ttww && component.group_id && updates.title_override) {
      console.log('[TT/WW BLOCK UPDATE] Updating unit/lesson for group:', component.group_id);

      // Extract unit and lesson from the new title (e.g., "L!L Unit 1, Lesson 3\nGroup 1: TT / Group 2: WT")
      const ttwwMatch = updates.title_override.match(/^L!L Unit (\d+), Lesson (\d+)/);
      if (ttwwMatch) {
        const newUnit = ttwwMatch[1];
        const newLesson = ttwwMatch[2];
        console.log('[TT/WW BLOCK UPDATE] New unit:', newUnit, 'New lesson:', newLesson);

        // Build the UPDATE query dynamically to include color if provided
        let updateQuery = `UPDATE scheduled_components
           SET title_override = REGEXP_REPLACE(
                 title_override,
                 '^L!L Unit [#0-9]+, Lesson [#0-9]+',
                 'L!L Unit ' || $1 || ', Lesson ' || $2,
                 'g'
               ),
               updated_at = CURRENT_TIMESTAMP`;

        const queryParams: any[] = [newUnit, newLesson];

        // If color is provided, update color_override for all components in the group
        if (updates.color) {
          updateQuery += `, color_override = $${queryParams.length + 1}`;
          queryParams.push(updates.color);
          console.log('[TT/WW BLOCK UPDATE] Also updating color to:', updates.color);
        }

        updateQuery += ` WHERE group_id = $${queryParams.length + 1}`;
        queryParams.push(component.group_id);

        await pool.query(updateQuery, queryParams);

        // Fetch all updated components in the group with computed color
        const groupResult = await pool.query(
          `SELECT sc.id, sc.subject_calendar_id, sc.component_key, sc.subject, sc.start_date, sc.duration_days,
                  sc.title_override, sc."order", sc.notes, sc.group_id, sc.updated_at, sc.display_order,
                  ct.display_name,
                  COALESCE(sc.color_override, ct.color, '#6B7280') as color
           FROM scheduled_components sc
           LEFT JOIN component_templates ct ON sc.component_key = ct.component_key
           WHERE sc.group_id = $1
           ORDER BY sc.start_date, sc.display_order`,
          [component.group_id]
        );

        return NextResponse.json(groupResult.rows);
      }
    }

    // Handle Language Live Unit updates (e.g., changing Unit # for all 22 sessions in a unit)
    if (updates.update_group_language_live && component.group_id && updates.title_override) {
      console.log('[LANGUAGE LIVE UNIT UPDATE] Updating unit number for group:', component.group_id);

      // Extract unit from the new title (e.g., "L!L Unit 1, L3\nGroup 1: TT\nGroup 2: WT")
      const unitMatch = updates.title_override.match(/^L!L Unit (\d+), /);
      if (unitMatch) {
        const newUnit = unitMatch[1];
        console.log('[LANGUAGE LIVE UNIT UPDATE] New unit:', newUnit);

        // Build the UPDATE query dynamically to include color if provided
        // Match both "L!L Unit #, L1" and "L!L Unit #\n" (for data conference days)
        let updateQuery = `UPDATE scheduled_components
           SET title_override = REGEXP_REPLACE(
                 title_override,
                 '^L!L Unit [#0-9]+',
                 'L!L Unit ' || $1,
                 'g'
               ),
               updated_at = CURRENT_TIMESTAMP`;

        const queryParams: any[] = [newUnit];

        // If color is provided, update color_override for all components in the group
        if (updates.color) {
          updateQuery += `, color_override = $${queryParams.length + 1}`;
          queryParams.push(updates.color);
          console.log('[LANGUAGE LIVE UNIT UPDATE] Also updating color to:', updates.color);
        }

        updateQuery += ` WHERE group_id = $${queryParams.length + 1}`;
        queryParams.push(component.group_id);

        await pool.query(updateQuery, queryParams);

        // Fetch all updated components in the group with computed color
        const groupResult = await pool.query(
          `SELECT sc.id, sc.subject_calendar_id, sc.component_key, sc.subject, sc.start_date, sc.duration_days,
                  sc.title_override, sc."order", sc.notes, sc.group_id, sc.updated_at, sc.display_order,
                  ct.display_name,
                  COALESCE(sc.color_override, ct.color, '#6B7280') as color
           FROM scheduled_components sc
           LEFT JOIN component_templates ct ON sc.component_key = ct.component_key
           WHERE sc.group_id = $1
           ORDER BY sc.start_date, sc.display_order`,
          [component.group_id]
        );

        return NextResponse.json(groupResult.rows);
      }
    }

    // Build dynamic update query
    const allowedFields = ['start_date', 'duration_days', 'title_override', 'notes', 'order', 'color'];
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        // Map 'color' to 'color_override' in the database
        const fieldName = key === 'color' ? 'color_override' : key;
        updateFields.push(`${fieldName} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add component ID as the last parameter
    values.push(id);

    const result = await pool.query(
      `UPDATE scheduled_components sc
       SET ${updateFields.join(', ')}
       FROM component_templates ct
       WHERE sc.id = $${paramCount} AND sc.component_key = ct.component_key
       RETURNING sc.id, sc.subject_calendar_id, sc.component_key, sc.subject, sc.start_date, sc.duration_days,
                 sc.title_override, sc."order", sc.notes, sc.group_id, sc.updated_at,
                 ct.display_name,
                 COALESCE(sc.color_override, ct.color, '#6B7280') as color`,
      values
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating scheduled component:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled component' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a scheduled component
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify the component belongs to a guide owned by this user
    const ownershipCheck = await pool.query(
      `SELECT sc.id, pg.user_id
       FROM scheduled_components sc
       JOIN subject_calendars scal ON sc.subject_calendar_id = scal.id
       JOIN pacing_guides pg ON scal.pacing_guide_id = pg.id
       WHERE sc.id = $1`,
      [id]
    );

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }

    if (ownershipCheck.rows[0].user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the component
    await pool.query(
      'DELETE FROM scheduled_components WHERE id = $1',
      [id]
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting scheduled component:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled component' },
      { status: 500 }
    );
  }
}
