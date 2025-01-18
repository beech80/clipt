import React, { useState } from "react";
import PostList from "@/components/PostList";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PostForm from "@/components/PostForm";
import GameBoyControls from "@/components/GameBoyControls";
import { StoriesBar } from "@/components/stories/StoriesBar";

const Home: React.FC = () => {
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");

  return (
    <div className="h-[calc(100vh-80px)] relative">
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="w-full bg-[#1A1F2C]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <StoriesBar />
            <div className="w-full h-12 sm:h-14">
              <div className="flex w-full h-full">
                <Dialog open={isPostFormOpen} onOpenChange={setIsPostFormOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="relative h-full w-1/2 bg-gradient-to-b from-gaming-700/40 to-gaming-800/50 
                      border-y-2 border-l-2 border-gaming-400/50 text-white hover:from-gaming-700/50 hover:to-gaming-800/60
                      active:from-gaming-700/60 active:to-gaming-800/70 transform active:translate-y-0.5
                      transition-all duration-200 shadow-[0_0_15px_rgba(155,135,245,0.3)]
                      hover:shadow-[0_0_20px_rgba(155,135,245,0.4)] rounded-none
                      text-sm sm:text-base touch-manipulation"
                    >
                      <span className="flex items-center -skew-x-12">
                        <span className="hidden sm:inline">SQUADS</span>
                        <span className="sm:hidden">SQUADS</span>
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] w-[95%] mx-auto">
                    <PostForm onPostCreated={() => setIsPostFormOpen(false)} />
                  </DialogContent>
                </Dialog>

                <div className="w-[2px] h-full bg-gaming-400/50" />

                <Button 
                  className={`relative h-full w-1/2 bg-gradient-to-b from-gaming-700/40 to-gaming-800/50 
                  border-y-2 border-r-2 border-gaming-400/50 text-white hover:from-gaming-700/50 hover:to-gaming-800/60
                  active:from-gaming-700/60 active:to-gaming-800/70 transform active:translate-y-0.5
                  transition-all duration-200 shadow-[0_0_15px_rgba(155,135,245,0.3)]
                  hover:shadow-[0_0_20px_rgba(155,135,245,0.4)] rounded-none text-sm sm:text-base touch-manipulation
                  ${activeTab === "squad" ? "from-gaming-600/50 to-gaming-700/60" : ""}`}
                  onClick={() => setActiveTab(activeTab === "squad" ? "feed" : "squad")}
                >
                  <span className="flex items-center -skew-x-12 font-bold tracking-wider">
                    SQUADS
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="retro-screen h-full pt-16 pb-[160px] sm:pb-[180px] overscroll-none">
        <PostList />
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Home;
