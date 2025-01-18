import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Home, MessageSquare, Video, Trophy, Gamepad } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { LanguageSelector } from "./LanguageSelector";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/discover", icon: Gamepad, label: "Discover" },
  { to: "/streaming", icon: Video, label: "Streaming" },
  { to: "/top-clips", icon: Trophy, label: "Top Clips" },
];

const authenticatedNavItems = [
  { to: "/clipts", icon: Video, label: "Clipts" },
  { to: "/messages", icon: MessageSquare, label: "Messages" },
];

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const { user } = useAuth();

  const renderNavItem = ({ to, icon: Icon, label }: typeof navItems[0]) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        cn(
          "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
          isActive ? "text-primary" : "text-muted-foreground"
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {navItems.map(renderNavItem)}
      <SearchBar />
      <LanguageSelector />
      {user?.id && authenticatedNavItems.map(renderNavItem)}
    </nav>
  );
}