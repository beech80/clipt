import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Video, 
  Home, 
  Trophy, 
  Users, 
  Camera,
  Settings,
  GameController,
  Crown
} from "lucide-react";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        to="/"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        <Button variant="ghost" size="sm" className="gap-2">
          <Home className="h-4 w-4" />
          Home
        </Button>
      </Link>
      
      <Link
        to="/streaming"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <Button variant="ghost" size="sm" className="gap-2">
          <Video className="h-4 w-4" />
          Streaming
        </Button>
      </Link>

      <Link
        to="/clipts"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <Button variant="ghost" size="sm" className="gap-2">
          <Camera className="h-4 w-4" />
          Clipts
        </Button>
      </Link>

      <Link
        to="/messages"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <Button variant="ghost" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Messages
        </Button>
      </Link>

      <Link
        to="/squads"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <Button variant="ghost" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Squads
        </Button>
      </Link>

      <Link
        to="/top-clips"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <Button variant="ghost" size="sm" className="gap-2">
          <Trophy className="h-4 w-4" />
          Top Clips
        </Button>
      </Link>

      <Link
        to="/esports"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <Button variant="ghost" size="sm" className="gap-2">
          <Crown className="h-4 w-4" />
          Esports
        </Button>
      </Link>

      <Link
        to="/discover"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <Button variant="ghost" size="sm" className="gap-2">
          <GameController className="h-4 w-4" />
          Discover
        </Button>
      </Link>
    </nav>
  );
}