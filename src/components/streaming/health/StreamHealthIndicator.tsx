
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export interface StreamHealthStatus {
  status: 'excellent' | 'good' | 'poor' | 'offline';
  message?: string;
}

export interface StreamHealthIndicatorProps {
  streamId: string;
  status?: StreamHealthStatus['status'];
  className?: string;
}

export function StreamHealthIndicator({ status = 'offline', className }: StreamHealthIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'good':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'poor':
        return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20';
      default:
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-4 h-4" />;
      case 'good':
        return <CheckCircle className="w-4 h-4" />;
      case 'poor':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  return (
    <Badge variant="outline" className={`${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span className="ml-2 capitalize">{status}</span>
    </Badge>
  );
}
