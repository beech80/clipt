import { useInfiniteQuery } from "@tanstack/react-query";
import PostItem from "./PostItem";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { PostFilters, PostSortOption, PostFilterOption } from "./post/PostFilters";

const POSTS_PER_PAGE = 5;

const PostSkeleton = () => (
  <div className="relative h-[calc(100vh-200px)] bg-[#1A1F2C]">
    <div className="p-3 sm:p-4 border-b border-[#2A2E3B]">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
    <Skeleton className="h-[calc(100%-120px)]" />
    <div className="p-3 sm:p-4 border-t border-[#2A2E3B]">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  </div>
);

const PostList = () => {
  const { ref, inView } = useInView();
  const [sortBy, setSortBy] = useState<PostSortOption>('recent');
  const [filter, setFilter] = useState<PostFilterOption>('all');

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['trending-posts', sortBy, filter],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('trending_posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes (
            count
          ),
          clip_votes (
            count
          )
        `)
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1);

      // Apply filters
      if (filter === 'images') {
        query = query.not('image_url', 'is', null);
      } else if (filter === 'videos') {
        query = query.not('video_url', 'is', null);
      }

      // Apply sorting
      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'trending') {
        query = query.order('trending_score', { ascending: false });
      } else if (sortBy === 'most_liked') {
        query = query.order('likes_count', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
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
      <div className="space-y-4 touch-none">
        {[1, 2, 3].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-4">
        <p className="text-red-500">Error: {error.message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gaming-400 text-white rounded-md hover:bg-gaming-500 transition-colors active:scale-95 touch-manipulation"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PostFilters 
        onSortChange={setSortBy}
        onFilterChange={setFilter}
      />
      <div className="post-container relative h-[calc(100vh-200px)] overflow-y-auto snap-y snap-mandatory scroll-smooth touch-none overscroll-none">
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
              <Loader2 className="h-8 w-8 animate-spin text-gaming-400" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostList;