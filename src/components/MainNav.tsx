import { Home, Compass, MessageSquare, User, LogIn, Video, Trophy, LogOut, Film } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export function MainNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
      toast.success('Successfully signed out');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/discover", icon: Compass, label: "Discover" },
    { path: "/for-you", icon: Film, label: "For You" },
    { path: "/clipts", icon: Video, label: "Clipts" },
    { path: "/streaming", icon: Video, label: "Stream" },
    { path: "/top-clips", icon: Trophy, label: "Top Clips" },
    { path: "/messages", icon: MessageSquare, label: "Messages" },
    { path: "/profile", icon: User, label: "Profile" },
    { path: "/login", icon: LogIn, label: "Login", hideWhenAuth: true },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.hideWhenAuth || !user
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gaming-700/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-xl items-center justify-around px-2 py-1">
        {isMobile ? (
          <>
            {filteredNavItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`p-2 transition-all hover:text-gaming-400 ${
                  isActive(path) ? "text-gaming-400 scale-110" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </Link>
            ))}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="p-2 transition-all hover:text-gaming-400 text-muted-foreground"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </>
        ) : (
          <>
            {filteredNavItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center p-2 transition-all hover:text-gaming-400 ${
                  isActive(path) ? "text-gaming-400 scale-110" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            ))}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="flex flex-col items-center p-2 transition-all hover:text-gaming-400 text-muted-foreground"
              >
                <LogOut className="h-6 w-6" />
                <span className="text-xs font-medium">Logout</span>
              </Button>
            )}
          </>
        )}
      </div>
    </nav>
  );
}