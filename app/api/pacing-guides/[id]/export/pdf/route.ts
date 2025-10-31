import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import puppeteer from 'puppeteer';

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

// Generate HTML for a calendar
function generateCalendarHTML(
  guide: any,
  subject: string,
  events: any[],
  components: any[]
) {
  const subjectLabels: Record<string, string> = {
    base: 'Base Calendar',
    ela: 'ELA',
    math: 'Math',
    science: 'Science',
    social_studies: 'Social Studies',
  };

  const weeks = calculateWeeks(guide.first_day, guide.last_day);

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

  // Format date for display with year
  const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

  const firstDay = new Date(guide.first_day);
  const lastDay = new Date(guide.last_day);

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
      font-size: 9px;
      line-height: 1.2;
      padding: 20px;
      background: white;
    }

    .header {
      margin-bottom: 15px;
    }

    .school-name {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }

    .school-info {
      font-size: 11px;
      color: #6B7280;
    }

    .subject-title {
      font-size: 14px;
      font-weight: 600;
      color: #9333EA;
      margin-bottom: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    th, td {
      border: 1px solid #D1D5DB;
      padding: 4px;
      vertical-align: top;
      text-align: left;
    }

    th {
      background-color: #F9FAFB;
      font-weight: 600;
      font-size: 10px;
      color: #111827;
      padding: 6px 4px;
    }

    .week-cell {
      background-color: #F9FAFB;
      width: 60px;
      font-size: 9px;
    }

    .week-number {
      font-weight: 600;
      color: #111827;
    }

    .week-date {
      color: #6B7280;
      font-size: 8px;
      margin-top: 2px;
    }

    .day-cell {
      min-height: 60px;
      width: calc((100% - 60px) / 5);
    }

    .out-of-range {
      background-color: #E5E7EB;
    }

    .event-item, .component-item {
      padding: 4px 6px;
      margin-bottom: 3px;
      border-radius: 2px;
      font-size: 10px;
      line-height: 1.3;
      word-wrap: break-word;
      white-space: pre-line;
      display: flex;
      align-items: center;
    }

    .event-item {
      font-weight: 500;
      color: #111827;
      border-style: dashed;
      border-width: 0 0 0 3px;
    }

    .component-item {
      color: #374151;
      border-style: solid;
      border-width: 0 0 0 3px;
    }

    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="school-name">${guide.school_name} ${subjectLabels[subject]} Pacing Guide</div>
    <div class="school-info">
      ${guide.district_name} • Grade ${guide.grade_level} •
      ${formatDate(firstDay)} - ${formatDate(lastDay)}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="week-cell">Week</th>
        <th>Monday</th>
        <th>Tuesday</th>
        <th>Wednesday</th>
        <th>Thursday</th>
        <th>Friday</th>
      </tr>
    </thead>
    <tbody>
`;

  weeks.forEach((week) => {
    html += '<tr>';
    html += `
      <td class="week-cell">
        <div class="week-number">Week ${week.weekNumber}</div>
        <div class="week-date">${formatDate(week.startDate)}</div>
      </td>
    `;

    week.days.forEach((day) => {
      const isBeforeStart = day < firstDay;
      const isAfterEnd = day > lastDay;
      const dayEvents = getEventsForDate(day);
      const dayComponents = getComponentsForDate(day);

      html += `<td class="day-cell ${isBeforeStart || isAfterEnd ? 'out-of-range' : ''}">`;

      // Render events
      dayEvents.forEach((event) => {
        const bgColor = event.color || '#9CA3AF';
        const opacity = subject === 'base' ? '1' : '0.3';
        html += `
          <div class="event-item" style="background-color: ${bgColor}; opacity: ${opacity}; border-left-color: ${bgColor};">
            ${event.event_name}
          </div>
        `;
      });

      // Render components (only for subject calendars, not base)
      if (subject !== 'base') {
        dayComponents.forEach((component) => {
          const title = component.title_override || component.display_name;
          const color = component.color_override || component.color || '#9CA3AF';
          html += `
            <div class="component-item" style="background-color: ${color}20; border-left-color: ${color};">
              ${title}
            </div>
          `;
        });
      }

      html += '</td>';
    });

    html += '</tr>';
  });

  html += `
    </tbody>
  </table>
</body>
</html>
`;

  return html;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');

    if (!subject) {
      return NextResponse.json({ error: 'Subject parameter required' }, { status: 400 });
    }

    // Fetch pacing guide with authorization
    const guideResult = await pool.query(
      `SELECT pg.*, u.email
       FROM pacing_guides pg
       JOIN users u ON pg.user_id = u.id
       WHERE pg.id = $1`,
      [id]
    );

    if (guideResult.rows.length === 0) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    const guide = guideResult.rows[0];

    if (guide.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch calendars
    const calendarsResult = await pool.query(
      'SELECT * FROM subject_calendars WHERE pacing_guide_id = $1 ORDER BY subject',
      [id]
    );
    const calendars = calendarsResult.rows;

    // Fetch events
    const eventsResult = await pool.query(
      'SELECT * FROM calendar_events WHERE pacing_guide_id = $1',
      [id]
    );
    const events = eventsResult.rows;

    // Determine which subjects to export (exclude base from "all")
    const subjects = subject === 'all'
      ? ['ela', 'math', 'science', 'social_studies']
      : [subject];

    // Generate HTML for each subject
    const htmlPages: string[] = [];

    for (const subj of subjects) {
      const calendar = calendars.find((c) => c.subject === subj);
      if (!calendar) continue;

      // Fetch scheduled components for this subject
      let components = [];
      if (subj !== 'base') {
        const componentsResult = await pool.query(
          `SELECT
            sc.*,
            ct.display_name,
            ct.color
           FROM scheduled_components sc
           LEFT JOIN component_templates ct ON sc.component_key = ct.component_key
           WHERE sc.subject_calendar_id = $1`,
          [calendar.id]
        );
        components = componentsResult.rows;
      }

      const html = generateCalendarHTML(guide, subj, events, components);
      htmlPages.push(html);
    }

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Combine all HTML pages
    let combinedHTML = htmlPages[0];
    for (let i = 1; i < htmlPages.length; i++) {
      // Add page break between subjects
      combinedHTML = combinedHTML.replace('</body>', '<div class="page-break"></div></body>');
      // Append next subject's body content
      const nextBody = htmlPages[i].match(/<body>([\s\S]*)<\/body>/)?.[1] || '';
      combinedHTML = combinedHTML.replace('</body>', nextBody + '</body>');
    }

    await page.setContent(combinedHTML, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      margin: {
        top: '0.5cm',
        right: '0.5cm',
        bottom: '0.5cm',
        left: '0.5cm',
      },
      printBackground: true,
    });

    await browser.close();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="pacing-guide-${subject}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
