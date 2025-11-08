import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Helper function to parse date string as local date (avoid timezone shifts)
function parseDateAsLocal(dateString: string | Date): Date {
  // If already a Date object, return as-is
  if (dateString instanceof Date) {
    return dateString;
  }

  // Ensure we have a string
  if (typeof dateString !== 'string') {
    console.error('parseDateAsLocal received non-string, non-Date:', dateString, typeof dateString);
    // Try to convert to string
    dateString = String(dateString);
  }

  // For YYYY-MM-DD format, parse as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // For ISO 8601 format from PostgreSQL (e.g., "2025-07-21T00:00:00.000Z")
  // Extract date parts and create as local date to avoid timezone shifts
  if (dateString.includes('T')) {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    return new Date(year, month, day);
  }

  // Fallback: try basic parsing
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

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
  // IMPORTANT: Parse dates as local to avoid timezone shifts
  // Use parseDateAsLocal to handle different formats safely
  const start = parseDateAsLocal(firstDay);
  const end = parseDateAsLocal(lastDay);
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

// Substitute metadata placeholders in title for display
function substituteMetadataInTitle(title: string, metadata: any): string {
  let result = title;

  // Replace {rotation} with actual rotation_number
  if (metadata?.rotation_number !== undefined) {
    result = result.replace(/{rotation}/g, metadata.rotation_number.toString());
  }

  // Replace {unit} with actual unit_number
  if (metadata?.unit_number !== undefined) {
    result = result.replace(/{unit}/g, metadata.unit_number.toString());
  }

  // Replace {standard_code}
  if (metadata?.standard_code !== undefined) {
    result = result.replace(/{standard_code}/g, metadata.standard_code.toString());
  }

  // Replace {lesson}
  if (metadata?.lesson_number !== undefined) {
    result = result.replace(/{lesson}/g, metadata.lesson_number.toString());
  }

  // Replace line breaks with commas for PDF export
  result = result.replace(/\\n/g, ', ').replace(/\n/g, ', ');

  return result;
}

// Truncate long titles to max length
function truncateTitle(title: string, maxLength: number = 35): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 1) + '…';
}

