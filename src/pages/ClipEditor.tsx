import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, Save, Undo, Redo, Download, Scissors, Play, Pause, Check, ChevronLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FallbackVideoPlayer from "@/components/video/FallbackVideoPlayer";
import { Json } from "@/integrations/supabase/types";
import { formatTime } from "@/lib/utils";

interface ClipEditingSession {
  id?: string;
  user_id?: string;
  clip_id?: string;
  effects: any[];
  edit_history: any[][];
  status?: string;
  created_at?: string;
  updated_at?: string;
}

const ClipEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editHistory, setEditHistory] = useState<any[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Video related states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  // Trim related states
  const [trimStart, setTrimStart] = useState(0); // In seconds
  const [trimEnd, setTrimEnd] = useState(0); // In seconds
  const [trimPreviewActive, setTrimPreviewActive] = useState(false);
  const [originalVideo, setOriginalVideo] = useState<Blob | null>(null);

  // Load clip data
  const { data: clipData, isLoading: clipLoading } = useQuery({
    queryKey: ['clip', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clips')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    onSuccess: (data) => {
      if (data?.video_url) {
        setVideoUrl(data.video_url);
      }
    }
  });

  // Load editing session
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['editing-session', id],
    queryFn: async () => {
      const { data: dbData, error } = await supabase
        .from('clip_editing_sessions')
        .select('*')
        .eq('clip_id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (dbData) {
        const parsedHistory = (dbData.edit_history as unknown as any[][]).map(historyEntry =>
          historyEntry.map(effect => ({
            ...effect
          }))
        );

        // Apply previous trim settings if they exist
        if (dbData.trim_start !== undefined && dbData.trim_end !== undefined) {
          setTrimStart(dbData.trim_start);
          setTrimEnd(dbData.trim_end || videoDuration);
        }

        return {
          ...dbData,
          edit_history: parsedHistory
        } as ClipEditingSession;
      }
      return null;
    },
    enabled: !!id
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const sessionData = {
        clip_id: id,
        effects: [],
        edit_history: editHistory,
        trim_start: trimStart,
        trim_end: trimEnd,
        status: 'draft'
      };

      const { error } = await supabase
        .from('clip_editing_sessions')
        .upsert(sessionData);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trim settings saved successfully!");
      // Add the trim operation to edit history
      const newHistoryEntry = [
        { type: 'trim', start: trimStart, end: trimEnd, timestamp: new Date().toISOString() }
      ];
      setEditHistory([...editHistory, newHistoryEntry]);
      setHistoryIndex(editHistory.length);
    },
    onError: (error) => {
      toast.error("Failed to save changes");
      console.error("Save error:", error);
    }
  });
  
  // Export trimmed video
  const exportMutation = useMutation({
    mutationFn: async () => {
      // Here we would integrate with a video processing service
      // For now, we'll simulate the export process
      toast.loading("Processing video export...");
      
      // Simulate an API call to a video processing service
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            url: `/exports/${id}-trimmed.mp4`,
            success: true
          });
        }, 3000);
      });
    },
    onSuccess: (data: any) => {
      toast.dismiss();
      toast.success("Video exported successfully!");
      
      // In a real implementation, we would update the database with the exported video URL
      // and/or trigger a download
    },
    onError: (error) => {
      toast.dismiss();
      toast.error("Failed to export video");
      console.error("Export error:", error);
    }
  });

  // Handle video metadata loaded
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      
      // Initialize trim end to video duration if not set
      if (trimEnd === 0) {
        setTrimEnd(duration);
      }
      
      setVideoLoaded(true);
    }
  };
  
  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // If we're in trim preview mode and the current time exceeds the trim end
      // or is less than trim start, reset to trim start
      if (trimPreviewActive) {
        if (videoRef.current.currentTime >= trimEnd) {
          videoRef.current.currentTime = trimStart;
        } else if (videoRef.current.currentTime < trimStart) {
          videoRef.current.currentTime = trimStart;
        }
      }
    }
  };
  
  // Handle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // If in trim preview and at the end, start from beginning of trim
        if (trimPreviewActive && currentTime >= trimEnd) {
          videoRef.current.currentTime = trimStart;
        }
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Enable/disable trim preview mode
  const toggleTrimPreview = () => {
    if (videoRef.current) {
      if (!trimPreviewActive) {
        // Entering trim preview mode
        videoRef.current.currentTime = trimStart;
        setTrimPreviewActive(true);
      } else {
        // Exiting trim preview mode
        setTrimPreviewActive(false);
      }
    }
  };
  
  // Apply trim to create a new video
  const handleTrim = () => {
    if (!videoRef.current || !videoLoaded) return;
    
    toast.success(`Video trimmed from ${formatTime(trimStart)} to ${formatTime(trimEnd)}`);
    saveMutation.mutate();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Monitor video playing state
  useEffect(() => {
    const videoElement = videoRef.current;
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (trimPreviewActive) {
        if (videoElement) {
          videoElement.currentTime = trimStart;
        }
      }
    };
    
    if (videoElement) {
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('ended', handleEnded);
    }
    
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
      }
    };
  }, [trimPreviewActive, trimStart]);
  
  // Loading state
  if (clipLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  
  // No clip data
  if (!clipData) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Clip Not Found</h1>
        </div>
        <Card className="p-6">
          <p>The clip you're looking for doesn't exist or you don't have permission to edit it.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Return to Previous Page
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Gameplay Clip</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo className="w-4 h-4 mr-2" />
            Undo
          </Button>
          <Button
            variant="outline"
            onClick={handleRedo}
            disabled={historyIndex >= editHistory.length - 1}
          >
            <Redo className="w-4 h-4 mr-2" />
            Redo
          </Button>
          <Button onClick={() => saveMutation.mutate()}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button 
            variant="secondary"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportMutation.isPending ? 'Exporting...' : 'Export Video'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Card className="p-4 overflow-hidden">
            <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
              {videoUrl ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    controls={false}
                    onLoadedMetadata={handleVideoLoaded}
                    onTimeUpdate={handleTimeUpdate}
                  />
                  
                  {/* Play/Pause Overlay */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={togglePlayPause}
                  >
                    {!isPlaying && (
                      <div className="bg-black/50 p-4 rounded-full">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center justify-between text-white gap-2">
                      <button onClick={togglePlayPause} className="p-1 hover:bg-white/20 rounded">
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <span className="text-sm">{formatTime(currentTime)} / {formatTime(videoDuration)}</span>
                      
                      {/* Trim Preview Toggle */}
                      <button 
                        onClick={toggleTrimPreview}
                        className={`p-1 hover:bg-white/20 rounded ${trimPreviewActive ? 'bg-white/20' : ''}`}
                        title={trimPreviewActive ? 'Exit trim preview' : 'Preview trim'}
                      >
                        <Scissors className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No video selected
                </div>
              )}
            </div>
          </Card>
        </div>
        
        <div className="col-span-12 lg:col-span-4">
          <Card className="p-4 h-full">
            <h3 className="text-lg font-semibold mb-4">Trim Settings</h3>
            
            <div className="space-y-6">
              {/* Trim Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Trim Video Clip</h4>
                  <Button 
                    onClick={handleTrim} 
                    variant="secondary" 
                    size="sm"
                    disabled={!videoLoaded}
                  >
                    <Scissors className="w-4 h-4 mr-2" />
                    Apply Trim
                  </Button>
                </div>
                
                {/* Start Time */}
                <div className="space-y-2">
                  <Label htmlFor="trimStart">Start Time</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="trimStart"
                      type="number"
                      min={0}
                      max={trimEnd}
                      step={0.1}
                      value={trimStart.toFixed(1)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setTrimStart(value > trimEnd ? trimEnd : value);
                      }}
                      disabled={!videoLoaded}
                    />
                    <span className="text-sm text-muted-foreground w-20">
                      {formatTime(trimStart)}
                    </span>
                  </div>
                </div>
                
                {/* End Time */}
                <div className="space-y-2">
                  <Label htmlFor="trimEnd">End Time</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="trimEnd"
                      type="number"
                      min={trimStart}
                      max={videoDuration}
                      step={0.1}
                      value={trimEnd.toFixed(1)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setTrimEnd(value < trimStart ? trimStart : (value > videoDuration ? videoDuration : value));
                      }}
                      disabled={!videoLoaded}
                    />
                    <span className="text-sm text-muted-foreground w-20">
                      {formatTime(trimEnd)}
                    </span>
                  </div>
                </div>
                
                {/* Trim Slider */}
                <div className="pt-4">
                  <Slider
                    value={[trimStart, trimEnd]}
                    min={0}
                    max={videoDuration || 100}
                    step={0.1}
                    onValueChange={([start, end]) => {
                      setTrimStart(start);
                      setTrimEnd(end);
                    }}
                    disabled={!videoLoaded}
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{formatTime(0)}</span>
                    <span>{formatTime(videoDuration)}</span>
                  </div>
                </div>
                
                {/* Trim Preview Button */}
                <Button 
                  onClick={toggleTrimPreview} 
                  variant={trimPreviewActive ? "default" : "outline"}
                  className="w-full mt-2"
                  disabled={!videoLoaded}
                >
                  {trimPreviewActive ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Exit Preview Mode
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Preview Trimmed Clip
                    </>
                  )}
                </Button>
              </div>
              
              {/* Trim Info */}
              <div className="p-3 bg-muted/50 rounded-md">
                <h4 className="text-sm font-medium mb-2">Trim Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Duration:</span>
                    <span>{formatTime(videoDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New Duration:</span>
                    <span>{formatTime(trimEnd - trimStart)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reduction:</span>
                    <span>{videoDuration ? `${Math.round(100 - ((trimEnd - trimStart) / videoDuration * 100))}%` : '0%'}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClipEditor;