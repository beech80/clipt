import { supabase } from '@/lib/supabase';
import { BoostType } from '@/components/boost/BoostTracker';
import { processBoost, setupBoostProcessingInterval } from './boostAlgorithm';
import { createBoostResultNotification } from './notificationService';
import { applyBoost, extendBoost } from './boostService';

/**
 * BoostManager integrates all boost-related services to ensure full functionality
 * and transparent performance tracking for users.
 */

// Initialize the boost system
export const initializeBoostSystem = (): void => {
  // Setup interval that checks for expired boosts and generates reports
  setupBoostProcessingInterval();
  
  // Subscribe to boost events from real-time database
  subscribeToBoostEvents();
};

// Apply a boost to content (posts or streams)
export const applyBoostToContent = async (
  userId: string, 
  contentId: string, 
  contentType: 'post' | 'stream', 
  boostType: BoostType
): Promise<boolean> => {
  try {
    console.log(`Applying ${boostType} boost to ${contentType}:${contentId} for user ${userId}`);
    
    // 1. Create the boost in the database (handled by boostService)
    const boost = await applyBoost(userId, contentId, contentType, boostType);
    
    if (!boost) {
      console.error('Failed to create boost record');
      return false;
    }
    
    // 2. Start the algorithmic processing of the boost
    await processBoost({
      boostId: boost.id,
      userId,
      contentId,
      contentType,
      boostType
    });
    
    // 3. Add boost tracking UI to the content for viewers
    await updateContentWithBoostUI(contentId, contentType, boostType);
    
    // 4. Create initial "Boost applied" notification for user transparency
    await createBoostAppliedNotification(userId, boostType, contentId, contentType);
    
    return true;
  } catch (error) {
    console.error('Error in applyBoostToContent:', error);
    return false;
  }
};

// Extend an existing boost
export const extendExistingBoost = async (boostId: string, userId: string): Promise<boolean> => {
  try {
    // 1. Update the boost expiration in database
    const success = await extendBoost(boostId, userId);
    
    if (!success) return false;
    
    // 2. Get boost details
    const { data: boost } = await supabase
      .from('boosts')
      .select('content_id, content_type, boost_type')
      .eq('id', boostId)
      .single();
      
    if (!boost) return false;
    
    // 3. Create notification about extension
    await supabase.from('notifications').insert([{
      user_id: userId,
      type: 'system',
      title: 'Boost Extended',
      message: `Your ${getBoostTitle(boost.boost_type)} has been extended.`,
      reference_id: boostId,
      reference_type: 'boost',
      read: false,
      created_at: new Date().toISOString()
    }]);
    
    return true;
  } catch (error) {
    console.error('Error extending boost:', error);
    return false;
  }
};

// Internal helper to create initial notification when boost is applied
const createBoostAppliedNotification = async (
  userId: string, 
  boostType: BoostType, 
  contentId: string, 
  contentType: 'post' | 'stream'
): Promise<void> => {
  try {
    // Get content title
    const { data: contentData } = await supabase
      .from(contentType === 'post' ? 'posts' : 'streams')
      .select('title')
      .eq('id', contentId)
      .single();
      
    const contentTitle = contentData?.title || 'your content';
    
    // Create notification
    await supabase.from('notifications').insert([{
      user_id: userId,
      type: 'system',
      title: `${getBoostTitle(boostType)} Applied`,
      message: getMessage(boostType, contentTitle),
      reference_id: contentId,
      reference_type: contentType,
      read: false,
      created_at: new Date().toISOString()
    }]);
  } catch (error) {
    console.error('Error creating boost notification:', error);
  }
};

// Add UI indicators to boosted content
const updateContentWithBoostUI = async (
  contentId: string, 
  contentType: 'post' | 'stream', 
  boostType: BoostType
): Promise<void> => {
  try {
    const updates: Record<string, any> = {
      is_boosted: true,
      boost_type: boostType,
      updated_at: new Date().toISOString()
    };
    
    // Add type-specific UI updates
    switch(boostType) {
      case 'king':
        updates.has_crown_badge = true;
        updates.featured = true;
        break;
      case 'stream_surge':
        updates.trending = true;
        break;
    }
    
    // Update the content
    await supabase
      .from(contentType === 'post' ? 'posts' : 'streams')
      .update(updates)
      .eq('id', contentId);
      
  } catch (error) {
    console.error('Error updating content with boost UI:', error);
  }
};

