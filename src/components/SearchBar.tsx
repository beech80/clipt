import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { SearchFilters as SearchFiltersType } from "@/types/post";
import { subDays } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { SearchInput } from "./search/SearchInput";
import { SearchFilters } from "./search/SearchFilters";
import { SearchHistory } from "./search/SearchHistory";
import { SearchResults } from "./search/SearchResults";
import { Json } from "@/integrations/supabase/types";

export function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SearchFiltersType>({
    type: 'all',
    dateRange: 'all',
    hasMedia: false,
    sortBy: 'recent'
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: searchHistory } = useQuery({
    queryKey: ['search-history'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', searchTerm, filters],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return null;

      // Save search to history
      if (user) {
        const searchData = {
          user_id: user.id,
          query: searchTerm,
          filters: filters as unknown as Json,
          category: filters.type
        };
        await supabase.from('search_history').insert(searchData);
      }

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

  const handleSearchHistoryClick = (historyItem: any) => {
    setSearchTerm(historyItem.query);
    if (historyItem.filters) {
      setFilters(historyItem.filters);
    }
    toast.success("Loaded search from history");
  };

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
        <SearchInput 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
        />
        <SearchFilters 
          filters={filters} 
          onFiltersChange={setFilters} 
        />
      </div>

      {searchTerm.length >= 2 ? (
        <SearchResults
          isLoading={isLoading}
          results={searchResults}
          onProfileClick={handleProfileClick}
          onPostClick={handlePostClick}
          onStreamClick={handleStreamClick}
        />
      ) : (
        <SearchHistory
          searchHistory={searchHistory || []}
          onHistoryItemClick={handleSearchHistoryClick}
        />
      )}
    </div>
  );
}