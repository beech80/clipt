import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface StreamFormProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export const StreamForm = ({ 
  title, 
  description, 
  onTitleChange, 
  onDescriptionChange 
}: StreamFormProps) => {
  return (
    <div>
      <Input
        placeholder="Stream Title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="mb-2"
      />
      <Textarea
        placeholder="Stream Description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className="h-24"
      />
    </div>
  );
};