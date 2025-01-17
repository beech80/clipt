import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

export function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return null;

      const [postsResult, profilesResult, streamsResult] = await Promise.all([
        // Search posts
        supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            profiles:user_id (username, avatar_url)
          `)
          .ilike('content', `%${searchTerm}%`)
          .limit(5),

        // Search profiles
        supabase
          .from('profiles')
          .select('id, username, avatar_url, display_name')
          .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
          .limit(5),

        // Search streams
        supabase
          .from('streams')
          .select(`
            id,
            title,
            description,
            profiles:user_id (username, avatar_url)
          `)
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .limit(5)
      ]);

      return {
        posts: postsResult.data || [],
        profiles: profilesResult.data || [],
        streams: streamsResult.data || []
      };
    },
    enabled: searchTerm.length >= 2
  });

  const handleProfileClick = (id: string) => {
    navigate(`/profile/${id}`);
    setSearchTerm("");
  };

  const handlePostClick = (id: string) => {
    navigate(`/post/${id}`);
    setSearchTerm("");
  };

  const handleStreamClick = (id: string) => {
    navigate(`/stream/${id}`);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search posts, users, streams..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {searchTerm.length >= 2 && (
        <div className="absolute top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md z-50">
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : searchResults ? (
              <div className="p-2">
                {/* Profiles */}
                {searchResults.profiles.length > 0 && (
                  <div className="mb-4">
                    <h3 className="px-2 text-sm font-medium text-muted-foreground">Users</h3>
                    {searchResults.profiles.map((profile) => (
                      <button
                        key={profile.id}
                        className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                        onClick={() => handleProfileClick(profile.id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile.avatar_url || ''} />
                          <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="text-sm font-medium">{profile.display_name}</p>
                          <p className="text-xs text-muted-foreground">@{profile.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Posts */}
                {searchResults.posts.length > 0 && (
                  <div className="mb-4">
                    <h3 className="px-2 text-sm font-medium text-muted-foreground">Posts</h3>
                    {searchResults.posts.map((post) => (
                      <button
                        key={post.id}
                        className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                        onClick={() => handlePostClick(post.id)}
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

                {/* Streams */}
                {searchResults.streams.length > 0 && (
                  <div>
                    <h3 className="px-2 text-sm font-medium text-muted-foreground">Streams</h3>
                    {searchResults.streams.map((stream) => (
                      <button
                        key={stream.id}
                        className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                        onClick={() => handleStreamClick(stream.id)}
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

                {searchResults.profiles.length === 0 &&
                  searchResults.posts.length === 0 &&
                  searchResults.streams.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No results found
                    </div>
                  )}
              </div>
            ) : null}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}