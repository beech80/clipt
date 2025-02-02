import React from 'react';
import { ClipEditor } from './ClipEditor';
import { HighlightGenerator } from './HighlightGenerator';
import { ThumbnailCreator } from './ThumbnailCreator';

interface StreamEditorToolsProps {
  streamId: string;
  videoUrl: string;
}

export const StreamEditorTools = ({ streamId, videoUrl }: StreamEditorToolsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <ClipEditor
        videoUrl={videoUrl}
        onSave={async (clipData) => {
          console.log('Clip saved:', clipData);
        }}
      />
      
      <HighlightGenerator
        streamId={streamId}
        onHighlightGenerated={(url) => {
          console.log('Highlight generated:', url);
        }}
      />
      
      <ThumbnailCreator
        videoUrl={videoUrl}
        onThumbnailCreated={(url) => {
          console.log('Thumbnail created:', url);
        }}
      />
    </div>
  );
};