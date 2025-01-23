import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Trophy } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function TeamManagement() {
  const { user } = useAuth();

  const { data: teams, isLoading } = useQuery({
    queryKey: ['esports-teams', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('esports_teams')
        .select(`
          *,
          esports_team_members (
            user_id,
            role,
            profiles (username, avatar_url)
          )
        `)
        .eq('owner_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const createTeam = useMutation({
    mutationFn: async (data: { name: string; tag: string }) => {
      const { error } = await supabase
        .from('esports_teams')
        .insert({
          name: data.name,
          tag: data.tag,
          owner_id: user?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Team created successfully");
    },
    onError: () => {
      toast.error("Failed to create team");
    }
  });

  if (isLoading) {
    return <div>Loading teams...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <h2 className="text-xl font-bold">My Teams</h2>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>

        <div className="grid gap-4">
          {teams?.map((team) => (
            <Card key={team.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{team.name}</h3>
                  <p className="text-sm text-muted-foreground">Tag: {team.tag}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{team.esports_team_members?.length || 0} members</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}