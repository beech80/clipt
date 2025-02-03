import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { StreamPreStartControls } from "./controls/StreamPreStartControls";
import { StreamLiveControls } from "./controls/StreamLiveControls";
import { startStream, endStream } from "@/utils/streamUtils";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface StreamControlsProps {
  userId?: string;
  isLive?: boolean;
  onStreamUpdate: (data: { 
    isLive: boolean; 
    streamKey: string | null; 
    streamUrl: string | null 
  }) => void;
  stream?: any;
  streamConfig?: any;
}

export const StreamControls = ({ 
  userId, 
  isLive = false, 
  onStreamUpdate,
  stream,
  streamConfig 
}: StreamControlsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    if (!title.trim()) {
      toast.error("Please enter a stream title");
      return;
    }

    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    setIsLoading(true);
    setError(null);
    
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
      toast.success("Stream started successfully! You can now start streaming from your broadcast software.");
    } catch (error) {
      console.error("Error starting stream:", error);
      setError("Failed to start stream. Please try again.");
      toast.error("Failed to start stream");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndStream = async () => {
    if (!userId || !stream?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await endStream(userId);
      onStreamUpdate(result);
      toast.success("Stream ended successfully!");
    } catch (error) {
      console.error("Error ending stream:", error);
      setError("Failed to end stream. Please try again.");
      toast.error("Failed to end stream");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

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