/**
 * Science Auto-Populate Pattern Generator
 *
 * Pattern validated across Anderson Middle, Catahoula, Lakeside, Morgan Village, Example Guide
 * Confidence: 100% - Zero variation across 6 schools
 *
 * Pattern Structure:
 * - Optional opening sequence (Benchmark, Blended Science, Module Orientation)
 * - 5 or 10 rotations, each with:
 *   - Module Rotation (7-day multi-component: R#, S1 through R#, S7)
 *   - Discovery Day (1 day)
 *   - Assessment (Pear and/or Edulastic, 1 day each)
 * - Optional mid-year Blended Science (after rotation 5)
 * - Optional end-of-year Blended Science
 */

import { ScienceOptions, ComponentPlacement } from './types';
import { addSchoolDays } from './helpers';

/**
 * Generate Science curriculum component placements based on user options
 *
 * @param options - Science configuration options
 * @param blockedDates - Set of blocked curriculum dates to skip
 * @returns Array of component placements
 */
export function generateScienceComponents(
  options: ScienceOptions,
  blockedDates: Set<string> = new Set()
): ComponentPlacement[] {
  const components: ComponentPlacement[] = [];
  let currentDate = options.startDate;

  // ========================================================================
  // COMMON OPENING COMPONENTS (All Subjects)
  // ========================================================================

  // Star Academy Welcome Video (1 day)
  components.push({
    component_key: 'science_welcome_video',
    start_date: currentDate,
    duration_days: 1,
    title_override: null
  });
  currentDate = addSchoolDays(currentDate, 1, blockedDates);

  // Establish Rules & Procedures (1 day)
  components.push({
    component_key: 'science_rules_procedures',
    start_date: currentDate,
    duration_days: 1,
    title_override: null
  });
  currentDate = addSchoolDays(currentDate, 1, blockedDates);

  // ========================================================================
  // OPENING SEQUENCE (Optional)
  // ========================================================================

  if (options.includeBenchmark) {
    components.push({
      component_key: 'science_benchmark',
      start_date: currentDate,
      duration_days: 2,
      title_override: null
    });
    currentDate = addSchoolDays(currentDate, 2, blockedDates);
  }

  // Blended Science at Beginning (2 of 5)
  if (options.includeBlendedScience) {
    components.push({
      component_key: 'science_blended_science',
      start_date: currentDate,
      duration_days: 5,
      title_override: 'Blended Science 1'
    });
    currentDate = addSchoolDays(currentDate, 5, blockedDates);

    components.push({
      component_key: 'science_blended_science',
      start_date: currentDate,
      duration_days: 5,
      title_override: 'Blended Science 2'
    });
    currentDate = addSchoolDays(currentDate, 5, blockedDates);
  }

  if (options.includeModuleOrientation) {
    components.push({
      component_key: 'science_module_orientation',
      start_date: currentDate,
      duration_days: 3,
      title_override: null
    });
    currentDate = addSchoolDays(currentDate, 3, blockedDates);
  }

  // ========================================================================
  // MAIN ROTATION PATTERN
  // ========================================================================

  for (let rotation = 1; rotation <= options.rotationCount; rotation++) {
    // Module Rotation (7-day multi-component)
    // Creates: R#, S1 through R#, S7
    // This is a multi-component template that will expand into 7 individual sessions
    components.push({
      component_key: 'science_module_rotation',
      start_date: currentDate,
      duration_days: 7,
      title_override: `R${rotation}` // Will be used to set rotation number (R1, R2, etc.)
    });
    currentDate = addSchoolDays(currentDate, 7, blockedDates);

    // Discovery Day + Assessments placed on SAME DAY(s)
    if (options.assessmentType === 'pear') {
      // Day 1: Discovery Day + PEAR Assessment (same day)
      components.push({
        component_key: 'science_discovery_day',
        start_date: currentDate,
        duration_days: 1,
        title_override: null
      });
      components.push({
        component_key: 'science_pear_assessment',
        start_date: currentDate, // SAME DAY
        duration_days: 1,
        title_override: null
      });
      currentDate = addSchoolDays(currentDate, 1, blockedDates);
    }
    else if (options.assessmentType === 'edulastic') {
      // Day 1: Discovery Day + Edulastic Assessment (same day)
      components.push({
        component_key: 'science_discovery_day',
        start_date: currentDate,
        duration_days: 1,
        title_override: null
      });
      components.push({
        component_key: 'science_edulastic_assessment',
        start_date: currentDate, // SAME DAY
        duration_days: 1,
        title_override: 'Edulastic/Discovery Day'
      });
      currentDate = addSchoolDays(currentDate, 1, blockedDates);
    }
    else if (options.assessmentType === 'both') {
      // Day 1: Discovery Day + PEAR Assessment (same day)
      components.push({
        component_key: 'science_discovery_day',
        start_date: currentDate,
        duration_days: 1,
        title_override: null
      });
      components.push({
        component_key: 'science_pear_assessment',
        start_date: currentDate, // SAME DAY
        duration_days: 1,
        title_override: null
      });
      currentDate = addSchoolDays(currentDate, 1, blockedDates);

      // Day 2: Discovery Day + Edulastic Assessment (same day)
      components.push({
        component_key: 'science_discovery_day',
        start_date: currentDate,
        duration_days: 1,
        title_override: null
      });
      components.push({
        component_key: 'science_edulastic_assessment',
        start_date: currentDate, // SAME DAY
        duration_days: 1,
        title_override: 'Edulastic/Discovery Day'
      });
      currentDate = addSchoolDays(currentDate, 1, blockedDates);
    }

    // Mid-year Blended Science (3 of 5) - after rotation 5
    if (options.includeBlendedScience && rotation === 5) {
      components.push({
        component_key: 'science_blended_science',
        start_date: currentDate,
        duration_days: 5,
        title_override: 'Blended Science 3'
      });
      currentDate = addSchoolDays(currentDate, 5, blockedDates);
    }
  }

  // ========================================================================
  // END-OF-YEAR BLENDED SCIENCE (4 and 5 of 5)
  // ========================================================================

  if (options.includeBlendedScience) {
    components.push({
      component_key: 'science_blended_science',
      start_date: currentDate,
      duration_days: 5,
      title_override: 'Blended Science 4'
    });
    currentDate = addSchoolDays(currentDate, 5, blockedDates);

    components.push({
      component_key: 'science_blended_science',
      start_date: currentDate,
      duration_days: 5,
      title_override: 'Blended Science 5'
    });
    currentDate = addSchoolDays(currentDate, 5, blockedDates);
  }

  return components;
}

