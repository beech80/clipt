import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SearchFilters } from "@/types/post";
import { subDays } from "date-fns";

export function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    dateRange: 'all',
    hasMedia: false,
    sortBy: 'recent'
  });
  const navigate = useNavigate();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', searchTerm, filters],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return null;

      const getDateFilter = () => {
        switch (filters.dateRange) {
          case 'today':
            return subDays(new Date(), 1).toISOString();
          case 'week':
            return subDays(new Date(), 7).toISOString();
          case 'month':
            return subDays(new Date(), 30).toISOString();
          default:
            return null;
        }
      };

      const dateFilter = getDateFilter();

      const queries = [];

      if (filters.type === 'all' || filters.type === 'posts') {
        let query = supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            image_url,
            video_url,
            profiles:user_id (username, avatar_url)
          `)
          .ilike('content', `%${searchTerm}%`)
          .limit(5);

        if (dateFilter) {
          query = query.gte('created_at', dateFilter);
        }

        if (filters.hasMedia) {
          query = query.or('image_url.neq.null,video_url.neq.null');
        }

        if (filters.sortBy === 'recent') {
          query = query.order('created_at', { ascending: false });
        }

        queries.push(query);
      }

      if (filters.type === 'all' || filters.type === 'profiles') {
        queries.push(
          supabase
            .from('profiles')
            .select('id, username, avatar_url, display_name')
            .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
            .limit(5)
        );
      }

      if (filters.type === 'all' || filters.type === 'streams') {
        let query = supabase
          .from('streams')
          .select(`
            id,
            title,
            description,
            created_at,
            profiles:user_id (username, avatar_url)
          `)
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .limit(5);

        if (dateFilter) {
          query = query.gte('created_at', dateFilter);
        }

        if (filters.sortBy === 'recent') {
          query = query.order('created_at', { ascending: false });
        }

        queries.push(query);
      }

      const [postsResult, profilesResult, streamsResult] = await Promise.all(queries);

      return {
        posts: (filters.type === 'all' || filters.type === 'posts') ? postsResult.data || [] : [],
        profiles: (filters.type === 'all' || filters.type === 'profiles') ? profilesResult?.data || [] : [],
        streams: (filters.type === 'all' || filters.type === 'streams') ? streamsResult?.data || [] : []
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
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search posts, users, streams..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Search Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value: any) => setFilters({ ...filters, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="posts">Posts</SelectItem>
                    <SelectItem value="profiles">Profiles</SelectItem>
                    <SelectItem value="streams">Streams</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value: any) => setFilters({ ...filters, dateRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Last 24 Hours</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Has Media</Label>
                <Switch
                  checked={filters.hasMedia}
                  onCheckedChange={(checked) => setFilters({ ...filters, hasMedia: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sorting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="relevant">Most Relevant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>
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