/**
 * Utility functions for the Chess Stats Platform
 * Includes class name merging, date formatting, and common helpers
 */

// ============================================================================
// Class Name Utilities
// ============================================================================

/**
 * Merges class names conditionally
 * Similar to clsx/classnames but lightweight
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ============================================================================
// Date Formatting Utilities
// ============================================================================

/**
 * Format date to readable string
 * @param date - Date object or ISO string
 * @param format - 'short' | 'long' | 'relative'
 */
export function formatDate(
  date: Date | string,
  format: "short" | "long" | "relative" = "short"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (format === "relative") {
    return getRelativeTime(dateObj);
  }

  const options: Intl.DateTimeFormatOptions =
    format === "long"
      ? { year: "numeric", month: "long", day: "numeric" }
      : { year: "numeric", month: "short", day: "numeric" };

  return dateObj.toLocaleDateString("en-US", options);
}

/**
 * Get relative time string (e.g., "2h ago", "3d ago")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${diffYear}y ago`;
}

/**
 * Format date range (e.g., "Oct 15-17" or "Oct 15")
 * Does not display year
 */
export function formatDateRange(
  startDate: Date | string,
  endDate: Date | string
): string {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  const isSameDay = start.toDateString() === end.toDateString();
  if (isSameDay) {
    return start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  const isSameMonth = start.getMonth() === end.getMonth();

  if (isSameMonth) {
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.getDate()}`;
  }

  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

// ============================================================================
// Number Formatting Utilities
// ============================================================================

/**
 * Format number with commas (e.g., 1000 -> "1,000")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

/**
 * Format currency (e.g., 1000 -> "$1,000")
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format compact number (e.g., 1500 -> "1.5K")
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}

// ============================================================================
// Chess Specific Utilities
// ============================================================================

/**
 * Calculate win rate percentage
 */
export function calculateWinRate(wins: number, draws: number, losses: number): number {
  const total = wins + draws + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

/**
 * Format game record (e.g., "W-D-L: 10-5-2")
 */
export function formatGameRecord(wins: number, draws: number, losses: number): string {
  return `${wins}-${draws}-${losses}`;
}

/**
 * Get platform display name
 */
export function getPlatformName(platform: string): string {
  const platformNames: Record<string, string> = {
    "chess-com": "Chess.com",
    lichess: "Lichess",
    fide: "FIDE",
  };
  return platformNames[platform] || platform;
}

/**
 * Get format display name
 */
export function getFormatName(format: string): string {
  const formatNames: Record<string, string> = {
    swiss: "Swiss",
    knockout: "Knockout",
    "round-robin": "Round Robin",
    arena: "Arena",
  };
  return formatNames[format] || format;
}

/**
 * Get time control display name
 */
export function getTimeControlName(timeControl: string): string {
  const timeControlNames: Record<string, string> = {
    bullet: "Bullet",
    blitz: "Blitz",
    rapid: "Rapid",
    classical: "Classical",
  };
  return timeControlNames[timeControl] || timeControl;
}

// ============================================================================
// URL/Slug Utilities
// ============================================================================

/**
 * Generate URL-friendly slug from string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Check if date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj < new Date();
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
