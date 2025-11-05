/**
 * CalendarCell - Single day cell in calendar grid
 *
 * V2 Component - Displays one calendar day with:
 * - Date header
 * - Blocked indicator (for base calendar events)
 * - Out-of-range indicator
 * - Scheduled items for that day
 * - Drag-and-drop target
 * - Selection states
 */

'use client';

import { useState } from 'react';
import { ScheduledItemWithTemplate, CalendarType } from '@/types/v2';
import { DraggableComponent } from './DraggableComponent';
import { cn } from '@/lib/utils';

interface CalendarCellProps {
  date: Date;
  items: ScheduledItemWithTemplate[];
  isBlocked: boolean; // Has curriculum-blocking base event
  isOutOfRange: boolean; // Date is before first_day or after last_day
  selectedItems: Set<string>;
  allItems: ScheduledItemWithTemplate[]; // All scheduled items (for multi-drag)
  viewingCalendar: CalendarType; // Current calendar being viewed
  onSelectItem: (itemId: string, ctrlKey: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onEditItem?: (item: ScheduledItemWithTemplate) => void;
}

export function CalendarCell({
  date,
  items,
  isBlocked,
  isOutOfRange,
  selectedItems,
  allItems,
  viewingCalendar,
  onSelectItem,
  onDrop,
  onDragOver,
  onEditItem
}: CalendarCellProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Cell is disabled if blocked OR out of range
  const isDisabled = isBlocked || isOutOfRange;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    onDrop(e);
  };

  return (
    <div
      className={cn(
        'border border-gray-200 p-2 min-h-24 bg-white',
        'transition-colors relative',
        isBlocked && !isOutOfRange && 'bg-red-50 opacity-60 cursor-not-allowed',
        isOutOfRange && 'bg-gray-100 opacity-40 cursor-not-allowed',
        isDragOver && !isDisabled && 'ring-2 ring-purple-500 bg-purple-50'
      )}
      onDrop={!isDisabled ? handleDrop : undefined}
      onDragOver={!isDisabled ? handleDragOver : undefined}
      onDragLeave={handleDragLeave}
    >
      {/* Date header */}
      <div className={cn(
        "text-xs mb-1 font-medium",
        isOutOfRange ? "text-gray-400" : "text-gray-600"
      )}>
        {date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
      </div>

      {/* Out of range indicator */}
      {isOutOfRange && (
        <div className="text-xs text-gray-400 italic">
          Out of range
        </div>
      )}

      {/* Scheduled items - only show if in range */}
      {!isOutOfRange && (
        <div className="space-y-1">
          {items.map(item => (
            <DraggableComponent
              key={item.id}
              item={item}
              isSelected={selectedItems.has(item.id)}
              onSelect={(ctrlKey) => onSelectItem(item.id, ctrlKey)}
              onEdit={onEditItem ? () => onEditItem(item) : undefined}
              selectedItems={selectedItems}
              allItems={allItems}
              viewingCalendar={viewingCalendar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
