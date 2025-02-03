import React from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface NavButtonProps {
  to: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ to, icon: Icon, label, className }) => {
  return (
    <Link
      to={to}
      className={`text-sm font-medium text-muted-foreground transition-colors hover:text-primary ${className}`}
    >
      <Button variant="ghost" size="sm" className="gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
};

export default NavButton;