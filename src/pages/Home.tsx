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
    <div className="min-h-screen bg-[#1A1F2C]">
      <div className="fixed top-0 left-0 right-0 z-20">
        <div className="flex w-full">
          <Dialog open={isPostFormOpen} onOpenChange={setIsPostFormOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-1/2 h-14 bg-[#553C9A] hover:bg-[#553C9A]/90 
                  text-white text-xl font-semibold rounded-none border-r border-[#6B46C1]
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
            className={`w-1/2 h-14 bg-[#553C9A] hover:bg-[#553C9A]/90 
              text-white text-xl font-semibold rounded-none border-l border-[#6B46C1]
              transition-all duration-200 ${activeTab === "squad" ? "bg-[#6B46C1]" : ""}`}
            onClick={() => setActiveTab(activeTab === "squad" ? "feed" : "squad")}
          >
            SQUADS
          </Button>
        </div>
      </div>

      <div className="pt-14 pb-[140px] sm:pb-[160px]">
        <PostList />
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Home;