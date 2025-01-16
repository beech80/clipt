import React from 'react';
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QualitySelectorProps {
  qualities: string[];
  currentQuality: string;
  onQualityChange: (quality: string) => void;
  className?: string;
}

export const QualitySelector = ({ 
  qualities, 
  currentQuality, 
  onQualityChange,
  className 
}: QualitySelectorProps) => {
  if (qualities.length === 0) return null;

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            {currentQuality}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onQualityChange('auto')}>
            Auto
          </DropdownMenuItem>
          {qualities.map((quality) => (
            <DropdownMenuItem 
              key={quality}
              onClick={() => onQualityChange(quality)}
            >
              {quality}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};