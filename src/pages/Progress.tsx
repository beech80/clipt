import React from "react";
import { Card } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Progress = () => {
  const { data: userLevels, isLoading } = useQuery({
    queryKey: ['userLevels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: achievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Your Progress</h1>
      
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Current Level</h2>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span>Level {userLevels?.current_level || 1}</span>
                <span>{userLevels?.current_xp || 0} XP</span>
              </div>
              <ProgressBar value={((userLevels?.current_xp || 0) % 100)} />
            </>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Achievements</h2>
        {achievements?.length ? (
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  {achievement.icon_url ? (
                    <img src={achievement.icon_url} alt="" className="h-8 w-8" />
                  ) : (
                    <div className="h-8 w-8 bg-primary/20 rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{achievement.name}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No achievements yet. Keep playing to earn some!</p>
        )}
      </Card>
    </div>
  );
};

export default Progress;