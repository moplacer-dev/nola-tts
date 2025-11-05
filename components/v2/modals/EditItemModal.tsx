'use client';

import { useState } from 'react';
import { ScheduledItemWithTemplate, UpdateScheduledItemRequest } from '@/types/v2';

interface EditItemModalProps {
  item: ScheduledItemWithTemplate;
  blockedDates: Set<string>;
  onClose: () => void;
  onSave: (updates: UpdateScheduledItemRequest, repeatDays?: number) => Promise<void>;
}

/**
 * Modal for editing scheduled item properties and setting event duration
 *
 * Features:
 * - Edit title and metadata
 * - Set duration (total days) for single-day components
 * - Dynamic metadata fields based on template configuration
 *
 * Note: Color editing is done via the bulk color toolbar, not in this modal.
 */
export function EditItemModal({ item, blockedDates, onClose, onSave }: EditItemModalProps) {
  const [titleOverride, setTitleOverride] = useState(item.title_override || '');
  const [repeatDays, setRepeatDays] = useState(1);
  const [metadata, setMetadata] = useState(item.metadata || {});
  const [isSaving, setIsSaving] = useState(false);

  // Debug: Log initial state
  console.log('🔍 EditItemModal opened for:', {
    id: item.id,
    title: item.title_override || item.display_name,
    metadata: item.metadata,
    initialMetadataState: metadata
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: UpdateScheduledItemRequest = {
        title_override: titleOverride || undefined,
        metadata
      };

      await onSave(updates, repeatDays);
    } finally {
      setIsSaving(false);
    }
  };

  const placeholderTitle = item.title_override || item.display_name || 'Component';

  return (
    <>
      {/* Invisible backdrop for click-to-close */}
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
      />

      {/* Modal window */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div
          className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-200 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
        <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Component</h2>

        {/* Title Override */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">Title</label>
          <input
            type="text"
            value={titleOverride}
            onChange={(e) => setTitleOverride(e.target.value)}
            placeholder={placeholderTitle}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use template default
          </p>
        </div>

        {/* Metadata Fields (dynamic based on template) */}
        {item.metadata_fields?.includes('rotation_number') && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">Rotation Number</label>
            <input
              type="number"
              value={metadata.rotation_number || 1}
              onChange={(e) => setMetadata({ ...metadata, rotation_number: parseInt(e.target.value) })}
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        )}

        {item.metadata_fields?.includes('unit_number') && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">Unit Number</label>
            <input
              type="number"
              value={metadata.unit_number || 1}
              onChange={(e) => setMetadata({ ...metadata, unit_number: parseInt(e.target.value) })}
              min="1"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        )}

        {item.metadata_fields?.includes('lesson_number') && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">Lesson Number</label>
            <input
              type="number"
              value={metadata.lesson_number || 1}
              onChange={(e) => setMetadata({ ...metadata, lesson_number: parseInt(e.target.value) })}
              min="1"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        )}

        {item.metadata_fields?.includes('standard_code') && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">Standard Code</label>
            <input
              type="text"
              value={metadata.standard_code || ''}
              onChange={(e) => setMetadata({ ...metadata, standard_code: e.target.value })}
              placeholder="e.g., 5.PS1.1"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the standard code (e.g., 5.PS1.1, MS-PS1-2)
            </p>
          </div>
        )}

        {/* EXTEND FEATURE - Duration (only for single-day components) */}
        {item.expansion_type === 'single' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">Duration (Days)</label>
            <input
              type="number"
              value={repeatDays}
              onChange={(e) => setRepeatDays(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total school days for this event.
            </p>
          </div>
        )}

        {/* Info message for multi-day components */}
        {item.expansion_type !== 'single' && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-300 rounded">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> This is part of a multi-day {item.expansion_type?.replace('multi_', '')} component.
              To add more instances, drag the component from the library again.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
