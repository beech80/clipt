import React from 'react';
import { StreamControls } from './StreamControls';
import { StreamRecordingManager } from './recording/StreamRecordingManager';
import { StreamHealthMonitor } from './StreamHealthMonitor';
import { StreamChat } from './StreamChat';
import { Card } from '@/components/ui/card';

interface StreamDashboardProps {
  streamId: string;
  userId: string;
}

export const StreamDashboard = ({ streamId, userId }: StreamDashboardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <StreamControls userId={userId} />
        <StreamRecordingManager streamId={streamId} />
      </div>
      <div className="space-y-6">
        <StreamHealthMonitor streamId={streamId} />
        <StreamChat streamId={streamId} />
      </div>
    </div>
  );
};