import React from 'react';
import { Card } from "@/components/ui/card";
import { StreamEndButton } from "./StreamEndButton";
import { VODManager } from "../VODManager";

interface StreamLiveControlsProps {
  streamId: string;
  onStreamEnd: () => void;
  isLoading: boolean;
}

export const StreamLiveControls = ({
  streamId,
  onStreamEnd,
  isLoading
}: StreamLiveControlsProps) => {
  return (
    <Card className="p-6 space-y-6">
      <StreamEndButton 
        onClick={onStreamEnd}
        isLoading={isLoading}
      />
      <VODManager streamId={streamId} />
    </Card>
  );
};