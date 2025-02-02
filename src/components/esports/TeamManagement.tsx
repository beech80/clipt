import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Trophy } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function TeamManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    tag: "",
  });

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
      setIsOpen(false);
      setNewTeam({ name: "", tag: "" });
      queryClient.invalidateQueries({ queryKey: ['esports-teams'] });
    },
    onError: () => {
      toast.error("Failed to create team");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name || !newTeam.tag) {
      toast.error("Please fill in all fields");
      return;
    }
    createTeam.mutate(newTeam);
  };

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
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="Enter team name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag">Team Tag</Label>
                  <Input
                    id="tag"
                    value={newTeam.tag}
                    onChange={(e) => setNewTeam({ ...newTeam, tag: e.target.value })}
                    placeholder="Enter team tag (e.g. TSM)"
                    maxLength={5}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createTeam.isPending}>
                  {createTeam.isPending ? "Creating..." : "Create Team"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
          
          {teams?.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              No teams created yet. Create your first team to get started!
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}