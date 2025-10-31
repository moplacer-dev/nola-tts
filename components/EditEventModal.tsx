'use client';

import { useState, useEffect } from 'react';

interface CalendarEvent {
  id: string;
  event_name: string;
  start_date: string;
  duration_days: number;
  event_type: string;
  is_base_event: boolean;
  blocks_curriculum?: boolean;
  color?: string;
}

interface EditEventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<CalendarEvent>) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function EditEventModal({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EditEventModalProps) {
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('other');
  const [duration, setDuration] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [blocksCurriculum, setBlocksCurriculum] = useState(false);
  const [color, setColor] = useState('#6B7280');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (event) {
      setEventName(event.event_name || '');
      setEventType(event.event_type || 'other');
      setDuration(event.duration_days || 1);
      setStartDate(event.start_date || '');
      setBlocksCurriculum(event.blocks_curriculum || false);
      setColor(event.color || '#6B7280');
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsSaving(true);
    try {
      const updates: any = {
        event_name: eventName,
        event_type: eventType,
        duration_days: duration,
        start_date: startDate,
        blocks_curriculum: blocksCurriculum,
        color: color,
      };

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
    if (!confirm(`Are you sure you want to delete "${eventName}"? This will remove it from all calendars.`)) return;

    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const eventTypeOptions = [
    { value: 'holiday', label: 'Holiday' },
    { value: 'testing', label: 'Testing' },
    { value: 'pd', label: 'Professional Development' },
    { value: 'break', label: 'Break' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border-2 border-gray-300 pointer-events-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Calendar Event</h2>
          <p className="text-xs text-gray-500 mt-1">
            Changes will sync across all calendars
          </p>
        </div>

        {/* Body - Wrapped in form for Enter key support */}
        <form onSubmit={handleSave}>
          <div className="px-6 py-4 space-y-4">
          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900 placeholder-gray-400"
              placeholder="Event name"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <div
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                style={{ backgroundColor: `${color}40`, borderColor: color }}
              >
                {eventName || 'Preview'}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Choose a color for this event on all calendars
            </p>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
            />
          </div>

          {/* Duration */}
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

          {/* Blocks Curriculum Checkbox */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-md border border-blue-200">
            <input
              type="checkbox"
              id="blocks-curriculum"
              checked={blocksCurriculum}
              onChange={(e) => setBlocksCurriculum(e.target.checked)}
              className="mt-1 w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
            />
            <div className="flex-1">
              <label htmlFor="blocks-curriculum" className="text-sm font-medium text-gray-900 cursor-pointer">
                Skip this day when scheduling curriculum
              </label>
              <p className="text-xs text-gray-600 mt-0.5">
                Multi-day components will automatically skip this date (like weekends)
              </p>
            </div>
          </div>
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
                disabled={isSaving || isDeleting || !eventName.trim()}
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
