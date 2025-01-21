import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { StreamForm } from "./StreamForm";
import { StreamScheduleForm } from "./StreamScheduleForm";
import { VODManager } from "./VODManager";
import { StreamMetaForm } from "./controls/StreamMetaForm";
import { StreamStartButton } from "./controls/StreamStartButton";
import { StreamEndButton } from "./controls/StreamEndButton";
import { InteractiveStreamFeatures } from "./InteractiveStreamFeatures";
import { startStream, endStream } from "@/utils/streamUtils";

interface StreamControlsProps {
  userId?: string;
  isLive?: boolean;
  onStreamUpdate: (data: { 
    isLive: boolean; 
    streamKey: string | null; 
    streamUrl: string | null 
  }) => void;
}

export const StreamControls = ({ 
  userId, 
  isLive = false, 
  onStreamUpdate 
}: StreamControlsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [streamData, setStreamData] = useState({
    title: "",
    description: "",
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: stream } = useQuery({
    queryKey: ['stream', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  const { data: categories } = useQuery({
    queryKey: ['streamCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: tags } = useQuery({
    queryKey: ['streamTags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_tags')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const handleStartStream = async () => {
    if (!userId) {
      toast.error("Please log in to start streaming");
      return;
    }

    if (!streamData.title) {
      toast.error("Please set a stream title first");
      return;
    }

    if (!selectedCategory) {
      toast.error("Please select a category first");
      return;
    }

    setIsLoading(true);
    try {
      const result = await startStream(userId, streamData.title, streamData.description);
      
      if (selectedCategory) {
        await supabase
          .from('stream_category_mappings')
          .insert({
            stream_id: result.streamId,
            category_id: selectedCategory
          });
      }

      if (selectedTags.length > 0) {
        const tagMappings = selectedTags.map(tagId => ({
          stream_id: result.streamId,
          tag_id: tagId
        }));
        await supabase
          .from('stream_tag_mappings')
          .insert(tagMappings);
      }

      onStreamUpdate(result);
      toast.success("Stream started successfully!");
    } catch (error) {
      console.error("Error starting stream:", error);
      toast.error("Failed to start stream");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndStream = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const result = await endStream(userId);
      onStreamUpdate(result);
      toast.success("Stream ended successfully!");
    } catch (error) {
      console.error("Error ending stream:", error);
      toast.error("Failed to end stream");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center">
        <Button 
          className="bg-gaming-500 hover:bg-gaming-600 text-white px-8 py-6 text-lg"
          onClick={() => toast.error("Please log in to start streaming")}
        >
          Start Stream
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6">
      {stream?.id && isLive && (
        <InteractiveStreamFeatures 
          streamId={stream.id} 
          isLive={isLive} 
        />
      )}

      {!isLive ? (
        <div className="space-y-6">
          <StreamForm
            title={streamData.title}
            description={streamData.description}
            onTitleChange={(title) => setStreamData({ ...streamData, title })}
            onDescriptionChange={(description) => 
              setStreamData({ ...streamData, description })
            }
          />
          
          <StreamMetaForm
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            categories={categories}
            tags={tags}
          />

          {stream?.id && (
            <StreamScheduleForm 
              streamId={stream.id} 
              onScheduled={() => {
                queryClient.invalidateQueries({ 
                  queryKey: ['stream', userId] 
                });
              }} 
            />
          )}

          <StreamStartButton 
            onClick={handleStartStream}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <StreamEndButton 
            onClick={handleEndStream}
            isLoading={isLoading}
          />

          {stream?.id && <VODManager streamId={stream.id} />}
        </div>
      )}
    </div>
  );
};