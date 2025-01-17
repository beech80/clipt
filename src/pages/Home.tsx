import PostList from "@/components/PostList";
import PostForm from "@/components/PostForm";
import { useAuth } from "@/contexts/AuthContext";
import GameBoyControls from "@/components/GameBoyControls";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="h-[calc(100vh-80px)] relative">
      {/* Squads Section */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex overflow-x-auto gap-2 p-2 scrollbar-hide">
          {/* Sample squads - replace with actual data */}
          {[1, 2, 3, 4, 5].map((squad) => (
            <div
              key={squad}
              className="flex-shrink-0 w-16 h-16 rounded-full bg-gaming-400/20 border-2 border-gaming-400 flex items-center justify-center"
            >
              <span className="text-sm text-gaming-400">Squad {squad}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Post Button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            className="fixed right-4 bottom-40 z-50 rounded-full h-14 w-14 shadow-lg bg-gaming-400 hover:bg-gaming-500"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>Create a Post</SheetTitle>
            <SheetDescription>Share your gaming moments with your squad.</SheetDescription>
          </SheetHeader>
          <PostForm />
        </SheetContent>
      </Sheet>

      <div className="retro-screen h-full pb-[160px] pt-[84px]">
        <PostList />
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Home;