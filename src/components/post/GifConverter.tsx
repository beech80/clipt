import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Clapperboard, Loader2 } from "lucide-react";

interface GifConverterProps {
  videoFile: File;
  onConvert: (gifBlob: Blob) => void;
}

const GifConverter = ({ videoFile, onConvert }: GifConverterProps) => {
  const [isConverting, setIsConverting] = useState(false);
  const [quality, setQuality] = useState(70);
  const videoRef = useRef<HTMLVideoElement>(null);

  const convertToGif = async () => {
    try {
      setIsConverting(true);
      const ffmpeg = createFFmpeg({ log: true });
      await ffmpeg.load();

      const inputName = 'input.mp4';
      const outputName = 'output.gif';

      ffmpeg.FS('writeFile', inputName, await fetchFile(videoFile));

      await ffmpeg.run(
        '-i', inputName,
        '-vf', `fps=10,scale=480:-1:flags=lanczos`,
        '-q:v', String(Math.round((100 - quality) / 10)),
        outputName
      );

      const data = ffmpeg.FS('readFile', outputName);
      const gifBlob = new Blob([data.buffer], { type: 'image/gif' });
      
      onConvert(gifBlob);
      toast.success("Video converted to GIF successfully!");
    } catch (error) {
      toast.error("Error converting to GIF");
      console.error("Error converting to GIF:", error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg">
      <video
        ref={videoRef}
        src={URL.createObjectURL(videoFile)}
        className="w-full rounded-lg"
        controls
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">GIF Quality</label>
          <Slider
            value={[quality]}
            min={10}
            max={90}
            step={10}
            onValueChange={([value]) => setQuality(value)}
          />
          <span className="text-sm text-muted-foreground">
            {quality}% (Higher quality means larger file size)
          </span>
        </div>

        <Button
          onClick={convertToGif}
          disabled={isConverting}
          className="w-full"
        >
          {isConverting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Converting...
            </>
          ) : (
            <>
              <Clapperboard className="h-4 w-4 mr-2" />
              Convert to GIF
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default GifConverter;