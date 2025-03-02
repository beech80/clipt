import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface TabLinkProps extends React.ComponentPropsWithoutRef<'a'> {
  to: string;
  active?: boolean;
}

export function TabLink({
  to,
  active,
  className,
  children,
  ...props
}: TabLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        active
          ? 'bg-background text-foreground shadow'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
