import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export function SquadList() {
  const { user } = useAuth();
  const [squads, setSquads] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadSquads();
    }
  }, [user]);

  const loadSquads = async () => {
    const { data, error } = await supabase
      .from('squads')
      .select(`
        *,
        leader:profiles!squads_leader_id_fkey(username, avatar_url),
        members:squad_members(
          user:profiles(username, avatar_url)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load squads");
      return;
    }

    setSquads(data || []);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Active Squads
        </h2>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          squad
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {squads.map((squad) => (
          <Card key={squad.id} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{squad.name}</h3>
              <span className="text-sm text-muted-foreground">
                {squad.members.length}/{squad.max_size}
              </span>
            </div>
            
            <div className="flex -space-x-2">
              {squad.members.map((member: any) => (
                <Avatar key={member.user.username} className="border-2 border-background">
                  <AvatarImage src={member.user.avatar_url} />
                  <AvatarFallback>{member.user.username[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}