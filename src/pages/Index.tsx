import { AchievementProgress } from "@/components/achievements/AchievementProgress";
import PostList from "@/components/PostList";

const Index = () => {
  return (
    <div className="space-y-6">
      <AchievementProgress />
      <PostList />
    </div>
  );
};

export default Index;