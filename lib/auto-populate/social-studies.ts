/**
 * Social Studies Auto-Populate Pattern Generator
 *
 * Pattern validated across Anderson Middle, BC, Catahoula, Lakeside, Morgan Village
 * Confidence: 100% - Perfect pattern match across 5 schools
 *
 * UPDATE (Oct 25, 2025): Implemented self-paced unit pattern
 *
 * Pattern Structure:
 * - Optional team building activity (2 days)
 * - Selected units from chosen curriculum (1-10 units available)
 * - Each unit is ONE self-paced component (metadata.is_multi handles expansion)
 * - Unit duration already set in template (lesson_count + 1 buffer day)
 * - Separate Flex Day component placed after each unit (1 day)
 *
 * Example: Unit 1 with 3 lessons = 4 days (3 lessons + 1 buffer) + 1 Flex Day = 5 days total
 */

import { SocialStudiesOptions, ComponentPlacement, LessonMapping } from './types';
import { addSchoolDays } from './helpers';

// ============================================================================
// CURRICULUM STRUCTURES
// ============================================================================

/**
 * Through Modern Times curriculum structure (8th grade US History)
 * 10 units, 36 lessons total
 */
const THROUGH_MODERN_TIMES_STRUCTURE: LessonMapping[] = [
  { unitNumber: 1, unitName: 'Forming a New Nation', lessonNumbers: [1, 2, 3], lessonCount: 3 },
  { unitNumber: 2, unitName: 'Launching the New Republic', lessonNumbers: [4, 5, 6, 7], lessonCount: 4 },
  { unitNumber: 3, unitName: 'An Expanding Nation', lessonNumbers: [8, 9, 10], lessonCount: 3 },
  { unitNumber: 4, unitName: 'Americans in the Mid-1800s', lessonNumbers: [11, 12, 13], lessonCount: 3 },
  { unitNumber: 5, unitName: 'The Union Challenged', lessonNumbers: [14, 15, 16], lessonCount: 3 },
  { unitNumber: 6, unitName: 'An Industrial Society', lessonNumbers: [17, 18, 19], lessonCount: 3 },
  { unitNumber: 7, unitName: 'The United States Becomes a World Power', lessonNumbers: [20, 21, 22, 23], lessonCount: 4 },
  { unitNumber: 8, unitName: 'The Roaring Twenties and the Great Depression', lessonNumbers: [24, 25, 26, 27, 28], lessonCount: 5 },
  { unitNumber: 9, unitName: 'World War II and the Cold War', lessonNumbers: [29, 30, 31, 32, 33], lessonCount: 5 },
  { unitNumber: 10, unitName: 'The Civil Rights Movement and Modern America', lessonNumbers: [34, 35, 36], lessonCount: 3 },
];

/**
 * Through Industrialism curriculum structure (7th grade US History)
 * 10 units, 36 lessons total
 */
const THROUGH_INDUSTRIALISM_STRUCTURE: LessonMapping[] = [
  { unitNumber: 1, unitName: 'Settling the Americas', lessonNumbers: [1, 2, 3], lessonCount: 3 },
  { unitNumber: 2, unitName: 'European Exploration and Settlement', lessonNumbers: [4, 5, 6, 7], lessonCount: 4 },
  { unitNumber: 3, unitName: 'The English Colonies', lessonNumbers: [8, 9, 10], lessonCount: 3 },
  { unitNumber: 4, unitName: 'Life in the Colonies', lessonNumbers: [11, 12, 13], lessonCount: 3 },
  { unitNumber: 5, unitName: 'Toward Independence', lessonNumbers: [14, 15, 16], lessonCount: 3 },
  { unitNumber: 6, unitName: 'The American Revolution', lessonNumbers: [17, 18, 19], lessonCount: 3 },
  { unitNumber: 7, unitName: 'Creating the Constitution', lessonNumbers: [20, 21, 22, 23], lessonCount: 4 },
  { unitNumber: 8, unitName: 'Political Developments in the Early Republic', lessonNumbers: [24, 25, 26, 27, 28], lessonCount: 5 },
  { unitNumber: 9, unitName: 'A Growing Sense of Nationhood', lessonNumbers: [29, 30, 31, 32, 33], lessonCount: 5 },
  { unitNumber: 10, unitName: 'An Age of Reform', lessonNumbers: [34, 35, 36], lessonCount: 3 },
];

