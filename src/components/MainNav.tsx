import { Home, Compass, MessageSquare, User, LogIn, Video } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function MainNav() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gaming-700/50 bg-background/80 p-2 backdrop-blur-xl md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="mx-auto flex max-w-screen-xl items-center justify-around px-4">
        <Link
          to="/"
          className={`flex flex-col items-center p-2 transition-all hover:text-gaming-400 ${
            isActive("/") 
              ? "text-gaming-400 scale-110" 
              : "text-muted-foreground"
          }`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs font-medium">Home</span>
        </Link>
        <Link
          to="/discover"
          className={`flex flex-col items-center p-2 transition-all hover:text-gaming-400 ${
            isActive("/discover")
              ? "text-gaming-400 scale-110"
              : "text-muted-foreground"
          }`}
        >
          <Compass className="h-6 w-6" />
          <span className="text-xs font-medium">Discover</span>
        </Link>
        <Link
          to="/streaming"
          className={`flex flex-col items-center p-2 transition-all hover:text-gaming-400 ${
            isActive("/streaming")
              ? "text-gaming-400 scale-110"
              : "text-muted-foreground"
          }`}
        >
          <Video className="h-6 w-6" />
          <span className="text-xs font-medium">Stream</span>
        </Link>
        <Link
          to="/messages"
          className={`flex flex-col items-center p-2 transition-all hover:text-gaming-400 ${
            isActive("/messages")
              ? "text-gaming-400 scale-110"
              : "text-muted-foreground"
          }`}
        >
          <MessageSquare className="h-6 w-6" />
          <span className="text-xs font-medium">Messages</span>
        </Link>
        <Link
          to="/profile"
          className={`flex flex-col items-center p-2 transition-all hover:text-gaming-400 ${
            isActive("/profile")
              ? "text-gaming-400 scale-110"
              : "text-muted-foreground"
          }`}
        >
          <User className="h-6 w-6" />
          <span className="text-xs font-medium">Profile</span>
        </Link>
        <Link
          to="/login"
          className={`flex flex-col items-center p-2 transition-all hover:text-gaming-400 ${
            isActive("/login")
              ? "text-gaming-400 scale-110"
              : "text-muted-foreground"
          }`}
        >
          <LogIn className="h-6 w-6" />
          <span className="text-xs font-medium">Login</span>
        </Link>
      </div>
    </nav>
  );
}