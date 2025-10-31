'use client';

import { useState, useEffect } from 'react';

interface BulkAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  guideId: string;
  currentSubject: string;
  schoolYear: {
    first_day: string;
    last_day: string;
  };
  onSuccess: () => void;
}

interface PreviewData {
  affected_count: number;
  sample_changes: Array<{
    id: string;
    title: string;
    old_date: string;
    new_date: string;
  }>;
  warnings: string[];
}

export default function BulkAdjustModal({
  isOpen,
  onClose,
  guideId,
  currentSubject,
  schoolYear,
  onSuccess,
}: BulkAdjustModalProps) {
  const [daysToShift, setDaysToShift] = useState<number>(5);
  const [applyToAll, setApplyToAll] = useState(false);
  const [startFromDate, setStartFromDate] = useState<string>('');
  const [useStartDate, setUseStartDate] = useState(false);
  const [respectBlocked, setRespectBlocked] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDaysToShift(5);
      setApplyToAll(false);
      setStartFromDate('');
      setUseStartDate(false);
      setRespectBlocked(true);
      setIsPreviewMode(false);
      setPreviewData(null);
      setError('');
    }
  }, [isOpen]);

  const handlePreview = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/pacing-guides/${guideId}/bulk-adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: applyToAll ? 'all' : currentSubject,
          days_to_shift: daysToShift,
          start_from_date: useStartDate && startFromDate ? startFromDate : null,
          respect_blocked_dates: respectBlocked,
          preview_only: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to preview changes');
      }

      const data = await response.json();
      setPreviewData(data);
      setIsPreviewMode(true);
    } catch (err) {
      console.error('Preview error:', err);
      setError(err instanceof Error ? err.message : 'Failed to preview changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/pacing-guides/${guideId}/bulk-adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: applyToAll ? 'all' : currentSubject,
          days_to_shift: daysToShift,
          start_from_date: useStartDate && startFromDate ? startFromDate : null,
          respect_blocked_dates: respectBlocked,
          preview_only: false,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to apply changes');
      }

      // Success!
      onSuccess();
    } catch (err) {
      console.error('Apply error:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setIsPreviewMode(false);
    setPreviewData(null);
    setError('');
  };

  const formatDateDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const subjectLabels: Record<string, string> = {
    base: 'Base Calendar',
    ela: 'ELA',
    math: 'Math',
    science: 'Science',
    social_studies: 'Social Studies',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-300 pointer-events-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isPreviewMode ? 'Preview Changes' : 'Adjust Schedule'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {!isPreviewMode ? (
            // Configuration Form
            <div className="space-y-6">
              {/* Days to Shift */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Shift all components:
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDaysToShift(Math.max(daysToShift - 1, -50))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-semibold transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={daysToShift}
                    onChange={(e) => setDaysToShift(parseInt(e.target.value) || 0)}
                    className="w-20 px-4 py-2 border border-gray-300 rounded-lg text-center font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9333EA]"
                  />
                  <button
                    onClick={() => setDaysToShift(Math.min(daysToShift + 1, 50))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-semibold transition-colors"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600">
                    school days {daysToShift > 0 ? 'forward' : daysToShift < 0 ? 'backward' : ''}
                  </span>
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Apply to:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!applyToAll}
                      onChange={() => setApplyToAll(false)}
                      className="mr-2 text-[#9333EA] focus:ring-[#9333EA]"
                    />
                    <span className="text-sm text-gray-700">
                      Current subject ({subjectLabels[currentSubject]})
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={applyToAll}
                      onChange={() => setApplyToAll(true)}
                      className="mr-2 text-[#9333EA] focus:ring-[#9333EA]"
                    />
                    <span className="text-sm text-gray-700">All subjects</span>
                  </label>
                </div>
              </div>

              {/* Start From Date */}
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={useStartDate}
                    onChange={(e) => setUseStartDate(e.target.checked)}
                    className="mr-2 text-[#9333EA] focus:ring-[#9333EA]"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Start from date (optional)
                  </span>
                </label>
                {useStartDate && (
                  <input
                    type="date"
                    value={startFromDate}
                    onChange={(e) => setStartFromDate(e.target.value)}
                    min={schoolYear.first_day}
                    max={schoolYear.last_day}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9333EA]"
                  />
                )}
                {useStartDate && (
                  <p className="mt-1 text-xs text-gray-500">
                    Only components scheduled on or after this date will be adjusted
                  </p>
                )}
              </div>

              {/* Respect Blocked Dates */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={respectBlocked}
                    onChange={(e) => setRespectBlocked(e.target.checked)}
                    className="mr-2 text-[#9333EA] focus:ring-[#9333EA]"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Skip holidays and blocked dates
                  </span>
                </label>
                <p className="mt-1 ml-6 text-xs text-gray-500">
                  When checked, components will skip over days marked as "blocks curriculum"
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          ) : (
            // Preview Results
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  {previewData?.affected_count || 0} component{previewData?.affected_count !== 1 ? 's' : ''} will be shifted{' '}
                  {daysToShift > 0 ? 'forward' : 'backward'} by {Math.abs(daysToShift)} school day
                  {Math.abs(daysToShift) !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Sample Changes */}
              {previewData && previewData.sample_changes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Sample changes:</h3>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                    {previewData.sample_changes.map((change) => (
                      <div key={change.id} className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-gray-700 font-medium truncate flex-1">
                          {change.title}
                        </span>
                        <span className="text-sm text-gray-500 ml-4 whitespace-nowrap">
                          {formatDateDisplay(change.old_date)} → {formatDateDisplay(change.new_date)}
                        </span>
                      </div>
                    ))}
                    {previewData.affected_count > previewData.sample_changes.length && (
                      <div className="px-4 py-2 bg-gray-50">
                        <span className="text-xs text-gray-500">
                          ... and {previewData.affected_count - previewData.sample_changes.length} more
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {previewData && previewData.warnings.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-yellow-900 mb-1">Warnings:</h4>
                      <ul className="space-y-1">
                        {previewData.warnings.map((warning, index) => (
                          <li key={index} className="text-sm text-yellow-800">
                            • {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          {!isPreviewMode ? (
            <>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePreview}
                disabled={isLoading || daysToShift === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-[#9333EA] rounded-lg hover:bg-[#7E22CE] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Preview Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleApply}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-[#9333EA] rounded-lg hover:bg-[#7E22CE] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Applying...' : 'Apply Changes'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
