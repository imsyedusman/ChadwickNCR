import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSydneyDate(date: string | Date | undefined) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-AU', {
    timeZone: 'Australia/Sydney',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatSydneyDateTime(date: string | Date | undefined) {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDuration(ms: number | undefined) {
  if (ms === undefined || ms === 0) return '—';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) return '< 1 day';
  if (days === 1) return '1 day';
  return `${days} days`;
}
