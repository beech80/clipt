
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface BannedUsersProps {
  streamId: string;
}

export const BannedUsers = ({ streamId }: BannedUsersProps) => {
  const [username, setUsername] = useState('');
  const queryClient = useQueryClient();

  const { data: bannedUsers } = useQuery({
    queryKey: ['banned-users', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banned_users')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('stream_id', streamId);
      
      if (error) throw error;
      return data;
    }
  });

  const banUser = useMutation({
    mutationFn: async (username: string) => {
      // First get the user ID from the username
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      const { error } = await supabase
        .from('banned_users')
        .insert([{
          stream_id: streamId,
          user_id: userData.id
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned-users', streamId] });
      toast.success('User banned successfully');
      setUsername('');
    },
    onError: () => {
      toast.error('Failed to ban user');
    }
  });

  const unbanUser = useMutation({
    mutationFn: async (banId: string) => {
      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('id', banId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned-users', streamId] });
      toast.success('User unbanned successfully');
    },
    onError: () => {
      toast.error('Failed to unban user');
    }
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Ban User</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button onClick={() => banUser.mutate(username)}>Ban User</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Banned Users</h3>
        <div className="space-y-4">
          {bannedUsers?.map((ban) => (
            <div
              key={ban.id}
              className="flex items-center justify-between p-4 bg-muted rounded-lg"
            >
              <div className="space-y-1">
                <p className="font-medium">{ban.profiles?.username}</p>
                <p className="text-sm text-muted-foreground">
                  Banned on {new Date(ban.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => unbanUser.mutate(ban.id)}
              >
                Unban
              </Button>
            </div>
          ))}
          {bannedUsers?.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No banned users</p>
          )}
        </div>
      </Card>
    </div>
  );
};
