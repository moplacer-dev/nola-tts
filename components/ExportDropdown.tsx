'use client';

import { useState } from 'react';

interface ExportDropdownProps {
  currentSubject: string;
  guideId: string;
  onExport: (type: 'current' | 'all-separate' | 'all-combined' | 'excel') => Promise<void>;
}

export default function ExportDropdown({ currentSubject, guideId, onExport }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const subjectDisplayNames: Record<string, string> = {
    base: 'Base',
    ela: 'ELA',
    math: 'Math',
    science: 'Science',
    social_studies: 'Social Studies',
  };

  const handleExport = async (type: 'current' | 'all-separate' | 'all-combined' | 'excel') => {
    setIsExporting(true);
    setIsOpen(false);
    try {
      await onExport(type);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
      >
        {isExporting ? 'Exporting...' : 'Export ▼'}
      </button>

      {isOpen && !isExporting && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-20 border border-gray-200">
            <div className="py-1">
              {currentSubject !== 'base' && (
                <button
                  onClick={() => handleExport('current')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export Current ({subjectDisplayNames[currentSubject]})
                </button>
              )}
              <button
                onClick={() => handleExport('all-combined')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Export All (Combined)
              </button>
              <button
                onClick={() => handleExport('all-separate')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Export All (Separate)
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={() => handleExport('excel')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Export as Excel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
