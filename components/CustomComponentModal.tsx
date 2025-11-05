'use client';

import { useState, useEffect } from 'react';

interface ComponentTemplate {
  id: string;
  component_key: string;
  subject: string;
  display_name: string;
  default_duration_days: number;
  color: string;
  user_id: string | null;
}

interface CustomComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  template?: ComponentTemplate | null;
  currentSubject: string;
}

export default function CustomComponentModal({
  isOpen,
  onClose,
  onSave,
  template,
  currentSubject,
}: CustomComponentModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [subject, setSubject] = useState(currentSubject);
  const [duration, setDuration] = useState(1);
  const [color, setColor] = useState('#9333EA');
  const [updateExisting, setUpdateExisting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [instanceCount, setInstanceCount] = useState(0);

  const isEditMode = !!template;

  useEffect(() => {
    if (template) {
      setDisplayName(template.display_name);
      setSubject(template.subject);
      setDuration(template.default_duration_days);
      setColor(template.color);
      fetchInstanceCount(template.component_key);
    } else {
      setDisplayName('');
      setSubject(currentSubject === 'base' ? 'ela' : currentSubject);
      setDuration(1);
      setColor('#9333EA');
      setUpdateExisting(false);
      setInstanceCount(0);
    }
    setError('');
  }, [template, currentSubject]);

  const fetchInstanceCount = async (componentKey: string) => {
    try {
      const response = await fetch(`/api/v2/scheduled-items/count?component_key=${componentKey}`);
      if (response.ok) {
        const data = await response.json();
        setInstanceCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching instance count:', err);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setError('');
    setIsSaving(true);

    try {
      // Validation
      if (!displayName.trim()) {
        setError('Component name is required');
        setIsSaving(false);
        return;
      }

      if (duration < 1 || duration > 50) {
        setError('Duration must be between 1 and 50 days');
        setIsSaving(false);
        return;
      }

      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorRegex.test(color)) {
        setError('Invalid color format (must be #RRGGBB)');
        setIsSaving(false);
        return;
      }

      const url = isEditMode
        ? `/api/v2/component-templates/${template.id}`
        : '/api/v2/component-templates';

      const method = isEditMode ? 'PATCH' : 'POST';

      const body = {
        display_name: displayName.trim(),
        subject,
        default_duration_days: duration,
        color,
        ...(isEditMode && { update_existing: updateExisting }),
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save component');
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving component:', err);
      setError(err instanceof Error ? err.message : 'Failed to save component');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border-2 border-gray-300 pointer-events-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditMode ? 'Edit Custom Component' : 'Create Custom Component'}
          </h2>
        </div>

        {/* Body - Wrapped in form for Enter key support */}
        <form onSubmit={handleSave}>
          <div className="px-6 py-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Component Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Component Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
              placeholder="e.g., My Reading Unit"
              maxLength={100}
            />
          </div>

          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isEditMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="ela">ELA</option>
              <option value="math">Math</option>
              <option value="science">Science</option>
              <option value="social_studies">Social Studies</option>
            </select>
            {isEditMode && (
              <p className="text-xs text-gray-500 mt-1">
                Subject cannot be changed after creation
              </p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Duration (school days) *
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">
              Between 1 and 50 days (Mon-Fri only)
            </p>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900 font-mono text-sm"
                placeholder="#9333EA"
                pattern="^#[0-9A-Fa-f]{6}$"
                maxLength={7}
              />
            </div>
          </div>

          {/* Update Existing Checkbox (Edit Mode Only) */}
          {isEditMode && instanceCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="updateExisting"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
                />
                <label htmlFor="updateExisting" className="text-sm text-gray-700 cursor-pointer">
                  Update all {instanceCount} existing instance{instanceCount !== 1 ? 's' : ''} on calendars
                </label>
              </div>
              <p className="text-xs text-gray-600 mt-2 ml-6">
                If unchecked, changes will only apply to future placements
              </p>
            </div>
          )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#9333EA] hover:bg-[#7E22CE] rounded-md transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Component'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
