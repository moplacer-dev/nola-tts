/**
 * ELA Auto-Populate Pattern Generator
 *
 * Pattern validated across Lakeside, Morgan Village
 * Confidence: 100% - Clear TT/WW pattern from previous analysis
 *
 * UPDATE (Oct 25, 2025): Implemented unit/lesson structure with direct SQL INSERTs.
 *
 * Pattern Structure:
 * - Optional opening sequence (L!L Startup, PAR Assessment, TOSCRF, TWS-5, etc.)
 * - Main TT/WW Lesson Blocks organized by Units and Lessons (e.g., Unit 1 Lesson 1, Unit 1 Lesson 2...)
 * - Supports both 1-day and 2-day blocks
 * - Optional mid-of-year assessments (after ~15 total lessons)
 * - Optional end-of-year assessments
 *
 * Implementation Note: Uses direct component placement (bypasses multi-component template)
 * to generate dynamic titles with actual unit/lesson numbers at placement time.
 *
 * ⚠️ API ROUTE REQUIREMENT:
 * For 2-day blocks, titles include "ELA_GROUP:U#L#|" prefix to mark components that should be grouped.
 * The API route must detect this prefix, generate a group_id, and link the components together.
 * Strip the prefix before saving to title_override.
 */

import { ELAOptions, ComponentPlacement } from './types';
import { addSchoolDays } from './helpers';

/**
 * Generate ELA curriculum component placements based on user options
 *
 * @param options - ELA configuration options
 * @param blockedDates - Set of blocked curriculum dates to skip
 * @returns Array of component placements
 */
export function generateELAComponents(
  options: ELAOptions,
  blockedDates: Set<string> = new Set()
): ComponentPlacement[] {
  const components: ComponentPlacement[] = [];
  let currentDate = options.startDate;

  // ========================================================================
  // COMMON OPENING COMPONENTS (All Subjects)
  // ========================================================================

  // Star Academy Welcome Video (1 day)
  components.push({
    component_key: 'ela_welcome_video',
    start_date: currentDate,
    duration_days: 1,
    title_override: null
  });
  currentDate = addSchoolDays(currentDate, 1, blockedDates);

  // Establish Rules & Procedures (1 day)
  components.push({
    component_key: 'ela_rules_procedures',
    start_date: currentDate,
    duration_days: 1,
    title_override: null
  });
  currentDate = addSchoolDays(currentDate, 1, blockedDates);

  // ========================================================================
  // OPENING SEQUENCE (Optional)
  // ========================================================================

  if (options.includeStartup) {
    // L!L Startup is a multi-component: 3 days (Lesson 1, 2, 3)
    components.push({
      component_key: 'ela_language_live_startup',
      start_date: currentDate,
      duration_days: 3,
      title_override: null
    });
    currentDate = addSchoolDays(currentDate, 3, blockedDates);
  }

  if (options.includePARAssessment) {
    components.push({
      component_key: 'ela_par_assessment',
      start_date: currentDate,
      duration_days: 1,
      title_override: null
    });
    currentDate = addSchoolDays(currentDate, 1, blockedDates);
  }

  if (options.includeTOSCRF) {
    components.push({
      component_key: 'ela_toscrf2',
      start_date: currentDate,
      duration_days: 1,
      title_override: null
    });
    currentDate = addSchoolDays(currentDate, 1, blockedDates);
  }

  if (options.includeTWS5) {
    components.push({
      component_key: 'ela_tws5',
      start_date: currentDate,
      duration_days: 1,
      title_override: null
    });
    currentDate = addSchoolDays(currentDate, 1, blockedDates);
  }

  if (options.includeMakeUpReadingScape) {
    // Place both Make-Up and ReadingScape as separate 1-day components
    components.push({
      component_key: 'ela_lil_makeup',
      start_date: currentDate,
      duration_days: 1,
      title_override: null
    });
    currentDate = addSchoolDays(currentDate, 1, blockedDates);

    components.push({
      component_key: 'ela_lil_readingscape',
      start_date: currentDate,
      duration_days: 1,
      title_override: null
    });
    currentDate = addSchoolDays(currentDate, 1, blockedDates);
  }

  if (options.includeBenchmarkGrouping) {
    components.push({
      component_key: 'ela_data_conference',
      start_date: currentDate,
      duration_days: 1,
      title_override: 'Benchmark Grouping / Data Conference'
    });
    currentDate = addSchoolDays(currentDate, 1, blockedDates);
  }

  // ========================================================================
  // MAIN TT/WW LESSON BLOCKS (Unit/Lesson Structure)
  // ========================================================================

  let totalLessonsPlaced = 0;

  for (let unitNum = 1; unitNum <= options.numberOfUnits; unitNum++) {
    for (let lessonNum = 1; lessonNum <= options.lessonsPerUnit; lessonNum++) {
      totalLessonsPlaced++;

      // Generate titles based on block type (1-day or 2-day)
      if (options.daysPerLesson === 2) {
        // 2-Day Block: Place TWO separate components with group marker
        // Day 1: TT / WT
        components.push({
          component_key: 'ela_tt_ww_block',
          start_date: currentDate,
          duration_days: 1,
          title_override: `ELA_GROUP:U${unitNum}L${lessonNum}|L!L Unit ${unitNum}, Lesson ${lessonNum}\nGroup 1: TT / Group 2: WT`
        });
        currentDate = addSchoolDays(currentDate, 1, blockedDates);

        // Day 2: WT / TT
        components.push({
          component_key: 'ela_tt_ww_block',
          start_date: currentDate,
          duration_days: 1,
          title_override: `ELA_GROUP:U${unitNum}L${lessonNum}|L!L Unit ${unitNum}, Lesson ${lessonNum}\nGroup 1: WT / Group 2: TT`
        });
        currentDate = addSchoolDays(currentDate, 1, blockedDates);
      } else {
        // 1-Day Block: Place ONE component
        components.push({
          component_key: 'ela_tt_ww_block',
          start_date: currentDate,
          duration_days: 1,
          title_override: `L!L Unit ${unitNum}, Lesson ${lessonNum}\nGroup 1: TT & WT / Group 2: WT & TT`
        });
        currentDate = addSchoolDays(currentDate, 1, blockedDates);
      }

      // ========================================================================
      // MID-OF-YEAR ASSESSMENT (after ~15 total lessons, typically after winter break)
      // ========================================================================

      if (options.includeMOYAssessment && totalLessonsPlaced === 15) {
        components.push({
          component_key: 'ela_lil_moy_assessment',
          start_date: currentDate,
          duration_days: 1,
          title_override: null
        });
        currentDate = addSchoolDays(currentDate, 1, blockedDates);

        components.push({
          component_key: 'ela_toscrf2',
          start_date: currentDate,
          duration_days: 1,
          title_override: 'TOSCRF-2 (M.O.Y.)'
        });
        currentDate = addSchoolDays(currentDate, 1, blockedDates);

        components.push({
          component_key: 'ela_tws5',
          start_date: currentDate,
          duration_days: 1,
          title_override: 'TWS-5 (M.O.Y.)'
        });
        currentDate = addSchoolDays(currentDate, 1, blockedDates);
      }
    }
  }

  // ========================================================================
  // END-OF-YEAR ASSESSMENT
  // ========================================================================

  if (options.includeEOYAssessment) {
    components.push({
      component_key: 'ela_lil_eoy_assessment',
      start_date: currentDate,
      duration_days: 1,
      title_override: null
    });
    currentDate = addSchoolDays(currentDate, 1, blockedDates);

    components.push({
      component_key: 'ela_toscrf2',
      start_date: currentDate,
      duration_days: 1,
      title_override: 'TOSCRF-2 (E.O.Y.)'
    });
    currentDate = addSchoolDays(currentDate, 1, blockedDates);

    components.push({
      component_key: 'ela_tws5',
      start_date: currentDate,
      duration_days: 1,
      title_override: 'TWS-5 (E.O.Y.)'
    });
    currentDate = addSchoolDays(currentDate, 1, blockedDates);

    components.push({
      component_key: 'ela_data_conference',
      start_date: currentDate,
      duration_days: 1,
      title_override: 'Final Data Conference'
    });
    currentDate = addSchoolDays(currentDate, 1, blockedDates);
  }

  return components;
}

