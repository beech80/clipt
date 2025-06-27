import { supabase } from '@/supabaseClient';
import { useUser } from '@/hooks/useUser';

export interface StreamRecommendation {
  id: string;
  title: string;
  thumbnail_url: string;
  user_id: string;
  username: string;
  avatar_url: string;
  is_live: boolean;
  viewer_count: number;
  duration: number;
  created_at: string;
  category: string;
  tags: string[];
  score: number;
  reason: string;
}

export interface RecommendationOptions {
  limit?: number;
  category?: string;
  excludeIds?: string[];
  followedOnly?: boolean;
}

export class RecommendationService {
  /**
   * Get personalized stream recommendations based on viewing history
   */
  static async getPersonalizedRecommendations(
    userId: string,
    options: RecommendationOptions = {}
  ): Promise<StreamRecommendation[]> {
    try {
      // Default options
      const limit = options.limit || 10;
      const excludeIds = options.excludeIds || [];
      
      // Get user's viewing history for embeddings query
      const { data: viewingHistory } = await supabase
        .from('stream_view_history')
        .select('stream_id, watch_time')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!viewingHistory || viewingHistory.length === 0) {
        // Fall back to popularity-based recommendations if no history
        return this.getPopularRecommendations(options);
      }
      
      // Get watched stream IDs to fetch their embeddings
      const watchedStreamIds = viewingHistory.map(item => item.stream_id);
      
      // Retrieve embeddings for watched streams
      const { data: watchedStreams } = await supabase
        .from('streams')
        .select('id, embedding')
        .in('id', watchedStreamIds)
        .not('embedding', 'is', null);
      
      if (!watchedStreams || watchedStreams.length === 0) {
        return this.getPopularRecommendations(options);
      }
      
      // Calculate average embedding vector from watched streams
      // This represents the user's content preference center
      const avgEmbedding = this.calculateAverageEmbedding(watchedStreams.map(s => s.embedding));
      
      // Query for similar streams using vector search
      let query = supabase.rpc('match_streams_by_embedding', {
        query_embedding: avgEmbedding,
        match_threshold: 0.7,
        match_count: limit * 2 // Get more than needed to filter
      });
      
      // Apply category filter if specified
      if (options.category) {
        query = query.eq('category', options.category);
      }
      
      // Apply followed-only filter if specified
      if (options.followedOnly) {
        const { data: followedUsers } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);
          
        if (followedUsers && followedUsers.length > 0) {
          const followingIds = followedUsers.map(f => f.following_id);
          query = query.in('user_id', followingIds);
        } else {
          return []; // No followed users, return empty array
        }
      }
      
      // Execute the query
      const { data: matchedStreams, error } = await query;
      
      if (error) {
        console.error('Error getting personalized recommendations:', error);
        return this.getPopularRecommendations(options);
      }
      
