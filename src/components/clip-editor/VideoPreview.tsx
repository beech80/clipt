import { Card } from "@/components/ui/card";

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoFile: File;
  onLoadedMetadata: () => void;
}

export const VideoPreview = ({ videoRef, videoFile, onLoadedMetadata }: VideoPreviewProps) => {
  return (
    <Card className="p-4">
      <video
        ref={videoRef}
        src={URL.createObjectURL(videoFile)}
        className="w-full rounded-lg"
        onLoadedMetadata={onLoadedMetadata}
      />
    </Card>
  );
};