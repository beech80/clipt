
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { File, Gamepad, MessageSquare, Video, Settings, Info, Shield, Users, BookOpen, Code } from "lucide-react";

const guides = [
  {
    title: "Getting Started",
    href: "/docs/getting-started",
    icon: Info
  },
  {
    title: "Streaming Guide",
    href: "/docs/streaming",
    icon: Video
  },
  {
    title: "Content Creation",
    href: "/docs/content",
    icon: File
  },
  {
    title: "Gaming Features",
    href: "/docs/gaming",
    icon: Gamepad
  },
  {
    title: "Community & Chat",
    href: "/docs/community",
    icon: MessageSquare
  },
  {
    title: "Settings & Privacy",
    href: "/docs/settings",
    icon: Settings
  },
  {
    title: "Terms of Service",
    href: "/docs/terms-of-service",
    icon: File
  },
  {
    title: "Privacy Policy",
    href: "/docs/privacy-policy",
    icon: Shield
  },
  {
    title: "Community Guidelines",
    href: "/docs/community-guidelines",
    icon: Users
  },
  {
    title: "User Guide",
    href: "/docs/user-guide",
    icon: BookOpen
  },
  {
    title: "API Documentation",
    href: "/docs/api-documentation",
    icon: Code
  }
];

export function DocsNavigation() {
  const location = useLocation();

  return (
    <nav className="w-64 bg-card border-r border-border p-4 hidden md:block">
      <div className="space-y-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Documentation</h2>
          <div className="space-y-1">
            {guides.map((guide) => {
              const Icon = guide.icon;
              return (
                <Link
                  key={guide.href}
                  to={guide.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                    location.pathname === guide.href 
                      ? "bg-secondary text-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {guide.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
