import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import HashtagSuggestions from "./HashtagSuggestions";
import MentionSuggestions from "@/components/mentions/MentionSuggestions";

interface PostFormContentProps {
  content: string;
  onChange: (value: string) => void;
}

const PostFormContent = ({ content, onChange }: PostFormContentProps) => {
  const [hashtagSearch, setHashtagSearch] = useState<string>("");
  const [mentionSearch, setMentionSearch] = useState<string>("");
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  useEffect(() => {
    const hashtagMatch = content
      .slice(0, cursorPosition)
      .match(/#(\w*)$/);
    const mentionMatch = content
      .slice(0, cursorPosition)
      .match(/@(\w*)$/);
    
    setHashtagSearch(hashtagMatch ? hashtagMatch[1] : "");
    setMentionSearch(mentionMatch ? mentionMatch[1] : "");
  }, [content, cursorPosition]);

  const handleHashtagSelect = (hashtag: string) => {
    const beforeHashtag = content.slice(0, cursorPosition).replace(/#\w*$/, "");
    const afterHashtag = content.slice(cursorPosition);
    const newContent = `${beforeHashtag}#${hashtag} ${afterHashtag}`;
    onChange(newContent);
    setHashtagSearch("");
  };

  const handleMentionSelect = (username: string) => {
    const beforeMention = content.slice(0, cursorPosition).replace(/@\w*$/, "");
    const afterMention = content.slice(cursorPosition);
    const newContent = `${beforeMention}@${username} ${afterMention}`;
    onChange(newContent);
    setMentionSearch("");
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  return (
    <div className="relative">
      <Textarea
        placeholder="Share your gaming moments... Use @ to mention users"
        value={content}
        onChange={handleContentChange}
        onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
        className="min-h-[100px] resize-none"
      />
      <HashtagSuggestions
        searchTerm={hashtagSearch}
        onSelect={handleHashtagSelect}
      />
      <MentionSuggestions
        searchTerm={mentionSearch}
        onSelect={handleMentionSelect}
      />
    </div>
  );
};

export default PostFormContent;