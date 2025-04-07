import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string or timestamp to a readable format
 * @param dateInput Date string, timestamp, or Date object
 * @returns Formatted date string
 */
export function formatDate(dateInput: string | number | Date): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  // Format: Month Day, Year
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format an image URL to ensure it has the correct protocol
 * @param url The image URL to format
 * @returns Formatted image URL
 */
export function formatImageUrl(url: string): string {
  if (!url) return '';
  
  // Ensure URL uses HTTPS
  if (url.startsWith('http:')) {
    return url.replace('http:', 'https:');
  }
  
  if (!url.startsWith('http')) {
    return `https:${url}`;
  }
  
  return url;
}

/**
 * Format seconds into a MM:SS display format for video players
 * @param seconds Number of seconds to format
 * @returns Formatted time string in MM:SS format
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
