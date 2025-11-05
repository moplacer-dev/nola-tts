/**
 * CalendarWeek - One week row in calendar grid
 *
 * V2 Component - Displays 5 days (Monday to Friday) with:
 * - Week number label
 * - 5 CalendarCell components (weekdays only)
 * - Handles drag-and-drop across cells
 */

'use client';

import { ScheduledItemWithTemplate, CalendarType } from '@/types/v2';
import { CalendarCell } from './CalendarCell';

interface CalendarWeekProps {
  weekNumber: number;
  days: Date[];
  itemsByDate: Map<string, ScheduledItemWithTemplate[]>;
  blockedDates: Set<string>;
  firstDay: Date; // First day of school year
  lastDay: Date;  // Last day of school year
  selectedItems: Set<string>;
  allItems: ScheduledItemWithTemplate[]; // All scheduled items (for multi-drag)
  viewingCalendar: CalendarType; // Current calendar being viewed
  onSelectItem: (itemId: string, ctrlKey: boolean) => void;
  onDrop: (dateString: string, e: React.DragEvent) => void;
  onDragOver: (dateString: string, e: React.DragEvent) => void;
  onEditItem?: (item: ScheduledItemWithTemplate) => void;
}

/**
 * Format Date to YYYY-MM-DD string for map lookups
 */
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CalendarWeek({
  weekNumber,
  days,
  itemsByDate,
  blockedDates,
  firstDay,
  lastDay,
  selectedItems,
  allItems,
  viewingCalendar,
  onSelectItem,
  onDrop,
  onDragOver,
  onEditItem
}: CalendarWeekProps) {
  return (
    <div className="grid border-b border-gray-300" style={{ gridTemplateColumns: '80px 1fr 1fr 1fr 1fr 1fr' }}>
      {/* Week number column */}
      <div className="flex items-center justify-center bg-gray-100 border-r border-gray-300 p-2">
        <span className="text-xs font-semibold text-gray-600">
          Week {weekNumber}
        </span>
      </div>

      {/* 5 day cells (Monday-Friday) */}
      {days.map((date) => {
        const dateKey = formatDateKey(date);
        const items = itemsByDate.get(dateKey) || [];
        const isBlocked = blockedDates.has(dateKey);

        // Check if date is outside school year range
        const isOutOfRange = date < firstDay || date > lastDay;

        return (
          <CalendarCell
            key={dateKey}
            date={date}
            items={items}
            isBlocked={isBlocked}
            isOutOfRange={isOutOfRange}
            selectedItems={selectedItems}
            allItems={allItems}
            viewingCalendar={viewingCalendar}
            onSelectItem={onSelectItem}
            onDrop={(e) => onDrop(dateKey, e)}
            onDragOver={(e) => onDragOver(dateKey, e)}
            onEditItem={onEditItem}
          />
        );
      })}
    </div>
  );
}
