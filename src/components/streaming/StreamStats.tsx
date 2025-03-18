import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StreamStatsProps {
  isLive: boolean;
}

const StreamStats: React.FC<StreamStatsProps> = ({ isLive }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stream Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={isLive ? "text-green-500" : "text-gray-500"}>
              {isLive ? "Live" : "Offline"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Viewers:</span>
            <span>{isLive ? Math.floor(Math.random() * 10) : 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Duration:</span>
            <span>{isLive ? "00:15:32" : "00:00:00"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreamStats;
