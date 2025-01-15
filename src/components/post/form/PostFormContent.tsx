import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PostFormContentProps {
  content: string;
  onChange: (value: string) => void;
  hashtags?: string[];
  mentions?: string[];
}

const MAX_CHARS = 500;

const PostFormContent = ({ content, onChange, hashtags, mentions }: PostFormContentProps) => {
  const remainingChars = MAX_CHARS - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[100px] resize-none"
        maxLength={MAX_CHARS}
      />
      
      <div className="flex justify-between items-center text-sm">
        <span className={`${isOverLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
          {remainingChars} characters remaining
        </span>
      </div>

      {content.length > 0 && !content.trim() && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Post content cannot be empty or only whitespace
          </AlertDescription>
        </Alert>
      )}

      {hashtags && hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag) => (
            <span key={tag} className="text-sm text-blue-500">#{tag}</span>
          ))}
        </div>
      )}

      {mentions && mentions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mentions.map((mention) => (
            <span key={mention} className="text-sm text-blue-500">@{mention}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostFormContent;