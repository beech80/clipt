import PostList from "@/components/PostList";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] relative">
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
        <div className="flex justify-center items-center gap-4">
          <span className="text-purple-300 font-medium">Squad</span>
          <span className="text-white/60">|</span>
          <span className="text-white font-medium">Clips</span>
        </div>
      </div>
      <div className="snap-y snap-mandatory overflow-y-auto h-full">
        <PostList />
      </div>
    </div>
  );
};

export default Home;