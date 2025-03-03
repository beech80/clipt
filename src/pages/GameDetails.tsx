import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { igdbService } from "@/services/igdbService";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Info, Video, Clock, Calendar, Trophy } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import AchievementItem from "@/components/achievements/AchievementItem";
import { achievementService } from "@/services/achievementService";

const formatDate = (timestamp: number) => {
  if (!timestamp) return "Unknown";
  try {
    // IGDB uses Unix timestamps
    return format(new Date(timestamp * 1000), "MMM dd, yyyy");
  } catch (e) {
    return "Unknown";
  }
};

const GameDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"clips" | "about">("clips");

  // Fetch game details
  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ["game", id],
    queryFn: async () => {
      if (!id) return null;
      return await igdbService.getGameById(parseInt(id));
    },
    enabled: !!id,
  });

  // Fetch game clips
  const { data: clips, isLoading: clipsLoading } = useQuery({
    queryKey: ["gameClips", id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          description,
          created_at,
          media_url,
          thumbnail_url,
          like_count,
          comment_count,
          user_id,
          profiles(username, avatar_url, display_name)
        `)
        .eq("game_id", id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching clips:", error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!id,
  });
  
  // Fetch game achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["gameAchievements", id],
    queryFn: async () => {
      if (!id) return [];
      return await achievementService.getGameAchievements(parseInt(id));
    },
    enabled: !!id,
  });

  if (gameLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Gamepad2 className="w-16 h-16 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-700">Game Not Found</h1>
        <p className="text-gray-500">This game doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/discover')} variant="outline">
          Back to Discover
        </Button>
      </div>
    );
  }

  const coverUrl = game.cover?.url.replace("thumb", "cover_big") || "/placeholder.svg";
  const screenshots = game.screenshots || [];
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => navigate(-1)}
        >
          ← Back
        </Button>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <img 
              src={coverUrl} 
              alt={game.name} 
              className="w-full md:w-64 h-auto rounded-lg shadow-lg"
            />
            
            {/* Achievement Section */}
            {achievementsLoading ? (
              <div className="mt-4 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-800/60 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : achievements && achievements.length > 0 ? (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold">Achievements</h3>
                </div>
                <div className="space-y-2">
                  {achievements.map((achievement) => (
                    <AchievementItem 
                      key={achievement.id} 
                      gameAchievement={achievement} 
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{game.name}</h1>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {game.genres?.map(genre => (
                <Badge key={genre.id} variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                  {genre.name}
                </Badge>
              ))}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Released: {formatDate(game.first_release_date)}</span>
              </div>
              
              {game.total_rating && (
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#ddd" strokeWidth="2"></circle>
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="16" 
                        fill="none" 
                        stroke="#8b5cf6" 
                        strokeWidth="2" 
                        strokeDasharray={`${100 * Math.PI / 100 * game.total_rating} ${100 * Math.PI}`}
                      ></circle>
                    </svg>
                    <span className="absolute text-xs font-semibold">{Math.round(game.total_rating)}%</span>
                  </div>
                  <span className="text-sm">Rating</span>
                </div>
              )}
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6 line-clamp-4">
              {game.summary || "No description available"}
            </p>
            
            <div className="flex gap-2">
              <Button onClick={() => setActiveTab("clips")}>View Clips</Button>
              <Button variant="outline" onClick={() => setActiveTab("about")}>About Game</Button>
            </div>
          </div>
        </div>
      </div>
      
      <Separator className="my-6" />
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "clips" | "about")}>
        <TabsList className="w-full max-w-md mx-auto">
          <TabsTrigger value="clips" className="flex-1">
            <Video className="w-4 h-4 mr-2" />
            Clips
          </TabsTrigger>
          <TabsTrigger value="about" className="flex-1">
            <Info className="w-4 h-4 mr-2" />
            About
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="clips" className="mt-6">
          {clipsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-gray-200 dark:bg-gray-800" />
              ))}
            </div>
          ) : clips && clips.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {clips.map((clip) => (
                <Card 
                  key={clip.id} 
                  className="overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => navigate(`/post/${clip.id}`)}
                >
                  <div className="relative aspect-video">
                    <img 
                      src={clip.thumbnail_url || "/placeholder.svg"} 
                      alt={clip.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                      <div className="p-4 w-full">
                        <h3 className="text-white font-semibold line-clamp-1">{clip.title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <img 
                            src={clip.profiles?.avatar_url || "/placeholder.svg"} 
                            alt={clip.profiles?.username} 
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-white/90 text-sm">
                            {clip.profiles?.display_name || clip.profiles?.username}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Video className="w-16 h-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No clips available</h2>
              <p className="text-gray-500 text-center max-w-md">
                Be the first to share a clip for this game!
              </p>
              <Button 
                className="mt-4" 
                onClick={() => navigate('/post/new')}
              >
                Create Post
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="about" className="mt-6">
          <div className="space-y-6">
            {game.summary && (
              <div>
                <h2 className="text-xl font-bold mb-2">Summary</h2>
                <p className="text-gray-700 dark:text-gray-300">{game.summary}</p>
              </div>
            )}
            
            {achievements && achievements.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">Achievements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <AchievementItem 
                      key={achievement.id} 
                      gameAchievement={achievement} 
                    />
                  ))}
                </div>
              </div>
            )}
            
            {screenshots.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">Screenshots</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {screenshots.map((screenshot, index) => (
                    <img 
                      key={index} 
                      src={screenshot.url.replace("thumb", "screenshot_big")} 
                      alt={`${game.name} screenshot ${index + 1}`}
                      className="rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {game.similar_games && game.similar_games.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">Similar Games</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {game.similar_games.map((similar) => (
                    <div 
                      key={similar.id} 
                      className="cursor-pointer"
                      onClick={() => navigate(`/game/${similar.id}`)}
                    >
                      <img 
                        src={similar.cover?.url.replace("thumb", "cover_small") || "/placeholder.svg"} 
                        alt={similar.name} 
                        className="w-full aspect-[3/4] object-cover rounded-lg shadow-md hover:shadow-lg transition-all"
                      />
                      <h3 className="text-sm font-medium mt-2 line-clamp-2">{similar.name}</h3>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GameDetails;
