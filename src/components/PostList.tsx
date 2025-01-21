import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import PostItem from "./PostItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/post";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

const POSTS_PER_PAGE = 5;

const PostSkeleton = () => (
  <div className="relative h-[calc(100vh-200px)] sm:h-[500px] bg-card/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg border border-border/50">
    <div className="p-4 border-b border-border/50">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-3 w-[100px]" />
        </div>
      </div>
    </div>
    <div className="h-[calc(100%-76px)]">
      <Skeleton className="h-full w-full" />
    </div>
  </div>
);

const PostList = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch
  } = useInfiniteQuery({
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

  const allPosts = data?.pages.flat() ?? [];

  const virtualizer = useVirtualizer({
    count: hasNextPage ? allPosts.length + 1 : allPosts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isMobile ? window.innerHeight - 120 : window.innerHeight - 200,
    overscan: 2,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Load more posts when reaching the end
  const lastItem = virtualItems[virtualItems.length - 1];
  if (lastItem && !isFetchingNextPage && hasNextPage && lastItem.index >= allPosts.length - 1) {
    fetchNextPage();
  }

  if (status === "pending") {
    return (
      <div className="space-y-6 px-4 sm:px-0 max-w-3xl mx-auto">
        {[...Array(2)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || "Error loading posts"}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => refetch()}
          variant="secondary"
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!data?.pages || data.pages.length === 0 || data.pages[0].length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        {user ? (
          <p className="text-muted-foreground text-center max-w-md">
            Follow some creators to see their posts here!
          </p>
        ) : (
          <p className="text-muted-foreground text-center max-w-md">
            Sign in to see personalized content from creators you follow!
          </p>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={parentRef}
      className={`relative ${isMobile ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-200px)]'} 
                  overflow-y-auto scroll-smooth touch-none overscroll-none`}
    >
      <div 
        className="relative space-y-6 px-4 sm:px-0 max-w-3xl mx-auto pb-6"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualItems.map((virtualItem) => {
          const post = allPosts[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {post ? (
                <PostItem post={post} />
              ) : isFetchingNextPage ? (
                <PostSkeleton />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PostList;