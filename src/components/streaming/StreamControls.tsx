import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { StreamPreStartControls } from "./controls/StreamPreStartControls";
import { StreamLiveControls } from "./controls/StreamLiveControls";
import { startStream, endStream } from "@/utils/streamUtils";
import { toast } from "sonner";

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
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
    setIsLoading(true);
    try {
      const result = await startStream(userId!, title, description);
      
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
    if (!userId || !stream?.id) return;

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

  if (!isLive) {
    return (
      <StreamPreStartControls
        userId={userId}
        title={title}
        description={description}
        selectedCategory={selectedCategory}
        selectedTags={selectedTags}
        categories={categories || []}
        tags={tags || []}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onCategoryChange={setSelectedCategory}
        onTagsChange={setSelectedTags}
        onStreamStart={handleStartStream}
        isLoading={isLoading}
      />
    );
  }

  return (
    <StreamLiveControls
      streamId={stream?.id || ""}
      onStreamEnd={handleEndStream}
      isLoading={isLoading}
    />
  );
};