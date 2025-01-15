import { useEffect, useState } from "react";

interface ParsedContent {
  text: string;
  hashtags: string[];
  mentions: string[];
}

export const useContentParser = (content: string) => {
  const [parsed, setParsed] = useState<ParsedContent>({
    text: content,
    hashtags: [],
    mentions: []
  });

  useEffect(() => {
    // Extract hashtags
    const hashtags = content.match(/#[\w\u0590-\u05ff]+/g) || [];
    
    // Extract mentions
    const mentions = content.match(/@[\w\u0590-\u05ff]+/g) || [];
    
    setParsed({
      text: content,
      hashtags: hashtags.map(tag => tag.slice(1)),
      mentions: mentions.map(mention => mention.slice(1))
    });
  }, [content]);

  return parsed;
};

export const formatContent = (text: string) => {
  // Convert URLs to clickable links
  const withLinks = text.replace(
    /(https?:\/\/[^\s]+)/g,
    url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-gaming-400 hover:underline">${url}</a>`
  );

  // Convert hashtags to links
  const withHashtags = withLinks.replace(
    /#([\w\u0590-\u05ff]+)/g,
    '<span class="text-gaming-400 hover:underline cursor-pointer">#$1</span>'
  );

  // Convert mentions to links
  const withMentions = withHashtags.replace(
    /@([\w\u0590-\u05ff]+)/g,
    '<span class="text-gaming-400 hover:underline cursor-pointer">@$1</span>'
  );

  return withMentions;
};