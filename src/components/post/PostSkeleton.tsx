import { Skeleton } from "@/components/ui/skeleton";

export const PostSkeleton = () => (
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