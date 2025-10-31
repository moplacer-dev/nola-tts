/**
 * Math Auto-Populate Pattern Generator
 *
 * Pattern validated across 7 schools with TWO valid sequence options
 * Confidence: 95% - Two valid sequence options confirmed
 *
 * Pattern Structure:
 * - Optional opening sequence (IPL Orientation, Whole Class, STEPS, Benchmark)
 * - Two sequence options:
 *   A) IPL → Rotations: Place all IPL units first, then rotations
 *   B) Rotations → IPL: Place all rotations first, then IPL units
 * - IPL units: 39 available, 3-6 days each with lesson pairing (Updated 2025-10-30: New format retains "IPL:" prefix)
 * - Module Rotations: 0-10 rotations, each with 10 days (R#, S1-S7 + diagnostic days + discovery/edulastic)
 * - Optional Math Connections after each IPL unit
 * - Optional intervention days between rotations
 */

import { MathOptions, ComponentPlacement, IPLLessonCount } from './types';
import { addSchoolDays } from './helpers';

// ============================================================================
// IPL LESSON PAIRING MAPPING
// ============================================================================

/**
 * IPL lesson counts for all 40 IPL units
 * These represent the number of days each IPL takes when using lesson pairing
 */
const IPL_LESSON_COUNTS: IPLLessonCount = {
  math_ipl_integers: 4,
  math_ipl_decimal_intro: 3,
  math_ipl_decimal_operations: 3,
  math_ipl_intro_fractions: 5,
  math_ipl_operations_fractions_1: 6,
  math_ipl_operations_fractions_2: 4,
  math_ipl_real_number_system: 4,
  math_ipl_ratios_percents: 4,
  math_ipl_transformations: 4,
  math_ipl_angles: 4,
  math_ipl_angle_relationships: 3,
  math_ipl_triangles: 5,
  math_ipl_polygons: 6,
  math_ipl_circles: 4,
  math_ipl_prisms_pyramids: 5,
  math_ipl_equations: 5,
  math_ipl_properties_real_numbers: 5,
  math_ipl_linear_equations_graphing: 5,
  math_ipl_inequalities: 4,
  math_ipl_absolute_value: 3,
  math_ipl_exponents: 3,
  math_ipl_radicals: 4,
  math_ipl_special_equations: 3,
  math_ipl_matrices: 3,
  math_ipl_systems_of_equations: 3,
  math_ipl_polynomials: 4,
  math_ipl_quadratics: 4,
  math_ipl_factoring: 4,
  math_ipl_exponential_equations: 3,
  math_ipl_functions: 3,
  math_ipl_units: 3,
  math_ipl_sets: 3,
  math_ipl_data_graphs_1: 4,
  math_ipl_data_graphs_2: 3,
  math_ipl_logic_sequence: 3,
  math_ipl_probability: 4,
  math_ipl_accuracy: 3,
  math_ipl_graphing_calculators: 2,
  math_ipl_calculators: 2,
};

// ============================================================================
// PATTERN GENERATOR
// ============================================================================

/**
 * Generate Math curriculum component placements based on user options
 *
 * @param options - Math configuration options
 * @param blockedDates - Set of blocked curriculum dates to skip
 * @returns Array of component placements
 */
