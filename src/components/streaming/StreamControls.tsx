import { useState } from "react";
import { Video, Tag, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StreamForm } from "./StreamForm";
import { startStream, endStream } from "@/utils/streamUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StreamScheduleForm } from "./StreamScheduleForm";
import { VODManager } from "./VODManager";

interface StreamControlsProps {
  userId?: string;
  isLive?: boolean;
  onStreamUpdate: (data: { isLive: boolean; streamKey: string | null; streamUrl: string | null }) => void;
}

export const StreamControls = ({ userId, isLive = false, onStreamUpdate }: StreamControlsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
    if (!userId) {
      toast.error("Please log in to start streaming");
      return;
    }

    if (!title) {
      toast.error("Please set a stream title first");
      return;
    }

    if (!selectedCategory) {
      toast.error("Please select a category first");
      return;
    }

    setIsLoading(true);
    try {
      const result = await startStream(userId, title, description);
      
      // Add category mapping
      if (selectedCategory) {
        await supabase
          .from('stream_category_mappings')
          .insert({
            stream_id: result.streamId,
            category_id: selectedCategory
          });
      }

      // Add tag mappings
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

  const handleTagSelect = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
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
    <div className="w-full max-w-md mx-auto text-center">
      {!isLive ? (
        <div className="space-y-6">
          <StreamForm
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
          />
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-gaming-400" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-gaming-400" />
                <span className="text-sm font-medium">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags?.map(tag => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagSelect(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {stream?.id && (
            <StreamScheduleForm 
              streamId={stream.id} 
              onScheduled={() => {
                queryClient.invalidateQueries({ queryKey: ['stream', userId] });
              }} 
            />
          )}

          <Button 
            onClick={handleStartStream}
            className="w-full bg-gaming-500 hover:bg-gaming-600 text-white px-8 py-6 text-lg"
            disabled={isLoading}
          >
            <Video className="h-5 w-5 mr-2" />
            Start Stream
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <Button 
            onClick={handleEndStream}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
            disabled={isLoading}
          >
            <Video className="h-4 w-4 mr-2" />
            End Stream
          </Button>

          {stream?.id && <VODManager streamId={stream.id} />}
        </div>
      )}
    </div>
  );
};