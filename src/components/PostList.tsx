import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "./PostItem";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";

const POSTS_PER_PAGE = 5;

interface Post {
  id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes: { count: number }[];
  clip_votes: { count: number }[];
}

const PostList = () => {
  const { ref, inView } = useInView();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = Number(pageParam) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes:likes (
            count
          ),
          clip_votes:clip_votes (
            count
          )
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data as Post[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage || lastPage.length < POSTS_PER_PAGE) return undefined;
      return pages.length;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (status === "pending") {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-gaming-400" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <p className="text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {data.pages.map((page, i) => (
        page.map((post) => (
          <div key={post.id} className="snap-start snap-always h-[calc(100vh-200px)]">
            <PostItem 
              post={{
                ...post,
                likes_count: post.likes?.[0]?.count || 0,
                clip_votes: post.clip_votes || []
              }} 
            />
          </div>
        ))
      ))}
      {hasNextPage && (
        <div
          ref={ref}
          className="flex justify-center p-4"
        >
          {isFetchingNextPage && (
            <Loader2 className="w-6 h-6 animate-spin text-gaming-400" />
          )}
        </div>
      )}
    </div>
  );
};

export default PostList;