/**
 * The World Through 1750 curriculum structure (World History)
 * 10 units, 36 lessons total
 */
const WORLD_THROUGH_1750_STRUCTURE: LessonMapping[] = [
  { unitNumber: 1, unitName: 'Early Humans', lessonNumbers: [1, 2, 3], lessonCount: 3 },
  { unitNumber: 2, unitName: 'Ancient Mesopotamia', lessonNumbers: [4, 5, 6], lessonCount: 3 },
  { unitNumber: 3, unitName: 'Ancient Egypt', lessonNumbers: [7, 8, 9], lessonCount: 3 },
  { unitNumber: 4, unitName: 'Ancient India', lessonNumbers: [10, 11, 12], lessonCount: 3 },
  { unitNumber: 5, unitName: 'Ancient China', lessonNumbers: [13, 14, 15], lessonCount: 3 },
  { unitNumber: 6, unitName: 'Ancient Greece', lessonNumbers: [16, 17, 18, 19], lessonCount: 4 },
  { unitNumber: 7, unitName: 'Ancient Rome', lessonNumbers: [20, 21, 22, 23, 24], lessonCount: 5 },
  { unitNumber: 8, unitName: 'The Byzantine Empire and Medieval Europe', lessonNumbers: [25, 26, 27, 28, 29], lessonCount: 5 },
  { unitNumber: 9, unitName: 'Islam and African Civilizations', lessonNumbers: [30, 31, 32, 33], lessonCount: 4 },
  { unitNumber: 10, unitName: 'Empires and Cultures of Asia', lessonNumbers: [34, 35, 36], lessonCount: 3 },
];

// ============================================================================
// PATTERN GENERATOR
// ============================================================================

/**
 * Generate Social Studies curriculum component placements based on user options
 *
 * UPDATE (Oct 25, 2025): Implements self-paced unit pattern.
 * Places ONE component per unit (metadata.is_multi handles expansion to individual lessons).
 * Duration is already set in template (lesson_count + 1 buffer day).
 * Separate Flex Day component placed after each unit.
 *
 * @param options - Social Studies configuration options
 * @param blockedDates - Set of blocked curriculum dates to skip
 * @returns Array of component placements
 */
export function generateSocialStudiesComponents(
  options: SocialStudiesOptions,
  blockedDates: Set<string> = new Set()
): ComponentPlacement[] {
  const components: ComponentPlacement[] = [];
  let currentDate = options.startDate;

  // ========================================================================
  // COMMON OPENING COMPONENTS (All Subjects)
  // ========================================================================

  // Star Academy Welcome Video (1 day)
  components.push({
    component_key: 'ss_welcome_video',
    start_date: currentDate,
    duration_days: 1,
    title_override: null
  });
  currentDate = addSchoolDays(currentDate, 1, blockedDates);

  // Establish Rules & Procedures (1 day)
  components.push({
    component_key: 'ss_rules_procedures',
    start_date: currentDate,
    duration_days: 1,
    title_override: null
  });
  currentDate = addSchoolDays(currentDate, 1, blockedDates);

  // Get curriculum structure for estimating duration
  let curriculumStructure: LessonMapping[];
  if (options.curriculum === 'through_modern_times') {
    curriculumStructure = THROUGH_MODERN_TIMES_STRUCTURE;
  } else if (options.curriculum === 'through_industrialism') {
    curriculumStructure = THROUGH_INDUSTRIALISM_STRUCTURE;
  } else {
    curriculumStructure = WORLD_THROUGH_1750_STRUCTURE;
  }

  // Get curriculum abbreviation for component keys
  const curriculumAbbrev = getCurriculumAbbreviation(options.curriculum);

  // ========================================================================
  // OPENING SEQUENCE (Optional)
  // ========================================================================

  // Note: Team Building component doesn't exist in database - skipping
  // If needed, user can manually add team building from base calendar
  // if (options.includeTeamBuilding) {
  //   components.push({
  //     component_key: 'ss_team_building',
  //     start_date: currentDate,
  //     duration_days: 2,
  //     title_override: null
  //   });
  //   currentDate = addSchoolDays(currentDate, 2, blockedDates);
  // }

  // ========================================================================
  // SELF-PACED UNIT PATTERN
  // ========================================================================

  for (const unitNumber of options.units) {
    const unit = curriculumStructure.find((u) => u.unitNumber === unitNumber);
    if (!unit) continue;

    // Calculate unit duration: lesson_count + 1 buffer day
    const unitDuration = unit.lessonCount + 1;

    // Place ONE component for the entire unit
    // The component's metadata.is_multi will handle expansion to individual lessons
    components.push({
      component_key: `ss_${curriculumAbbrev}_unit${unitNumber}`,
      start_date: currentDate,
      duration_days: unitDuration,
      title_override: null // Use template's metadata.is_multi titles
    });
    currentDate = addSchoolDays(currentDate, unitDuration, blockedDates);

    // Place Flex Day component after the unit
    components.push({
      component_key: 'ss_flex_day',
      start_date: currentDate,
      duration_days: 1,
      title_override: null
    });
    currentDate = addSchoolDays(currentDate, 1, blockedDates);
  }

  return components;
}

