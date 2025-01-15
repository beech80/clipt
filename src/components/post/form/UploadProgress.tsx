import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  progress: number;
  type: "image" | "video";
}

const UploadProgress = ({ progress, type }: UploadProgressProps) => {
  if (progress === 0) return null;

  return (
    <div className="space-y-2">
      <Progress value={progress} className="h-2" />
      <p className="text-sm text-muted-foreground text-center">
        Uploading {type}: {progress}%
      </p>
    </div>
  );
};

export default UploadProgress;