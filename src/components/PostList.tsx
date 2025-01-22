import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import PostItem from "./PostItem";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { PostSkeleton } from "./post/PostSkeleton";
import { EmptyPostList } from "./post/EmptyPostList";
import { usePostList } from "@/hooks/usePostList";

const PostList = () => {
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
  } = usePostList();

  const allPosts = data?.pages.flat() ?? [];

  const virtualizer = useVirtualizer({
    count: hasNextPage ? allPosts.length + 1 : allPosts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isMobile ? window.innerHeight - 80 : window.innerHeight - 200,
    overscan: isMobile ? 1 : 2,
  });

  // Load more posts when reaching the end
  const lastItem = virtualizer.getVirtualItems()[virtualizer.getVirtualItems().length - 1];
  if (lastItem && !isFetchingNextPage && hasNextPage && lastItem.index >= allPosts.length - 1) {
    fetchNextPage();
  }

  if (status === "pending") {
    return (
      <div className="space-y-4 px-4 sm:px-0 max-w-3xl mx-auto">
        {[...Array(2)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <Alert variant="destructive" className="mb-4 max-w-md w-full">
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
    return <EmptyPostList />;
  }

  return (
    <div 
      ref={parentRef}
      className={`relative overflow-y-auto scroll-smooth touch-none overscroll-none ${isMobile ? "h-[calc(100vh-80px)]" : "h-[calc(100vh-200px)]"}`}
    >
      <div 
        className="relative space-y-4 px-4 sm:px-0 max-w-3xl mx-auto pb-6"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const post = allPosts[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className={`absolute top-0 left-0 w-full ${isMobile ? "px-2" : ""}`}
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
