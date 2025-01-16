import React from 'react';
import { StreamPlayer } from './StreamPlayer';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface StreamPreviewProps {
  streamUrl?: string | null;
  onTogglePreview: () => void;
  isPreviewActive: boolean;
}

export const StreamPreview = ({
  streamUrl,
  onTogglePreview,
  isPreviewActive
}: StreamPreviewProps) => {
  const handleTogglePreview = () => {
    onTogglePreview();
    toast.success(isPreviewActive ? 'Preview disabled' : 'Preview enabled');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Stream Preview</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTogglePreview}
          className="flex items-center gap-2"
        >
          {isPreviewActive ? (
            <>
              <EyeOff className="h-4 w-4" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Show Preview
            </>
          )}
        </Button>
      </div>
      
      {isPreviewActive && (
        <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
          <StreamPlayer
            streamUrl={streamUrl}
            autoplay={false}
            controls={true}
          />
          <div className="absolute top-2 right-2 bg-background/80 px-2 py-1 rounded text-xs font-medium">
            Preview Mode
          </div>
        </div>
      )}
    </div>
  );
};