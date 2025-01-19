import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import HashtagSuggestions from "./HashtagSuggestions";
import MentionSuggestions from "@/components/mentions/MentionSuggestions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface PostFormContentProps {
  content: string;
  onChange: (value: string) => void;
}

const PostFormContent = ({ content, onChange }: PostFormContentProps) => {
  const [hashtagSearch, setHashtagSearch] = useState<string>("");
  const [mentionSearch, setMentionSearch] = useState<string>("");
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  const { data: hashtagSuggestions } = useQuery({
    queryKey: ['hashtag-suggestions', hashtagSearch],
    queryFn: async () => {
      if (!hashtagSearch) return [];
      
      const { data, error } = await supabase
        .from('hashtags')
        .select('name')
        .ilike('name', `${hashtagSearch}%`)
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: hashtagSearch.length > 0
  });

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

  return (
    <div className="relative">
      <Textarea
        placeholder="Share your gaming moments... Use # for hashtags, @ to mention users"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
        className="min-h-[100px] resize-none"
      />
      {hashtagSearch && hashtagSuggestions && (
        <div className="absolute z-10 w-full max-w-md bg-background border border-border rounded-md shadow-lg mt-1">
          <ul className="py-1">
            {hashtagSuggestions.map((hashtag) => (
              <li
                key={hashtag.name}
                className="px-4 py-2 hover:bg-accent cursor-pointer text-sm"
                onClick={() => handleHashtagSelect(hashtag.name)}
              >
                #{hashtag.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      <MentionSuggestions
        searchTerm={mentionSearch}
        onSelect={(username) => {
          const beforeMention = content.slice(0, cursorPosition).replace(/@\w*$/, "");
          const afterMention = content.slice(cursorPosition);
          const newContent = `${beforeMention}@${username} ${afterMention}`;
          onChange(newContent);
          setMentionSearch("");
        }}
      />
    </div>
  );
};

export default PostFormContent;