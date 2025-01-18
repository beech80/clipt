import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Connections = () => {
  const { user } = useAuth();

  const { data: followers } = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower:profiles!follows_follower_id_fkey(
            id,
            username,
            avatar_url,
            display_name
          )
        `)
        .eq('following_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: following } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following:profiles!follows_following_id_fkey(
            id,
            username,
            avatar_url,
            display_name
          )
        `)
        .eq('follower_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleFollow = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user?.id, following_id: userId });
      
      if (error) throw error;
      toast.success("Successfully followed user");
    } catch (error) {
      toast.error("Failed to follow user");
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .match({ follower_id: user?.id, following_id: userId });
      
      if (error) throw error;
      toast.success("Successfully unfollowed user");
    } catch (error) {
      toast.error("Failed to unfollow user");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Connections</h1>
      </div>

      <Tabs defaultValue="followers" className="w-full">
        <TabsList>
          <TabsTrigger value="followers">
            Followers ({followers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="following">
            Following ({following?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="followers" className="space-y-4">
          {followers?.map(({ follower }) => (
            <Card key={follower.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <img
                      src={follower.avatar_url || "/placeholder.svg"}
                      alt={follower.username}
                      className="object-cover"
                    />
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{follower.display_name}</h3>
                    <p className="text-sm text-muted-foreground">@{follower.username}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFollow(follower.id)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Follow Back
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          {following?.map(({ following }) => (
            <Card key={following.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <img
                      src={following.avatar_url || "/placeholder.svg"}
                      alt={following.username}
                      className="object-cover"
                    />
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{following.display_name}</h3>
                    <p className="text-sm text-muted-foreground">@{following.username}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnfollow(following.id)}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Unfollow
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Connections;