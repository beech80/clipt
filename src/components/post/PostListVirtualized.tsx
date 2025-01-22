import { useVirtualizer } from "@tanstack/react-virtual";
import { MutableRefObject } from "react";
import { Post } from "@/types/post";
import PostItem from "../PostItem";
import { PostSkeleton } from "./PostSkeleton";
import { InfiniteData } from "@tanstack/react-query";

interface PostListVirtualizedProps {
  parentRef: MutableRefObject<HTMLDivElement | null>;
  data: InfiniteData<Post[]>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  isMobile: boolean;
}

export const PostListVirtualized = ({
  parentRef,
  data,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  isMobile
}: PostListVirtualizedProps) => {
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