export function generateMathComponents(
  options: MathOptions,
  blockedDates: Set<string> = new Set()
): ComponentPlacement[] {
  const components: ComponentPlacement[] = [];
  let currentDate = options.startDate;

  // ========================================================================
  // COMMON OPENING COMPONENTS (All Subjects)
  // ========================================================================

  // Star Academy Welcome Video (1 day)
  components.push({
    component_key: 'math_welcome_video',
    start_date: currentDate,
    duration_days: 1,
    title_override: null
  });
  currentDate = addSchoolDays(currentDate, 1, blockedDates);

  // Establish Rules & Procedures (1 day)
  components.push({
    component_key: 'math_rules_procedures',
    start_date: currentDate,
    duration_days: 1,
    title_override: null
  });
  currentDate = addSchoolDays(currentDate, 1, blockedDates);

  // ========================================================================
  // OPENING SEQUENCE (Optional)
  // ========================================================================

  if (options.includeIPLOrientation) {
    components.push({
      component_key: 'math_ipl_orientation',
      start_date: currentDate,
      duration_days: 1,
      title_override: null
    });
    currentDate = addSchoolDays(currentDate, 1, blockedDates);
  }

  if (options.includeIPLWholeClass) {
    components.push({
      component_key: 'math_ipl_whole_class',
      start_date: currentDate,
      duration_days: 2,
      title_override: null
    });
    currentDate = addSchoolDays(currentDate, 2, blockedDates);
  }

  if (options.includeSTEPSPlacement) {
    // STEPS Placement is 2 days with Early Finishers IPLs on both days
    const stepsStartDate = currentDate;

    // STEPS Placement (2 days)
    components.push({
      component_key: 'math_steps_placement',
      start_date: stepsStartDate,
      duration_days: 2,
      title_override: null
    });

    // Early Finishers IPL - Day 1 (same day as STEPS starts)
    components.push({
      component_key: 'math_early_finishers_ipl',
      start_date: stepsStartDate,
      duration_days: 1,
      title_override: null
    });

    // Early Finishers IPL - Day 2 (second day of STEPS)
    const stepsDay2 = addSchoolDays(stepsStartDate, 1, blockedDates);
    components.push({
      component_key: 'math_early_finishers_ipl',
      start_date: stepsDay2,
      duration_days: 1,
      title_override: null
    });

    // Advance by 2 days total (after STEPS completes)
    currentDate = addSchoolDays(stepsStartDate, 2, blockedDates);
  }

  if (options.includeBenchmark) {
    components.push({
      component_key: 'math_benchmark',
      start_date: currentDate,
      duration_days: 2,
      title_override: null
    });
    currentDate = addSchoolDays(currentDate, 2, blockedDates);
  }

  // ========================================================================
  // SEQUENCE OPTION A: IPL → Rotations
  // ========================================================================

  if (options.sequence === 'ipl_first') {
    // Place all selected IPL units first
    for (const iplKey of options.selectedIPLs) {
      const iplDays = IPL_LESSON_COUNTS[iplKey] || 3;
      components.push({
        component_key: iplKey,
        start_date: currentDate,
        duration_days: iplDays,
        title_override: null
      });
      currentDate = addSchoolDays(currentDate, iplDays, blockedDates);

      // Math Connections after each IPL (optional)
      if (options.includeMathConnections) {
        components.push({
          component_key: 'math_connections_1761426773201',
          start_date: currentDate,
          duration_days: 1,
          title_override: 'Math Connections'
        });
        currentDate = addSchoolDays(currentDate, 1, blockedDates);
      }

      // Flex Day after each IPL
      components.push({
        component_key: 'math_flex_day',
        start_date: currentDate,
        duration_days: 1,
        title_override: null
      });
      currentDate = addSchoolDays(currentDate, 1, blockedDates);
    }

    // Then place rotations
    for (let rotation = 1; rotation <= options.rotationCount; rotation++) {
      currentDate = placeRotation(components, currentDate, rotation, options, blockedDates);
    }
  }

  // ========================================================================
  // SEQUENCE OPTION B: Rotations → IPL
  // ========================================================================

  else {
    // Place all rotations first
    for (let rotation = 1; rotation <= options.rotationCount; rotation++) {
      currentDate = placeRotation(components, currentDate, rotation, options, blockedDates);
    }

    // Then place IPLs
    for (const iplKey of options.selectedIPLs) {
      const iplDays = IPL_LESSON_COUNTS[iplKey] || 3;
      components.push({
        component_key: iplKey,
        start_date: currentDate,
        duration_days: iplDays,
        title_override: null
      });
      currentDate = addSchoolDays(currentDate, iplDays, blockedDates);

      // Math Connections after each IPL (optional)
      if (options.includeMathConnections) {
        components.push({
          component_key: 'math_connections_1761426773201',
          start_date: currentDate,
          duration_days: 1,
          title_override: 'Math Connections'
        });
        currentDate = addSchoolDays(currentDate, 1, blockedDates);
      }

      // Flex Day after each IPL
      components.push({
        component_key: 'math_flex_day',
        start_date: currentDate,
        duration_days: 1,
        title_override: null
      });
      currentDate = addSchoolDays(currentDate, 1, blockedDates);
    }
  }

  return components;
}

