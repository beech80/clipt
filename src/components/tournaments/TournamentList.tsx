import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Users } from "lucide-react";
import { format } from "date-fns";

export function TournamentList() {
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    const { data } = await supabase
      .from('tournaments')
      .select(`
        *,
        creator:profiles!tournaments_created_by_fkey(username),
        tournament_participants(count)
      `)
      .eq('status', 'upcoming')
      .order('start_date', { ascending: true });

    setTournaments(data || []);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Upcoming Tournaments
        </h2>
        <Button>Create Tournament</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="p-4">
            <h3 className="font-bold text-lg mb-2">{tournament.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {tournament.description}
            </p>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(tournament.start_date), 'PPP')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {tournament.tournament_participants[0].count}/{tournament.max_participants}
                </span>
              </div>
            </div>
            
            <div className="mt-4">
              <Button className="w-full">Join Tournament</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}