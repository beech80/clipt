/**
 * ISOLATED ACTIVITY ICON IMPLEMENTATION
 * 
 * This is a completely standalone implementation with NO imports from any other files
 * to avoid ALL circular dependencies and initialization errors.
 */

// Simple interface for the Activity icon with the minimum props needed
interface ActivityIconProps {
  className?: string;
  size?: number | string;
  strokeWidth?: number;
  color?: string;
}

// Completely standalone Activity Icon - no dependencies whatsoever
export function ActivityIcon({
  className = "",
  size = 24,
  strokeWidth = 2,
  color = "currentColor",
  ...props
}: ActivityIconProps & React.SVGAttributes<SVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide-activity ${className}`}
      {...props}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

// Export the ActivityIcon for direct use
export default ActivityIcon;
