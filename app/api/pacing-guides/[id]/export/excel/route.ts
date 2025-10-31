import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import ExcelJS from 'exceljs';

// Helper function to add school days (skipping weekends)
function addSchoolDays(startDate: Date, numDays: number): Date {
  const result = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < numDays) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }

  return result;
}

// Helper function to check if a date is a school day
function isSchoolDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

// Calculate weeks between first and last day
function calculateWeeks(firstDay: string, lastDay: string) {
  const start = new Date(firstDay);
  const end = new Date(lastDay);
  const weeks: Array<{ weekNumber: number; startDate: Date; days: Date[] }> = [];

  let currentWeekStart = new Date(start);
  const dayOfWeek = currentWeekStart.getDay();

  if (dayOfWeek !== 1) {
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
    currentWeekStart.setDate(currentWeekStart.getDate() + daysUntilMonday);
  }

  let weekNumber = 1;

  while (currentWeekStart <= end) {
    const days: Date[] = [];

    for (let i = 0; i < 5; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }

    weeks.push({
      weekNumber,
      startDate: new Date(currentWeekStart),
      days,
    });

    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    weekNumber++;
  }

  return weeks;
}

// Format date for display
function formatDateDisplay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

// Generate worksheet for a subject
function generateWorksheet(
  workbook: ExcelJS.Workbook,
  guide: any,
  subject: string,
  events: any[],
  components: any[]
) {
  const subjectLabels: Record<string, string> = {
    ela: 'ELA',
    math: 'Math',
    science: 'Science',
    social_studies: 'Social Studies',
  };

  const sheetName = subject === 'social_studies' ? 'Social Studies' : subjectLabels[subject];
  const worksheet = workbook.addWorksheet(sheetName);

  const weeks = calculateWeeks(guide.first_day, guide.last_day);
  const firstDay = new Date(guide.first_day);
  const lastDay = new Date(guide.last_day);

  // Helper to get events for a date
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.start_date);
      const eventEnd = addSchoolDays(eventStart, event.duration_days - 1);
      return isSchoolDay(date) && date >= eventStart && date <= eventEnd;
    });
  };

  // Helper to get components for a date
  const getComponentsForDate = (date: Date) => {
    return components.filter((component) => {
      const componentStart = new Date(component.start_date);
      const componentEnd = addSchoolDays(componentStart, component.duration_days - 1);
      return isSchoolDay(date) && date >= componentStart && date <= componentEnd;
    });
  };

  // Check if date is in range
  const isInRange = (date: Date) => {
    return date >= firstDay && date <= lastDay;
  };

  // Set column widths
  worksheet.columns = [
    { width: 12 },  // Week column
    { width: 26 },  // Monday
    { width: 26 },  // Tuesday
    { width: 26 },  // Wednesday
    { width: 26 },  // Thursday
    { width: 26 },  // Friday
  ];

  // Header row 1: School Name - Subject - Pacing Guide
  const headerRow = worksheet.addRow([`${guide.school_name} - ${subjectLabels[subject]} - Pacing Guide`]);
  headerRow.height = 24;
  headerRow.font = { bold: true, size: 14 };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  // Add top border only to header row
  for (let i = 1; i <= 6; i++) {
    const cell = headerRow.getCell(i);
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } }
    };
  }

  // Header row 2: District • Grade • Date Range
  const subHeaderRow = worksheet.addRow([
    `${guide.district_name} • Grade ${guide.grade_level} • ${formatDateDisplay(firstDay)} - ${formatDateDisplay(lastDay)}`
  ]);
  subHeaderRow.height = 18;
  subHeaderRow.font = { size: 11 };
  subHeaderRow.alignment = { vertical: 'middle', horizontal: 'left' };

  // Blank row
  const blankRow = worksheet.addRow([]);

  // Column headers
  const columnHeaderRow = worksheet.addRow(['Week', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  columnHeaderRow.height = 22;
  columnHeaderRow.font = { bold: true, size: 11 };
  columnHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Only apply styling to the 6 column header cells (not beyond)
  for (let i = 1; i <= 6; i++) {
    const cell = columnHeaderRow.getCell(i);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' } // Light gray
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  }

  // Calendar data rows
  weeks.forEach((week) => {
    const rowData: any[] = [`Week ${week.weekNumber}\n${formatDateDisplay(week.days[0]).replace(/\/\d{4}$/, '')}`];
    const dayCellInfo: Array<{ hasEventsOnly: boolean }> = [];

    week.days.forEach((day) => {
      const richTextParts: any[] = [];
      let hasEventsOnly = false;

      if (isInRange(day)) {
        // Add base calendar events (no color)
        const dayEvents = getEventsForDate(day);
        const dayComponents = getComponentsForDate(day);

        dayEvents.forEach((event, index) => {
          richTextParts.push({
            text: event.event_name + (index < dayEvents.length - 1 || dayComponents.length > 0 ? '\n' : ''),
            font: { color: { argb: 'FF000000' } } // Black for events
          });
        });

        // Add scheduled components with their colors
        dayComponents.forEach((component, index) => {
          const title = component.title_override || component.display_name;
          const color = component.color ? component.color.replace('#', 'FF') : 'FF000000';

          richTextParts.push({
            text: title + (index < dayComponents.length - 1 ? '\n' : ''),
            font: { color: { argb: color } }
          });
        });

        // Check if this cell has only events (no components)
        hasEventsOnly = dayEvents.length > 0 && dayComponents.length === 0;
      }

      dayCellInfo.push({ hasEventsOnly });

      // If we have rich text parts, use them; otherwise use empty string
      rowData.push(richTextParts.length > 0 ? { richText: richTextParts } : '');
    });

    const dataRow = worksheet.addRow(rowData);

    // Explicitly set row height (not auto-calculated)
    dataRow.height = 60;
    (dataRow as any).outlineLevel = 0; // Ensure no outline

    // Apply borders, alignment, and background color to the 6 data cells
    for (let i = 1; i <= 6; i++) {
      const cell = dataRow.getCell(i);

      // Set alignment with wrapText
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true, shrinkToFit: false };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };

      // Add background colors based on cell content
      if (i > 1) { // Skip the week column
        const dayIndex = i - 2; // Convert cell index to day index (0-4)
        const day = week.days[dayIndex];

        if (!isInRange(day)) {
          // Gray background for cells outside calendar range
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' } // Light gray
          };
        } else if (dayCellInfo[dayIndex].hasEventsOnly) {
          // Very light gray background for cells with only calendar events
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' } // Very light gray
          };
        }
      }
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch guide
    const guideResult = await pool.query(
      `SELECT * FROM pacing_guides WHERE id = $1 AND user_id = $2`,
      [id, session.user.id]
    );

    if (guideResult.rows.length === 0) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    const guide = guideResult.rows[0];

    // Fetch calendar events
    const eventsResult = await pool.query(
      `SELECT * FROM calendar_events WHERE pacing_guide_id = $1 ORDER BY start_date`,
      [id]
    );

    // Fetch subject calendars
    const calendarsResult = await pool.query(
      `SELECT * FROM subject_calendars WHERE pacing_guide_id = $1 ORDER BY
        CASE subject
          WHEN 'ela' THEN 1
          WHEN 'math' THEN 2
          WHEN 'science' THEN 3
          WHEN 'social_studies' THEN 4
        END`,
      [id]
    );

    // Fetch scheduled components
    const componentsResult = await pool.query(
      `SELECT
        sc.*,
        ct.display_name,
        COALESCE(sc.color_override, ct.color) as color
      FROM scheduled_components sc
      LEFT JOIN component_templates ct ON sc.component_key = ct.component_key
      WHERE sc.subject_calendar_id IN (
        SELECT id FROM subject_calendars WHERE pacing_guide_id = $1
      )
      ORDER BY sc.start_date, sc.display_order`,
      [id]
    );

    // Create workbook
    const workbook = new ExcelJS.Workbook();

    // Only include subject calendars (not base)
    const subjects = calendarsResult.rows.filter((cal: any) => cal.subject !== 'base');

    subjects.forEach((calendar: any) => {
      const subjectComponents = componentsResult.rows.filter(
        (comp: any) => comp.subject_calendar_id === calendar.id
      );

      generateWorksheet(
        workbook,
        guide,
        calendar.subject,
        eventsResult.rows,
        subjectComponents
      );
    });

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return Excel file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${guide.school_name}-pacing-guides.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json(
      { error: 'Failed to export Excel' },
      { status: 500 }
    );
  }
}
