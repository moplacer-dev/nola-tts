/**
 * Auto-Populate Feature - Shared TypeScript Types
 *
 * This file defines all TypeScript interfaces and types used across the auto-populate feature.
 * These types are validated against real school pacing guides from 8 schools.
 */

// ============================================================================
// COMPONENT PLACEMENT
// ============================================================================

/**
 * Represents a single component to be placed on the calendar
 */
export interface ComponentPlacement {
  component_key: string;
  start_date: string;
  duration_days: number;
  title_override?: string | null;
}

// ============================================================================
// SCIENCE AUTO-POPULATE
// ============================================================================

/**
 * Science auto-populate configuration
 * Pattern validated across Anderson Middle, Catahoula, Lakeside, Morgan Village, Example Guide
 * Confidence: 100% - Zero variation across 6 schools
 */
export interface ScienceOptions {
  enabled: boolean;
  startDate: string;
  rotationCount: 5 | 10;
  includeBenchmark: boolean;
  includeBlendedScience: boolean;
  includeModuleOrientation: boolean;
  blendedSciencePlacement: 'beginning' | 'mid-year' | 'end-year';
  assessmentType: 'pear' | 'edulastic' | 'both';
}

// ============================================================================
// SOCIAL STUDIES AUTO-POPULATE
// ============================================================================

/**
 * Social Studies auto-populate configuration
 * Pattern validated across Anderson Middle, BC, Catahoula, Lakeside, Morgan Village
 * Confidence: 100% - Perfect pattern match across 5 schools
 *
 * UPDATE (Oct 25, 2025): Units are self-paced blocks, not day-by-day scheduling.
 * Each unit is ONE component with duration from template (lesson_count + 1 buffer day).
 * Flex Days are separate components placed after each unit.
 */
export interface SocialStudiesOptions {
  enabled: boolean;
  startDate: string;
  curriculum: 'through_industrialism' | 'through_modern_times' | 'world_through_1750';
  units: number[]; // Array of unit numbers (1-10)
  includeTeamBuilding: boolean;
}

/**
 * Social Studies curriculum unit structure
 */
export interface LessonMapping {
  unitNumber: number;
  unitName: string;
  lessonNumbers: number[]; // Array of lesson numbers in this unit
  lessonCount: number;
}

// ============================================================================
// MATH AUTO-POPULATE
// ============================================================================

/**
 * Math auto-populate configuration
 * Pattern validated across 7 schools with TWO valid sequence options
 * Confidence: 95% - Two valid sequence options confirmed
 *
 * UPDATE (Oct 25, 2025): Removed diagnosticPlacement option.
 * Math Module Rotation templates now have metadata.is_multi with diagnostics built-in.
 * Default sequence set to 'ipl_first' (IPL → Rotations).
 */
export interface MathOptions {
  enabled: boolean;
  startDate: string;
  sequence: 'ipl_first' | 'rotations_first'; // User chooses sequence
  selectedIPLs: string[]; // Array of IPL component_keys
  rotationCount: number; // 0-10
  includeIPLOrientation: boolean;
  includeIPLWholeClass: boolean;
  includeSTEPSPlacement: boolean;
  includeBenchmark: boolean;
  includeMathConnections: boolean;
}

/**
 * IPL lesson pairing mapping
 */
export interface IPLLessonCount {
  [key: string]: number; // component_key -> number of days
}

// ============================================================================
// ELA AUTO-POPULATE
// ============================================================================

/**
 * ELA auto-populate configuration
 * Pattern validated across Lakeside, Morgan Village
 * Confidence: 100% - Clear TT/WW pattern from previous analysis
 *
 * UPDATE (Oct 25, 2025): Replaced lessonBlockCount with unit/lesson structure.
 * TT/WW blocks are organized by Units and Lessons (e.g., Unit 1 Lesson 1, Unit 1 Lesson 2...).
 * Supports both 1-day and 2-day blocks via daysPerLesson setting.
 * Implementation uses direct SQL INSERTs with group_id (bypasses multi-component for safety).
 */
export interface ELAOptions {
  enabled: boolean;
  startDate: string;
  numberOfUnits: number;        // Number of units (default: 10)
  lessonsPerUnit: number;       // Lessons per unit (default: 10)
  daysPerLesson: number;        // 1 or 2 days per lesson (default: 2)
  includeStartup: boolean;
  includePARAssessment: boolean;
  includeTOSCRF: boolean;
  includeTWS5: boolean;
  includeMakeUpReadingScape: boolean;
  includeBenchmarkGrouping: boolean;
  includeMOYAssessment: boolean; // Mid-of-year
  includeEOYAssessment: boolean; // End-of-year
}

// ============================================================================
// AUTO-POPULATE REQUEST/RESPONSE
// ============================================================================

/**
 * Full auto-populate request containing all subject configurations
 */
export interface AutoPopulateRequest {
  science?: ScienceOptions;
  socialStudies?: SocialStudiesOptions;
  math?: MathOptions;
  ela?: ELAOptions;
}

/**
 * Auto-populate response with placement counts and errors
 */
export interface AutoPopulateResponse {
  success: boolean;
  placedComponents: {
    science: number;
    socialStudies: number;
    math: number;
    ela: number;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Result from a single subject's auto-populate operation
 */
export interface SubjectAutoPopulateResult {
  success: boolean;
  componentCount: number;
  error?: string;
  warning?: string;
}