// Subscribe to boost events for real-time processing
const subscribeToBoostEvents = (): void => {
  // Subscribe to new boosts for real-time processing
  const boostsChannel = supabase
    .channel('boosts_channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'boosts' },
      (payload) => {
        const boost = payload.new;
        
        // Process the boost algorithm
        processBoost({
          boostId: boost.id,
          userId: boost.user_id,
          contentId: boost.content_id,
          contentType: boost.content_type,
          boostType: boost.boost_type
        });
      }
    )
    .subscribe();
  
  // Subscribe to engagement events for Chain Reaction monitoring
  const engagementChannel = supabase
    .channel('engagement_channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'likes' },
      (payload) => {
        updateChainReactionMetrics(payload.new.content_id);
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comments' },
      (payload) => {
        updateChainReactionMetrics(payload.new.content_id);
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'shares' },
      (payload) => {
        updateChainReactionMetrics(payload.new.content_id);
      }
    )
    .subscribe();
};

// Update Chain Reaction metrics when new engagements happen
const updateChainReactionMetrics = async (contentId: string): Promise<void> => {
  try {
    // Check if this content has an active Chain Reaction boost
    const { data: boostData } = await supabase
      .from('boosts')
      .select('id, user_id')
      .eq('content_id', contentId)
      .eq('boost_type', 'chain_reaction')
      .eq('status', 'active')
      .single();
      
    if (!boostData) return; // No active Chain Reaction boost
    
    // Get current engagement counts
    const { data: engagementData } = await supabase
      .from('post_analytics')
      .select('likes, comments, shares')
      .eq('content_id', contentId)
      .single();
    
    if (!engagementData) return;
    
    // Calculate new chain multiplier and spread
    const totalEngagements = engagementData.likes + engagementData.comments + engagementData.shares;
    const chainSpread = totalEngagements * 5; // Each engagement = 5 new users
    const chainMultiplier = (totalEngagements * 0.2) + 1; // Base + 0.2 per engagement
    
    // Update boost metrics
    await supabase
      .from('boost_metrics')
      .update({
        metrics: {
          chainMultiplier: parseFloat(chainMultiplier.toFixed(2)),
          chainSpread,
          reachedUsers: chainSpread,
          // Other metrics will be updated by the periodic check
        },
        updated_at: new Date().toISOString()
      })
      .eq('boost_id', boostData.id);
      
    // If chain reaction is significant, send a notification
    if (totalEngagements % 5 === 0 && totalEngagements > 0) {
      await supabase.from('notifications').insert([{
        user_id: boostData.user_id,
        type: 'system',
        title: 'Chain Reaction Growing',
        message: `Your Chain Reaction boost has reached ${chainMultiplier.toFixed(1)}x multiplier! Your post has spread to ${chainSpread} users.`,
        reference_id: boostData.id,
        reference_type: 'boost',
        read: false,
        created_at: new Date().toISOString()
      }]);
    }
  } catch (error) {
    console.error('Error updating Chain Reaction metrics:', error);
  }
};

// Helper to get a nice title for the boost
const getBoostTitle = (boostType: BoostType): string => {
  switch (boostType) {
    case 'squad_blast':
      return 'Squad Blast';
    case 'chain_reaction':
      return 'Chain Reaction';
    case 'king':
      return 'I\'m the King Now';
    case 'stream_surge':
      return 'Stream Surge';
    default:
      return 'Boost';
  }
};

// Helper to get notification message
const getMessage = (boostType: BoostType, contentTitle: string): string => {
  switch (boostType) {
    case 'squad_blast':
      return `Your Squad Blast is pushing "${contentTitle}" to all your friends for the next 24 hours.`;
    case 'chain_reaction':
      return `Your Chain Reaction boost is active on "${contentTitle}". Each engagement will spread it to 5 more users!`;
    case 'king':
      return `Your stream "${contentTitle}" is now featured in the Top 10 for its game category with a crown badge!`;
    case 'stream_surge':
      return `Your Stream Surge is bringing 200+ viewers to "${contentTitle}" for the next 30 minutes!`;
    default:
      return `Your boost has been applied to "${contentTitle}".`;
  }
};

export default {
  initializeBoostSystem,
  applyBoostToContent,
  extendExistingBoost
};
