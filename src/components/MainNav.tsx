
import React from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Game, Settings, Trophy, Video, User, MessageSquare } from "lucide-react";

export default function MainNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: userRole } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      return data?.role;
    }
  });

  const isModerator = userRole === 'moderator' || userRole === 'admin';

  const navItems = [
    { name: "Feed", path: "/", icon: <Game className="mr-2 h-4 w-4" /> },
    { name: "Clipts", path: "/clipts", icon: <Video className="mr-2 h-4 w-4" /> },
    { name: "Top Clipts", path: "/top-clipts", icon: <Trophy className="mr-2 h-4 w-4" /> },
    { name: "Profile", path: "/profile", icon: <User className="mr-2 h-4 w-4" /> },
    { name: "Messages", path: "/messages", icon: <MessageSquare className="mr-2 h-4 w-4" /> },
  ];

  return (
    <nav className="flex items-center space-x-2">
      {navItems.map((item) => (
        <Button
          key={item.path}
          variant="ghost"
          className={cn(
            "text-muted-foreground flex gap-1",
            location.pathname === item.path && "bg-[#252040] text-purple-400"
          )}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
          {item.name}
        </Button>
      ))}
      
      {isModerator && (
        <Button
          variant="ghost"
          className={cn(
            "text-muted-foreground flex gap-1",
            location.pathname === "/moderation" && "bg-[#252040] text-purple-400"
          )}
          onClick={() => navigate("/moderation")}
        >
          <Settings className="mr-2 h-4 w-4" />
          Moderation
        </Button>
      )}
    </nav>
  );
}
