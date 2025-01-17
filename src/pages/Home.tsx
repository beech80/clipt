import PostList from "@/components/PostList";
import PostForm from "@/components/PostForm";
import { useAuth } from "@/contexts/AuthContext";
import GameBoyControls from "@/components/GameBoyControls";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="h-[calc(100vh-80px)] relative">
      <div className="retro-screen h-full pb-[160px]">
        <PostList />
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Home;