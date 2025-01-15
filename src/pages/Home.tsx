import PostList from "@/components/PostList";
import PostForm from "@/components/PostForm";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

const Home = () => {
  const { user } = useAuth();
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("clips");

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-80px)] relative">
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="w-full px-4 py-3 bg-[#1A1F2C]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
            <h1 className="text-2xl font-bold gaming-gradient tracking-wider">
              CLIPT
            </h1>
            
            <div className="flex justify-between items-center w-full space-x-6">
              <Dialog open={isPostFormOpen} onOpenChange={setIsPostFormOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="relative h-10 w-[100px] bg-gradient-to-b from-gaming-400/20 to-gaming-400/30 
                    border-2 border-gaming-400/50 text-white hover:from-gaming-400/30 hover:to-gaming-400/40
                    active:from-gaming-400/40 active:to-gaming-400/50 transform active:translate-y-0.5
                    transition-all duration-200 shadow-[0_0_15px_rgba(155,135,245,0.3)]
                    hover:shadow-[0_0_20px_rgba(155,135,245,0.4)]
                    [clip-path:polygon(0_0,100%_0,85%_100%,0%_100%)]"
                    size="sm"
                  >
                    <span className="flex items-center">
                      <Video className="w-4 h-4 mr-2" />
                      Post
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <PostForm onPostCreated={() => setIsPostFormOpen(false)} />
                </DialogContent>
              </Dialog>

              {/* Gaming Toggle Container */}
              <div className="relative inline-flex items-center min-w-[200px] h-10">
                {/* Background Frame */}
                <div className="absolute inset-0 bg-gradient-to-b from-gaming-400/20 to-gaming-400/30 
                  border-2 border-gaming-400/50 shadow-[0_0_15px_rgba(155,135,245,0.3)]
                  [clip-path:polygon(15%_0,85%_0,100%_100%,0%_100%)]">
                </div>
                
                {/* Sliding Highlight */}
                <div 
                  className={`absolute h-full w-1/2 transition-all duration-300 ease-out 
                    bg-gradient-to-b from-gaming-400/30 to-gaming-400/40 
                    border-2 border-gaming-400/50 shadow-[0_0_20px_rgba(155,135,245,0.4)]
                    [clip-path:polygon(15%_0,85%_0,100%_100%,0%_100%)]
                    ${activeTab === "clips" ? "translate-x-[95px]" : "translate-x-0"}`}
                >
                  {/* Highlight Glow */}
                  <div className="absolute inset-0 bg-gaming-400/10"></div>
                </div>

                {/* Button Labels */}
                <button
                  onClick={() => setActiveTab("squad")}
                  className={`relative flex-1 h-full px-4 text-xs font-bold tracking-wider transition-colors duration-200
                    ${activeTab === "squad" 
                      ? "text-gaming-400" 
                      : "text-gray-400 hover:text-gaming-400/70"
                    }`}
                >
                  SQUAD
                </button>
                <button
                  onClick={() => setActiveTab("clips")}
                  className={`relative flex-1 h-full px-4 text-xs font-bold tracking-wider transition-colors duration-200
                    ${activeTab === "clips" 
                      ? "text-gaming-400" 
                      : "text-gray-400 hover:text-gaming-400/70"
                    }`}
                >
                  CLIPS
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="retro-screen h-full pt-16">
        {activeTab === "clips" ? (
          <PostList />
        ) : (
          <div className="flex items-center justify-center h-full text-gaming-400">
            Squad feature coming soon!
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;