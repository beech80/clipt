import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cloudflareService, CloudflareCheckResult } from '@/services/cloudflareService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ActivityIcon from '@/components/ui/activity-icon';
import { Globe, Wifi } from 'lucide-react';
import { toast } from 'sonner';

export function CloudflareStatus() {
  const { data: checkResult, error, isLoading } = useQuery({
    queryKey: ['cloudflare-check'],
    queryFn: () => cloudflareService.performSystemCheck(),
    refetchInterval: 60000 // Check every minute
  });

  useEffect(() => {
    if (error) {
      toast.error('Failed to check Cloudflare status');
    }
  }, [error]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          <h3 className="font-semibold">Cloudflare Status</h3>
        </div>
        {checkResult && (
          <Badge className={getStatusColor(checkResult.status)}>
            {checkResult.status}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-20">
          <ActivityIcon className="h-6 w-6 animate-pulse" />
        </div>
      ) : checkResult ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Latency</span>
            <span className="font-mono">{Math.round(checkResult.latency)}ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Region</span>
            <span>{checkResult.region}</span>
          </div>
          {checkResult.details && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">POP</span>
                <span>{checkResult.details.pop}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Protocol</span>
                <span>{checkResult.details.protocol}</span>
              </div>
            </>
          )}
        </div>
      ) : null}
    </Card>
  );
}