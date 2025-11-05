/**
 * DraggableComponent - Individual scheduled item on calendar
 *
 * V2 Component - Displays a single scheduled item with:
 * - Title (from title_override or template display_name)
 * - Color (from color_override or template color)
 * - Draggable behavior
 * - Selection state
 * - Three-dot menu for editing
 *
 * Base Event Behavior:
 * - When viewing base calendar: Base events are draggable and editable
 * - When viewing subject calendars: Base events are read-only (shown for context)
 */

'use client';

import { ScheduledItemWithTemplate, CalendarType } from '@/types/v2';
import { cn } from '@/lib/utils';

interface DraggableComponentProps {
  item: ScheduledItemWithTemplate;
  isSelected: boolean;
  onSelect: (ctrlKey: boolean) => void;
  onEdit?: () => void;
  selectedItems?: Set<string>;
  allItems?: ScheduledItemWithTemplate[];
  viewingCalendar: CalendarType; // NEW: Current calendar being viewed
}

export function DraggableComponent({
  item,
  isSelected,
  onSelect,
  onEdit,
  selectedItems,
  allItems,
  viewingCalendar
}: DraggableComponentProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger cell click
    onSelect(e.ctrlKey || e.metaKey);
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Check if dragging a selected item with multiple selections (MULTI-DRAG MODE)
    if (isSelected && selectedItems && selectedItems.size > 1 && allItems) {
      console.log('🚀🚀 Multi-drag start:', selectedItems.size, 'items');

      // Get all selected items sorted by display order
      const selectedData = allItems
        .filter(i => selectedItems.has(i.id))
        .sort((a, b) => {
          // Sort by start_date first, then display_order
          const dateCompare = a.start_date.localeCompare(b.start_date);
          if (dateCompare !== 0) return dateCompare;
          return a.display_order - b.display_order;
        });

      e.dataTransfer.setData('multi-drag', JSON.stringify(selectedData));
      e.dataTransfer.effectAllowed = 'move';

      // Create custom drag image showing count
      const dragImg = document.createElement('div');
      dragImg.style.cssText = `
        position: absolute; top: -1000px;
        padding: 12px 16px; background: white;
        border: 2px solid #6366F1; border-radius: 8px;
        font-size: 14px; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      `;
      dragImg.textContent = `Moving ${selectedItems.size} components`;
      document.body.appendChild(dragImg);
      e.dataTransfer.setDragImage(dragImg, 0, 0);
      setTimeout(() => document.body.removeChild(dragImg), 0);
    } else {
      // SINGLE DRAG MODE
      e.dataTransfer.setData('item-id', item.id);
      e.dataTransfer.setData('item', JSON.stringify(item));
      e.dataTransfer.effectAllowed = 'move';

      console.log('🚀 Single item drag start:', item.id, item.display_name);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  // Substitute metadata placeholders in title for display
  const substituteMetadataInTitle = (title: string): string => {
    let result = title;

    // Replace {rotation} with actual rotation_number
    if (item.metadata?.rotation_number !== undefined) {
      result = result.replace(/{rotation}/g, item.metadata.rotation_number.toString());
    }

    // Replace {unit} with actual unit_number
    if (item.metadata?.unit_number !== undefined) {
      result = result.replace(/{unit}/g, item.metadata.unit_number.toString());
    }

    // Replace {standard_code}
    if (item.metadata?.standard_code !== undefined) {
      result = result.replace(/{standard_code}/g, item.metadata.standard_code.toString());
    }

    // Replace {lesson}
    if (item.metadata?.lesson_number !== undefined) {
      result = result.replace(/{lesson}/g, item.metadata.lesson_number.toString());
    }

    return result;
  };

  // Display values: Override takes precedence over template defaults
  const rawTitle = item.title_override || item.display_name || 'Untitled';
  const displayTitle = substituteMetadataInTitle(rawTitle);
  const displayColor = item.color_override || item.color || '#6B7280';

  // Check if this is a base calendar event
  const isBaseEvent = item.calendar_type === 'base';
  const isViewingBaseCalendar = viewingCalendar === 'base';

  // Base events are draggable/editable ONLY when viewing the base calendar
  // On subject calendars, base events are read-only (shown for context)
  const isDraggable = !isBaseEvent || isViewingBaseCalendar;
  const isEditable = !isBaseEvent || isViewingBaseCalendar;

  return (
    <div
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      onClick={isEditable ? handleClick : undefined}
      className={cn(
        'relative group',
        'px-2 py-1 rounded text-xs',
        'select-none',
        'whitespace-pre-line', // Preserve line breaks in titles
        'transition-all duration-150', // Smooth transitions
        // Base events on subject calendars: lighter, not clickable
        isBaseEvent && !isViewingBaseCalendar && 'opacity-60 cursor-default',
        // Draggable items: clickable with hover effect
        isDraggable && 'cursor-pointer hover:opacity-80',
        // Selected state (only for draggable items) - thicker border instead of ring
        isDraggable && isSelected ? 'border-2 border-blue-600 shadow-lg' : 'border'
      )}
      style={{
        backgroundColor: displayColor + '20', // Add 20 for ~12% opacity
        borderColor: isSelected && isDraggable ? '#2563EB' : displayColor, // Blue border when selected
        color: '#1f2937' // gray-800 for text
      }}
    >
      {/* Component title */}
      <div className="font-medium leading-tight">
        {displayTitle}
      </div>

      {/* Metadata display removed - now shown in title via placeholder substitution */}

      {/* Three-dot menu (visible on hover) - only for editable items */}
      {onEdit && isEditable && (
        <button
          onClick={handleMenuClick}
          className={cn(
            'absolute top-1 right-1',
            'w-5 h-5 rounded flex items-center justify-center',
            'bg-white/80 hover:bg-white',
            'opacity-0 group-hover:opacity-100',
            'transition-opacity',
            'text-gray-600 hover:text-gray-900'
          )}
          title="Edit"
        >
          ⋯
        </button>
      )}
    </div>
  );
}
