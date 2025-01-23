import React from 'react';
import { StreamForm } from "../StreamForm";
import { StreamMetaForm } from "./StreamMetaForm";
import { StreamStartButton } from "./StreamStartButton";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface StreamPreStartControlsProps {
  userId?: string;
  title: string;
  description: string;
  selectedCategory: string;
  selectedTags: string[];
  categories: any[];
  tags: any[];
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onCategoryChange: (category: string) => void;
  onTagsChange: (tags: string[]) => void;
  onStreamStart: () => void;
  isLoading: boolean;
}

export const StreamPreStartControls = ({
  userId,
  title,
  description,
  selectedCategory,
  selectedTags,
  categories,
  tags,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onTagsChange,
  onStreamStart,
  isLoading
}: StreamPreStartControlsProps) => {
  const handleStartStream = () => {
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

    onStreamStart();
  };

  return (
    <Card className="p-6 space-y-6">
      <StreamForm
        title={title}
        description={description}
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
      />
      
      <StreamMetaForm
        selectedCategory={selectedCategory}
        setSelectedCategory={onCategoryChange}
        selectedTags={selectedTags}
        setSelectedTags={onTagsChange}
        categories={categories}
        tags={tags}
      />

      <StreamStartButton 
        onClick={handleStartStream}
        isLoading={isLoading}
      />
    </Card>
  );
};