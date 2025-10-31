/**
 * Auto-Populate Feature - Helper Utilities
 *
 * Shared utility functions for date manipulation and validation.
 * These helpers are used across all subject-specific pattern generators.
 */

/**
 * Add school days to a date, skipping weekends and blocked curriculum dates
 *
 * IMPORTANT: Uses local timezone to avoid UTC parsing issues
 *
 * @param startDateString - Starting date in YYYY-MM-DD format
 * @param daysToAdd - Number of school days to add
 * @param blockedDates - Set of blocked dates in YYYY-MM-DD format to skip
 * @returns New date string in YYYY-MM-DD format
 */
export function addSchoolDays(
  startDateString: string,
  daysToAdd: number,
  blockedDates: Set<string> = new Set()
): string {
  // Parse as local date (YYYY-MM-DD)
  const [year, month, day] = startDateString.split('-').map(Number);
  const result = new Date(year, month - 1, day); // month is 0-indexed

  let daysRemaining = daysToAdd;

  // Keep moving forward until we've added the correct number of school days
  while (daysRemaining > 0) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    const dateString = `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`;

    // Check if this is a weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    // Check if this date is blocked by a calendar event
    if (blockedDates.has(dateString)) {
      continue;
    }

    // This is a valid school day
    daysRemaining--;
  }

  const outputDate = `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`;
  return outputDate;
}

/**
 * Validate that a date string is in valid YYYY-MM-DD format
 *
 * @param dateString - Date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Check if a date falls on a weekend
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns true if weekend, false otherwise
 */
export function isWeekend(dateString: string): boolean {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Calculate the number of school days between two dates (excluding weekends and blocked dates)
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @param blockedDates - Set of blocked dates to exclude
 * @returns Number of school days
 */
export function countSchoolDays(
  startDate: string,
  endDate: string,
  blockedDates: Set<string> = new Set()
): number {
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateString = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;

    // Count if not weekend and not blocked
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !blockedDates.has(dateString)) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Format a date string for display
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "January 15, 2025")
 */
export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get the day of week for a date
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay();
}

/**
 * Get the day name for a date
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Day name (e.g., "Monday")
 */
export function getDayName(dateString: string): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[getDayOfWeek(dateString)];
}
