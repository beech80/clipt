import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Home, MessageSquare, Video, Trophy, Settings, Gamepad } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { useIsMobile } from "@/hooks/use-mobile";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  return (
    <nav
      className={cn(
        "flex items-center space-x-4 lg:space-x-6",
        isMobile ? "overflow-x-auto pb-2 snap-x snap-mandatory" : "",
        className
      )}
      {...props}
    >
      <NavLink
        to="/"
        className={({ isActive }) =>
          cn(
            "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 whitespace-nowrap snap-start",
            isActive ? "text-primary" : "text-muted-foreground",
            isMobile ? "px-3" : ""
          )
        }
      >
        <Home className="h-4 w-4" />
        Home
      </NavLink>
      <NavLink
        to="/discover"
        className={({ isActive }) =>
          cn(
            "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 whitespace-nowrap snap-start",
            isActive ? "text-primary" : "text-muted-foreground",
            isMobile ? "px-3" : ""
          )
        }
      >
        <Gamepad className="h-4 w-4" />
        Discover
      </NavLink>
      {!isMobile && <SearchBar />}
      <NavLink
        to="/streaming"
        className={({ isActive }) =>
          cn(
            "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 whitespace-nowrap snap-start",
            isActive ? "text-primary" : "text-muted-foreground",
            isMobile ? "px-3" : ""
          )
        }
      >
        <Video className="h-4 w-4" />
        Streaming
      </NavLink>
      <NavLink
        to="/top-clips"
        className={({ isActive }) =>
          cn(
            "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 whitespace-nowrap snap-start",
            isActive ? "text-primary" : "text-muted-foreground",
            isMobile ? "px-3" : ""
          )
        }
      >
        <Trophy className="h-4 w-4" />
        Top Clips
      </NavLink>
      {user?.id && (
        <>
          <NavLink
            to="/clipts"
            className={({ isActive }) =>
              cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 whitespace-nowrap snap-start",
                isActive ? "text-primary" : "text-muted-foreground",
                isMobile ? "px-3" : ""
              )
            }
          >
            <Video className="h-4 w-4" />
            Clipts
          </NavLink>
          <NavLink
            to="/messages"
            className={({ isActive }) =>
              cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 whitespace-nowrap snap-start",
                isActive ? "text-primary" : "text-muted-foreground",
                isMobile ? "px-3" : ""
              )
            }
          >
            <MessageSquare className="h-4 w-4" />
            Messages
          </NavLink>
        </>
      )}
    </nav>
  );
}