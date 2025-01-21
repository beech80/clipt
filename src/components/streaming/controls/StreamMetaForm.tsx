import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StreamMetaFormProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  categories?: any[];
  tags?: any[];
}

export const StreamMetaForm = ({
  selectedCategory,
  setSelectedCategory,
  selectedTags,
  setSelectedTags,
  categories,
  tags
}: StreamMetaFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
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
        <Select
          value={selectedTags[0]}
          onValueChange={(value) => setSelectedTags([...selectedTags, value])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Add tags" />
          </SelectTrigger>
          <SelectContent>
            {tags?.map((tag) => (
              <SelectItem 
                key={tag.id} 
                value={tag.id}
                disabled={selectedTags.includes(tag.id)}
              >
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTags.map((tagId) => {
            const tag = tags?.find((t) => t.id === tagId);
            return (
              <div 
                key={tagId}
                className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1"
              >
                {tag?.name}
                <button
                  onClick={() => setSelectedTags(selectedTags.filter(id => id !== tagId))}
                  className="hover:text-destructive"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};