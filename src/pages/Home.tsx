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
            className="
              relative w-16 h-8
              data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-gaming-600 data-[state=checked]:to-gaming-400
              data-[state=unchecked]:bg-gradient-to-r data-[state=unchecked]:from-gaming-700 data-[state=unchecked]:to-gaming-900
              rounded-lg
              border-[3px] border-gaming-400
              shadow-[inset_0_0_10px_rgba(155,135,245,0.3)]
              transition-all duration-300
              after:content-['']
              after:absolute
              after:inset-0
              after:bg-[linear-gradient(45deg,transparent_25%,rgba(155,135,245,0.2)_50%,transparent_75%)]
              after:bg-[length:200%_200%]
              after:animate-[gradient_3s_linear_infinite]
              before:content-['']
              before:absolute
              before:inset-[-2px]
              before:rounded-lg
              before:bg-gradient-to-r
              before:from-gaming-400/30
              before:to-gaming-600/30
              before:animate-pulse
              [&>span]:w-7
              [&>span]:h-7
              [&>span]:rounded-md
              [&>span]:bg-gradient-to-br
              [&>span]:from-gaming-200
              [&>span]:to-gaming-300
              [&>span]:shadow-[0_0_15px_rgba(155,135,245,0.6)]
              [&>span]:border-2
              [&>span]:border-gaming-400/50
              [&>span]:transition-all
              [&>span]:duration-300
              [&>span]:data-[state=checked]:translate-x-[32px]
              [&>span]:data-[state=unchecked]:translate-x-0.5
              hover:scale-105
              hover:shadow-[0_0_20px_rgba(155,135,245,0.4)]
            "
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