'use client';

import { MathOptions } from '@/lib/auto-populate/types';
import { getAllIPLKeys, getIPLDays } from '@/lib/auto-populate/math';

interface MathConfigProps {
  config: MathOptions;
  onChange: (config: MathOptions) => void;
  defaultStartDate: string;
}

// IPL unit display names (simplified for UI)
const IPL_DISPLAY_NAMES: Record<string, string> = {
  'math_ipl_integers': 'Integers',
  'math_ipl_decimal_intro': 'Intro to Decimals',
  'math_ipl_decimal_operations': 'Decimal Operations',
  'math_ipl_intro_fractions': 'Intro to Fractions',
  'math_ipl_operations_fractions_1': 'Operations w/ Fractions I',
  'math_ipl_operations_fractions_2': 'Operations w/ Fractions II',
  'math_ipl_real_number_system': 'Real Number System',
  'math_ipl_ratios_percents': 'Ratios & Percents',
  'math_ipl_transformations': 'Transformations',
  'math_ipl_angles': 'Angles',
  'math_ipl_angle_relationships': 'Angle Relationships',
  'math_ipl_triangles': 'Triangles',
  'math_ipl_polygons': 'Polygons',
  'math_ipl_circles': 'Circles',
  'math_ipl_prisms_pyramids': 'Prisms and Pyramids',
  'math_ipl_equations': 'Equations',
  'math_ipl_properties_real_numbers': 'Properties of Real Numbers',
  'math_ipl_linear_equations_graphing': 'Linear Equations & Graphing',
  'math_ipl_inequalities': 'Inequalities',
  'math_ipl_absolute_value': 'Absolute Value',
  'math_ipl_exponents': 'Exponents',
  'math_ipl_radicals': 'Radicals',
  'math_ipl_special_equations': 'Special Equations',
  'math_ipl_matrices': 'Matrices',
  'math_ipl_systems_of_equations': 'Systems of Equations',
  'math_ipl_polynomials': 'Polynomials',
  'math_ipl_quadratics': 'Quadratics',
  'math_ipl_factoring': 'Factoring',
  'math_ipl_exponential_equations': 'Exponential Equations',
  'math_ipl_functions': 'Functions',
  'math_ipl_units': 'Units',
  'math_ipl_sets': 'Sets',
  'math_ipl_data_graphs_1': 'Data Graphs I',
  'math_ipl_data_graphs_2': 'Data Graphs II',
  'math_ipl_logic_sequence': 'Logic and Sequence',
  'math_ipl_probability': 'Probability',
  'math_ipl_accuracy': 'Accuracy',
  'math_ipl_graphing_calculators': 'Graphing Calculators',
  'math_ipl_calculators': 'Calculators',
};

// Categorize IPL units for better UX
const IPL_CATEGORIES = {
  foundational: [
    'math_ipl_integers',
    'math_ipl_decimal_intro',
    'math_ipl_decimal_operations',
    'math_ipl_intro_fractions',
    'math_ipl_operations_fractions_1',
    'math_ipl_operations_fractions_2',
    'math_ipl_real_number_system',
    'math_ipl_ratios_percents',
  ],
  geometry: [
    'math_ipl_transformations',
    'math_ipl_angles',
    'math_ipl_angle_relationships',
    'math_ipl_triangles',
    'math_ipl_polygons',
    'math_ipl_circles',
    'math_ipl_prisms_pyramids',
  ],
  algebra: [
    'math_ipl_equations',
    'math_ipl_properties_real_numbers',
    'math_ipl_linear_equations_graphing',
    'math_ipl_inequalities',
    'math_ipl_absolute_value',
    'math_ipl_exponents',
    'math_ipl_radicals',
    'math_ipl_special_equations',
    'math_ipl_matrices',
    'math_ipl_systems_of_equations',
    'math_ipl_polynomials',
    'math_ipl_quadratics',
    'math_ipl_factoring',
    'math_ipl_exponential_equations',
    'math_ipl_functions',
  ],
  other: [
    'math_ipl_units',
    'math_ipl_sets',
    'math_ipl_data_graphs_1',
    'math_ipl_data_graphs_2',
    'math_ipl_logic_sequence',
    'math_ipl_probability',
    'math_ipl_accuracy',
    'math_ipl_graphing_calculators',
    'math_ipl_calculators',
  ],
};

