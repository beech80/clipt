import { useState, useEffect } from 'react';
import { selectOptimalCDNEndpoint, monitorCDNHealth } from "@/utils/cdnUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface CDNManagerProps {
  streamUrl: string;
  onCDNChange: (newUrl: string) => void;
}

export const CDNManager = ({ streamUrl, onCDNChange }: CDNManagerProps) => {
  const [currentEndpoint, setCurrentEndpoint] = useState(streamUrl);
  const [health, setHealth] = useState<{
    healthy: boolean;
    latency: number;
    status: number;
  }>({ healthy: true, latency: 0, status: 200 });

  useEffect(() => {
    const initCDN = async () => {
      const optimalEndpoint = await selectOptimalCDNEndpoint();
      if (optimalEndpoint) {
        setCurrentEndpoint(optimalEndpoint);
        onCDNChange(optimalEndpoint);
      }
    };

    initCDN();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const healthStatus = await monitorCDNHealth(currentEndpoint);
      setHealth(healthStatus);

      // If current CDN is unhealthy, try to switch to a backup
      if (!healthStatus.healthy) {
        const newEndpoint = await selectOptimalCDNEndpoint();
        if (newEndpoint && newEndpoint !== currentEndpoint) {
          setCurrentEndpoint(newEndpoint);
          onCDNChange(newEndpoint);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [currentEndpoint]);

  if (!health.healthy) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          CDN connection issues detected. Attempting to optimize...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">
        CDN Latency: {Math.round(health.latency)}ms
      </Badge>
    </div>
  );
};