/**
 * Calculate estimated number of curriculum days for Science
 *
 * @param options - Science configuration options
 * @returns Estimated number of days
 */
export function estimateScienceDays(options: ScienceOptions): number {
  let days = 0;

  // Opening sequence
  if (options.includeBenchmark) days += 2;
  if (options.includeBlendedScience) days += 10; // Blended Science 1 and 2 at beginning (2 × 5 days)
  if (options.includeModuleOrientation) days += 3;

  // Rotations
  days += options.rotationCount * 7; // Module sessions

  // Discovery Days + Assessments (now on SAME day)
  if (options.assessmentType === 'pear') {
    days += options.rotationCount * 1; // Discovery + Pear (same day)
  }
  else if (options.assessmentType === 'edulastic') {
    days += options.rotationCount * 1; // Discovery + Edulastic (same day)
  }
  else if (options.assessmentType === 'both') {
    days += options.rotationCount * 2; // Day 1: Discovery + Pear, Day 2: Discovery + Edulastic
  }

  // Mid-year Blended Science (3 of 5) - always included if Blended Science enabled
  if (options.includeBlendedScience) {
    days += 5; // Blended Science 3 after rotation 5
  }

  // End-of-year Blended Science (4 and 5 of 5) - always included if Blended Science enabled
  if (options.includeBlendedScience) {
    days += 10; // Blended Science 4 and 5 at end (2 × 5 days)
  }

  return days;
}

/**
 * Get default Science options with common settings
 *
 * @param startDate - Start date for Science curriculum
 * @returns Default Science options
 */
export function getDefaultScienceOptions(startDate: string): ScienceOptions {
  return {
    enabled: false,
    startDate,
    rotationCount: 10,
    includeBenchmark: true,
    includeBlendedScience: true,
    includeModuleOrientation: true,
    blendedSciencePlacement: 'beginning',
    assessmentType: 'edulastic'
  };
}
