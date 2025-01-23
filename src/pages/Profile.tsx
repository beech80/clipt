import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, Edit, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_levels (current_level, current_xp),
          user_achievements (
            achievements (name, description, icon_url)
          )
        `)
        .eq('username', username)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (user && profile) {
      checkFollowStatus();
    }
  }, [user, profile]);

  const checkFollowStatus = async () => {
    if (!user || !profile) return;
    
    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .single();
    
    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!user || !profile) return;

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);
    } else {
      await supabase
        .from('follows')
        .insert([{ follower_id: user.id, following_id: profile.id }]);
    }

    setIsFollowing(!isFollowing);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="p-6 text-center bg-card/50 backdrop-blur-sm border-border/50">
          <h2 className="text-xl font-semibold">Profile not found</h2>
          <p className="text-muted-foreground mt-2">The requested profile could not be found.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Header */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <Avatar className="h-24 w-24 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>
              <User className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
            
            {profile.bio && (
              <p className="text-foreground/80">{profile.bio}</p>
            )}

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              {user?.id === profile.id ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/settings')}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/edit-profile')}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </>
              ) : (
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  onClick={handleFollow}
                  className="min-w-[100px]"
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Level & XP */}
      {profile.user_levels && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Level {profile.user_levels.current_level}
            </h2>
            <span className="text-sm text-muted-foreground">
              {profile.user_levels.current_xp} XP
            </span>
          </div>
          <div className="w-full bg-secondary/50 rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{
                width: `${(profile.user_levels.current_xp % 100) / 100 * 100}%`
              }}
            />
          </div>
        </Card>
      )}

      {/* Achievements */}
      {profile.user_achievements?.length > 0 && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h2 className="text-xl font-semibold mb-4">Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.user_achievements.map((achievement: any, index: number) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
              >
                {achievement.achievements.icon_url ? (
                  <img
                    src={achievement.achievements.icon_url}
                    alt={achievement.achievements.name}
                    className="w-8 h-8"
                  />
                ) : (
                  <Trophy className="w-8 h-8 text-yellow-500" />
                )}
                <div>
                  <h3 className="font-medium">{achievement.achievements.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {achievement.achievements.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}