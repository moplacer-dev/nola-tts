// Horizontal Lesson Plan TypeScript Interfaces
// Database models and API response types

// ============================================
// DATABASE MODELS (matches PostgreSQL schema)
// ============================================

/**
 * Module Template (hlp_module_templates table)
 * Pre-populated Star Academy curriculum modules
 */
export interface ModuleTemplate {
  id: string;
  module_name: string;
  subject: string | null;
  grade_level: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Template Session (hlp_template_sessions table)
 * Session data for module templates (7 per module)
 */
export interface TemplateSession {
  id: string;
  template_id: string;
  session_number: number;  // 1-7
  focus: string | null;
  objectives: string | null;
  materials: string | null;
  teacher_prep: string | null;
  assessments: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Template Enrichment (hlp_template_enrichments table)
 * Enrichment activities for module templates
 */
export interface TemplateEnrichment {
  id: string;
  template_id: string;
  enrichment_number: number;
  title: string;
  description: string;
  created_at: Date;
}

/**
 * Horizontal Lesson Plan (horizontal_lesson_plans table)
 * User-created HLP documents
 */
export interface HorizontalLessonPlan {
  id: string;
  user_id: string;
  school_name: string;
  teacher_name: string;
  school_year: string;
  subject: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Selected Module (hlp_selected_modules table)
 * Join table linking HLPs to selected module templates
 */
export interface SelectedModule {
  id: string;
  hlp_id: string;
  template_id: string;
  module_number: number;  // 1-10
  created_at: Date;
}

// ============================================
// API REQUEST TYPES
// ============================================

/**
 * Request body for creating a new HLP
 */
export interface CreateHLPRequest {
  school_name: string;
  teacher_name: string;
  school_year: string;
  subject: string;
  selected_module_ids: string[];  // Up to 10 module template IDs
}

/**
 * Query parameters for fetching module library
 */
export interface ModuleLibraryQuery {
  subject?: string;
  grade_level?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Module template with counts (for library display)
 */
export interface ModuleTemplateWithCounts extends ModuleTemplate {
  session_count: number;
  enrichment_count: number;
}

/**
 * HLP with module count and names (for list display)
 */
export interface HLPListItem {
  id: string;
  school_name: string;
  teacher_name: string;
  school_year: string;
  subject: string;
  module_count: number;
  module_names: string[];
  created_at: Date;
}

/**
 * Complete HLP details with all selected modules and their data
 */
export interface HLPDetails {
  hlp: HorizontalLessonPlan;
  modules: ModuleWithData[];
}

/**
 * Module template with all sessions and enrichments
 */
export interface ModuleWithData {
  template: ModuleTemplate;
  module_number: number;  // Position 1-10 in HLP
  sessions: TemplateSession[];  // Ordered by session_number
  enrichments: TemplateEnrichment[];  // Ordered by enrichment_number
}

/**
 * Module library API response
 */
export interface ModuleLibraryResponse {
  modules: ModuleTemplateWithCounts[];
}

/**
 * HLP list API response
 */
export interface HLPListResponse {
  hlps: HLPListItem[];
}

/**
 * Create HLP API response
 */
export interface CreateHLPResponse {
  hlp: HorizontalLessonPlan;
  selected_modules: SelectedModule[];
}

// ============================================
// DOCX GENERATION TYPES
// ============================================

/**
 * Data structure for DOCX generation
 */
export interface DOCXGenerationData {
  hlp: HorizontalLessonPlan;
  modules: ModuleWithData[];
}

/**
 * Formatted enrichment text for DOCX table
 */
export interface FormattedEnrichment {
  module_number: number;
  formatted_text: string;  // "1. Title: Description\n\n2. Title: Description"
}

/**
 * Table cell data for DOCX builder
 */
export interface TableCellData {
  text: string;
  is_header?: boolean;
  is_label?: boolean;
  bold?: boolean;
  font?: string;
  fontSize?: number;
  backgroundColor?: string;
  textColor?: string;
}

/**
 * Table row data for DOCX builder
 */
export interface TableRowData {
  cells: TableCellData[];
  height?: number;  // Row height in inches
}

// ============================================
// VALIDATION TYPES
// ============================================

/**
 * Validation errors
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================
// CONSTANTS
// ============================================

/**
 * DOCX formatting constants
 */
export const DOCX_CONSTANTS = {
  MAX_MODULES: 10,
  SESSIONS_PER_MODULE: 7,
  COLUMN_WIDTH_LABEL: 1.2,  // inches
  COLUMN_WIDTH_MODULE: 2.0,  // inches
  HEADER_ROW_HEIGHT: 0.3,  // inches

  COLORS: {
    DARK_BLUE: '13205A',
    LIGHT_GREY: 'D9D9D9',
    WHITE_TEXT: 'FFFFFF',
    WHITE_BG: 'FFFFFF',
  },

  FONTS: {
    HEADER: 'Rockwell',
    DATA: 'Times New Roman',
  },

  FONT_SIZES: {
    MAIN_HEADER: 11,
    SESSION_HEADER: 9,
    LABEL: 8,
    DATA: 8,
  },

  CELL_MARGINS: {
    TOP: 0.02,     // inches
    BOTTOM: 0.02,  // inches
    LEFT: 0.05,    // inches
    RIGHT: 0.05,   // inches
  },
} as const;

/**
 * Table label constants
 */
export const TABLE_LABELS = {
  MODULE_SECTION: 'Module:\nSection',
  FOCUS: 'Focus',
  GOALS: 'Goals',
  MATERIAL_LIST: 'Material\nList',
  TEACHER_PREP: 'Teacher\nPrep',
  PBA: 'PBA',
  ACTIVITIES: 'Activities',
} as const;