/**
 * Helper function to place a single rotation
 *
 * @param components - Array to add components to
 * @param currentDate - Current date
 * @param rotationNumber - Rotation number (1-10)
 * @param options - Math configuration options
 * @param blockedDates - Set of blocked curriculum dates
 * @returns Updated current date after placing rotation
 */
function placeRotation(
  components: ComponentPlacement[],
  currentDate: string,
  rotationNumber: number,
  options: MathOptions,
  blockedDates: Set<string>
): string {
  // Module Rotation (10-day multi-component: R#, S1-S7 + 2 diagnostic days + 1 discovery/edulastic)
  // UPDATE (Oct 25, 2025): Diagnostic days are built into the multi-component template (metadata.is_multi).
  // No need for separate diagnostic placement logic.
  components.push({
    component_key: 'math_module_rotation',
    start_date: currentDate,
    duration_days: 10,
    title_override: `R${rotationNumber}`
  });
  currentDate = addSchoolDays(currentDate, 10, blockedDates);

  return currentDate;
}

/**
 * Calculate estimated number of curriculum days for Math
 *
 * @param options - Math configuration options
 * @returns Estimated number of days
 */
export function estimateMathDays(options: MathOptions): number {
  let days = 0;

  // Opening sequence
  if (options.includeIPLOrientation) days += 1;
  if (options.includeIPLWholeClass) days += 2;
  if (options.includeSTEPSPlacement) days += 2; // Updated: STEPS is now 2 days
  if (options.includeBenchmark) days += 2;

  // IPL units
  for (const iplKey of options.selectedIPLs) {
    const iplDays = IPL_LESSON_COUNTS[iplKey] || 3;
    days += iplDays;

    if (options.includeMathConnections) {
      days += 1;
    }

    // Flex Day after each IPL
    days += 1;
  }

  // Rotations
  // UPDATE (Oct 25, 2025): Diagnostic days are included in rotation template (metadata.is_multi).
  days += options.rotationCount * 10; // 10 days per rotation (includes built-in diagnostics)

  return days;
}

/**
 * Get default Math options with common settings
 *
 * UPDATE (Oct 25, 2025): Removed diagnosticPlacement option.
 * Default sequence is 'ipl_first' (IPL → Rotations).
 *
 * @param startDate - Start date for Math curriculum
 * @returns Default Math options
 */
export function getDefaultMathOptions(startDate: string): MathOptions {
  return {
    enabled: false,
    startDate,
    sequence: 'ipl_first', // Default to IPL → Rotations
    selectedIPLs: [
      'math_ipl_integers',
      'math_ipl_decimal_intro',
      'math_ipl_decimal_operations',
      'math_ipl_intro_fractions',
      'math_ipl_real_number_system'
    ], // Foundational units by default
    rotationCount: 5, // Default to 5 rotations (changed from 10)
    includeIPLOrientation: true,
    includeIPLWholeClass: true,
    includeSTEPSPlacement: true,
    includeBenchmark: true,
    includeMathConnections: true
  };
}

/**
 * Get IPL lesson count for a given IPL key
 *
 * @param iplKey - IPL component key
 * @returns Number of days for that IPL
 */
export function getIPLDays(iplKey: string): number {
  return IPL_LESSON_COUNTS[iplKey] || 3;
}

/**
 * Get all available IPL keys
 *
 * @returns Array of all IPL component keys
 */
export function getAllIPLKeys(): string[] {
  return Object.keys(IPL_LESSON_COUNTS);
}
