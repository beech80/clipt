import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  progress: number;
  type: "image" | "video";
}

const UploadProgress = ({ progress, type }: UploadProgressProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Uploading {type}...</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

export default UploadProgress;