/**
 * Calculate estimated number of curriculum days for ELA
 *
 * UPDATE (Oct 25, 2025): Updated for unit/lesson structure with configurable daysPerLesson.
 *
 * @param options - ELA configuration options
 * @returns Estimated number of days
 */
export function estimateELADays(options: ELAOptions): number {
  let days = 0;

  // Opening sequence
  if (options.includeStartup) days += 3;
  if (options.includePARAssessment) days += 1;
  if (options.includeTOSCRF) days += 1;
  if (options.includeTWS5) days += 1;
  if (options.includeMakeUpReadingScape) days += 2; // Make-Up + ReadingScape (2 separate days)
  if (options.includeBenchmarkGrouping) days += 1;

  // TT/WW Lesson Blocks (numberOfUnits × lessonsPerUnit × daysPerLesson)
  const totalLessons = options.numberOfUnits * options.lessonsPerUnit;
  days += totalLessons * options.daysPerLesson;

  // M.O.Y. Assessment
  if (options.includeMOYAssessment) {
    days += 3; // MOY assessment + TOSCRF + TWS-5
  }

  // E.O.Y. Assessment
  if (options.includeEOYAssessment) {
    days += 4; // EOY assessment + TOSCRF + TWS-5 + Data Conference
  }

  return days;
}

/**
 * Get default ELA options with common settings
 *
 * UPDATE (Oct 25, 2025): Changed from lessonBlockCount to unit/lesson structure.
 * Default: 3 units × 10 lessons/unit = 30 total lessons, 2-day blocks.
 *
 * @param startDate - Start date for ELA curriculum
 * @returns Default ELA options
 */
export function getDefaultELAOptions(startDate: string): ELAOptions {
  return {
    enabled: false,
    startDate,
    numberOfUnits: 10,
    lessonsPerUnit: 10,
    daysPerLesson: 2,
    includeStartup: true,
    includePARAssessment: true,
    includeTOSCRF: true,
    includeTWS5: true,
    includeMakeUpReadingScape: true,
    includeBenchmarkGrouping: true,
    includeMOYAssessment: true,
    includeEOYAssessment: true
  };
}
