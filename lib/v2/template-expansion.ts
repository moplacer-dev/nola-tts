/**
 * Template Expansion Utility for V2 System
 *
 * Converts component templates into scheduled items based on expansion_type.
 * This is the core of the V2 system - NO subject-specific logic here.
 * All behavior is driven by the template's expansion_config.
 */

import { ComponentTemplate, ScheduledItemInput, ScheduledItemMetadata, CalendarType } from '@/types/v2';
import { addSchoolDays } from '@/lib/auto-populate/helpers';
import { randomUUID } from 'crypto';

/**
 * Format a Date object to YYYY-MM-DD string
 */
function formatDateForDB(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Main expansion function - routes to appropriate expansion handler
 *
 * NO SUBJECT-SPECIFIC LOGIC HERE - Just reads expansion_type and delegates
 */
export function expandTemplate(
  template: ComponentTemplate,
  startDate: string, // YYYY-MM-DD
  placementGroupId: string,
  blockedDates: Set<string>,
  guideId: string,
  calendarType: string,
  metadata?: ScheduledItemMetadata
): ScheduledItemInput[] {
  switch (template.expansion_type) {
    case 'single':
      return expandSingle(template, startDate, placementGroupId, guideId, calendarType, metadata);

    case 'multi_sequence':
      return expandMultiSequence(template, startDate, placementGroupId, blockedDates, guideId, calendarType, metadata);

    case 'multi_rotation':
      return expandMultiRotation(template, startDate, placementGroupId, blockedDates, guideId, calendarType, metadata);

    case 'multi_grouped':
      return expandMultiGrouped(template, startDate, placementGroupId, blockedDates, guideId, calendarType, metadata);

    default:
      throw new Error(`Unknown expansion type: ${template.expansion_type}`);
  }
}

/**
 * Expand 'single' type - Creates one 1-day item
 * Used for: Flex days, holidays, single-day events
 */
function expandSingle(
  template: ComponentTemplate,
  startDate: string,
  placementGroupId: string,
  guideId: string,
  calendarType: string,
  metadata?: ScheduledItemMetadata
): ScheduledItemInput[] {
  return [{
    guide_id: guideId,
    calendar_type: calendarType as CalendarType,
    template_id: template.id,
    component_key: template.component_key,
    start_date: startDate,
    duration_days: template.default_duration_days,
    placement_group_id: placementGroupId,
    group_index: 0,
    source: 'library',
    metadata: metadata || {},
    blocks_curriculum: template.default_blocks_curriculum || false
  }];
}

/**
 * Expand 'multi_sequence' type - Creates sequential items with specific titles
 * Used for: Social Studies units (Setting the Stage → Lesson 1 → Lesson 2, etc.)
 */
function expandMultiSequence(
  template: ComponentTemplate,
  startDate: string,
  placementGroupId: string,
  blockedDates: Set<string>,
  guideId: string,
  calendarType: string,
  metadata?: ScheduledItemMetadata
): ScheduledItemInput[] {
  const items: ScheduledItemInput[] = [];
  const config = template.expansion_config;

  if (!config.items || config.items.length === 0) {
    throw new Error(`multi_sequence template ${template.component_key} has no items in expansion_config`);
  }

  let currentDate = startDate;

  config.items.forEach((item, index) => {
    // For each item, add 'days' worth of scheduled items
    for (let d = 0; d < item.days; d++) {
      items.push({
        guide_id: guideId,
        calendar_type: calendarType as CalendarType,
        template_id: template.id,
        component_key: template.component_key,
        start_date: currentDate,
        duration_days: 1, // Always 1-day atomic items
        placement_group_id: placementGroupId,
        group_index: items.length, // 0, 1, 2, 3, ...
        source: 'library',
        title_override: item.title,
        metadata: metadata || {},
        blocks_curriculum: false
      });

      // Move to next school day (skip weekends and blocked dates)
      currentDate = addSchoolDays(currentDate, 1, blockedDates);
    }
  });

  return items;
}

/**
 * Expand 'multi_rotation' type - Creates rotation sessions with numbered pattern
 * Used for: Science Module Rotations (R1, S1 → R1, S2 → ... → R1, S7)
 */
function expandMultiRotation(
  template: ComponentTemplate,
  startDate: string,
  placementGroupId: string,
  blockedDates: Set<string>,
  guideId: string,
  calendarType: string,
  metadata?: ScheduledItemMetadata
): ScheduledItemInput[] {
  const items: ScheduledItemInput[] = [];
  const config = template.expansion_config;

  if (!config.sessions || !config.title_pattern) {
    throw new Error(`multi_rotation template ${template.component_key} missing sessions or title_pattern`);
  }

  const rotationNumber = metadata?.rotation_number || 1;
  let currentDate = startDate;

  for (let session = 1; session <= config.sessions; session++) {
    // Replace {session} placeholder but KEEP {rotation} for dynamic substitution
    // Examples: "R{rotation}, S{session}" → "R{rotation}, S3"
    // This allows rotation_number to be changed later without re-creating items
    let title = config.title_pattern
      .replace('{session}', session.toString()); // Only replace session, not rotation!

    items.push({
      guide_id: guideId,
      calendar_type: calendarType as CalendarType,
      template_id: template.id,
      component_key: template.component_key,
      start_date: currentDate,
      duration_days: 1, // Always 1-day atomic items
      placement_group_id: placementGroupId,
      group_index: session - 1, // 0-indexed: 0, 1, 2, ...
      source: 'library',
      title_override: title,
      metadata: { ...metadata, rotation_number: rotationNumber },
      blocks_curriculum: false
    });

    // Move to next school day
    currentDate = addSchoolDays(currentDate, 1, blockedDates);
  }

  return items;
}

/**
 * Expand 'multi_grouped' type - Creates grouped items with optional repeats
 * Used for: ELA units, Math IPL units
 */
function expandMultiGrouped(
  template: ComponentTemplate,
  startDate: string,
  placementGroupId: string,
  blockedDates: Set<string>,
  guideId: string,
  calendarType: string,
  metadata?: ScheduledItemMetadata
): ScheduledItemInput[] {
  const items: ScheduledItemInput[] = [];
  const config = template.expansion_config;

  if (!config.items || config.items.length === 0) {
    throw new Error(`multi_grouped template ${template.component_key} has no items in expansion_config`);
  }

  let currentDate = startDate;

  config.items.forEach((item) => {
    const repeatCount = item.repeat || 1;

    // Create 'days' worth of items, repeated 'repeat' times
    for (let r = 0; r < repeatCount; r++) {
      for (let d = 0; d < item.days; d++) {
        items.push({
          guide_id: guideId,
          calendar_type: calendarType as CalendarType,
          template_id: template.id,
          component_key: template.component_key,
          start_date: currentDate,
          duration_days: 1, // Always 1-day atomic items
          placement_group_id: placementGroupId,
          group_index: items.length, // 0, 1, 2, 3, ...
          source: 'library',
          title_override: item.title,
          metadata: metadata || {},
          blocks_curriculum: false
        });

        // Move to next school day
        currentDate = addSchoolDays(currentDate, 1, blockedDates);
      }
    }
  });

  return items;
}

/**
 * Generate a new UUID for placement groups
 */
export function generatePlacementGroupId(): string {
  return randomUUID();
}
