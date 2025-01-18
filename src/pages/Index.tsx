import { AchievementProgress } from "@/components/achievements/AchievementProgress";
import { ActiveChallenges } from "@/components/challenges/ActiveChallenges";
import { AchievementList } from "@/components/achievements/AchievementList";
import PostList from "@/components/PostList";
import { TrendingHashtags } from "@/components/hashtags/TrendingHashtags";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {user && (
            <>
              <AchievementProgress />
              <ActiveChallenges />
            </>
          )}
          <PostList />
        </div>
        <div className="space-y-6">
          {user && <AchievementList userId={user.id} />}
          <TrendingHashtags />
        </div>
      </div>
    </div>
  );
};

export default Index;