/**
 * TypeScript Type Definitions for V2 System
 *
 * These types correspond to the V2 database schema (component_templates_v2, scheduled_items_v2)
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export type Subject = 'base' | 'ela' | 'math' | 'science' | 'social_studies';
export type CalendarType = Subject; // Same as Subject
export type ExpansionType = 'single' | 'multi_sequence' | 'multi_rotation' | 'multi_grouped';
export type MoveBehavior = 'independent' | 'grouped';
export type ItemSource = 'library' | 'pdf_extraction' | 'custom' | 'paste';

// ============================================================================
// Component Template Types
// ============================================================================

/**
 * Expansion configuration for different component types
 */
export interface ExpansionConfig {
  // For multi_rotation
  sessions?: number;
  title_pattern?: string;

  // For multi_sequence and multi_grouped
  items?: Array<{
    title: string;
    days: number;
    repeat?: number; // Used in multi_grouped
  }>;
}

/**
 * Component template from database (component_templates_v2)
 */
export interface ComponentTemplate {
  id: string;
  component_key: string;
  subject: Subject;
  display_name: string;
  description: string | null;
  color: string;
  default_duration_days: number;
  expansion_type: ExpansionType;
  expansion_config: ExpansionConfig;
  metadata_fields: string[]; // e.g., ['rotation_number', 'unit_number']
  default_blocks_curriculum: boolean | null;
  move_behavior: MoveBehavior;
  category: string | null;
  tags: string[] | null;
  is_system: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Scheduled Item Types
// ============================================================================

/**
 * Metadata that can be stored with scheduled items
 */
export interface ScheduledItemMetadata {
  rotation_number?: number;
  unit_number?: number;
  lesson_number?: number;
  standard_code?: string;
  // Legacy field (deprecated - now uses unit_number)
  blended_science_unit?: number;
  [key: string]: any; // Allow other subject-specific fields
}

/**
 * Scheduled item from database (scheduled_items_v2)
 */
export interface ScheduledItem {
  id: string;
  guide_id: string;
  calendar_type: CalendarType;
  template_id: string | null;
  component_key: string | null;
  start_date: string; // YYYY-MM-DD format
  duration_days: number;
  display_order: number;
  placement_group_id: string | null;
  group_index: number | null;
  blocks_curriculum: boolean;
  title_override: string | null;
  color_override: string | null;
  metadata: ScheduledItemMetadata;
  notes: string | null;
  source: ItemSource;
  created_at: Date;
  updated_at: Date;
}

/**
 * Input for creating scheduled items (used by template expansion)
 */
export interface ScheduledItemInput {
  guide_id: string;
  calendar_type: CalendarType;
  template_id: string;
  component_key: string;
  start_date: string; // YYYY-MM-DD format
  duration_days: number;
  placement_group_id: string;
  group_index: number;
  source: ItemSource;
  title_override?: string;
  metadata?: ScheduledItemMetadata;
  blocks_curriculum?: boolean;
}

/**
 * Scheduled item with template details (from JOIN query)
 */
export interface ScheduledItemWithTemplate extends ScheduledItem {
  // Template fields (from LEFT JOIN)
  display_name?: string;
  color?: string;
  expansion_type?: ExpansionType;
  metadata_fields?: string[];
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request body for POST /api/v2/scheduled-items
 */
export interface CreateScheduledItemsRequest {
  guide_id: string;
  calendar_type: CalendarType;
  template_id: string;
  start_date: string; // YYYY-MM-DD
  metadata?: ScheduledItemMetadata; // Optional metadata for items (rotation_number, etc.)
  placement_group_id?: string; // Optional: specify group ID for duplicates (Extend feature)
}

/**
 * Response for POST /api/v2/scheduled-items
 */
export interface CreateScheduledItemsResponse {
  success: boolean;
  items: ScheduledItem[];
  count: number;
}

/**
 * Response for GET /api/v2/scheduled-items
 */
export interface GetScheduledItemsResponse {
  items: ScheduledItemWithTemplate[];
  count: number;
}

/**
 * Response for GET /api/v2/component-templates
 */
export interface GetComponentTemplatesResponse {
  templates: ComponentTemplate[];
  count: number;
}

/**
 * Request body for PATCH /api/v2/scheduled-items/[id]
 */
export interface UpdateScheduledItemRequest {
  start_date?: string; // YYYY-MM-DD
  title_override?: string;
  color_override?: string;
  metadata?: ScheduledItemMetadata;
  notes?: string;
  display_order?: number;
}

/**
 * Response for single item operations (GET, PATCH, DELETE)
 */
export interface ScheduledItemResponse {
  success: boolean;
  item?: ScheduledItem;
  message?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Blocked dates set (for skipping weekends and curriculum-blocking events)
 */
export type BlockedDatesSet = Set<string>; // Set of YYYY-MM-DD strings

/**
 * Placement group (multiple items placed together)
 */
export interface PlacementGroup {
  placement_group_id: string;
  items: ScheduledItem[];
}

// ============================================================================
// Error Types
// ============================================================================

export interface APIError {
  error: string;
  details?: any;
}
