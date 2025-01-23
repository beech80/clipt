import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SearchResultsProps {
  isLoading: boolean;
  results: any;
  onProfileClick: (id: string) => void;
  onPostClick: (id: string) => void;
  onStreamClick: (id: string) => void;
}

export default function SearchResults({ 
  isLoading, 
  results, 
  onProfileClick,
  onPostClick,
  onStreamClick 
}: SearchResultsProps) {
  if (!results) return null;

  return (
    <div className="absolute top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-lg z-50">
      <ScrollArea className="h-[calc(100vh-200px)] sm:h-[300px]">
        <div className="p-2 touch-manipulation">
          {results.profiles.length > 0 && (
            <div className="mb-4">
              <h3 className="px-2 text-sm font-medium text-muted-foreground" id="search-profiles">User Results</h3>
              <div role="list" aria-labelledby="search-profiles">
                {results.profiles.map((profile: any) => (
                  <button
                    key={profile.id}
                    className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-md active:scale-98 transition-transform"
                    onClick={() => onProfileClick(profile.id)}
                    role="listitem"
                    aria-label={`View profile of ${profile.display_name}`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
                      <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-left truncate">
                      <p className="text-sm font-medium line-clamp-1">{profile.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{profile.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

            {results.posts.length > 0 && (
              <div className="mb-4">
                <h3 className="px-2 text-sm font-medium text-muted-foreground">Posts</h3>
                {results.posts.map((post: any) => (
                  <button
                    key={post.id}
                    className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                    onClick={() => onPostClick(post.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.profiles?.avatar_url || ''} />
                      <AvatarFallback>{post.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm">{post.content?.substring(0, 50)}...</p>
                      <p className="text-xs text-muted-foreground">by @{post.profiles?.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.streams.length > 0 && (
              <div>
                <h3 className="px-2 text-sm font-medium text-muted-foreground">Streams</h3>
                {results.streams.map((stream: any) => (
                  <button
                    key={stream.id}
                    className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                    onClick={() => onStreamClick(stream.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={stream.profiles?.avatar_url || ''} />
                      <AvatarFallback>{stream.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium">{stream.title}</p>
                      <p className="text-xs text-muted-foreground">by @{stream.profiles?.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.profiles.length === 0 &&
              results.posts.length === 0 &&
              results.streams.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No results found
                </div>
              )}
        </div>
      </ScrollArea>
    </div>
  );
}
