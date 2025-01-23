import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StreamMetaFormProps {
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  categories?: { id: string; name: string }[];
  tags?: { id: string; name: string }[];
}

export const StreamMetaForm = ({
  selectedCategory,
  setSelectedCategory,
  selectedTags,
  setSelectedTags,
  categories,
  tags,
}: StreamMetaFormProps) => {
  const handleTagSelect = (tagId: string) => {
    setSelectedTags(
      selectedTags.includes(tagId)
        ? selectedTags.filter(id => id !== tagId)
        : [...selectedTags, tagId]
    );
  };

  return (
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
  );
};