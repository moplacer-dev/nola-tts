'use client';

import { useState } from 'react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: {
    event_name: string;
    event_type: string;
    start_date: string;
    duration_days: number;
    blocks_curriculum?: boolean;
    color?: string;
  }) => Promise<void>;
  guideId: string;
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onSave,
  guideId,
}: CreateEventModalProps) {
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('other');
  const [duration, setDuration] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [blocksCurriculum, setBlocksCurriculum] = useState(false);
  const [color, setColor] = useState('#6B7280');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Helper function to determine smart default for blocks_curriculum
  const shouldBlockCurriculum = (name: string, type: string): boolean => {
    const lowerName = name.toLowerCase();

    // Check for specific event names that should block curriculum by default
    const blockingKeywords = [
      'break', 'winter break', 'spring break', 'thanksgiving',
      'no school', 'half day', 'holiday',
      'labor day', 'mlk', 'martin luther king', "veterans day", 'memorial day',
      'presidents', 'juneteenth', 'election day',
      'first day for students', 'last day for students'
    ];

    return blockingKeywords.some(keyword => lowerName.includes(keyword)) || type === 'break' || type === 'holiday';
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!eventName.trim() || !startDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        event_name: eventName,
        event_type: eventType,
        start_date: startDate,
        duration_days: duration,
        blocks_curriculum: blocksCurriculum,
        color: color,
      });

      // Reset form
      setEventName('');
      setEventType('other');
      setDuration(1);
      setStartDate('');
      setBlocksCurriculum(false);
      setColor('#6B7280');

      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to create event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setEventName('');
    setEventType('other');
    setDuration(1);
    setStartDate('');
    setBlocksCurriculum(false);
    setColor('#6B7280');
    onClose();
  };

  // Auto-update checkbox when event name or type changes
  const handleEventNameChange = (newName: string) => {
    setEventName(newName);
    setBlocksCurriculum(shouldBlockCurriculum(newName, eventType));
  };

  const handleEventTypeChange = (newType: string) => {
    setEventType(newType);
    setBlocksCurriculum(shouldBlockCurriculum(eventName, newType));
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
          <h2 className="text-lg font-semibold text-gray-900">Create Calendar Event</h2>
          <p className="text-xs text-gray-500 mt-1">
            This event will appear on all calendars
          </p>
        </div>

        {/* Body - Wrapped in form for Enter key support */}
        <form onSubmit={handleSave}>
          <div className="px-6 py-4 space-y-4">
          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name *
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => handleEventNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900 placeholder-gray-400"
              placeholder="e.g., Spring Break, State Testing"
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
              Start Date *
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
              id="blocks-curriculum-create"
              checked={blocksCurriculum}
              onChange={(e) => setBlocksCurriculum(e.target.checked)}
              className="mt-1 w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
            />
            <div className="flex-1">
              <label htmlFor="blocks-curriculum-create" className="text-sm font-medium text-gray-900 cursor-pointer">
                Skip this day when scheduling curriculum
              </label>
              <p className="text-xs text-gray-600 mt-0.5">
                Multi-day components will automatically skip this date (like weekends)
              </p>
            </div>
          </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !eventName.trim() || !startDate}
              className="px-4 py-2 text-sm font-medium text-white bg-[#9333EA] hover:bg-[#7E22CE] rounded-md transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
