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
            className={`clip-button ${
              !showClips ? 'opacity-100' : 'opacity-40'
            }`}
          >
            SQUAD
          </span>
          <Switch 
            checked={showClips}
            onCheckedChange={setShowClips}
            className="
              relative w-24 h-24
              data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-gaming-400 data-[state=checked]:to-gaming-600
              data-[state=unchecked]:bg-gradient-to-br data-[state=unchecked]:from-gaming-700 data-[state=unchecked]:to-gaming-900
              rounded-full
              border-[4px] border-gaming-400
              shadow-[inset_0_0_20px_rgba(155,135,245,0.4)]
              transition-all duration-300
              after:content-['']
              after:absolute
              after:inset-0
              after:rounded-full
              after:bg-[radial-gradient(circle_at_50%_50%,transparent_30%,rgba(155,135,245,0.2)_70%)]
              after:animate-[pulse_2s_ease-in-out_infinite]
              before:content-['']
              before:absolute
              before:inset-[-4px]
              before:rounded-full
              before:bg-gradient-to-r
              before:from-gaming-400/40
              before:to-gaming-600/40
              before:animate-[spin_8s_linear_infinite]
              [&>span]:w-16
              [&>span]:h-16
              [&>span]:rounded-full
              [&>span]:bg-gradient-to-br
              [&>span]:from-gaming-200
              [&>span]:to-gaming-400
              [&>span]:shadow-[0_0_30px_rgba(155,135,245,0.8)]
              [&>span]:border-4
              [&>span]:border-gaming-400/70
              [&>span]:transition-all
              [&>span]:duration-500
              [&>span]:data-[state=checked]:translate-x-6
              [&>span]:data-[state=unchecked]:translate-x-0
              [&>span]:data-[state=checked]:scale-90
              [&>span]:data-[state=unchecked]:scale-100
              hover:scale-105
              hover:shadow-[0_0_40px_rgba(155,135,245,0.6)]
              hover:[&>span]:shadow-[0_0_40px_rgba(155,135,245,1)]
            "
          />
          <span 
            className={`clip-button ${
              showClips ? 'opacity-100' : 'opacity-40'
            }`}
          >
            CLIPS
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