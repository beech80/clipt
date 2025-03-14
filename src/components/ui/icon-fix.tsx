/**
 * This is a special isolated file that provides the Activity (A) icon
 * It creates a direct proxy for the lucide-react Activity icon
 * This approach prevents initialization errors by avoiding circular dependencies
 */

// Import only the Activity icon directly
import React from 'react';

// Create a direct proxy for the Activity icon without importing from lucide-react
// This breaks any potential circular dependencies
export const ActivityFixed = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.width || 24}
    height={props.height || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.stroke || "currentColor"}
    strokeWidth={props.strokeWidth || 2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

// Export individually to ensure they're not part of any circular dependencies
export { ActivityFixed as Activity };