export default function MathConfig({ config, onChange, defaultStartDate }: MathConfigProps) {
  const handleChange = (updates: Partial<MathOptions>) => {
    onChange({ ...config, ...updates });
  };

  const toggleIPL = (iplKey: string) => {
    const newIPLs = config.selectedIPLs.includes(iplKey)
      ? config.selectedIPLs.filter(k => k !== iplKey)
      : [...config.selectedIPLs, iplKey];
    handleChange({ selectedIPLs: newIPLs });
  };

  const selectCategory = (category: keyof typeof IPL_CATEGORIES) => {
    const categoryIPLs = IPL_CATEGORIES[category];
    const allSelected = categoryIPLs.every(ipl => config.selectedIPLs.includes(ipl));

    if (allSelected) {
      // Deselect all in category
      handleChange({ selectedIPLs: config.selectedIPLs.filter(ipl => !categoryIPLs.includes(ipl)) });
    } else {
      // Select all in category
      const newIPLs = [...new Set([...config.selectedIPLs, ...categoryIPLs])];
      handleChange({ selectedIPLs: newIPLs });
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      {/* Header with Enable/Disable Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Math</h3>
          <p className="text-sm text-gray-600">IPL units and module rotations</p>
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

          {/* Sequence Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Placement Sequence
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleChange({ sequence: 'ipl_first' })}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  config.sequence === 'ipl_first'
                    ? 'bg-[#9333EA] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                IPL → Rotations
              </button>
              <button
                type="button"
                onClick={() => handleChange({ sequence: 'rotations_first' })}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  config.sequence === 'rotations_first'
                    ? 'bg-[#9333EA] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rotations → IPL
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Choose whether to place IPL units or rotations first
            </p>
          </div>

          {/* IPL Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select IPL Units ({config.selectedIPLs.length})
              </label>
            </div>

            <div className="space-y-3 p-3 bg-gray-50 rounded border border-gray-200">
                {/* Category Quick Selectors */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => selectCategory('foundational')}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Foundational ({IPL_CATEGORIES.foundational.filter(ipl => config.selectedIPLs.includes(ipl)).length}/{IPL_CATEGORIES.foundational.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => selectCategory('geometry')}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Geometry ({IPL_CATEGORIES.geometry.filter(ipl => config.selectedIPLs.includes(ipl)).length}/{IPL_CATEGORIES.geometry.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => selectCategory('algebra')}
                    className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                  >
                    Algebra ({IPL_CATEGORIES.algebra.filter(ipl => config.selectedIPLs.includes(ipl)).length}/{IPL_CATEGORIES.algebra.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => selectCategory('other')}
                    className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Other ({IPL_CATEGORIES.other.filter(ipl => config.selectedIPLs.includes(ipl)).length}/{IPL_CATEGORIES.other.length})
                  </button>
                </div>

                {/* IPL Checkboxes (categorized) */}
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {Object.entries(IPL_CATEGORIES).map(([categoryName, iplKeys]) => (
                    <div key={categoryName}>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                        {categoryName === 'foundational' ? 'Foundational' :
                         categoryName === 'geometry' ? 'Geometry' :
                         categoryName === 'algebra' ? 'Algebra' : 'Other'}
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {iplKeys.map((iplKey) => (
                          <label key={iplKey} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-white rounded text-xs">
                            <input
                              type="checkbox"
                              checked={config.selectedIPLs.includes(iplKey)}
                              onChange={() => toggleIPL(iplKey)}
                              className="w-3 h-3 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
                            />
                            <span className="text-gray-700">
                              {IPL_DISPLAY_NAMES[iplKey]} ({getIPLDays(iplKey)}d)
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                checked={config.includeIPLOrientation}
                onChange={(e) => handleChange({ includeIPLOrientation: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">IPL Orientation (1 day)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeIPLWholeClass}
                onChange={(e) => handleChange({ includeIPLWholeClass: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">IPL Whole Class (2 days)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeSTEPSPlacement}
                onChange={(e) => handleChange({ includeSTEPSPlacement: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">STEPS Placement Assessment (2 days)</span>
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
                checked={config.includeMathConnections}
                onChange={(e) => handleChange({ includeMathConnections: e.target.checked })}
                className="w-4 h-4 text-[#9333EA] border-gray-300 rounded focus:ring-[#9333EA]"
              />
              <span className="text-sm text-gray-700">Math Connections after each IPL (1 day each)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
