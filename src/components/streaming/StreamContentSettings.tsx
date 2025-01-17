import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface StreamContentSettingsProps {
  streamId: string;
}

export function StreamContentSettings({ streamId }: StreamContentSettingsProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customTag, setCustomTag] = useState("");

  const { data: categories } = useQuery({
    queryKey: ['stream-categories'],
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
    queryKey: ['stream-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_tags')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const handleAddTag = async () => {
    if (!customTag.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('stream_tags')
        .insert({ name: customTag.trim() })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSelectedTags([...selectedTags, data.id]);
        toast.success('Tag added successfully');
      }
      
      setCustomTag("");
    } catch (error) {
      toast.error('Failed to add tag');
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Save category mapping
      if (selectedCategory) {
        await supabase
          .from('stream_category_mappings')
          .upsert({
            stream_id: streamId,
            category_id: selectedCategory,
          });
      }

      // Save tag mappings
      if (selectedTags.length > 0) {
        const tagMappings = selectedTags.map(tagId => ({
          stream_id: streamId,
          tag_id: tagId,
        }));

        await supabase
          .from('stream_tag_mappings')
          .upsert(tagMappings);
      }

      toast.success('Stream settings updated');
    } catch (error) {
      toast.error('Failed to update stream settings');
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Content Settings</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map((tagId) => {
            const tag = tags?.find(t => t.id === tagId);
            return (
              <Badge
                key={tagId}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setSelectedTags(selectedTags.filter(id => id !== tagId))}
              >
                {tag?.name} ×
              </Badge>
            );
          })}
        </div>
        <Select
          value=""
          onValueChange={(value) => {
            if (!selectedTags.includes(value)) {
              setSelectedTags([...selectedTags, value]);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Add a tag" />
          </SelectTrigger>
          <SelectContent>
            {tags?.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Custom Tag</label>
        <div className="flex gap-2">
          <Input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            placeholder="Enter a custom tag"
          />
          <Button onClick={handleAddTag}>Add</Button>
        </div>
      </div>

      <Button onClick={handleSaveSettings} className="w-full">
        Save Settings
      </Button>
    </div>
  );
}