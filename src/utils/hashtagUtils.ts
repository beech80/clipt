export const extractHashtags = (content: string): string[] => {
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  return content.match(hashtagRegex)?.map(tag => tag.slice(1)) || [];
};

export const linkifyHashtags = (content: string): string => {
  return content.replace(
    /#[\w\u0590-\u05ff]+/g,
    tag => `<a href="/hashtag/${tag.slice(1)}" class="text-gaming-400 hover:text-gaming-500 hover:underline">${tag}</a>`
  );
};