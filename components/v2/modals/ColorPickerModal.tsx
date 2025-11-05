'use client';

import { useState } from 'react';

interface ColorPickerModalProps {
  selectedCount: number;
  onClose: () => void;
  onConfirm: (color: string) => void;
}

// Preset colors matching the template color scheme
const PRESET_COLORS = [
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Yellow', hex: '#FBBF24' },
  { name: 'Deep Orange', hex: '#EA580C' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Lime', hex: '#84CC16' },
  { name: 'Teal', hex: '#10B981' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Cyan', hex: '#0891B2' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Sky', hex: '#0EA5E9' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Slate', hex: '#64748B' }
];

export function ColorPickerModal({ selectedCount, onClose, onConfirm }: ColorPickerModalProps) {
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  const [customColor, setCustomColor] = useState('#6366F1');

  const handleConfirm = () => {
    onConfirm(selectedColor);
    onClose();
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    setSelectedColor(color);
  };

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
          className="bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4 border border-gray-200 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Change Color
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Select a color for {selectedCount} selected item{selectedCount === 1 ? '' : 's'}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {/* Preset Colors Grid */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preset Colors
            </label>
            <div className="grid grid-cols-6 gap-3">
              {PRESET_COLORS.map(({ name, hex }) => (
                <button
                  key={hex}
                  onClick={() => setSelectedColor(hex)}
                  className={`
                    relative h-12 rounded-md border-2 transition-all
                    ${selectedColor === hex
                      ? 'border-blue-500 ring-2 ring-blue-200 scale-105'
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                  style={{ backgroundColor: hex }}
                  title={name}
                >
                  {selectedColor === hex && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Custom Color
            </label>
            <div className="flex items-center gap-3">
              {/* HTML5 Color Input */}
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
              />

              {/* Hex Input */}
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomColor(value);
                  // Only update selected color if valid hex
                  if (/^#[0-9A-F]{6}$/i.test(value)) {
                    setSelectedColor(value);
                  }
                }}
                placeholder="#6366F1"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply Color
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
