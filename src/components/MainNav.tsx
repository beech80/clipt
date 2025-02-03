import React from "react";
import { cn } from "@/lib/utils";
import { 
  MessageSquare, 
  Video, 
  Home, 
  Trophy, 
  Users, 
  Camera,
  Settings,
  Gamepad,
  Crown
} from "lucide-react";
import NavButton from "./nav/NavButton";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/streaming", icon: Video, label: "Streaming" },
  { to: "/clipts", icon: Camera, label: "Clipts" },
  { to: "/messages", icon: MessageSquare, label: "Messages" },
  { to: "/squads", icon: Users, label: "Squads" },
  { to: "/top-clips", icon: Trophy, label: "Top Clips" },
  { to: "/esports", icon: Crown, label: "Esports" },
  { to: "/discover", icon: Gamepad, label: "Discover" }
];

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {navItems.map((item) => (
        <NavButton
          key={item.to}
          to={item.to}
          icon={item.icon}
          label={item.label}
        />
      ))}
    </nav>
  );
}