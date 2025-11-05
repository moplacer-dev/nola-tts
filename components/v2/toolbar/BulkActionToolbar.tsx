/**
 * BulkActionToolbar - Toolbar for multi-select operations
 *
 * V2 Component - Appears when items are selected, provides:
 * - Selection count
 * - Delete action (bulk delete)
 * - Clear selection action
 *
 * Note: Used for bulk delete and future multi-drag feature
 */

'use client';

import { cn } from '@/lib/utils';

interface BulkActionToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onChangeColor?: () => void;
  onClearSelection: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  onDelete,
  onChangeColor,
  onClearSelection
}: BulkActionToolbarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border-2 border-gray-300 rounded-lg shadow-2xl px-6 py-3 flex items-center gap-4">
        {/* Selection count */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">
            {selectedCount}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {selectedCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300" />

        {/* Change Color button */}
        {onChangeColor && (
          <button
            onClick={onChangeColor}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 transition-colors font-medium text-sm border border-purple-200"
            title="Change color"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Color
          </button>
        )}

        {/* Delete button */}
        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 transition-colors font-medium text-sm border border-red-200"
          title="Delete selection"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors font-medium text-sm"
          title="Clear selection"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      </div>
    </div>
  );
}
