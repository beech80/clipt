import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, UserPlus, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerConfetti } from '@/utils/animationUtils';

interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'like' | 'follow' | 'achievement';
  isActive?: boolean;
  count?: number;
  showAnimation?: boolean;
}

export const InteractiveButton = ({
  variant = 'like',
  isActive = false,
  count,
  showAnimation = true,
  className,
  onClick,
  ...props
}: InteractiveButtonProps) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (showAnimation && !isActive) {
      triggerConfetti();
    }
    onClick?.(e);
  };

  const icons = {
    like: <Heart className={cn(
      "w-5 h-5 transition-all duration-300",
      isActive ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground"
    )} />,
    follow: <UserPlus className={cn(
      "w-5 h-5 transition-all duration-300",
      isActive ? "text-green-500 scale-110" : "text-muted-foreground"
    )} />,
    achievement: <Trophy className={cn(
      "w-5 h-5 transition-all duration-300",
      isActive ? "text-yellow-500 scale-110" : "text-muted-foreground"
    )} />
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "relative group transition-all duration-300",
        "hover:bg-background/50 active:scale-95",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="flex items-center gap-2">
        {icons[variant]}
        {count !== undefined && (
          <span className={cn(
            "text-sm transition-all duration-300",
            isActive && variant === 'like' && "text-red-500",
            isActive && variant === 'follow' && "text-green-500",
            isActive && variant === 'achievement' && "text-yellow-500"
          )}>
            {count}
          </span>
        )}
      </span>
      <span className={cn(
        "absolute -inset-1 rounded-full bg-current opacity-0 transition-all duration-300",
        "group-hover:opacity-10",
        isActive && variant === 'like' && "text-red-500",
        isActive && variant === 'follow' && "text-green-500",
        isActive && variant === 'achievement' && "text-yellow-500"
      )} />
    </Button>
  );
};