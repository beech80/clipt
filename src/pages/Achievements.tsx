import { useAuth } from "@/contexts/AuthContext";
import { AchievementList } from "@/components/achievements/AchievementList";
import { AchievementProgress } from "@/components/achievements/AchievementProgress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Award } from "lucide-react";

const Achievements = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Achievements</h1>
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
            <AchievementList userId={user.id} filter="all" />
            <AchievementProgress />
          </div>
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <AchievementList userId={user.id} filter="in-progress" />
            <AchievementProgress />
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <AchievementList userId={user.id} filter="completed" />
            <AchievementProgress />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Achievements;