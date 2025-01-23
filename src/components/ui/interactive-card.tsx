import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'gaming';
}

export const InteractiveCard = ({ 
  children, 
  className,
  variant = 'default',
  ...props 
}: InteractiveCardProps) => {
  return (
    <Card
      className={cn(
        'transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1',
        variant === 'gaming' && 'bg-gradient-to-br from-gaming-900/50 to-gaming-800/50 border-gaming-600/30',
        'hover:border-gaming-500/50 hover:shadow-gaming-500/20',
        'active:scale-[0.98] active:duration-100',
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
};