// Convert hex color to rgba with opacity
function hexToRGBA(hex: string, alpha: number): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Generate HTML for a calendar
function generateCalendarHTML(
  guide: any,
  subject: string,
  baseItems: any[], // Items from base calendar (holidays, etc.)
  subjectItems: any[], // Items from subject calendar (curriculum components)
  startFromDate?: string | null // Optional: Only include weeks from this date onwards
) {
  const subjectLabels: Record<string, string> = {
    base: 'Base Calendar',
    ela: 'ELA',
    math: 'Math',
    science: 'Science',
    social_studies: 'Social Studies',
  };

  const allWeeks = calculateWeeks(guide.first_day, guide.last_day);

  // Filter weeks if startFromDate is provided
  const weeks = startFromDate
    ? allWeeks.filter(week => {
        // Keep weeks where the week END date (Friday) is on or after startFromDate
        const weekEndDate = new Date(week.startDate);
        weekEndDate.setDate(weekEndDate.getDate() + 4); // Friday is 4 days after Monday
        // IMPORTANT: Parse startFromDate as local date to avoid timezone shifts
        const cutoffDate = parseDateAsLocal(startFromDate);
        return weekEndDate >= cutoffDate;
      })
    : allWeeks;

  // Helper to get base items (events) for a date
  const getBaseItemsForDate = (date: Date) => {
    return baseItems.filter((item) => {
      // IMPORTANT: Parse item start_date as local to avoid timezone shifts
      const itemStart = parseDateAsLocal(item.start_date);
      const itemEnd = addSchoolDays(itemStart, item.duration_days - 1);
      return isSchoolDay(date) && date >= itemStart && date <= itemEnd;
    });
  };

  // Helper to get subject items (components) for a date
  const getSubjectItemsForDate = (date: Date) => {
    return subjectItems.filter((item) => {
      // IMPORTANT: Parse item start_date as local to avoid timezone shifts
      const itemStart = parseDateAsLocal(item.start_date);
      const itemEnd = addSchoolDays(itemStart, item.duration_days - 1);
      return isSchoolDay(date) && date >= itemStart && date <= itemEnd;
    });
  };

  // Format date for display with 2-digit year
  const formatDate = (date: Date) => {
    const year = date.getFullYear().toString().slice(-2); // Last 2 digits
    return `${date.getMonth() + 1}/${date.getDate()}/${year}`;
  };

  // IMPORTANT: Parse guide dates as local to avoid timezone shifts
  const firstDay = parseDateAsLocal(guide.first_day);
  const lastDay = parseDateAsLocal(guide.last_day);

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

    @page {
      size: Letter portrait;
      margin: 0.35in 0.4in;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
      font-size: 9px;
      line-height: 1.25;
      background: white;
      color: #111827;
    }

    .subject-section {
      page-break-after: always;
      page-break-inside: avoid;
    }

    .header {
      margin-bottom: 6px;
      page-break-inside: avoid;
      page-break-after: avoid;
    }

    .calendar-container {
      orphans: 3;
      widows: 3;
    }

    .school-name {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 2px;
    }

    .school-info {
      font-size: 9px;
      color: #6B7280;
    }

    /* CSS Grid Calendar Container */
    .calendar-container {
      width: 100%;
      display: grid;
      grid-template-columns: 45px repeat(5, 1fr);
      gap: 0;
      border: 0.5px solid #000000;
    }

    /* Header Row */
    .header-cell {
      background-color: #F9FAFB;
      color: #374151;
      padding: 4px 3px;
      font-weight: 600;
      font-size: 9px;
      text-align: center;
      border: 0.5px solid #000000;
    }

    /* Week Cell (left column) */
    .week-cell {
      background-color: #F9FAFB;
      padding: 3px 2px;
      font-size: 8px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      min-height: 38px;
      border: 0.5px solid #000000;
    }

    .week-number {
      font-weight: 600;
      color: #374151;
      margin-bottom: 1px;
      font-size: 8px;
    }

    .week-date {
      color: #6B7280;
      font-size: 7px;
    }

    /* Day Cells */
    .day-cell {
      background-color: white;
      padding: 3px;
      min-height: 38px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      border: 0.5px solid #000000;
      page-break-inside: avoid;
    }

    .day-cell.out-of-range {
      background-color: #F3F4F6;
    }

    /* Items in cells - match app styling */
    .item {
      padding: 2px 4px;
      font-size: 9.5px;
      line-height: 1.25;
      font-weight: 500;
      border-radius: 3px;
      word-wrap: break-word;
      color: #111827;
    }

    .page-break {
      page-break-after: always;
    }

    @media print {
      .subject-section {
        page-break-after: always;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="subject-section">
    <div class="header">
      <div class="school-name">${guide.school_name} ${subjectLabels[subject]} Pacing Guide</div>
      <div class="school-info">
        ${guide.district_name} • Grade ${guide.grade_level} •
        ${formatDate(firstDay)} - ${formatDate(lastDay)}
      </div>
    </div>

    <div class="calendar-container">
      <!-- Header Row -->
      <div class="header-cell">Week</div>
      <div class="header-cell">Monday</div>
      <div class="header-cell">Tuesday</div>
      <div class="header-cell">Wednesday</div>
      <div class="header-cell">Thursday</div>
      <div class="header-cell">Friday</div>
`;

  weeks.forEach((week) => {
    // Week cell
    html += `
      <div class="week-cell">
        <div class="week-number">W${week.weekNumber}</div>
        <div class="week-date">${formatDate(week.startDate)}</div>
      </div>
    `;

    // Day cells (5 per week)
    week.days.forEach((day) => {
      const isBeforeStart = day < firstDay;
      const isAfterEnd = day > lastDay;
      const dayBaseItems = getBaseItemsForDate(day);
      const daySubjectItems = getSubjectItemsForDate(day);

      html += `<div class="day-cell ${isBeforeStart || isAfterEnd ? 'out-of-range' : ''}">`;

      // Render base items (holidays, events)
      dayBaseItems.forEach((item) => {
        const rawTitle = item.title_override || item.display_name || 'Event';
        const title = substituteMetadataInTitle(rawTitle, item.metadata);
        const baseColor = item.color_override || item.color || '#6B7280';

        // Convert hex to rgba with 25% opacity for subtle look (like app)
        const rgba = hexToRGBA(baseColor, 0.25);

        html += `
          <div class="item" style="background-color: ${rgba};">
            ${title}
          </div>
        `;
      });

      // Render subject items (curriculum components - only for subject calendars, not base)
      if (subject !== 'base') {
        daySubjectItems.forEach((item) => {
          const rawTitle = item.title_override || item.display_name || 'Component';
          const title = substituteMetadataInTitle(rawTitle, item.metadata);
          const baseColor = item.color_override || item.color || '#A78BFA';

          // Reduce vibrancy with 30% opacity for softer, more muted colors (like app)
          const rgba = hexToRGBA(baseColor, 0.30);

          html += `
            <div class="item" style="background-color: ${rgba};">
              ${title}
            </div>
          `;
        });
      }

      html += '</div>';
    });
  });

  html += `
    </div> <!-- end calendar-container -->
  </div> <!-- end subject-section -->
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
    const startFromDate = searchParams.get('start_from_date'); // Optional: filter weeks from this date

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

    // Fetch all scheduled items (V2) for this guide
    // We'll filter by calendar_type later
    const itemsResult = await pool.query(
      `SELECT
        si.*,
        ct.display_name,
        ct.color,
        ct.category
       FROM scheduled_items_v2 si
       LEFT JOIN component_templates_v2 ct ON si.template_id = ct.id
       WHERE si.guide_id = $1
       ORDER BY si.calendar_type, si.start_date`,
      [id]
    );
    const allItems = itemsResult.rows;

    // Determine which subjects to export (exclude base from "all")
    const subjects = subject === 'all'
      ? ['ela', 'math', 'science', 'social_studies']
      : [subject];

    // Generate HTML for each subject
    const htmlPages: string[] = [];

    for (const subj of subjects) {
      // Filter items for this calendar_type
      const baseItems = allItems.filter(item => item.calendar_type === 'base');
      const subjectItems = allItems.filter(item => item.calendar_type === subj);

      // For subject calendars, pass both base items (events) and subject items (components)
      const html = generateCalendarHTML(guide, subj, baseItems, subjectItems, startFromDate);
      htmlPages.push(html);
    }

    // Launch Puppeteer with @sparticuz/chromium (works on Render)
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
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
      format: 'Letter', // US standard (8.5" x 11")
      landscape: false, // Portrait
      margin: {
        top: '0.35in',
        right: '0.4in',
        bottom: '0.35in',
        left: '0.4in',
      },
      printBackground: true,
      scale: 0.85, // Scale down to fit more content
      preferCSSPageSize: true, // Respect CSS @page rules
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
