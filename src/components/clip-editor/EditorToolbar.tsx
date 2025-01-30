import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Scissors } from "lucide-react";

interface EditorToolbarProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onTrim: () => void;
}

export const EditorToolbar = ({ isPlaying, onPlayPause, onReset, onTrim }: EditorToolbarProps) => {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onPlayPause}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onReset}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button 
        variant="default"
        onClick={onTrim}
        className="ml-auto"
      >
        <Scissors className="h-4 w-4 mr-2" />
        Trim Video
      </Button>
    </div>
  );
};