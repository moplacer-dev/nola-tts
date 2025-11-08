'use client';

import { useState, useEffect } from 'react';

interface Version {
  id: string;
  version_number: number;
  version_label: string;
  created_at: string;
  item_count: number;
  created_by: {
    email: string;
    name: string;
  };
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  guideId: string;
  currentVersion: number | null;
  onRestore: () => void; // Callback to refresh after restore
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  guideId,
  currentVersion,
  onRestore
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState<number | null>(null);

  // Fetch versions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, guideId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/pacing-guides/${guideId}/versions`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch versions');
      }

      const data = await res.json();
      setVersions(data.versions || []);
    } catch (err) {
      console.error('Error fetching versions:', err);
      setError('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (versionNumber: number) => {
    setRestoringVersion(versionNumber);

    try {
      const res = await fetch(
        `/api/pacing-guides/${guideId}/versions/${versionNumber}/restore`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (!res.ok) {
        throw new Error('Failed to restore version');
      }

      const data = await res.json();
      console.log('Restore success:', data);

      // Refresh the parent component
      onRestore();

      // Close the modal
      onClose();
      setShowConfirm(null);
    } catch (err) {
      console.error('Error restoring version:', err);
      setError('Failed to restore version. Please try again.');
    } finally {
      setRestoringVersion(null);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Invisible backdrop for click-to-close */}
      <div className="fixed inset-0 z-50" onClick={onClose} />

      {/* Modal window */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-2xl w-full mx-4 pointer-events-auto max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Version History</h2>
            <p className="text-sm text-gray-600 mt-1">
              View and restore previous versions of your pacing guide
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {!isLoading && !error && versions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">No version history yet</p>
                <p className="text-sm">
                  Versions are created automatically when you re-pace your calendar
                </p>
              </div>
            )}

            {!isLoading && !error && versions.length > 0 && (
              <div className="space-y-3">
                {versions.map((version) => {
                  const isCurrent = version.version_number === currentVersion;

                  return (
                    <div
                      key={version.id}
                      className={`border rounded-lg p-4 ${
                        isCurrent
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {version.version_label}
                            </h3>
                            {isCurrent && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-purple-600 text-white rounded">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(version.created_at)} • {version.item_count} items
                          </p>
                          {version.created_by && (
                            <p className="text-xs text-gray-500 mt-1">
                              by {version.created_by.name || version.created_by.email}
                            </p>
                          )}
                        </div>

                        {!isCurrent && (
                          <div>
                            {showConfirm === version.version_number ? (
                              <div className="flex flex-col gap-2">
                                <p className="text-xs text-gray-600 mb-1">
                                  Restore this version?
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleRestore(version.version_number)}
                                    disabled={restoringVersion !== null}
                                    className="px-3 py-1 text-xs font-medium bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                                  >
                                    {restoringVersion === version.version_number
                                      ? 'Restoring...'
                                      : 'Confirm'}
                                  </button>
                                  <button
                                    onClick={() => setShowConfirm(null)}
                                    className="px-3 py-1 text-xs font-medium border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowConfirm(version.version_number)}
                                disabled={restoringVersion !== null}
                                className="px-4 py-2 text-sm font-medium border border-purple-300 text-purple-700 rounded hover:bg-purple-50 transition-colors disabled:opacity-50"
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Restoring a version will create a backup of your current calendar
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
