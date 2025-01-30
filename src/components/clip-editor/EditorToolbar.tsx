import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Scissors } from "lucide-react";
import type { EditorToolbarProps } from "@/types/clip-editor";

export const EditorToolbar = ({ isPlaying, onPlayPause, onReset, onTrim }: EditorToolbarProps) => {
  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        size="icon"
        onClick={onPlayPause}
        className="gaming-button w-12 h-12"
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onReset}
        className="gaming-button w-12 h-12"
      >
        <RotateCcw className="h-5 w-5" />
      </Button>
      <Button 
        variant="default"
        onClick={onTrim}
        className="gaming-button ml-auto px-6"
      >
        <Scissors className="h-5 w-5 mr-2" />
        Trim Video
      </Button>
    </div>
  );
};