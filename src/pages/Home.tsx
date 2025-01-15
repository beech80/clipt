import PostList from "@/components/PostList";
import PostForm from "@/components/PostForm";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Home = () => {
  const { user } = useAuth();
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("clips");

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-80px)] relative">
      <div className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-gaming-400 mb-4">CLIPS</h1>
        <div className="w-full px-4 py-3 bg-[#1A1F2C]/80 backdrop-blur-sm border-y border-gaming-400/20">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <Dialog open={isPostFormOpen} onOpenChange={setIsPostFormOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="border border-gaming-400 bg-transparent hover:bg-gaming-400/10 text-white flex gap-2 items-center"
                  size="sm"
                >
                  <Video className="w-4 h-4" />
                  Post
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <PostForm onPostCreated={() => setIsPostFormOpen(false)} />
              </DialogContent>
            </Dialog>

            <Tabs 
              defaultValue="clips" 
              className="w-48"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2 bg-gaming-700/20">
                <TabsTrigger 
                  value="squad" 
                  className="data-[state=active]:bg-gaming-400/20"
                >
                  SQUAD
                </TabsTrigger>
                <TabsTrigger 
                  value="clips" 
                  className="data-[state=active]:bg-gaming-400"
                >
                  CLIPS
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="retro-screen h-full pt-32">
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