'use client';

import { useState, useEffect, useCallback } from 'react';

interface RepaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepace: (subject: string, daysToShift: number, startFromDate?: string) => void;
  currentSubject: string;
}

export function RepaceModal({ isOpen, onClose, onRepace, currentSubject }: RepaceModalProps) {
  const [subject, setSubject] = useState<string>(currentSubject === 'base' ? 'all' : currentSubject);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [days, setDays] = useState<number>(1);
  const [startFromDate, setStartFromDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const daysToShift = direction === 'forward' ? days : -days;

    try {
      await onRepace(subject, daysToShift, startFromDate || undefined);
      onClose();
      // Reset form
      setDirection('forward');
      setDays(1);
      setStartFromDate('');
    } catch (error) {
      console.error('Re-pace error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [direction, days, subject, startFromDate, onRepace, onClose]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
          className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-md w-full mx-4 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Re-pace Calendar</h2>
          <p className="text-sm text-gray-600 mt-1">
            Shift scheduled items while respecting weekends and blocked dates
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Subject selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Which calendar to re-pace?
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">All Subjects</option>
              <option value="ela">ELA</option>
              <option value="math">Math</option>
              <option value="science">Science</option>
              <option value="social_studies">Social Studies</option>
            </select>
          </div>

          {/* Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direction
            </label>
            <div className="flex gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="forward"
                  checked={direction === 'forward'}
                  onChange={(e) => setDirection(e.target.value as 'forward' | 'backward')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Forward (push later)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="backward"
                  checked={direction === 'backward'}
                  onChange={(e) => setDirection(e.target.value as 'forward' | 'backward')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Backward (pull earlier)</span>
              </label>
            </div>
          </div>

          {/* Number of days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of school days
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">
              Weekends and blocked dates are automatically skipped
            </p>
          </div>

          {/* Optional: Start from date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start from date (optional)
            </label>
            <input
              type="date"
              value={startFromDate}
              onChange={(e) => setStartFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to shift all items, or specify a date to only shift items on or after that date
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ This will create a version snapshot before making changes. You can view version history to restore if needed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Re-pacing...' : 'Re-pace Calendar'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}
