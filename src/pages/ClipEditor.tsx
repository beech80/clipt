import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Effect, ClipEditingSession } from "@/types/clip-editor";
import { VideoPreview } from "@/components/clip-editor/VideoPreview";
import { TrimControls } from "@/components/clip-editor/TrimControls";
import { EditorToolbar } from "@/components/clip-editor/EditorToolbar";
import { EffectsPanel } from "@/components/clip-editor/EffectsPanel";

export default function ClipEditor() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [selectedEffects, setSelectedEffects] = useState<Effect[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: effects, isLoading: effectsLoading } = useQuery({
    queryKey: ['clip-effects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clip_effects')
        .select('*');

      if (error) throw error;

      return data.map(effect => ({
        id: effect.id,
        type: effect.type,
        name: effect.name || undefined,
        is_premium: effect.is_premium || false,
        settings: {
          value: 0,
          ...(effect.settings as { [key: string]: any })
        }
      })) as Effect[];
    }
  });

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleReset = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    }
  };

  const handleTrimChange = ([start, end]: [number, number]) => {
    setStartTime(start);
    setEndTime(end);
    if (videoRef.current) {
      videoRef.current.currentTime = start;
      setCurrentTime(start);
    }
  };

  const handleEffectSelect = (effect: Effect) => {
    setSelectedEffects(prev => [...prev, effect]);
  };

  const handleEffectRemove = (effectId: string) => {
    setSelectedEffects(prev => prev.filter(e => e.id !== effectId));
  };

  const handleEffectSettingsChange = (effectId: string, settings: any) => {
    setSelectedEffects(prev =>
      prev.map(effect =>
        effect.id === effectId
          ? { ...effect, settings: { ...effect.settings, ...settings } }
          : effect
      )
    );
  };

  if (effectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-4">
        <div className="space-y-4">
          <VideoPreview
            videoUrl="/path/to/video.mp4"
            isPlaying={isPlaying}
            currentTime={currentTime}
            onTimeUpdate={handleTimeUpdate}
          />
          
          <TrimControls
            startTime={startTime}
            endTime={endTime}
            duration={10}
            onValueChange={handleTrimChange}
          />
          
          <EditorToolbar
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onReset={handleReset}
            onTrim={() => {}}
          />
        </div>
      </div>

      <EffectsPanel
        effects={effects || []}
        selectedEffects={selectedEffects}
        onEffectSelect={handleEffectSelect}
        onEffectRemove={handleEffectRemove}
        onEffectSettingsChange={handleEffectSettingsChange}
      />
    </div>
  );
}