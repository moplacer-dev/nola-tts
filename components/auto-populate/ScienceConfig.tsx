'use client';

import { ScienceOptions } from '@/lib/auto-populate/types';

interface ScienceConfigProps {
  config: ScienceOptions;
  onChange: (config: ScienceOptions) => void;
  defaultStartDate: string;
}

export default function ScienceConfig({ config, onChange, defaultStartDate }: ScienceConfigProps) {
  const handleChange = (updates: Partial<ScienceOptions>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      {/* Header with Enable/Disable Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Science</h3>
          <p className="text-sm text-gray-600">Module rotations with Discovery Days and assessments</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => handleChange({ enabled: e.target.checked })}
            className="w-5 h-5 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
          />
          <span className="text-sm font-medium text-gray-700">Enable</span>
        </label>
      </div>

      {/* Configuration Form (only shown when enabled) */}
      {config.enabled && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={config.startDate}
              onChange={(e) => handleChange({ startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              First day to place Science curriculum
            </p>
          </div>

          {/* Rotation Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Rotations
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleChange({ rotationCount: 5 })}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  config.rotationCount === 5
                    ? 'bg-[#9333EA] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                5 Rotations
              </button>
              <button
                type="button"
                onClick={() => handleChange({ rotationCount: 10 })}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  config.rotationCount === 10
                    ? 'bg-[#9333EA] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                10 Rotations
              </button>
            </div>
          </div>

          {/* Opening Sequence */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Opening Sequence (Optional)
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeBenchmark}
                onChange={(e) => handleChange({ includeBenchmark: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">Benchmark (2 days)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeBlendedScience}
                onChange={(e) => handleChange({ includeBlendedScience: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">Blended Science (5 total, 25 days)</span>
            </label>

            {config.includeBlendedScience && (
              <div className="ml-6 text-xs text-gray-500 space-y-1">
                <p>• 2 at beginning (Blended Science 1-2)</p>
                <p>• 1 mid-year after R5 (Blended Science 3)</p>
                <p>• 2 at end (Blended Science 4-5)</p>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeModuleOrientation}
                onChange={(e) => handleChange({ includeModuleOrientation: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">Module Orientation (3 days)</span>
            </label>
          </div>

          {/* Assessment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Type
            </label>
            <select
              value={config.assessmentType}
              onChange={(e) => handleChange({ assessmentType: e.target.value as 'pear' | 'edulastic' | 'both' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
            >
              <option value="pear">Pear Assessment only</option>
              <option value="edulastic">Edulastic only</option>
              <option value="both">Both (Pear + Edulastic)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
