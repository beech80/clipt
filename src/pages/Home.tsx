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
                    className="relative h-10 px-5 bg-gradient-to-b from-gaming-400/20 to-gaming-400/30 
                    border-2 border-gaming-400/50 text-white hover:from-gaming-400/30 hover:to-gaming-400/40
                    active:from-gaming-400/40 active:to-gaming-400/50 transform active:translate-y-0.5
                    rounded-r-lg rounded-l-sm skew-x-12 transition-all duration-200 min-w-[90px]
                    shadow-[0_0_15px_rgba(155,135,245,0.3)] hover:shadow-[0_0_20px_rgba(155,135,245,0.4)]"
                    size="sm"
                  >
                    <span className="flex items-center -skew-x-12">
                      <Video className="w-4 h-4 mr-2" />
                      Post
                    </span>
                    {/* Trigger accent */}
                    <div className="absolute -right-0.5 top-0 bottom-0 w-2 bg-gaming-400/30 
                      border-r-2 border-gaming-400/50 rounded-r-lg"></div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <PostForm onPostCreated={() => setIsPostFormOpen(false)} />
                </DialogContent>
              </Dialog>

              {/* Gaming Toggle Switch Container */}
              <div className="relative inline-flex items-center min-w-[180px] h-10">
                {/* Background Frame */}
                <div 
                  className="absolute inset-0 bg-gradient-to-b from-gaming-400/20 to-gaming-400/30 
                    border-2 border-gaming-400/50 rounded-r-lg rounded-l-sm skew-x-12
                    shadow-[0_0_15px_rgba(155,135,245,0.3)]"
                ></div>
                {/* Sliding Highlight */}
                <div 
                  className={`absolute h-full w-1/2 transition-all duration-300 ease-out 
                    bg-gradient-to-b from-gaming-400/30 to-gaming-400/40 
                    border-2 border-gaming-400/50 rounded-r-lg rounded-l-sm skew-x-12
                    shadow-[0_0_20px_rgba(155,135,245,0.4)]
                    ${activeTab === "clips" ? "translate-x-full" : "translate-x-0"}`}
                >
                  {/* Right Edge Accent */}
                  <div className="absolute -right-0.5 top-0 bottom-0 w-2 bg-gaming-400/30 
                    border-r-2 border-gaming-400/50 rounded-r-lg"></div>
                </div>
                {/* Button Labels */}
                <button
                  onClick={() => setActiveTab("squad")}
                  className={`relative flex-1 h-full px-4 text-xs font-bold tracking-wider transition-colors duration-200 -skew-x-12
                    ${activeTab === "squad" 
                      ? "text-gaming-400" 
                      : "text-gray-400 hover:text-gaming-400/70"
                    }`}
                >
                  SQUAD
                </button>
                <button
                  onClick={() => setActiveTab("clips")}
                  className={`relative flex-1 h-full px-4 text-xs font-bold tracking-wider transition-colors duration-200 -skew-x-12
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