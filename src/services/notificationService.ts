import { supabase } from '@/lib/supabase';
import { BoostType } from '@/components/boost/BoostTracker';

// Interface matching our application's notification structure
export interface Notification {
  id: string;
  user_id: string;
  type: 'boost_result' | 'comment' | 'like' | 'follow' | 'share' | 'system' | 'mention' | 'stream_live' | 'reply';
  title: string;
  message: string;
  reference_id?: string; // ID of post, boost, or user this relates to
  reference_type?: 'post' | 'boost' | 'user' | 'system';
  data?: any; // Additional structured data
  read: boolean;
  created_at: string;
}

// Interface matching Supabase database structure
interface DbNotification {
  id: string;
  user_id: string;
  actor_id?: string;
  type: 'comment' | 'like' | 'follow' | 'mention' | 'stream_live' | 'reply' | 'boost_result' | 'share' | 'system';
  content?: string;
  resource_id?: string;
  resource_type?: string;
  read: boolean;
  created_at: string;
}

export interface BoostResultData {
  boostType: BoostType;
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
    // Type-specific metrics
    chainMultiplier?: number;
    rankImprovement?: number; 
    viewersPeak?: number;
    reachedUsers?: number;
  };
  contentTitle: string;
  contentId: string;
}

// Create a boost result notification when a boost completes
export const createBoostResultNotification = async (
  userId: string, 
  boostId: string,
  boostType: BoostType,
  metrics: BoostResultData['metrics'],
  contentTitle: string,
  contentId: string
): Promise<Notification | null> => {
  try {
    // Generate a title based on boost type
    let title = '';
    switch (boostType) {
      case 'squad_blast':
        title = 'Squad Blast Results';
        break;
      case 'chain_reaction':
        title = 'Chain Reaction Performance';
        break;
      case 'king':
        title = 'King Boost Performance';
        break;
      case 'stream_surge':
        title = 'Stream Surge Results';
        break;
      default:
        title = 'Boost Performance';
    }
    
    // Generate message with key metrics
    let message = '';
    
    switch (boostType) {
      case 'squad_blast':
        message = `Your Squad Blast reached ${metrics.reachedUsers} friends and generated ${metrics.viewsFromBoost} extra views and ${metrics.likesFromBoost} extra likes.`;
        break;
      case 'chain_reaction':
        message = `Your Chain Reaction achieved a ${metrics.chainMultiplier}x multiplier, spreading to ${metrics.reachedUsers} users and generating ${metrics.viewsFromBoost} extra views.`;
        break;
      case 'king':
        message = `Your King boost placed you in the Top 10, improving your rank by ${metrics.rankImprovement} positions and generating ${metrics.viewsFromBoost} extra views.`;
        break;
      case 'stream_surge':
        message = `Your Stream Surge reached a peak of ${metrics.viewersPeak} viewers and generated ${metrics.engagementFromBoost} extra engagement actions.`;
        break;
      default:
        message = `Your boost generated ${metrics.viewsFromBoost} extra views and ${metrics.likesFromBoost} extra likes.`;
    }
    
    // Prepare the notification data
    const notificationData = {
      user_id: userId,
      type: 'boost_result',
      title,
      message,
      reference_id: boostId,
      reference_type: 'boost',
      data: {
        boostType,
        metrics,
        contentTitle,
        contentId
      },
      read: false,
      created_at: new Date().toISOString()
    };
    
    // Map our notification format to DB format
    const dbNotification = {
      user_id: notificationData.user_id,
      type: notificationData.type as any, // Type assertion to handle custom types
      content: notificationData.message,
      resource_id: notificationData.reference_id,
      resource_type: notificationData.reference_type,
      read: notificationData.read,
      created_at: notificationData.created_at
    };
    
    // Insert the notification into the database
    const { data, error } = await supabase
      .from('notifications')
      .insert([dbNotification])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }
    
    // Map DB response to our notification format
    return {
      id: data.id,
      user_id: data.user_id,
      type: data.type as any,
      title: notificationData.title,
      message: data.content || '',
      reference_id: data.resource_id,
      reference_type: data.resource_type as any,
      data: notificationData.data,
      read: data.read,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error in createBoostResultNotification:', error);
    return null;
  }
};

