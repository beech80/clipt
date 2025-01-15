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
    <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] relative pt-10">
      <div className="absolute -top-2 left-0 right-0 z-20 flex flex-col items-center gap-4">
        <Tabs 
          defaultValue="clips" 
          className="w-[200px]"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2 bg-gaming-700/20">
            <TabsTrigger 
              value="clips" 
              className="data-[state=active]:bg-gaming-400/20"
            >
              CLIPS
            </TabsTrigger>
            <TabsTrigger 
              value="squad" 
              className="data-[state=active]:bg-gaming-400/20"
            >
              SQUAD
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="absolute top-14 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm">
        <div className="flex justify-center items-center px-4 py-3">
          <Dialog open={isPostFormOpen} onOpenChange={setIsPostFormOpen}>
            <DialogTrigger asChild>
              <Button 
                className="gaming-button flex gap-2 items-center"
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
        </div>
      </div>
      <div className="snap-y snap-mandatory overflow-y-auto h-full mt-12">
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