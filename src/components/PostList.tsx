import { useInfiniteQuery } from "@tanstack/react-query";
import PostItem from "./PostItem";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/post";

const POSTS_PER_PAGE = 5;

const PostSkeleton = () => (
  <div className="relative h-[calc(100vh-200px)] bg-[#1A1F2C]">
    <div className="p-3 sm:p-4 border-b border-[#2A2E3B]">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
    </div>
    <div className="h-[calc(100%-88px)]">
      <Skeleton className="h-full w-full" />
    </div>
  </div>
);

const PostList = () => {
  const { ref, inView } = useInView({
    threshold: 0.5,
    rootMargin: "100px",
  });

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
      const { data, error } = await supabase
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
        .is('is_published', true)
        .throwOnError();

      if (error) throw error;
      return data as Post[];
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage?.length === POSTS_PER_PAGE ? pages.length : undefined;
    },
    gcTime: 1000 * 60 * 30, // Keep cache for 30 minutes (renamed from cacheTime)
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (status === "loading") {
    return (
      <div className="space-y-4 touch-none">
        {[...Array(3)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-4">
        <p className="text-red-500">Error loading posts: {error.message}</p>
        <Button 
          onClick={() => window.location.reload()}
          variant="secondary"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="post-container relative h-[calc(100vh-200px)] overflow-y-auto snap-y snap-mandatory scroll-smooth touch-none overscroll-none">
      {data.pages.map((page) => (
        page?.map((post) => (
          <div key={post.id} className="snap-start">
            <PostItem post={post} />
          </div>
        ))
      ))}
      {hasNextPage && (
        <div ref={ref} className="h-20 flex items-center justify-center">
          {isFetchingNextPage && <PostSkeleton />}
        </div>
      )}
    </div>
  );
};

export default PostList;