'use client';

import { ELAOptions } from '@/lib/auto-populate/types';

interface ELAConfigProps {
  config: ELAOptions;
  onChange: (config: ELAOptions) => void;
  defaultStartDate: string;
}

export default function ELAConfig({ config, onChange, defaultStartDate }: ELAConfigProps) {
  const handleChange = (updates: Partial<ELAOptions>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      {/* Header with Enable/Disable Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">ELA</h3>
          <p className="text-sm text-gray-600">Leveled Literacy Intervention (L!L) with TT/WW lesson blocks</p>
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
              First day to place ELA curriculum
            </p>
          </div>

          {/* Units and Lessons Configuration */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Units
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.numberOfUnits}
                onChange={(e) => handleChange({ numberOfUnits: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lessons per Unit
              </label>
              <input
                type="number"
                min="1"
                max="15"
                value={config.lessonsPerUnit}
                onChange={(e) => handleChange({ lessonsPerUnit: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: 10 lessons per unit
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Block Type
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleChange({ daysPerLesson: 2 })}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    config.daysPerLesson === 2
                      ? 'bg-[#9333EA] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  2-Day Block
                </button>
                <button
                  type="button"
                  onClick={() => handleChange({ daysPerLesson: 1 })}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    config.daysPerLesson === 1
                      ? 'bg-[#9333EA] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  1-Day Block
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {config.daysPerLesson === 2
                  ? 'Day 1: Group 1 TT / Group 2 WT, Day 2: Group 1 WT / Group 2 TT'
                  : 'Day 1: Group 1 TT & WT / Group 2 WT & TT'}
              </p>
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
                checked={config.includeStartup}
                onChange={(e) => handleChange({ includeStartup: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">L!L Startup (3 days: Lessons 1-3)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includePARAssessment}
                onChange={(e) => handleChange({ includePARAssessment: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">PAR Assessment (1 day)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeTOSCRF}
                onChange={(e) => handleChange({ includeTOSCRF: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">TOSCRF-2 (1 day)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeTWS5}
                onChange={(e) => handleChange({ includeTWS5: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">TWS-5 (1 day)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeMakeUpReadingScape}
                onChange={(e) => handleChange({ includeMakeUpReadingScape: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">Make-Up / ReadingScape (1 day)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeBenchmarkGrouping}
                onChange={(e) => handleChange({ includeBenchmarkGrouping: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">Benchmark Grouping / Data Conference (1 day)</span>
            </label>
          </div>

          {/* Assessment Options */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Assessments (Optional)
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeMOYAssessment}
                onChange={(e) => handleChange({ includeMOYAssessment: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">
                Mid-of-Year Assessment (after lesson 15, includes TOSCRF + TWS-5)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeEOYAssessment}
                onChange={(e) => handleChange({ includeEOYAssessment: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">
                End-of-Year Assessment (includes TOSCRF + TWS-5 + Data Conference)
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
