'use client';

import { useState, useEffect } from 'react';

interface ScheduledComponent {
  id: string;
  subject_calendar_id: string;
  component_key: string;
  subject: string;
  start_date: string;
  duration_days: number;
  title_override: string | null;
  order: number;
  notes: string | null;
  display_name: string;
  color: string;
  group_id?: string | null;
}

interface EditComponentModalProps {
  component: ScheduledComponent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<ScheduledComponent>) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function EditComponentModal({
  component,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EditComponentModalProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(1);
  // NOTE: startDate removed - components are positioned via drag-and-drop only
  // const [startDate, setStartDate] = useState('');
  const [color, setColor] = useState('#9333EA');
  const [rotationNumber, setRotationNumber] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [lessonNumber, setLessonNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detect if this is a rotation session component (e.g., "R#, S1" or "R1, S1")
  const isRotationSession = component?.group_id && component?.title_override?.match(/^R[#\d]+, S\d+$/);

  // Detect if this is a TT/WW Lesson Block component (e.g., "L!L Unit #, Lesson #\nGroup 1: TT / Group 2: WT")
  // Match both actual newlines (\n) and literal backslash-n (\\n) for backwards compatibility
  const isTTWWBlock = component?.group_id && component?.title_override?.match(/^L!L Unit [#\d]+, Lesson [#\d]+(\n|\\n)/);

  // Detect if this is a Language Live Unit component (e.g., "L!L Unit #, L1\nLevel 1: TT\nLevel 2: WT")
  // Match both actual newlines (\n) and literal backslash-n (\\n) for backwards compatibility
  const isLanguageLiveUnit = component?.group_id && component?.title_override?.match(/^L!L Unit [#\d]+, L\d+(\n|\\n)/);

  useEffect(() => {
    if (component) {
      setTitle(component.title_override || component.display_name || '');
      setDuration(component.duration_days || 1);
      // setStartDate(component.start_date || ''); // Removed - drag-and-drop handles positioning
      setColor(component.color || '#9333EA');

      // If it's a rotation session, extract rotation number
      if (component.title_override?.match(/^R[#\d]+, S\d+$/)) {
        const match = component.title_override.match(/^R([#\d]+),/);
        const extractedNumber = match ? match[1] : '';
        // If it's still R#, set to empty string, otherwise use the number
        setRotationNumber(extractedNumber === '#' ? '' : extractedNumber);
      } else {
        // Reset rotation number when switching to non-rotation component
        setRotationNumber('');
      }

      // If it's a TT/WW Lesson Block, extract unit and lesson numbers
      // Handle both actual newlines and literal \n
      if (component.title_override?.match(/^L!L Unit [#\d]+, Lesson [#\d]+(\n|\\n)/)) {
        const match = component.title_override.match(/^L!L Unit ([#\d]+), Lesson ([#\d]+)(?:\n|\\n)/);
        const extractedUnit = match ? match[1] : '';
        const extractedLesson = match ? match[2] : '';
        // If it's still #, set to empty string, otherwise use the number
        setUnitNumber(extractedUnit === '#' ? '' : extractedUnit);
        setLessonNumber(extractedLesson === '#' ? '' : extractedLesson);
      } else if (component.title_override?.match(/^L!L Unit [#\d]+, L\d+(\n|\\n)/)) {
        // If it's a Language Live Unit, extract unit number only
        const match = component.title_override.match(/^L!L Unit ([#\d]+), L\d+(?:\n|\\n)/);
        const extractedUnit = match ? match[1] : '';
        // If it's still #, set to empty string, otherwise use the number
        setUnitNumber(extractedUnit === '#' ? '' : extractedUnit);
        setLessonNumber(''); // No lesson number for Language Live Units
      } else {
        // Reset unit/lesson numbers when switching to non-TT/WW component
        setUnitNumber('');
        setLessonNumber('');
      }
    }
  }, [component]);

  if (!isOpen || !component) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Prevent form submission if called from form

    setIsSaving(true);
    try {
      const updates: any = {};

      // Handle rotation session updates
      if (isRotationSession && rotationNumber) {
        // Extract session number from current title (e.g., "R#, S3" -> "S3")
        const sessionMatch = component.title_override?.match(/, (S\d+)$/);
        const sessionNumber = sessionMatch ? sessionMatch[1] : 'S1';

        updates.title_override = `R${rotationNumber}, ${sessionNumber}`;
        updates.update_group_rotation = true; // Flag to update all sessions in the rotation
      } else if (isTTWWBlock && unitNumber && lessonNumber) {
        // Handle TT/WW Lesson Block updates
        // Normalize line breaks (convert literal \n to actual newlines)
        const normalizedTitle = component.title_override?.replace(/\\n/g, '\n') || '';
        // Extract the group assignment part (e.g., "\nLevel 1: TT / Level 2: WT")
        const groupMatch = normalizedTitle.match(/(\n(?:Group|Level) [12]: [TW]+ \/ (?:Group|Level) [12]: [TW]+)$/);
        const groupAssignment = groupMatch ? groupMatch[1] : '\nLevel 1: TT / Level 2: WT';

        updates.title_override = `L!L Unit ${unitNumber}, Lesson ${lessonNumber}${groupAssignment}`;
        updates.update_group_ttww = true; // Flag to update all days in the TT/WW block
      } else if (isLanguageLiveUnit && unitNumber) {
        // Handle Language Live Unit updates - update unit number for all sessions
        // Normalize line breaks (convert literal \n to actual newlines)
        const normalizedTitle = component.title_override?.replace(/\\n/g, '\n') || '';
        // Extract the lesson and group parts (e.g., "L1\nLevel 1: TT\nLevel 2: WT" or "L1\nLevel 1: TT & WT\nLevel 2: WT & TT")
        const lessonMatch = normalizedTitle.match(/, (L\d+\n.+)$/s);
        const lessonAndGroups = lessonMatch ? lessonMatch[1] : 'L1\nLevel 1: TT\nLevel 2: WT';

        updates.title_override = `L!L Unit ${unitNumber}, ${lessonAndGroups}`;
        updates.update_group_language_live = true; // Flag to update all sessions in the unit
      } else if (!isRotationSession && !isTTWWBlock && !isLanguageLiveUnit) {
        // Regular component update
        updates.title_override = title !== component.display_name ? title : null;
        // Include duration for regular components only (grouped components have fixed durations)
        updates.duration_days = duration;
      }

      // NOTE: start_date removed - handled by drag-and-drop only
      // NOTE: duration_days only included for regular components (not rotation sessions or TT/WW blocks)

      // Only include color if it's different from the original
      if (color !== component.color) {
        updates.color = color;
      }

      await onSave(updates);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this component?')) return;

    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete component');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border-2 border-gray-300 pointer-events-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Component</h2>
        </div>

        {/* Body - Wrapped in form for Enter key support */}
        <form onSubmit={handleSave} className="px-6 py-4 space-y-4">
          {/* Rotation Number (for rotation sessions) */}
          {isRotationSession ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rotation Number
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={rotationNumber}
                onChange={(e) => setRotationNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will update the rotation number (R#) for all 7 sessions in this rotation
              </p>
              <p className="text-xs font-mono text-gray-600 mt-1">
                Current: {component.title_override}
              </p>
            </div>
          ) : isTTWWBlock ? (
            /* Unit & Lesson Numbers (for TT/WW Lesson Blocks) */
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lesson Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={lessonNumber}
                  onChange={(e) => setLessonNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                  placeholder="1"
                />
              </div>
              <p className="text-xs text-gray-500">
                This will update the unit and lesson for all 2 days in this block
              </p>
              <p className="text-xs font-mono text-gray-600 whitespace-pre-line">
                Current: {component.title_override?.replace(/\\n/g, '\n')}
              </p>
            </div>
          ) : isLanguageLiveUnit ? (
            /* Unit Number Only (for Language Live Units) */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Number
              </label>
              <input
                type="number"
                min="1"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will update the unit number for all {component.component_key === 'ela_language_live_unit_single' ? '10' : '22'} sessions in this Language Live Unit
              </p>
              <p className="text-xs font-mono text-gray-600 mt-1 whitespace-pre-line">
                Current: {component.title_override?.replace(/\\n/g, '\n')}
              </p>
            </div>
          ) : (
            /* Title (for regular components) */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900 placeholder-gray-400"
                placeholder={component.display_name}
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: {component.display_name}
              </p>
            </div>
          )}

          {/* Start Date field REMOVED - components are positioned via drag-and-drop only */}
          {/* This prevents accidental component moves when editing properties */}

          {/* Duration - Only show for regular components, not grouped components */}
          {!isRotationSession && !isTTWWBlock && !isLanguageLiveUnit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (school days)
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
                Number of school days (Mon-Fri)
              </p>
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
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
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Default color is set by component template
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-[#9333EA] hover:bg-[#7E22CE] rounded-md transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