/**
 * Get curriculum abbreviation for component keys
 *
 * @param curriculum - Full curriculum identifier
 * @returns Abbreviated curriculum key
 */
function getCurriculumAbbreviation(
  curriculum: 'through_industrialism' | 'through_modern_times' | 'world_through_1750'
): string {
  if (curriculum === 'through_industrialism') {
    return 'industrialism';
  } else if (curriculum === 'through_modern_times') {
    return 'modern';
  } else {
    return 'world1750';
  }
}

/**
 * Calculate estimated number of curriculum days for Social Studies
 *
 * UPDATE (Oct 25, 2025): Updated for self-paced unit pattern.
 * Each unit = lesson_count + 1 buffer day + 1 Flex Day
 *
 * @param options - Social Studies configuration options
 * @returns Estimated number of days
 */
export function estimateSocialStudiesDays(options: SocialStudiesOptions): number {
  let days = 0;

  // Opening sequence
  // Note: Team Building component doesn't exist in database
  // if (options.includeTeamBuilding) days += 2;

  // Get curriculum structure
  let curriculumStructure: LessonMapping[];
  if (options.curriculum === 'through_modern_times') {
    curriculumStructure = THROUGH_MODERN_TIMES_STRUCTURE;
  } else if (options.curriculum === 'through_industrialism') {
    curriculumStructure = THROUGH_INDUSTRIALISM_STRUCTURE;
  } else {
    curriculumStructure = WORLD_THROUGH_1750_STRUCTURE;
  }

  // Calculate days for each selected unit
  for (const unitNumber of options.units) {
    const unit = curriculumStructure.find((u) => u.unitNumber === unitNumber);
    if (unit) {
      // Unit duration: lesson_count + 1 buffer day
      days += unit.lessonCount + 1;
      // Plus Flex Day after each unit
      days += 1;
    }
  }

  return days;
}

/**
 * Get default Social Studies options with common settings
 *
 * UPDATE (Oct 25, 2025): Removed obsolete options (daysPerLesson, quizzes, etc.).
 * Units are now self-paced with Flex Days automatically included.
 *
 * @param startDate - Start date for Social Studies curriculum
 * @param curriculum - Curriculum to use
 * @returns Default Social Studies options
 */
export function getDefaultSocialStudiesOptions(
  startDate: string,
  curriculum: 'through_industrialism' | 'through_modern_times' | 'world_through_1750' = 'through_modern_times'
): SocialStudiesOptions {
  return {
    enabled: false,
    startDate,
    curriculum,
    units: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // All units by default
    includeTeamBuilding: true
  };
}

/**
 * Get curriculum structure for a given curriculum
 *
 * @param curriculum - Curriculum identifier
 * @returns Curriculum structure
 */
export function getCurriculumStructure(
  curriculum: 'through_industrialism' | 'through_modern_times' | 'world_through_1750'
): LessonMapping[] {
  if (curriculum === 'through_modern_times') {
    return THROUGH_MODERN_TIMES_STRUCTURE;
  } else if (curriculum === 'through_industrialism') {
    return THROUGH_INDUSTRIALISM_STRUCTURE;
  } else {
    return WORLD_THROUGH_1750_STRUCTURE;
  }
}
