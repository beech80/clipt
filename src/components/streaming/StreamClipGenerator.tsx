import { useState, useRef } from 'react';
import { Scissors, Check, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ShareButton from '@/components/shared/ShareButton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface StreamClipGeneratorProps {
  streamId: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  streamTitle: string;
  streamUrl: string;
  className?: string;
}

export const StreamClipGenerator = ({
  streamId,
  videoRef,
  streamTitle,
  streamUrl,
  className = '',
}: StreamClipGeneratorProps) => {
  const { user } = useAuth();
  const [isCreatingClip, setIsCreatingClip] = useState(false);
  const [clipTitle, setClipTitle] = useState('');
  const [clipUrl, setClipUrl] = useState('');
  const [clipGenerated, setClipGenerated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const clipStartTimeRef = useRef(0);
  const clipLengthSeconds = 30; // Default clip length in seconds

  const handleStartClip = () => {
    if (!videoRef.current) return;
    
    // Record the current playback time
    clipStartTimeRef.current = Math.max(0, videoRef.current.currentTime - 15);
    setIsCreatingClip(true);
    setClipTitle(`${streamTitle} clip`);
  };

  const handleCancelClip = () => {
    setIsCreatingClip(false);
    setClipGenerated(false);
    setClipUrl('');
  };

  const handleSaveClip = async () => {
    if (!videoRef.current || !user) return;
    
    setIsProcessing(true);
    try {
      // This would typically involve server-side processing
      // For this implementation, we'll simulate the process and create a clip record

      // Calculate clip end time (start time + clip length, max at video duration)
      const clipEndTime = Math.min(
        clipStartTimeRef.current + clipLengthSeconds,
        videoRef.current.duration
      );
      
      // In a real implementation, you would send start/end times to your backend
      // to process the actual video clip. Here we're just creating a database record.
      
      const { data, error } = await supabase.from('stream_clips').insert({
        user_id: user.id,
        stream_id: streamId,
        title: clipTitle,
        start_time: clipStartTimeRef.current,
        end_time: clipEndTime,
        duration: clipEndTime - clipStartTimeRef.current,
        created_at: new Date().toISOString(),
      }).select('id').single();
      
      if (error) throw error;
      
      // In a real implementation, the backend would generate an actual clip URL
      // For now, we'll generate a shareable URL that references this clip in the database
      const generatedClipUrl = `${window.location.origin}/clips/${data.id}`;
      setClipUrl(generatedClipUrl);
      setClipGenerated(true);
      
      toast.success('Clip created successfully!');
    } catch (error) {
      console.error('Error creating clip:', error);
      toast.error('Failed to create clip. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className={`rounded-lg shadow-sm ${className}`}>
      {!isCreatingClip ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleStartClip}
          className="flex items-center gap-1"
        >
          <Scissors className="h-4 w-4" />
          Create Clip
        </Button>
      ) : (
        <div className="space-y-3 p-3 border rounded-lg">
          {!clipGenerated ? (
            <>
              <div className="text-sm font-medium">Create 30-second clip</div>
              <Input
                placeholder="Clip title"
                value={clipTitle}
                onChange={(e) => setClipTitle(e.target.value)}
                className="w-full"
              />
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSaveClip}
                  disabled={isProcessing}
                  className="flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  {isProcessing ? 'Processing...' : 'Save Clip'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelClip}
                  disabled={isProcessing}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-medium">Clip created successfully!</div>
              <div className="flex items-center gap-2">
                <Input 
                  value={clipUrl} 
                  readOnly 
                  className="flex-grow text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(clipUrl);
                    toast.success('Link copied to clipboard!');
                  }}
                >
                  Copy
                </Button>
              </div>
              <div className="flex gap-2">
                <ShareButton 
                  title={clipTitle}
                  text={`Check out this clip from ${streamTitle}`}
                  url={clipUrl}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCancelClip}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StreamClipGenerator;
