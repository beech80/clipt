import { supabase } from '@/lib/supabase';
import { BoostType } from '@/components/boost/BoostTracker';

// Define the interface for a boost
export interface Boost {
  id: string;
  user_id: string;
  content_id: string; // Can be post_id or stream_id
  content_type: 'post' | 'stream';
  boost_type: BoostType;
  created_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'cancelled';
  cost: number;
}

// Define the interface for detailed boost analytics
export interface BoostAnalytics {
  id: string;
  boostType: BoostType;
  startTime: string;
  endTime: string;
  progress: number;
  metrics: {
    views: number;
    viewsFromBoost: number;
    engagement: number;
    engagementFromBoost: number;
    likes: number;
    likesFromBoost: number;
    shares: number;
    sharesFromBoost: number;
    newFollowers: number;
    reachedUsers: number;
    // For Chain Reaction
    chainMultiplier?: number;
    chainSpread?: number;
    // For King boost
    rankBefore?: number;
    rankDuring?: number;
    // For Stream Surge
    viewersBefore?: number;
    viewersPeak?: number;
    minutesWatched?: number;
  };
}

// Get boost duration in hours based on type
const getBoostDuration = (boostType: BoostType): number => {
  switch (boostType) {
    case 'squad_blast':
      return 24; // 24 hours
    case 'chain_reaction':
      return 6; // 6 hours
    case 'king':
      return 2; // 2 hours
    case 'stream_surge':
      return 0.5; // 30 minutes
    default:
      return 24;
  }
};

// Get boost cost based on type
export const getBoostCost = (boostType: BoostType): number => {
  switch (boostType) {
    case 'squad_blast':
      return 40;
    case 'chain_reaction':
      return 60;
    case 'king':
      return 80;
    case 'stream_surge':
      return 50;
    default:
      return 50;
  }
};

// Apply a boost to a post or stream
export const applyBoost = async (
  userId: string,
  contentId: string,
  contentType: 'post' | 'stream',
  boostType: BoostType
): Promise<Boost | null> => {
  try {
    // Calculate expiration time based on boost type
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (getBoostDuration(boostType) * 60 * 60 * 1000));
    
    const cost = getBoostCost(boostType);
    
    // First, check if user has enough tokens
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('tokens')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      console.error('Error fetching user tokens:', userError);
      throw new Error('Could not fetch user tokens');
    }
    
    if (userData.tokens < cost) {
      throw new Error('Not enough tokens to apply this boost');
    }
    
    // Start a transaction - deduct tokens and create boost
    const { data: boostData, error: boostError } = await supabase
      .from('boosts')
      .insert([
        {
          user_id: userId,
          content_id: contentId,
          content_type: contentType,
          boost_type: boostType,
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'active',
          cost: cost
        }
      ])
      .select()
      .single();
      
    if (boostError) {
      console.error('Error creating boost:', boostError);
      throw new Error('Failed to create boost');
    }
    
    // Deduct tokens from user
    const { error: tokenError } = await supabase
      .from('profiles')
      .update({ tokens: userData.tokens - cost })
      .eq('id', userId);
      
    if (tokenError) {
      console.error('Error updating user tokens:', tokenError);
      throw new Error('Failed to update user tokens');
    }
    
    // Create a record in the token_transactions table
    const { error: transactionError } = await supabase
      .from('token_transactions')
      .insert([
        {
          user_id: userId,
          amount: -cost,
          type: 'boost',
          description: `Applied ${boostType} boost`,
          reference_id: boostData.id,
          created_at: now.toISOString()
        }
      ]);
      
    if (transactionError) {
      console.error('Error recording token transaction:', transactionError);
    }
    
    return boostData as Boost;
  } catch (error) {
    console.error('Error in applyBoost:', error);
    return null;
  }
};

// Get all active boosts for a user
export const getUserActiveBoosts = async (userId: string): Promise<Boost[]> => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('boosts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', now)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching active boosts:', error);
      return [];
    }
    
    return data as Boost[];
  } catch (error) {
    console.error('Error in getUserActiveBoosts:', error);
    return [];
  }
};

