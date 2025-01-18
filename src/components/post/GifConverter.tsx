import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { Clapperboard, Loader2 } from "lucide-react";

interface GifConverterProps {
  videoFile: File;
  onConvert: (gifBlob: Blob) => void;
}

const GifConverter = ({ videoFile, onConvert }: GifConverterProps) => {
  const [isConverting, setIsConverting] = useState(false);
  const [quality, setQuality] = useState(70);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef(new FFmpeg());

  const convertToGif = async () => {
    const ffmpeg = ffmpegRef.current;
    
    try {
      setIsConverting(true);
      
      // Load FFmpeg
      if (!ffmpeg.loaded) {
        await ffmpeg.load({
          coreURL: await toBlobURL(`/node_modules/@ffmpeg/core/dist/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`/node_modules/@ffmpeg/core/dist/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      const inputName = 'input.mp4';
      const outputName = 'output.gif';

      // Write the video file to FFmpeg's file system
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Run FFmpeg command
      await ffmpeg.exec([
        '-i', inputName,
        '-vf', `fps=10,scale=480:-1:flags=lanczos`,
        '-q:v', String(Math.round((100 - quality) / 10)),
        outputName
      ]);

      // Read the resulting file
      const data = await ffmpeg.readFile(outputName);
      const gifBlob = new Blob([data], { type: 'image/gif' });
      
      onConvert(gifBlob);
      toast.success("Video converted to GIF successfully!");
    } catch (error) {
      console.error("Error converting to GIF:", error);
      toast.error("Error converting to GIF");
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