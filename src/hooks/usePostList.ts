import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/post";
import { useAuth } from "@/contexts/AuthContext";

const POSTS_PER_PAGE = 5;

export const usePostList = () => {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['posts', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      let followedUserIds: string[] = [];
      if (user) {
        const { data: followsData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        
        followedUserIds = followsData?.map(follow => follow.following_id) || [];
      }

      const query = supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          video_url,
          created_at,
          user_id,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes:likes!post_id (
            count
          ),
          clip_votes:clip_votes!post_id (
            count
          )
        `)
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1)
        .order('created_at', { ascending: false })
        .is('is_published', true);

      if (user && followedUserIds.length > 0) {
        query.in('user_id', followedUserIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Post[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      return lastPage && lastPage.length === POSTS_PER_PAGE ? pages.length : undefined;
    },
    gcTime: 1000 * 60 * 30, // Cache for 30 minutes
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
};