/**
 * LibraryCard - Draggable template card in component library
 *
 * V2 Component - Displays a single component template with:
 * - Display name and description
 * - Color indicator
 * - Duration badge
 * - Drag behavior to place on calendar
 */

'use client';

import { ComponentTemplate } from '@/types/v2';
import { cn } from '@/lib/utils';

interface LibraryCardProps {
  template: ComponentTemplate;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function LibraryCard({
  template,
  onDragStart,
  onDragEnd
}: LibraryCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    // Store template data for drop handler
    e.dataTransfer.setData('template-id', template.id);
    e.dataTransfer.setData('template', JSON.stringify(template));
    e.dataTransfer.effectAllowed = 'copy';

    // Create a smaller custom drag image
    const dragImage = document.createElement('div');
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      padding: 8px 12px;
      background: white;
      border: 2px solid ${template.color};
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #111;
      white-space: nowrap;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    dragImage.textContent = template.display_name;
    document.body.appendChild(dragImage);

    e.dataTransfer.setDragImage(dragImage, 0, 0);

    // Clean up after drag starts
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);

    if (onDragStart) {
      onDragStart();
    }
  };

  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  // Get duration label
  const getDurationLabel = () => {
    if (template.expansion_type === 'single') {
      return template.default_duration_days === 1
        ? '1 day'
        : `${template.default_duration_days} days`;
    }

    // For multi-* types, show total days
    return `${template.default_duration_days} days`;
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'p-2 rounded-lg border-2 border-gray-200',
        'bg-white hover:shadow-md hover:border-gray-300',
        'cursor-grab active:cursor-grabbing',
        'transition-all',
        'select-none'
      )}
    >
      {/* Color indicator strip */}
      <div
        className="h-1 rounded-full mb-2"
        style={{ backgroundColor: template.color }}
      />

      {/* Template name */}
      <div className="font-semibold text-sm text-gray-900 mb-1.5">
        {template.display_name}
      </div>

      {/* Footer: Duration and expansion type - only show for multi-day components */}
      {template.expansion_type !== 'single' && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {getDurationLabel()}
          </span>

          {/* Expansion type badge */}
          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
            {template.expansion_type === 'multi_rotation' && 'Rotation'}
            {template.expansion_type === 'multi_sequence' && 'Sequence'}
            {template.expansion_type === 'multi_grouped' && 'Grouped'}
          </span>
        </div>
      )}
    </div>
  );
}
