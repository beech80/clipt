import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Video, StopCircle } from 'lucide-react';

interface RecordingControlsProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  autoRecord: boolean;
  onAutoRecordChange: (enabled: boolean) => void;
}

export const RecordingControls = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  autoRecord,
  onAutoRecordChange,
}: RecordingControlsProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recording Controls</h3>
        <div className="flex items-center space-x-2">
          <Switch
            id="auto-record"
            checked={autoRecord}
            onCheckedChange={onAutoRecordChange}
          />
          <Label htmlFor="auto-record">Auto-record streams</Label>
        </div>
      </div>
      <div className="flex justify-center">
        <Button
          variant={isRecording ? "destructive" : "default"}
          onClick={isRecording ? onStopRecording : onStartRecording}
          className="w-full"
        >
          {isRecording ? (
            <>
              <StopCircle className="w-4 h-4 mr-2" />
              Stop Recording
            </>
          ) : (
            <>
              <Video className="w-4 h-4 mr-2" />
              Start Recording
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};