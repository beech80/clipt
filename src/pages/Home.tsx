import PostList from "@/components/PostList";
import PostForm from "@/components/PostForm";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useSheetState } from "@/hooks/use-sheet-state";

const Home = () => {
  const { user } = useAuth();
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("squad");
  const { isOpen: isMenuOpen } = useSheetState();

  return (
    <div className="h-[calc(100vh-80px)] relative">
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="w-full bg-[#1A1F2C]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="w-full h-12">
              <div className="flex w-full h-full">
                <Dialog open={isPostFormOpen} onOpenChange={setIsPostFormOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="relative h-full w-1/2 bg-gradient-to-b from-gaming-700/40 to-gaming-800/50 
                      border-y-2 border-l-2 border-gaming-400/50 text-white hover:from-gaming-700/50 hover:to-gaming-800/60
                      active:from-gaming-700/60 active:to-gaming-800/70 transform active:translate-y-0.5
                      transition-all duration-200 shadow-[0_0_15px_rgba(155,135,245,0.3)]
                      hover:shadow-[0_0_20px_rgba(155,135,245,0.4)] rounded-none"
                    >
                      <span className="flex items-center -skew-x-12">
                        <Video className="w-4 h-4 mr-2" />
                        POST
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <PostForm onPostCreated={() => setIsPostFormOpen(false)} />
                  </DialogContent>
                </Dialog>

                <div className="w-[2px] h-full bg-gaming-400/50" />

                <Button 
                  className="relative h-full w-1/2 bg-gradient-to-b from-gaming-700/40 to-gaming-800/50 
                  border-y-2 border-r-2 border-gaming-400/50 text-white hover:from-gaming-700/50 hover:to-gaming-800/60
                  active:from-gaming-700/60 active:to-gaming-800/70 transform active:translate-y-0.5
                  transition-all duration-200 shadow-[0_0_15px_rgba(155,135,245,0.3)]
                  hover:shadow-[0_0_20px_rgba(155,135,245,0.4)] rounded-none"
                  onClick={() => setActiveTab("squad")}
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

      <div className="retro-screen h-full pt-16">
        {activeTab === "squad" ? (
          <div className="flex items-center justify-center h-full text-gaming-400">
            Squad feature coming soon!
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Home;