import { useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePostList } from "@/hooks/usePostList";
import { PostListError } from "./PostListError";
import { PostListLoading } from "./PostListLoading";
import { PostListEmpty } from "./EmptyPostList";
import { PostListVirtualized } from "./PostListVirtualized";

export const PostListContainer = () => {
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

  if (status === "pending") {
    return <PostListLoading />;
  }

  if (status === "error") {
    return <PostListError error={error} onRetry={refetch} />;
  }

  if (!data?.pages || data.pages.length === 0 || data.pages[0].length === 0) {
    return <PostListEmpty />;
  }

  return (
    <PostListVirtualized
      parentRef={parentRef}
      data={data}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      isMobile={isMobile}
    />
  );
};

export default PostListContainer;