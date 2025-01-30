import { useState, useRef } from 'react';
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Json } from "@/types/auth";
import { Effect, ClipEditingSession } from "@/types/clip-editor";
import { VideoPreview } from "@/components/clip-editor/VideoPreview";
import { TrimControls } from "@/components/clip-editor/TrimControls";
import { EditorToolbar } from "@/components/clip-editor/EditorToolbar";
import { EffectsPanel } from "@/components/clip-editor/EffectsPanel";

const ClipEditor = () => {
  const { id } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null);
  const [appliedEffects, setAppliedEffects] = useState<Effect[]>([]);
  const [editHistory, setEditHistory] = useState<Effect[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const { data: effects, isLoading: effectsLoading } = useQuery({
    queryKey: ['clip-effects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clip_effects')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Transform the data to match Effect type
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

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['editing-session', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clip_editing_sessions')
        .select('*')
        .eq('clip_id', id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!id
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const sessionData = {
        clip_id: id,
        effects: appliedEffects as unknown as Json,
        edit_history: editHistory as unknown as Json[],
        status: 'draft'
      };

      const { error } = await supabase
        .from('clip_editing_sessions')
        .upsert(sessionData);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Changes saved successfully!");
    },
    onError: (error) => {
      toast.error("Failed to save changes");
      console.error("Save error:", error);
    }
  });

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setEndTime(videoRef.current.duration);
    }
  };

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

  const handleTrim = async () => {
    if (!videoRef.current) return;

    try {
      const stream = (videoRef.current as any).captureStream();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        // Handle the trimmed video blob
        toast.success("Video trimmed successfully!");
      };

      videoRef.current.currentTime = startTime;
      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
      }, (endTime - startTime) * 1000);

    } catch (error) {
      toast.error("Error trimming video");
      console.error("Error trimming video:", error);
    }
  };

  const handleEffectChange = (effectId: string, value: number) => {
    setAppliedEffects(current => {
      const newEffects = current.map(effect => 
        effect.id === effectId 
          ? { ...effect, settings: { ...effect.settings, value } }
          : effect
      );
      
      const newHistory = editHistory.slice(0, historyIndex + 1);
      newHistory.push(newEffects);
      setEditHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      return newEffects;
    });
  };

  if (effectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-9">
          <Tabs defaultValue="preview">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="trim">Trim</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview">
              <VideoPreview
                videoRef={videoRef}
                onLoadedMetadata={handleLoadedMetadata}
              />
            </TabsContent>
            
            <TabsContent value="trim">
              <div className="space-y-4">
                <VideoPreview
                  videoRef={videoRef}
                  onLoadedMetadata={handleLoadedMetadata}
                />
                <div className="space-y-4">
                  <TrimControls
                    startTime={startTime}
                    endTime={endTime}
                    duration={duration}
                    onValueChange={([start, end]) => {
                      setStartTime(start);
                      setEndTime(end);
                    }}
                  />
                  <EditorToolbar
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}
                    onReset={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                      }
                    }}
                    onTrim={handleTrim}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="col-span-3">
          <EffectsPanel
            effects={effects}
            appliedEffects={appliedEffects}
            onEffectChange={handleEffectChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ClipEditor;