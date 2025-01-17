import PostList from "@/components/PostList";
import PostForm from "@/components/PostForm";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import GameBoyControls from "@/components/GameBoyControls";

const Home = () => {
  const { user } = useAuth();
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);

  return (
    <div className="h-[calc(100vh-80px)] relative">
      <div className="retro-screen h-full pb-[160px]">
        <PostList />
      </div>

      <div className="fixed bottom-24 right-6 z-30">
        <Dialog open={isPostFormOpen} onOpenChange={setIsPostFormOpen}>
          <DialogTrigger asChild>
            <Button 
              className="clip-button"
              size="lg"
            >
              <Video className="w-5 h-5 mr-2" />
              <span>Post</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <PostForm onPostCreated={() => setIsPostFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Home;