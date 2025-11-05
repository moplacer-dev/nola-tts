/**
 * CalendarGrid - Main calendar component
 *
 * V2 Component - Displays the full calendar with:
 * - Day-of-week headers
 * - Multiple CalendarWeek rows
 * - Organizes items by date
 * - Handles drag-and-drop coordination
 */

'use client';

import { useMemo } from 'react';
import { ScheduledItemWithTemplate, CalendarType } from '@/types/v2';
import { CalendarWeek } from './CalendarWeek';

interface CalendarGridProps {
  firstDay: Date; // School year start date
  lastDay: Date; // School year end date
  items: ScheduledItemWithTemplate[];
  blockedDates: Set<string>; // Set of YYYY-MM-DD strings
  selectedItems: Set<string>;
  viewingCalendar: CalendarType; // Current calendar being viewed
  onSelectItem: (itemId: string, ctrlKey: boolean) => void;
  onDrop: (dateString: string, e: React.DragEvent) => void;
  onDragOver: (dateString: string, e: React.DragEvent) => void;
  onEditItem?: (item: ScheduledItemWithTemplate) => void;
}

interface Week {
  weekNumber: number;
  startDate: Date;
  days: Date[];
}

/**
 * Format Date to YYYY-MM-DD string
 */
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate weeks from first day to last day
 * Each week contains only Monday-Friday (school days)
 */
function generateWeeks(firstDay: Date, lastDay: Date): Week[] {
  const weeks: Week[] = [];

  // Find the Monday before or on firstDay
  const startDate = new Date(firstDay);
  const dayOfWeek = startDate.getDay();
  // If Sunday (0), go back 6 days to Monday. Otherwise go back (dayOfWeek - 1) days
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startDate.setDate(startDate.getDate() - daysToMonday);

  let weekNumber = 1;
  let currentWeekStart = new Date(startDate);

  while (currentWeekStart <= lastDay) {
    const days: Date[] = [];

    // Generate 5 days (Monday-Friday) for this week
    for (let i = 0; i < 5; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }

    weeks.push({
      weekNumber,
      startDate: new Date(currentWeekStart),
      days
    });

    // Move to next Monday
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    weekNumber++;
  }

  return weeks;
}

export function CalendarGrid({
  firstDay,
  lastDay,
  items,
  blockedDates,
  selectedItems,
  viewingCalendar,
  onSelectItem,
  onDrop,
  onDragOver,
  onEditItem
}: CalendarGridProps) {
  // Generate weeks
  const weeks = useMemo(() => {
    const generated = generateWeeks(firstDay, lastDay);
    console.log('CalendarGrid: Generated weeks:', generated.length, 'from', firstDay, 'to', lastDay);
    return generated;
  }, [firstDay, lastDay]);

  // Organize items by date for quick lookup
  const itemsByDate = useMemo(() => {
    const map = new Map<string, ScheduledItemWithTemplate[]>();

    items.forEach(item => {
      // Parse start_date to ensure it's in YYYY-MM-DD format
      let startDateKey = item.start_date;

      // If it's an ISO string, extract just the date part
      if (startDateKey.includes('T')) {
        startDateKey = startDateKey.split('T')[0];
      }

      // For multi-day items (duration_days > 1), add to all dates in the span
      const durationDays = item.duration_days || 1;

      if (durationDays > 1) {
        // Multi-day item: add to each date it spans
        // Parse date carefully to avoid timezone issues
        const [year, month, day] = startDateKey.split('-').map(Number);
        const startDate = new Date(year, month - 1, day); // month is 0-indexed

        // For base calendar items, skip weekends (since duration_days = school days only)
        // For curriculum items, we can also skip weekends since the calendar only shows weekdays
        let schoolDaysAdded = 0;
        let currentDate = new Date(startDate);

        while (schoolDaysAdded < durationDays) {
          const dayOfWeek = currentDate.getDay();

          // Only add weekdays (Mon-Fri = 1-5, skip Sat=6, Sun=0)
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const dateKey = formatDateKey(currentDate);
            const existing = map.get(dateKey) || [];
            existing.push(item);
            map.set(dateKey, existing);
            schoolDaysAdded++;
          }

          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // Single-day item: add only to start date
        const existing = map.get(startDateKey) || [];
        existing.push(item);
        map.set(startDateKey, existing);
      }
    });

    // Sort items within each date by display_order
    map.forEach((items, date) => {
      items.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    });

    console.log('📅 Items organized by date:', Array.from(map.entries()).map(([date, items]) => `${date}: ${items.length} items`));

    return map;
  }, [items]);

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Day headers - Monday through Friday only */}
      <div className="grid bg-gray-50 border-b border-gray-300 sticky top-0 z-10" style={{ gridTemplateColumns: '80px 1fr 1fr 1fr 1fr 1fr' }}>
        <div className="p-2 border-r border-gray-300">
          {/* Empty corner cell */}
        </div>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
          <div key={day} className="p-2 text-center font-semibold text-sm text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div>
        {weeks.map((week) => (
          <CalendarWeek
            key={week.weekNumber}
            weekNumber={week.weekNumber}
            days={week.days}
            itemsByDate={itemsByDate}
            blockedDates={blockedDates}
            firstDay={firstDay}
            lastDay={lastDay}
            selectedItems={selectedItems}
            allItems={items}
            viewingCalendar={viewingCalendar}
            onSelectItem={onSelectItem}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onEditItem={onEditItem}
          />
        ))}
      </div>
    </div>
  );
}
