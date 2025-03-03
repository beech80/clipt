import { formatDistanceToNow, format } from "date-fns";

/**
 * Format a timestamp as a human-readable time
 * For messages from today, shows the time (e.g., "1:23 PM")
 * For older messages, shows relative time (e.g., "2 hours ago", "3 days ago")
 */
export const formatMessageTime = (timestamp: string): string => {
  if (!timestamp) return "";
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(date, 'h:mm a'); // Format as "1:23 PM"
    } else {
      return formatDistanceToNow(date, { addSuffix: true }); // "2 hours ago", "3 days ago", etc.
    }
  } catch (error) {
    console.error("Error formatting time:", error);
    return timestamp; // Fallback to original timestamp string
  }
};
