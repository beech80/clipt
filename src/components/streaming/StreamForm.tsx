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
    <div className="space-y-4">
      <Input
        placeholder="Stream Title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="bg-[#1A1F2C] border-gaming-400/50 focus:border-gaming-400"
      />
      <Textarea
        placeholder="Stream Description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className="h-24 bg-[#1A1F2C] border-gaming-400/50 focus:border-gaming-400"
      />
    </div>
  );
};