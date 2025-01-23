import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SearchFilters } from '@/types/post';
import { useAuth } from '@/contexts/AuthContext';
import { subDays } from 'date-fns';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export const useSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
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

  const executeSearch = async (term: string, filters: SearchFilters) => {
    if (!term || term.length < 2) return null;

    if (user) {
      const searchData = {
        user_id: user.id,
        query: term,
        filters: filters as unknown as Json,
        category: filters.type
      };
      await supabase.from('search_history').insert(searchData);
    }

    const getDateFilter = () => {
      switch (filters.dateRange) {
        case 'today': return subDays(new Date(), 1).toISOString();
        case 'week': return subDays(new Date(), 7).toISOString();
        case 'month': return subDays(new Date(), 30).toISOString();
        default: return null;
      }
    };

    const dateFilter = getDateFilter();
    const queries = [];

    // Enhanced post search
    if (filters.type === 'all' || filters.type === 'posts') {
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          image_url,
          video_url,
          profiles:user_id (
            username, 
            avatar_url, 
            is_verified
          ),
          likes:likes(count),
          comments:comments(count)
        `)
        .ilike('content', `%${term}%`);

      if (dateFilter) query = query.gte('created_at', dateFilter);
      if (filters.hasMedia) query = query.or('image_url.neq.null,video_url.neq.null');
      if (filters.verifiedOnly) query = query.eq('profiles.is_verified', true);
      if (filters.category !== 'all') query = query.eq('category', filters.category);
      if (filters.sortBy === 'recent') query = query.order('created_at', { ascending: false });
      else if (filters.sortBy === 'popular') query = query.order('likes.count', { ascending: false });
      query = query.limit(filters.maxResults);
      queries.push(query);
    }

    // Enhanced profile search
    if (filters.type === 'all' || filters.type === 'profiles') {
      let query = supabase
        .from('profiles')
        .select('id, username, avatar_url, display_name, is_verified, bio')
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(filters.maxResults);

      if (filters.verifiedOnly) query = query.eq('is_verified', true);
      queries.push(query);
    }

    // Enhanced stream search
    if (filters.type === 'all' || filters.type === 'streams') {
      let query = supabase
        .from('streams')
        .select(`
          id,
          title,
          description,
          created_at,
          viewer_count,
          is_live,
          profiles:user_id (
            username, 
            avatar_url,
            is_verified
          )
        `)
        .or(`title.ilike.%${term}%,description.ilike.%${term}%`);

      if (dateFilter) query = query.gte('created_at', dateFilter);
      if (filters.verifiedOnly) query = query.eq('profiles.is_verified', true);
      if (filters.sortBy === 'recent') query = query.order('created_at', { ascending: false });
      else if (filters.sortBy === 'popular') query = query.order('viewer_count', { ascending: false });
      query = query.limit(filters.maxResults);
      queries.push(query);
    }

    const [postsResult, profilesResult, streamsResult] = await Promise.all(queries);

    return {
      posts: (filters.type === 'all' || filters.type === 'posts') ? postsResult.data || [] : [],
      profiles: (filters.type === 'all' || filters.type === 'profiles') ? profilesResult?.data || [] : [],
      streams: (filters.type === 'all' || filters.type === 'streams') ? streamsResult?.data || [] : []
    };
  };

  return {
    searchTerm,
    setSearchTerm,
    searchHistory,
    executeSearch
  };
};