import { format, formatDistanceToNow, isPast, isToday, isTomorrow, isThisWeek, isThisYear } from 'date-fns';

/**
 * Format a date for display in a compact format
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy');
}

/**
 * Format a date for display in a short format
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatShortDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d');
}

/**
 * Format a date and time for display
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy HH:mm');
}

/**
 * Format a time for display
 * @param date - Date string or Date object
 * @returns Formatted time string
 */
export function formatTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'HH:mm');
}

/**
 * Format a date with relative time (e.g., "2 hours ago")
 * @param date - Date string or Date object
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format a date with smart context (Today, Tomorrow, etc.)
 * @param date - Date string or Date object
 * @returns Formatted date with context
 */
export function formatSmartDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'HH:mm')}`;
  } else if (isTomorrow(dateObj)) {
    return `Tomorrow at ${format(dateObj, 'HH:mm')}`;
  } else if (isThisWeek(dateObj)) {
    return format(dateObj, 'EEEE at HH:mm');
  } else if (isThisYear(dateObj)) {
    return format(dateObj, 'MMM d at HH:mm');
  } else {
    return format(dateObj, 'MMM d, yyyy at HH:mm');
  }
}

/**
 * Check if a date is overdue
 * @param date - Date string or Date object
 * @returns True if the date is in the past
 */
export function isOverdue(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isPast(dateObj);
}

/**
 * Get a human-readable status for a date
 * @param date - Date string or Date object
 * @returns Status string
 */
export function getDateStatus(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return 'Today';
  } else if (isTomorrow(dateObj)) {
    return 'Tomorrow';
  } else if (isPast(dateObj)) {
    return 'Overdue';
  } else {
    return formatRelativeTime(dateObj);
  }
}
