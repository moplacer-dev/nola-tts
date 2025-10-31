'use client';

import { SocialStudiesOptions } from '@/lib/auto-populate/types';
import { getCurriculumStructure } from '@/lib/auto-populate/social-studies';

interface SocialStudiesConfigProps {
  config: SocialStudiesOptions;
  onChange: (config: SocialStudiesOptions) => void;
  defaultStartDate: string;
}

export default function SocialStudiesConfig({ config, onChange, defaultStartDate }: SocialStudiesConfigProps) {
  const handleChange = (updates: Partial<SocialStudiesOptions>) => {
    onChange({ ...config, ...updates });
  };

  const toggleUnit = (unitNumber: number) => {
    const newUnits = config.units.includes(unitNumber)
      ? config.units.filter(u => u !== unitNumber)
      : [...config.units, unitNumber].sort((a, b) => a - b);
    handleChange({ units: newUnits });
  };

  const selectAllUnits = () => {
    handleChange({ units: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
  };

  const deselectAllUnits = () => {
    handleChange({ units: [] });
  };

  const curriculumStructure = getCurriculumStructure(config.curriculum);

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      {/* Header with Enable/Disable Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Social Studies</h3>
          <p className="text-sm text-gray-600">History Alive! curriculum with customizable units</p>
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
          </div>

          {/* Curriculum Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Curriculum
            </label>
            <select
              value={config.curriculum}
              onChange={(e) => handleChange({
                curriculum: e.target.value as 'through_industrialism' | 'through_modern_times' | 'world_through_1750'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
            >
              <option value="through_modern_times">Through Modern Times</option>
              <option value="through_industrialism">Through Industrialism</option>
              <option value="world_through_1750">The World Through 1750</option>
            </select>
          </div>

          {/* Unit Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Units ({config.units.length}/10)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllUnits}
                  className="text-xs text-[#9333EA] hover:text-[#7E22CE] font-medium"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAllUnits}
                  className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded border border-gray-200">
              {curriculumStructure.map((unit) => (
                <label key={unit.unitNumber} className="flex items-start gap-2 cursor-pointer p-2 hover:bg-white rounded">
                  <input
                    type="checkbox"
                    checked={config.units.includes(unit.unitNumber)}
                    onChange={() => toggleUnit(unit.unitNumber)}
                    className="mt-0.5 w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">Unit {unit.unitNumber}</span>
                    <p className="text-xs text-gray-600">{unit.unitName}</p>
                    <p className="text-xs text-gray-500">{unit.lessonCount} lessons</p>
                  </div>
                </label>
              ))}
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
                checked={config.includeTeamBuilding}
                onChange={(e) => handleChange({ includeTeamBuilding: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">Team Building (2 days)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
