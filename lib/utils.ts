import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format milliseconds into human-readable time string
 * @param ms - Time in milliseconds
 * @returns Human-readable string like "6.5 days", "4h 16m", "2m 30s"
 */
export function formatTimeBehind(ms: number): string {
  if (ms < 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    if (remainingHours > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${days} day${days !== 1 ? 's' : ''}`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${hours}h`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    if (remainingSeconds > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m`;
  }

  return `${seconds}s`;
}

/**
 * Calculate time behind based on blocks and block time
 * @param blocksBehind - Number of blocks behind
 * @param blockTimeMs - Block time in milliseconds
 * @returns Formatted time string
 */
export function calculateTimeBehind(blocksBehind: number, blockTimeMs: number): string {
  const totalMs = blocksBehind * blockTimeMs;
  return formatTimeBehind(totalMs);
}
