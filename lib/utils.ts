/**
 * Utility functions for the application
 */

/**
 * Combines class names, filtering out falsy values
 * Simple alternative to clsx/classnames without external dependencies
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
