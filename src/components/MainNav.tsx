import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/UserMenu";
import NotificationsPopover from "@/components/NotificationsPopover";
import { SearchBar } from "@/components/SearchBar";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Tv,
  Video,
  Trophy,
  Gamepad2,
  MessageSquare,
  Settings,
  FolderHeart,
} from "lucide-react";

export function MainNav() {
  const { user } = useAuth();

  return (
    <nav className="flex items-center justify-between p-4 border-b border-gaming-600/20 backdrop-blur-sm bg-gaming-800/80">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-2xl font-bold text-gaming-100">
          Clip
        </Link>

        {user && (
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/home">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link to="/streaming">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Tv className="h-4 w-4" />
                Streaming
              </Button>
            </Link>
            <Link to="/top-clips">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Top Clips
              </Button>
            </Link>
            <Link to="/achievements">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Achievements
              </Button>
            </Link>
            <Link to="/discover">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                Discover
              </Button>
            </Link>
            <Link to="/collections">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <FolderHeart className="h-4 w-4" />
                Collections
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:block w-72">
          <SearchBar />
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <Link to="/messages">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
            <NotificationsPopover />
            <UserMenu />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}