import { useAuth } from "@/contexts/AuthContext";
import { AchievementList } from "@/components/achievements/AchievementList";
import { AchievementProgress } from "@/components/achievements/AchievementProgress";
import { Trophy } from "lucide-react";

const Achievements = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Achievements</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Your Achievements</h2>
          <AchievementList userId={user.id} />
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Progress</h2>
          <AchievementProgress />
        </div>
      </div>
    </div>
  );
};

export default Achievements;