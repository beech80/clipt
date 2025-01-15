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

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] relative pt-10">
      <div className="absolute -top-2 left-0 right-0 z-20 text-center">
        <h1 className="text-3xl font-bold gaming-gradient relative inline-block transform -translate-y-2">
          CLIPS
          <div className="absolute inset-0 blur-sm opacity-50 gaming-gradient">
            CLIPS
          </div>
        </h1>
      </div>
      
      <div className="absolute top-8 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm">
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
      <div className="snap-y snap-mandatory overflow-y-auto h-full mt-4">
        <PostList />
      </div>
    </div>
  );
};

export default Home;