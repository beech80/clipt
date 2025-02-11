
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FileText, Gamepad, MessageSquare, Video, Settings, Info, Shield, Users, BookOpen, Code } from "lucide-react";

const guides = [
  {
    title: "Getting Started",
    href: "/docs",
    icon: Info
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
  },
  {
    title: "Terms of Service",
    href: "/docs/terms-of-service",
    icon: FileText
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
    title: "Streaming Guide",
    href: "/docs/streaming-guide",
    icon: Video
  }
];

export function DocsNavigation() {
  const location = useLocation();

  return (
    <nav className="space-y-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Documentation
        </h2>
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
    </nav>
  );
}
