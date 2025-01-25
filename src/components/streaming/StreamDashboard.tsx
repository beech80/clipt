import React from 'react';
import { StreamControls } from './StreamControls';
import { StreamRecordingManager } from './recording/StreamRecordingManager';
import { StreamHealthMonitor } from './StreamHealthMonitor';
import { StreamChat } from './StreamChat';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

interface StreamDashboardProps {
  streamId: string;
  userId: string;
}

export const StreamDashboard = ({ streamId, userId }: StreamDashboardProps) => {
  const [isLive, setIsLive] = useState(false);

  const handleStreamUpdate = (data: { 
    isLive: boolean; 
    streamKey: string | null; 
    streamUrl: string | null 
  }) => {
    setIsLive(data.isLive);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <StreamControls 
          userId={userId} 
          isLive={isLive} 
          onStreamUpdate={handleStreamUpdate}
        />
        <StreamRecordingManager streamId={streamId} />
      </div>
      <div className="space-y-6">
        <StreamHealthMonitor streamId={streamId} />
        <StreamChat streamId={streamId} isLive={isLive} />
      </div>
    </div>
  );
};