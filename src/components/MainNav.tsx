import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageSquare, Video } from "lucide-react";

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
        Home
      </Link>
      <Link
        to="/progress"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Progress
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
        to="/messages"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <Button variant="ghost" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Messages
        </Button>
      </Link>
    </nav>
  );
}