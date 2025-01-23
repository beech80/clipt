import { PostSkeleton } from "./PostSkeleton";

export const PostListLoading = () => {
  return (
    <div className="space-y-4 px-4 sm:px-0 max-w-3xl mx-auto">
      {[...Array(2)].map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
};