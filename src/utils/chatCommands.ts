import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { ChatCommand } from "@/types/chat";

const timeoutUser = async (userId: string, streamId: string, duration: number, moderatorId: string) => {
  const expiresAt = new Date(Date.now() + duration * 1000).toISOString();
  
  const { error } = await supabase
    .from('chat_timeouts')
    .insert({
      stream_id: streamId,
      user_id: userId,
      moderator_id: moderatorId,
      expires_at: expiresAt,
    });

  if (error) throw error;
};

export const chatCommands: Record<string, ChatCommand> = {
  timeout: {
    name: 'timeout',
    description: 'Timeout a user for a specified duration',
    moderatorOnly: true,
    execute: async (args: string[], userId: string, streamId: string) => {
      if (args.length < 2) throw new Error('Usage: /timeout @username <duration>');
      
      const targetUsername = args[0].replace('@', '');
      const duration = parseInt(args[1]);
      
      if (isNaN(duration)) throw new Error('Invalid duration');
      
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', targetUsername)
        .single();
        
      if (userError || !targetUser) throw new Error('User not found');
      
      await timeoutUser(targetUser.id, streamId, duration, userId);
      toast.success(`User ${targetUsername} has been timed out for ${duration} seconds`);
    }
  },
  
  clear: {
    name: 'clear',
    description: 'Clear all chat messages',
    moderatorOnly: true,
    execute: async (args: string[], userId: string, streamId: string) => {
      const { error } = await supabase
        .from('stream_chat')
        .update({
          is_deleted: true,
          deleted_by: userId,
          deleted_at: new Date().toISOString()
        })
        .eq('stream_id', streamId);
        
      if (error) throw error;
      toast.success('Chat has been cleared');
    }
  },
  
  ban: {
    name: 'ban',
    description: 'Permanently ban a user from chat',
    moderatorOnly: true,
    execute: async (args: string[], userId: string, streamId: string) => {
      if (args.length < 1) throw new Error('Usage: /ban @username');
      
      const targetUsername = args[0].replace('@', '');
      await timeoutUser(targetUsername, streamId, 365 * 24 * 60 * 60, userId); // 1 year timeout
      toast.success(`User ${targetUsername} has been banned`);
    }
  }
};

export const processCommand = async (message: string, userId: string, streamId: string): Promise<boolean> => {
  if (!message.startsWith('/')) return false;

  const [commandName, ...args] = message.slice(1).split(' ');
  const command = chatCommands[commandName];

  if (!command) {
    toast.error('Unknown command');
    return false;
  }

  try {
    if (command.moderatorOnly) {
      const { data: stream } = await supabase
        .from('streams')
        .select('user_id')
        .eq('id', streamId)
        .single();

      if (stream?.user_id !== userId) {
        toast.error('You do not have permission to use this command');
        return false;
      }
    }

    await command.execute(args, userId, streamId);
    return true;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to execute command');
    return false;
  }
};