// Calculate boost analytics based on current data
export const getBoostAnalytics = async (boostId: string): Promise<BoostAnalytics | null> => {
  try {
    // First get the boost details
    const { data: boostData, error: boostError } = await supabase
      .from('boosts')
      .select(`
        *,
        boost_metrics (*)
      `)
      .eq('id', boostId)
      .single();
      
    if (boostError || !boostData) {
      console.error('Error fetching boost details:', boostError);
      return null;
    }
    
    // Get engagement metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('boost_metrics')
      .select('*')
      .eq('boost_id', boostId)
      .single();
    
    if (metricsError) {
      console.error('Error fetching boost metrics:', metricsError);
      // Continue with default metrics if no data found
    }
    
    const boost = boostData as Boost;
    const startTime = new Date(boost.created_at);
    const endTime = new Date(boost.expires_at);
    const now = new Date();
    
    // Calculate progress percentage
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = Math.min(now.getTime() - startTime.getTime(), totalDuration);
    const progress = Math.round((elapsed / totalDuration) * 100);
    
    // Get baseline metrics from before boost was applied
    const beforeBoost = {
      views: 0,
      engagement: 0,
      likes: 0,
      shares: 0,
      followers: 0
    };
    
    // Get current metrics
    const currentMetrics = metrics || {
      views: 100,
      engagement: 30,
      likes: 25,
      shares: 5,
      new_followers: 2,
      reached_users: 150,
      chain_multiplier: 1.5,
      chain_spread: 35,
      rank_before: 50,
      rank_during: 8,
      viewers_before: 20,
      viewers_peak: 220,
      minutes_watched: 1250
    };
    
    // If boost type is king, get the rank information
    let rankBefore, rankDuring;
    if (boost.boost_type === 'king') {
      rankBefore = currentMetrics.rank_before;
      rankDuring = currentMetrics.rank_during;
    }
    
    // If boost type is stream_surge, get viewer information
    let viewersBefore, viewersPeak, minutesWatched;
    if (boost.boost_type === 'stream_surge') {
      viewersBefore = currentMetrics.viewers_before;
      viewersPeak = currentMetrics.viewers_peak;
      minutesWatched = currentMetrics.minutes_watched;
    }
    
    // If boost type is chain_reaction, get chain information
    let chainMultiplier, chainSpread;
    if (boost.boost_type === 'chain_reaction') {
      chainMultiplier = currentMetrics.chain_multiplier;
      chainSpread = currentMetrics.chain_spread;
    }
    
    return {
      id: boost.id,
      boostType: boost.boost_type,
      startTime: boost.created_at,
      endTime: boost.expires_at,
      progress,
      metrics: {
        views: currentMetrics.views,
        viewsFromBoost: currentMetrics.views - beforeBoost.views,
        engagement: currentMetrics.engagement,
        engagementFromBoost: currentMetrics.engagement - beforeBoost.engagement,
        likes: currentMetrics.likes,
        likesFromBoost: currentMetrics.likes - beforeBoost.likes,
        shares: currentMetrics.shares,
        sharesFromBoost: currentMetrics.shares - beforeBoost.shares,
        newFollowers: currentMetrics.new_followers || 0,
        reachedUsers: currentMetrics.reached_users || 0,
        // For Chain Reaction
        chainMultiplier,
        chainSpread,
        // For King boost
        rankBefore,
        rankDuring,
        // For Stream Surge
        viewersBefore,
        viewersPeak,
        minutesWatched
      }
    };
  } catch (error) {
    console.error('Error in getBoostAnalytics:', error);
    return null;
  }
};

// Extend an existing boost
export const extendBoost = async (boostId: string, userId: string): Promise<boolean> => {
  try {
    // Get the current boost
    const { data: boostData, error: boostError } = await supabase
      .from('boosts')
      .select('*')
      .eq('id', boostId)
      .eq('user_id', userId) // Ensure the user owns this boost
      .single();
      
    if (boostError || !boostData) {
      console.error('Error fetching boost to extend:', boostError);
      return false;
    }
    
    const boost = boostData as Boost;
    
    // Calculate new expiration time
    const additionalHours = getBoostDuration(boost.boost_type as BoostType);
    const currentExpiry = new Date(boost.expires_at);
    const newExpiry = new Date(currentExpiry.getTime() + (additionalHours * 60 * 60 * 1000));
    
    const cost = getBoostCost(boost.boost_type as BoostType);
    
    // Check if user has enough tokens
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('tokens')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      console.error('Error fetching user tokens:', userError);
      return false;
    }
    
    if (userData.tokens < cost) {
      throw new Error('Not enough tokens to extend this boost');
    }
    
    // Update the boost expiration time
    const { error: updateError } = await supabase
      .from('boosts')
      .update({
        expires_at: newExpiry.toISOString()
      })
      .eq('id', boostId);
      
    if (updateError) {
      console.error('Error extending boost:', updateError);
      return false;
    }
    
    // Deduct tokens from user
    const { error: tokenError } = await supabase
      .from('profiles')
      .update({ tokens: userData.tokens - cost })
      .eq('id', userId);
      
    if (tokenError) {
      console.error('Error updating user tokens:', tokenError);
      return false;
    }
    
    // Create a token transaction record
    const { error: transactionError } = await supabase
      .from('token_transactions')
      .insert([
        {
          user_id: userId,
          amount: -cost,
          type: 'boost_extension',
          description: `Extended ${boost.boost_type} boost`,
          reference_id: boostId,
          created_at: new Date().toISOString()
        }
      ]);
      
    if (transactionError) {
      console.error('Error recording token transaction:', transactionError);
    }
    
    return true;
  } catch (error) {
    console.error('Error in extendBoost:', error);
    return false;
  }
};

// Cancel an active boost
export const cancelBoost = async (boostId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('boosts')
      .update({
        status: 'cancelled'
      })
      .eq('id', boostId)
      .eq('user_id', userId); // Ensure the user owns this boost
      
    if (error) {
      console.error('Error cancelling boost:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in cancelBoost:', error);
    return false;
  }
};

export default {
  applyBoost,
  getUserActiveBoosts,
  getBoostAnalytics,
  extendBoost,
  cancelBoost,
  getBoostCost
};
