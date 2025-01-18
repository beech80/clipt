import React from 'react';
import { ViewerCountManager } from '../ViewerCountManager';

interface StreamPlayerChatProps {
  streamId: string;
  viewerCount: number;
  onViewerCountChange: (count: number) => void;
}

export function StreamPlayerChat({
  streamId,
  viewerCount,
  onViewerCountChange
}: StreamPlayerChatProps) {
  return (
    <div className="absolute top-4 right-4 space-y-2">
      <ViewerCountManager
        streamId={streamId}
        viewerCount={viewerCount}
        onViewerCountChange={onViewerCountChange}
      />
    </div>
  );
}