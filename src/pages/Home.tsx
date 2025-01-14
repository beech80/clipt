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
        <div className="flex justify-center items-center gap-6">
          <span 
            className={`text-sm font-bold uppercase tracking-wider transition-all ${
              !showClips 
                ? 'text-gaming-200 drop-shadow-[0_0_8px_rgba(155,135,245,0.8)]' 
                : 'text-white/60'
            }`}
          >
            Squad
          </span>
          <Switch 
            checked={showClips}
            onCheckedChange={setShowClips}
            className="data-[state=checked]:bg-gaming-500 data-[state=unchecked]:bg-gaming-700 animate-glow relative after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(to_right,transparent,rgba(155,135,245,0.2),transparent)] after:animate-scanline"
          />
          <span 
            className={`text-sm font-bold uppercase tracking-wider transition-all ${
              showClips 
                ? 'text-gaming-200 drop-shadow-[0_0_8px_rgba(155,135,245,0.8)]' 
                : 'text-white/60'
            }`}
          >
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