import { AchievementProgress } from "@/components/achievements/AchievementProgress";
import PostList from "@/components/PostList";
import { TrendingHashtags } from "@/components/hashtags/TrendingHashtags";

const Index = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <AchievementProgress />
          <PostList />
        </div>
        <div className="space-y-6">
          <TrendingHashtags />
        </div>
      </div>
    </div>
  );
};

export default Index;