import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, Save, Undo, Redo, Download, Scissors, Play, Pause, Check, ChevronLeft, Upload } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FallbackVideoPlayer from "@/components/video/FallbackVideoPlayer";
import { Json } from "@/integrations/supabase/types";
import { formatTime } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

interface ClipEditingSession {
  id?: string;
  user_id?: string;
  clip_id?: string;
  effects: any[];
  edit_history: any[][];
  trim_start?: number;
  trim_end?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

const ClipEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editHistory, setEditHistory] = useState<any[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [clipId, setClipId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Determine if we're in "new" mode
  const isNewMode = id === 'new';

  // Load clip data
  const { data: clipData, isLoading: clipLoading } = useQuery({
    queryKey: ['clip', id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('clips')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error loading clip:', error);
        throw error;
      }
    },
    enabled: !!id && id !== 'new',
    onSuccess: (data) => {
      if (data?.video_url) {
        setVideoUrl(data.video_url);
        setClipId(data.id);
      }
    }
  });

  // Load editing session
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['editing-session', id],
    queryFn: async () => {
      try {
        const { data: dbData, error } = await supabase
          .from('clip_editing_sessions')
          .select('*')
          .eq('clip_id', id)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (dbData) {
          const parsedHistory = (dbData.edit_history as unknown as any[][]) || [];

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
      } catch (error) {
        console.error('Error loading editing session:', error);
        throw error;
      }
    },
    enabled: !!id && id !== 'new' && !!clipId
  });

  // Save session mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      try {
        const sessionData = {
          clip_id: clipId,
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
        return true;
      } catch (error) {
        console.error('Error saving session:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Edits saved successfully!');
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast.error('Failed to save edits');
    }
  });

  // Publish clip mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      try {
        const { error } = await supabase
          .from('clips')
          .update({ status: 'published' })
          .eq('id', clipId);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Publish error:', error);
        throw error;
      }
    },
    onSuccess: (data: any) => {
      toast.success('Clip published successfully!');
      // Navigate to view the published clip
      navigate('/clip/' + clipId);
    },
    onError: (error) => {
      console.error('Publish error:', error);
      toast.error('Failed to publish clip');
    }
  });

  // Handle video metadata loaded
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      
      // Initialize trim end to full duration if not set
      if (trimEnd === 0) {
        setTrimEnd(duration);
      }
      
      setVideoLoaded(true);
    }
  };

  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      setCurrentTime(currentTime);
      
      // If in trim preview mode, loop the video within trim points
      if (trimPreviewActive) {
        if (currentTime >= trimEnd) {
          videoRef.current.currentTime = trimStart;
        } else if (currentTime < trimStart) {
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
        setIsPlaying(false);
      } else {
        if (trimPreviewActive && currentTime >= trimEnd) {
          videoRef.current.currentTime = trimStart;
        }
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Enable/disable trim preview mode
  const toggleTrimPreview = () => {
    if (!videoLoaded) return;
    
    const newPreviewState = !trimPreviewActive;
    setTrimPreviewActive(newPreviewState);
    
    if (videoRef.current) {
      if (newPreviewState) {
        // Enter preview mode, set video to start at trim start
        videoRef.current.currentTime = trimStart;
      }
    }
  };

  // Apply trim to create a new video
  const handleTrim = () => {
    // For now, we'll just save the trim points
    // In a real implementation, you would actually create a new trimmed video here
    saveMutation.mutate();
    toast.success('Trim points saved!');
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      // Apply the previous state
    }
  };

  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      // Apply the next state
    }
  };

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      if (trimPreviewActive) {
        video.currentTime = trimStart;
        video.play().catch(e => console.error('Error auto-playing video:', e));
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('loadedmetadata', handleVideoLoaded);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('loadedmetadata', handleVideoLoaded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [trimPreviewActive, trimStart]);

  // Handle file selection for upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file is a video
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }
    
    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file size must be less than 100MB');
      return;
    }
    
    // Start upload process
    await uploadVideo(file);
  };
  
  // Upload video to storage and create clip record
  const uploadVideo = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Create a new clip ID
      const newClipId = uuidv4();
      setClipId(newClipId);
      
      // Generate file path
      const fileExt = file.name.split('.').pop();
      const filePath = `clips/${newClipId}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);
      
      const videoUrl = urlData.publicUrl;
      setVideoUrl(videoUrl);
      
      // Create clip record in database
      const { error: dbError } = await supabase
        .from('clips')
        .insert({
          id: newClipId,
          video_url: videoUrl,
          status: 'draft'
        });
      
      if (dbError) throw dbError;
      
      // Update URL to reflect the new clip ID
      navigate(`/clip-editor/${newClipId}`, { replace: true });
      
      toast.success('Video uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Loading state
  if (clipLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-6 px-4 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold mt-2">Clip Editor</h1>
        <p className="text-muted-foreground">Trim and edit your gameplay clip</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Video Preview */}
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-black overflow-hidden rounded-t-lg">
              {isNewMode && !videoUrl ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <input
                    type="file"
                    accept="video/*"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {isUploading ? (
                    <div className="w-full max-w-md">
                      <div className="mb-2 flex justify-between text-sm">
                        <span>Uploading video...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                          className="bg-gaming-600 h-2.5 rounded-full" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Upload Your Gameplay Clip</h3>
                      <p className="text-muted-foreground mb-4">Select a video file to upload and edit</p>
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gaming-600 hover:bg-gaming-700"
                      >
                        <Upload className="w-4 h-4 mr-2" /> Select Video
                      </Button>
                    </div>
                  )}
                </div>
              ) : clipLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : videoUrl ? (
                <div className="relative w-full h-full">
                  <FallbackVideoPlayer
                    videoUrl={videoUrl}
                    className="w-full h-full object-contain"
                    controls={false}
                    autoPlay={false}
                    muted={false}
                    loop={false}
                    ref={videoRef}
                  />
                  
                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center justify-between text-white gap-2">
                      <Button variant="ghost" size="icon" onClick={togglePlayPause} className="text-white hover:bg-white/20">
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </Button>
                      
                      <div className="flex-1 mx-2">
                        <div className="relative h-1 bg-white/30 rounded-full overflow-hidden">
                          <div 
                            className="absolute top-0 left-0 h-full bg-white"
                            style={{ width: `${(currentTime / videoDuration) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      <span className="text-xs">{formatTime(currentTime)} / {formatTime(videoDuration)}</span>
                      
                      <Button 
                        onClick={toggleTrimPreview} 
                        variant={trimPreviewActive ? "default" : "outline"}
                        className="p-1 hover:bg-white/20 rounded"
                        title={trimPreviewActive ? 'Exit trim preview' : 'Preview trim'}
                      >
                        <Scissors className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground">No video available</p>
                </div>
              )}
            </div>
            
            <div className="p-4">
              {videoUrl && (
                <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
                  <Button 
                    variant="outline"
                    onClick={handleTrim}
                    className="flex-1 gap-2"
                    disabled={!videoLoaded || (trimStart === 0 && trimEnd === videoDuration)}
                  >
                    <Scissors className="w-4 h-4" />
                    Apply Trim
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                    >
                      <Undo className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={handleRedo}
                      disabled={historyIndex >= editHistory.length - 1}
                    >
                      <Redo className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {videoUrl && (
                <div className="flex gap-4">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Draft
                  </Button>
                  
                  <Button
                    variant="default"
                    className="flex-1 bg-gaming-600 hover:bg-gaming-700"
                    onClick={() => publishMutation.mutate()}
                    disabled={publishMutation.isPending}
                  >
                    {publishMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Publish
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Trim Settings */}
        <div className="md:col-span-1">
          <Card className="p-4 h-full">
            <h3 className="text-lg font-semibold mb-4">Trim Settings</h3>
            
            <div className="space-y-6">
              {/* Trim Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Trim Video Clip</h4>
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
