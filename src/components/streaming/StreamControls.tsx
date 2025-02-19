
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';
import { startStream, endStream } from '@/utils/streamUtils';

interface StreamControlsProps {
  userId: string;
  streamId?: string;
  isLive?: boolean;
  title: string;
  description?: string;
  onStreamStateChange?: () => void;
}

export const StreamControls = ({
  userId,
  streamId,
  isLive,
  title,
  description,
  onStreamStateChange
}: StreamControlsProps) => {
  const handleStartStream = async () => {
    try {
      await startStream(userId, title, description);
      onStreamStateChange?.();
    } catch (error) {
      console.error('Failed to start stream:', error);
    }
  };

  const handleEndStream = async () => {
    if (!streamId) return;
    try {
      await endStream(streamId);
      onStreamStateChange?.();
    } catch (error) {
      console.error('Failed to end stream:', error);
    }
  };

  return (
    <div className="flex justify-end gap-4">
      {isLive ? (
        <Button onClick={handleEndStream} variant="destructive" className="gap-2">
          <Square className="w-4 h-4" />
          End Stream
        </Button>
      ) : (
        <Button onClick={handleStartStream} className="gap-2">
          <Play className="w-4 h-4" />
          Start Stream
        </Button>
      )}
    </div>
  );
};