// Create a social interaction notification (like, comment, follow)
export const createSocialNotification = async (
  userId: string,
  type: 'comment' | 'like' | 'follow' | 'share' | 'mention',
  fromUserId: string,
  fromUsername: string,
  contentId?: string,
  contentTitle?: string,
  commentText?: string
): Promise<Notification | null> => {
  try {
    let title = '';
    let message = '';
    let referenceType: 'post' | 'user' = 'post';
    
    switch (type) {
      case 'comment':
        title = 'New Comment';
        message = `@${fromUsername} commented: "${commentText?.substring(0, 50)}${commentText && commentText.length > 50 ? '...' : ''}"`;
        referenceType = 'post';
        break;
      case 'like':
        title = 'New Like';
        message = `@${fromUsername} liked your ${contentTitle ? `"${contentTitle}"` : 'post'}`;
        referenceType = 'post';
        break;
      case 'follow':
        title = 'New Follower';
        message = `@${fromUsername} started following you`;
        referenceType = 'user';
        break;
      case 'share':
        title = 'New Share';
        message = `@${fromUsername} shared your ${contentTitle ? `"${contentTitle}"` : 'post'}`;
        referenceType = 'post';
        break;
      case 'mention':
        title = 'New Mention';
        message = `@${fromUsername} mentioned you in a ${contentTitle ? `"${contentTitle}"` : 'post'}`;
        referenceType = 'post';
        break;
    }
    
    // Prepare notification data
    const notificationData = {
      user_id: userId,
      type,
      title,
      message,
      reference_id: type === 'follow' ? fromUserId : contentId,
      reference_type: referenceType,
      data: {
        fromUserId,
        fromUsername,
        contentId,
        contentTitle,
        commentText
      },
      read: false,
      created_at: new Date().toISOString()
    };
    
    // Map our notification format to DB format
    const dbNotification = {
      user_id: notificationData.user_id,
      type: notificationData.type,
      content: notificationData.message,
      resource_id: notificationData.reference_id,
      resource_type: notificationData.reference_type,
      actor_id: fromUserId,
      read: notificationData.read,
      created_at: notificationData.created_at
    };
    
    // Insert notification
    const { data, error } = await supabase
      .from('notifications')
      .insert([dbNotification])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating social notification:', error);
      return null;
    }
    
    // Map DB response to our notification format
    return {
      id: data.id,
      user_id: data.user_id,
      type: data.type as any,
      title: notificationData.title,
      message: notificationData.message,
      reference_id: data.resource_id,
      reference_type: data.resource_type as any,
      data: notificationData.data,
      read: data.read,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error in createSocialNotification:', error);
    return null;
  }
};

// Get all notifications for a user
export const getUserNotifications = async (userId: string, limit: number = 50, offset: number = 0): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    
    // Convert DB notifications to our app format
    return data.map((dbNotification: DbNotification) => ({
      id: dbNotification.id,
      user_id: dbNotification.user_id,
      type: dbNotification.type as any,
      title: generateNotificationTitle(dbNotification),
      message: dbNotification.content || generateNotificationMessage(dbNotification),
      reference_id: dbNotification.resource_id,
      reference_type: dbNotification.resource_type as any,
      data: {}, // In a real app, we'd fetch this from a JSON field
      read: dbNotification.read,
      created_at: dbNotification.created_at
    }));
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    return [];
  }
};

// Helper function to generate titles from DB notifications
const generateNotificationTitle = (notification: DbNotification): string => {
  switch (notification.type) {
    case 'comment': return 'New Comment';
    case 'like': return 'New Like';
    case 'follow': return 'New Follower';
    case 'mention': return 'New Mention';
    case 'share': return 'New Share';
    case 'boost_result': return 'Boost Results';
    case 'stream_live': return 'Stream Started';
    case 'reply': return 'New Reply';
    case 'system': return 'System Notification';
    default: return 'Notification';
  }
};

// Helper function to generate messages for notifications without content
const generateNotificationMessage = (notification: DbNotification): string => {
  switch (notification.type) {
    case 'comment': return 'Someone commented on your post';
    case 'like': return 'Someone liked your content';
    case 'follow': return 'You have a new follower';
    case 'mention': return 'Someone mentioned you';
    case 'share': return 'Your content was shared';
    case 'boost_result': return 'Your boost has completed';
    case 'stream_live': return 'A stream you follow is now live';
    case 'reply': return 'Someone replied to your comment';
    default: return '';
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const { data, error, count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('read', false);
      
    if (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error);
    return 0;
  }
};

// Mark notifications as read
export const markNotificationsAsRead = async (notificationIds: string[]): Promise<boolean> => {
  try {
    if (notificationIds.length === 0) return true;
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', notificationIds);
      
    if (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in markNotificationsAsRead:', error);
    return false;
  }
};

// Mark single notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  return markNotificationsAsRead([notificationId]);
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
      
    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return false;
  }
};

// Export all functions as a default object
const notificationService = {
  createBoostResultNotification,
  createSocialNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationsAsRead,
  markNotificationAsRead,
  markAllNotificationsAsRead
};

export default notificationService;
