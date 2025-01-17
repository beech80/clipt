import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useState } from "react";

export function ModeratorList({ streamId }: { streamId: string }) {
  const [username, setUsername] = useState("");

  const { data: moderators, refetch } = useQuery({
    queryKey: ['stream-moderators', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_moderators')
        .select(`
          *,
          moderator:profiles!moderator_id (
            username,
            avatar_url
          )
        `)
        .eq('stream_id', streamId);
      
      if (error) throw error;
      return data;
    }
  });

  const handleAddModerator = async () => {
    try {
      // First get the user id from the username
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (userError) throw userError;
      if (!userData) {
        toast.error('User not found');
        return;
      }

      const { error } = await supabase
        .from('stream_moderators')
        .insert([{
          stream_id: streamId,
          moderator_id: userData.id
        }]);

      if (error) throw error;

      toast.success('Moderator added successfully');
      refetch();
      setUsername("");
    } catch (error) {
      toast.error('Failed to add moderator');
    }
  };

  const handleRemoveModerator = async (moderatorId: string) => {
    try {
      const { error } = await supabase
        .from('stream_moderators')
        .delete()
        .eq('stream_id', streamId)
        .eq('moderator_id', moderatorId);

      if (error) throw error;
      toast.success('Moderator removed successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to remove moderator');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Add Moderator</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button onClick={handleAddModerator}>Add</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Current Moderators</h3>
        <div className="space-y-2">
          {moderators?.map((mod) => (
            <div
              key={mod.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={mod.moderator?.avatar_url || undefined} />
                  <AvatarFallback>{mod.moderator?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{mod.moderator?.username}</span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveModerator(mod.moderator_id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}