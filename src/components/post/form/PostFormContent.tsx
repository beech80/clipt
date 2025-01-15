import { Textarea } from "@/components/ui/textarea";

interface PostFormContentProps {
  content: string;
  onChange: (value: string) => void;
}

const PostFormContent = ({ content, onChange }: PostFormContentProps) => {
  return (
    <Textarea
      placeholder="Share your gaming moments..."
      value={content}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-[100px] resize-none"
    />
  );
};

export default PostFormContent;