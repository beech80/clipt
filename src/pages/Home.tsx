import React, { useState } from "react";
import PostList from "@/components/PostList";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PostForm from "@/components/PostForm";
import GameBoyControls from "@/components/GameBoyControls";
import { Video } from "lucide-react";

const Home: React.FC = () => {
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");

  return (
    <div className="h-[calc(100vh-80px)] relative bg-[#1A1F2C]">
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="w-full bg-[#1A1F2C]">
          <div className="flex flex-col items-center">
            <div className="w-full h-14">
              <div className="flex w-full h-full">
                <Dialog open={isPostFormOpen} onOpenChange={setIsPostFormOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="relative h-full w-1/2 bg-[#6B46C1] hover:bg-[#553C9A] 
                        text-white text-lg font-semibold rounded-none border-r border-[#553C9A]
                        transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Video className="h-5 w-5" />
                      POST
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] w-[95%] mx-auto">
                    <PostForm onPostCreated={() => setIsPostFormOpen(false)} />
                  </DialogContent>
                </Dialog>

                <Button 
                  className={`relative h-full w-1/2 bg-[#6B46C1] hover:bg-[#553C9A] 
                    text-white text-lg font-semibold rounded-none
                    transition-all duration-200 ${activeTab === "squad" ? "bg-[#553C9A]" : ""}`}
                  onClick={() => setActiveTab(activeTab === "squad" ? "feed" : "squad")}
                >
                  SQUADS
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-full pt-16 pb-[160px] sm:pb-[180px] overscroll-none">
        <PostList />
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Home;