import { supabase } from './supabase';
import { toast } from 'sonner';

interface MessagePayload {
  sender_id: string;
  receiver_id: string;
  content: string;
  attachment_url?: string;
  message_type?: 'text' | 'image' | 'video';
}

// Function to send a message in real-time
export const sendMessage = async (payload: MessagePayload) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: payload.sender_id,
          receiver_id: payload.receiver_id,
          content: payload.content,
          attachment_url: payload.attachment_url || null,
          message_type: payload.message_type || 'text',
          created_at: new Date().toISOString(),
          is_read: false
        }
      ]);

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    toast.error('Failed to send message');
    return { success: false, error };
  }
};

// Function to subscribe to new messages in real-time
export const subscribeToMessages = (userId: string, callback: (message: any) => void) => {
  const subscription = supabase
    .channel('messages-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
};

// Function to mark a message as read
export const markMessageAsRead = async (messageId: string) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in markMessageAsRead:', error);
    return { success: false, error };
  }
};

// Function to get all unread messages count
export const getUnreadMessagesCount = async (userId: string) => {
  try {
    const { data, error, count } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread messages count:', error);
      return { success: false, error, count: 0 };
    }

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Error in getUnreadMessagesCount:', error);
    return { success: false, error, count: 0 };
  }
};

// Function to get all conversations for a user
export const getConversations = async (userId: string) => {
  try {
    // Get all users who have sent messages to this user or received messages from this user
    const { data: senderIds, error: senderError } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });

    const { data: receiverIds, error: receiverError } = await supabase
      .from('messages')
      .select('receiver_id')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    if (senderError || receiverError) {
      console.error('Error getting conversation partners:', senderError || receiverError);
      return { success: false, error: senderError || receiverError };
    }

    // Combine unique user IDs 
    const uniqueUserIds = new Set([
      ...senderIds?.map(item => item.sender_id) || [],
      ...receiverIds?.map(item => item.receiver_id) || []
    ]);

    const conversationPartnerIds = Array.from(uniqueUserIds);

    if (conversationPartnerIds.length === 0) {
      return { success: true, conversations: [] };
    }

    // Get profile info for each conversation partner
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', conversationPartnerIds);

    if (profilesError) {
      console.error('Error getting conversation profiles:', profilesError);
      return { success: false, error: profilesError };
    }

    // Get the most recent message for each conversation
    const conversations = await Promise.all(
      conversationPartnerIds.map(async (partnerId) => {
        const { data: latestMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${partnerId},receiver_id.eq.${partnerId}`)
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (messagesError) {
          console.error(`Error getting messages for conversation with ${partnerId}:`, messagesError);
          return null;
        }

        const partner = profiles?.find(profile => profile.id === partnerId);
        const latestMessage = latestMessages?.[0];

        if (!partner || !latestMessage) return null;

        return {
          partnerId,
          partnerUsername: partner.username,
          partnerDisplayName: partner.display_name,
          partnerAvatarUrl: partner.avatar_url,
          latestMessage: {
            id: latestMessage.id,
            content: latestMessage.content,
            senderId: latestMessage.sender_id,
            receiverId: latestMessage.receiver_id,
            createdAt: latestMessage.created_at,
            isRead: latestMessage.is_read,
            attachmentUrl: latestMessage.attachment_url,
            messageType: latestMessage.message_type
          },
          unreadCount: 0 // Will be populated next
        };
      })
    );

    // Filter out any null results
    const validConversations = conversations.filter(convo => convo !== null);

    // Get unread count for each conversation
    await Promise.all(
      validConversations.map(async (convo) => {
        if (!convo) return;

        const { data: unreadMessages, error: unreadError, count } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('sender_id', convo.partnerId)
          .eq('receiver_id', userId)
          .eq('is_read', false);

        if (unreadError) {
          console.error(`Error getting unread count for conversation with ${convo.partnerId}:`, unreadError);
          return;
        }

        convo.unreadCount = count || 0;
      })
    );

    return { 
      success: true, 
      conversations: validConversations as any[]
    };
  } catch (error) {
    console.error('Error in getConversations:', error);
    return { success: false, error };
  }
};

// Function to get messages between current user and a specific user
export const getMessages = async (userId: string, partnerId: string) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting messages:', error);
      return { success: false, error };
    }

    return { 
      success: true, 
      messages: data.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        createdAt: msg.created_at,
        isRead: msg.is_read,
        readAt: msg.read_at,
        attachmentUrl: msg.attachment_url,
        messageType: msg.message_type,
        isMine: msg.sender_id === userId
      }))
    };
  } catch (error) {
    console.error('Error in getMessages:', error);
    return { success: false, error };
  }
};
