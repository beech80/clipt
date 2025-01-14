import PostList from "@/components/PostList";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const Home = () => {
  const { user } = useAuth();
  const [showClips, setShowClips] = useState(false);

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] relative">
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
        <div className="flex justify-center items-center gap-4">
          <span className={`text-sm font-medium transition-colors ${!showClips ? 'text-purple-300' : 'text-white/60'}`}>
            Squad
          </span>
          <Switch 
            checked={showClips}
            onCheckedChange={setShowClips}
            className="data-[state=checked]:bg-gaming-500 data-[state=unchecked]:bg-gaming-700"
          />
          <span className={`text-sm font-medium transition-colors ${showClips ? 'text-purple-300' : 'text-white/60'}`}>
            Clips
          </span>
        </div>
      </div>
      <div className="snap-y snap-mandatory overflow-y-auto h-full">
        <PostList />
      </div>
    </div>
  );
};

export default Home;