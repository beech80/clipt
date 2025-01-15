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
        <div className="w-full px-4 py-3 bg-[#1A1F2C]/80 backdrop-blur-sm border-y border-gaming-400/20">
          <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
            <h1 className="text-2xl font-bold gaming-gradient tracking-wider">
              CLIPS
            </h1>
            
            <div className="flex justify-between items-center w-full">
              <Dialog open={isPostFormOpen} onOpenChange={setIsPostFormOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="relative h-12 px-6 bg-gradient-to-b from-gaming-400/20 to-gaming-400/30 
                    border-2 border-gaming-400/50 text-white hover:from-gaming-400/30 hover:to-gaming-400/40
                    active:from-gaming-400/40 active:to-gaming-400/50 transform active:translate-y-0.5
                    rounded-r-lg rounded-l-sm skew-x-12 transition-all duration-200 min-w-[100px]
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

              {/* Smooth Game-like Toggle Switch */}
              <div className="relative inline-flex items-center min-w-[140px] h-9">
                <div 
                  className="absolute inset-0 rounded-sm"
                  style={{
                    background: 'linear-gradient(to right, rgba(155, 135, 245, 0.1), rgba(139, 92, 246, 0.1))',
                    border: '2px solid rgba(155, 135, 245, 0.3)',
                    boxShadow: '0 0 10px rgba(155, 135, 245, 0.15)',
                  }}
                ></div>
                <div 
                  className={`absolute h-full w-1/2 transition-all duration-300 ease-out rounded-sm ${
                    activeTab === "clips" ? "translate-x-full" : "translate-x-0"
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, rgba(155, 135, 245, 0.15), rgba(139, 92, 246, 0.25))',
                    boxShadow: '0 0 10px rgba(155, 135, 245, 0.2)',
                    border: '2px solid rgba(155, 135, 245, 0.4)',
                  }}
                ></div>
                <button
                  onClick={() => setActiveTab("squad")}
                  className={`relative flex-1 h-full px-2 text-xs font-bold tracking-wider transition-colors duration-200 ${
                    activeTab === "squad" 
                      ? "text-gaming-400" 
                      : "text-gray-400 hover:text-gaming-400/70"
                  }`}
                >
                  SQUAD
                </button>
                <button
                  onClick={() => setActiveTab("clips")}
                  className={`relative flex-1 h-full px-2 text-xs font-bold tracking-wider transition-colors duration-200 ${
                    activeTab === "clips" 
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