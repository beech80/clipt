import { RefObject } from 'react';

interface VideoPreviewProps {
  videoRef: RefObject<HTMLVideoElement>;
  onLoadedMetadata: () => void;
}

export const VideoPreview = ({ videoRef, onLoadedMetadata }: VideoPreviewProps) => {
  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        onLoadedMetadata={onLoadedMetadata}
      />
    </div>
  );
};