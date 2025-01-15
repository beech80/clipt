import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Home, Users, Trophy, Radio, MessageSquare, User } from "lucide-react";

export const MainNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/discover", label: "Discover", icon: Users },
    { href: "/top-clips", label: "Top Clips", icon: Trophy },
    { href: "/streaming", label: "Streaming", icon: Radio },
    { href: "/messages", label: "Messages", icon: MessageSquare },
  ];

  if (!user) {
    return null;
  }

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4 lg:space-x-6">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center space-x-2",
                isActive(href)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          ))}
          {user && (
            <Link
              to={`/profile/${user.id}`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center space-x-2",
                isActive(`/profile/${user.id}`)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};