      // Filter out excluded IDs and format results
      return matchedStreams
        .filter(stream => !excludeIds.includes(stream.id))
        .slice(0, limit)
        .map(stream => ({
          ...stream,
          reason: 'Based on your viewing history'
        }));
    } catch (error) {
      console.error('Error in getPersonalizedRecommendations:', error);
      return this.getPopularRecommendations(options);
    }
  }
  
  /**
   * Get trending stream recommendations
   */
  static async getTrendingRecommendations(
    options: RecommendationOptions = {}
  ): Promise<StreamRecommendation[]> {
    try {
      const limit = options.limit || 10;
      const excludeIds = options.excludeIds || [];
      
      // Calculate trending score based on recent views and engagement
      let query = supabase
        .from('streams')
        .select(`
          id, 
          title, 
          thumbnail_url, 
          user_id,
          profiles(username, avatar_url),
          is_live,
          viewer_count,
          duration,
          created_at,
          category,
          tags,
          views,
          likes,
          comments
        `)
        .order('trending_score', { ascending: false })
        .limit(limit * 2);
      
      // Apply category filter if specified
      if (options.category) {
        query = query.eq('category', options.category);
      }
      
      const { data: streams, error } = await query;
      
      if (error || !streams) {
        console.error('Error getting trending recommendations:', error);
        return [];
      }
      
      // Filter out excluded IDs and format results
      return streams
        .filter(stream => !excludeIds.includes(stream.id))
        .slice(0, limit)
        .map(stream => ({
          ...stream,
          username: stream.profiles?.username || 'Unknown',
          avatar_url: stream.profiles?.avatar_url || '',
          reason: 'Trending now',
          score: this.calculateTrendingScore(stream)
        }));
    } catch (error) {
      console.error('Error in getTrendingRecommendations:', error);
      return [];
    }
  }
  
  /**
   * Get popular stream recommendations
   */
  static async getPopularRecommendations(
    options: RecommendationOptions = {}
  ): Promise<StreamRecommendation[]> {
    try {
      const limit = options.limit || 10;
      const excludeIds = options.excludeIds || [];
      
      let query = supabase
        .from('streams')
        .select(`
          id, 
          title, 
          thumbnail_url, 
          user_id,
          profiles(username, avatar_url),
          is_live,
          viewer_count,
          duration,
          created_at,
          category,
          tags,
          views
        `)
        .order('views', { ascending: false })
        .limit(limit * 2);
      
      // Apply category filter if specified
      if (options.category) {
        query = query.eq('category', options.category);
      }
      
      const { data: streams, error } = await query;
      
      if (error || !streams) {
        console.error('Error getting popular recommendations:', error);
        return [];
      }
      
      // Filter out excluded IDs and format results
      return streams
        .filter(stream => !excludeIds.includes(stream.id))
        .slice(0, limit)
        .map(stream => ({
          ...stream,
          username: stream.profiles?.username || 'Unknown',
          avatar_url: stream.profiles?.avatar_url || '',
          reason: 'Popular in the community',
          score: stream.views || 0
        }));
    } catch (error) {
      console.error('Error in getPopularRecommendations:', error);
      return [];
    }
  }
  
  /**
   * Get recommended live streams
   */
  static async getLiveRecommendations(
    options: RecommendationOptions = {}
  ): Promise<StreamRecommendation[]> {
    try {
      const limit = options.limit || 10;
      const excludeIds = options.excludeIds || [];
      
      let query = supabase
        .from('streams')
        .select(`
          id, 
          title, 
          thumbnail_url, 
          user_id,
          profiles(username, avatar_url),
          is_live,
          viewer_count,
          duration,
          created_at,
          category,
          tags
        `)
        .eq('is_live', true)
        .order('viewer_count', { ascending: false })
        .limit(limit * 2);
      
      // Apply category filter if specified
      if (options.category) {
        query = query.eq('category', options.category);
      }
      
      // Apply followed-only filter if specified
      if (options.followedOnly) {
        const { data: followedUsers } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', options.userId || '');
          
        if (followedUsers && followedUsers.length > 0) {
          const followingIds = followedUsers.map(f => f.following_id);
          query = query.in('user_id', followingIds);
        } else {
          return []; // No followed users, return empty array
        }
      }
      
      const { data: streams, error } = await query;
      
      if (error || !streams) {
        console.error('Error getting live recommendations:', error);
        return [];
      }
      
      // Filter out excluded IDs and format results
      return streams
        .filter(stream => !excludeIds.includes(stream.id))
        .slice(0, limit)
        .map(stream => ({
          ...stream,
          username: stream.profiles?.username || 'Unknown',
          avatar_url: stream.profiles?.avatar_url || '',
          reason: 'Live now',
          score: stream.viewer_count || 0
        }));
    } catch (error) {
      console.error('Error in getLiveRecommendations:', error);
      return [];
    }
  }
  
  /**
   * Get similar streams to a given stream
   */
  static async getSimilarStreams(
    streamId: string,
    options: RecommendationOptions = {}
  ): Promise<StreamRecommendation[]> {
    try {
      const limit = options.limit || 6;
      
      // Get the source stream with its embedding
      const { data: sourceStream } = await supabase
        .from('streams')
        .select('embedding')
        .eq('id', streamId)
        .single();
        
      if (!sourceStream || !sourceStream.embedding) {
        return this.getPopularRecommendations(options);
      }
      
      // Query for similar streams using vector search
      const { data: matchedStreams, error } = await supabase.rpc('match_streams_by_embedding', {
        query_embedding: sourceStream.embedding,
        match_threshold: 0.7,
        match_count: limit
      }).neq('id', streamId); // Exclude the source stream
      
      if (error || !matchedStreams) {
        console.error('Error getting similar streams:', error);
        return [];
      }
      
      // Format results
      return matchedStreams.map(stream => ({
        ...stream,
        reason: 'Similar content',
        score: stream.similarity || 0
      }));
    } catch (error) {
      console.error('Error in getSimilarStreams:', error);
      return [];
    }
  }
  
  /**
   * Get streams by category
   */
  static async getCategoryStreams(
    category: string,
    options: RecommendationOptions = {}
  ): Promise<StreamRecommendation[]> {
    try {
      const limit = options.limit || 10;
      
      const { data: streams, error } = await supabase
        .from('streams')
        .select(`
          id, 
          title, 
          thumbnail_url, 
          user_id,
          profiles(username, avatar_url),
          is_live,
          viewer_count,
          duration,
          created_at,
          category,
          tags,
          views
        `)
        .eq('category', category)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error || !streams) {
        console.error(`Error getting streams for category ${category}:`, error);
        return [];
      }
      
      // Format results
      return streams.map(stream => ({
        ...stream,
        username: stream.profiles?.username || 'Unknown',
        avatar_url: stream.profiles?.avatar_url || '',
        reason: `Top ${category} content`,
        score: stream.views || 0
      }));
    } catch (error) {
      console.error('Error in getCategoryStreams:', error);
      return [];
    }
  }
  
  /**
   * Calculate average embedding from a list of embeddings
   */
  private static calculateAverageEmbedding(embeddings: number[][]): number[] {
    if (!embeddings || embeddings.length === 0) {
      return [];
    }
    
    const dimensions = embeddings[0].length;
    const result = new Array(dimensions).fill(0);
    
    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        result[i] += embedding[i];
      }
    }
    
    // Average
    for (let i = 0; i < dimensions; i++) {
      result[i] /= embeddings.length;
    }
    
    return result;
  }
  
  /**
   * Calculate trending score based on views, likes, comments and recency
   */
  private static calculateTrendingScore(stream: any): number {
    const views = stream.views || 0;
    const likes = stream.likes || 0;
    const comments = stream.comments || 0;
    const viewerCount = stream.viewer_count || 0;
    
    // Calculate recency factor (higher for newer content)
    const createdDate = new Date(stream.created_at);
    const now = new Date();
    const ageInHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    const recencyFactor = Math.max(0.1, Math.min(1, 48 / (ageInHours + 12))); // Higher for newer content
    
    // Calculate engagement rate (likes + comments per view)
    const engagementRate = views > 0 ? (likes + comments) / views : 0;
    
    // Live streams get a boost based on current viewers
    const liveBoost = stream.is_live ? viewerCount * 2 : 0;
    
    // Combine factors for final score
    return (views * 0.4 + (likes + comments * 2) * 0.3 + liveBoost * 0.3) * recencyFactor;
  }
}

// Hook for easy access to recommendations
export const useStreamRecommendations = () => {
  const { user } = useUser();
  
  const getPersonalized = async (options: RecommendationOptions = {}) => {
    if (!user) return [];
    return RecommendationService.getPersonalizedRecommendations(user.id, options);
  };
  
  const getTrending = async (options: RecommendationOptions = {}) => {
    return RecommendationService.getTrendingRecommendations(options);
  };
  
  const getPopular = async (options: RecommendationOptions = {}) => {
    return RecommendationService.getPopularRecommendations(options);
  };
  
  const getLive = async (options: RecommendationOptions = {}) => {
    return RecommendationService.getLiveRecommendations({
      ...options,
      userId: user?.id
    });
  };
  
  const getSimilar = async (streamId: string, options: RecommendationOptions = {}) => {
    return RecommendationService.getSimilarStreams(streamId, options);
  };
  
  const getByCategory = async (category: string, options: RecommendationOptions = {}) => {
    return RecommendationService.getCategoryStreams(category, options);
  };
  
  return {
    getPersonalized,
    getTrending,
    getPopular,
    getLive,
    getSimilar,
    getByCategory
  };
};
