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
  const [activeTab, setActiveTab] = useState("squad");

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-80px)] relative">
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="w-full px-4 py-3 bg-[#1A1F2C]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
            <h1 className="text-2xl font-bold gaming-gradient tracking-wider">
              CLIPT
            </h1>
            
            <div className="relative w-full h-12">
              <div className="absolute left-0 right-0 flex justify-between">
                <Dialog open={isPostFormOpen} onOpenChange={setIsPostFormOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="relative h-12 w-[140px] bg-gradient-to-b from-gaming-400/20 to-gaming-400/30 
                      border-2 border-gaming-400/50 text-white hover:from-gaming-400/30 hover:to-gaming-400/40
                      active:from-gaming-400/40 active:to-gaming-400/50 transform active:translate-y-0.5
                      transition-all duration-200 shadow-[0_0_15px_rgba(155,135,245,0.3)]
                      hover:shadow-[0_0_20px_rgba(155,135,245,0.4)]"
                      style={{
                        clipPath: "polygon(0 0, 100% 0, 80% 100%, 0% 100%)",
                        transform: "perspective(500px) rotateY(15deg)"
                      }}
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

                <Button 
                  className="relative h-12 w-[140px] bg-gradient-to-b from-gaming-400/20 to-gaming-400/30 
                  border-2 border-gaming-400/50 text-white hover:from-gaming-400/30 hover:to-gaming-400/40
                  active:from-gaming-400/40 active:to-gaming-400/50 transform active:translate-y-0.5
                  transition-all duration-200 shadow-[0_0_15px_rgba(155,135,245,0.3)]
                  hover:shadow-[0_0_20px_rgba(155,135,245,0.4)]"
                  style={{
                    clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0% 100%)",
                    transform: "perspective(500px) rotateY(-15deg)"
                  }}
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