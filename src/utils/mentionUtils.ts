import { supabase } from "@/lib/supabase";

export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);
  return matches ? matches.map(match => match.slice(1)) : [];
  return matches ? matches.map(match => match.slice(1)) : [];
};

export const linkifyMentions = (content: string): string => {
  return content.replace(/@(\w+)/g, '<a href="/profile/$1" class="text-gaming-400 hover:underline">@$1</a>');
};

export const searchUsers = async (query: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, avatar_url, id')
    .ilike('username', `${query}%`)
    .limit(5);

  if (error) throw error;
  return data;
};

export const createMention = async (
  mentionedUsername: string,
  postId?: string,
  commentId?: string
) => {
  // First get the mentioned user's ID
  const { data: mentionedUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', mentionedUsername)
    .single();

  if (!mentionedUser) return;

  // Create the mention
  const { error } = await supabase
    .from('mentions')
    .insert({
      mentioned_user_id: mentionedUser.id,
      mentioning_user_id: (await supabase.auth.getUser()).data.user?.id,
      post_id: postId,
      comment_id: commentId
    });

  if (error) throw error;
};