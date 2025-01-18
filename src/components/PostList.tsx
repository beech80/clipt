import { useInfiniteQuery } from "@tanstack/react-query";
import PostItem from "./PostItem";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

/**
 * Number of posts to fetch per page for infinite scrolling
 */
const POSTS_PER_PAGE = 5;

/**
 * PostSkeleton Component
 * 
 * Displays a loading placeholder for posts while content is being fetched.
 * Maintains the same dimensions and layout as actual posts for a smooth transition.
 */
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

/**
 * PostList Component
 * 
 * Renders a list of posts with infinite scrolling functionality.
 * Features:
 * - Infinite scrolling using Intersection Observer
 * - Loading states with skeleton placeholders
 * - Error handling with retry option
 * - Optimized performance with React Query
 * - Responsive design for all screen sizes
 */
const PostList = () => {
  // Set up intersection observer for infinite scrolling
  const { ref, inView } = useInView();

  // Fetch posts with infinite query
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['trending-posts'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
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
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage || lastPage.length < POSTS_PER_PAGE) return undefined;
      return pages.length;
    },
  });

  // Load more posts when user scrolls to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Show loading state
  if (status === "pending") {
    return (
      <div className="space-y-4 touch-none">
        {[1, 2, 3].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show error state
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

  // Render post list
  return (
    <div className="post-container relative h-[calc(100vh-200px)] overflow-y-auto snap-y snap-mandatory scroll-smooth touch-none overscroll-none">
      {data.pages.map((page) => (
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
  );
};

export default PostList;