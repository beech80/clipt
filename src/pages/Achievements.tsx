import { useAuth } from "@/contexts/AuthContext";
import { AchievementList } from "@/components/achievements/AchievementList";
import { AchievementProgress } from "@/components/achievements/AchievementProgress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Award, LogIn } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Achievements = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-gaming-400" />
          <h1 className="text-2xl font-bold">Achievements</h1>
        </div>
        {!user && (
          <Button 
            onClick={() => navigate('/login')} 
            className="flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Sign in to track progress
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            <Trophy className="h-4 w-4 mr-2" />
            All
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            <Star className="h-4 w-4 mr-2" />
            In Progress
          </TabsTrigger>
          <TabsTrigger value="completed">
            <Award className="h-4 w-4 mr-2" />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              {!user ? (
                <Card className="p-6">
                  <div className="text-center space-y-4">
                    <Trophy className="w-12 h-12 mx-auto text-gaming-400" />
                    <div>
                      <h3 className="text-lg font-semibold">Preview Mode</h3>
                      <p className="text-muted-foreground">
                        Sign in to track your achievements and earn rewards
                      </p>
                    </div>
                  </div>
                </Card>
              ) : null}
              <AchievementList userId={user?.id || ''} filter="all" />
            </div>
            {user && <AchievementProgress />}
          </div>
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <AchievementList userId={user?.id || ''} filter="in-progress" />
            {user && <AchievementProgress />}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <AchievementList userId={user?.id || ''} filter="completed" />
            {user && <AchievementProgress />}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Achievements;