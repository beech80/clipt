
import React from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Settings, Trophy, Video, User, MessageSquare, Gamepad, Search } from "lucide-react";

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
    { name: "Feed", path: "/", icon: <Gamepad className="mr-2 h-4 w-4" /> },
    { name: "Clips", path: "/clipts", icon: <Video className="mr-2 h-4 w-4" /> },
    { name: "Top Clips", path: "/top-clipts", icon: <Trophy className="mr-2 h-4 w-4" /> },
    { name: "Discovery", path: "/discovery", icon: <Search className="mr-2 h-4 w-4" /> },
    { name: "Profile", path: "/profile", icon: <User className="mr-2 h-4 w-4" /> },
    { name: "Messages", path: "/messages", icon: <MessageSquare className="mr-2 h-4 w-4" /> },
  ];

  return (
    <nav className="flex items-center space-x-1 overflow-x-auto py-2">
      {navItems.map((item) => (
        <Button
          key={item.path}
          variant="ghost"
          className={cn(
            "text-sm border-b-2 border-transparent rounded-none px-3",
            location.pathname === item.path 
              ? "bg-[#25243b]/30 text-[#9b87f5] border-b-[#9b87f5]" 
              : "text-muted-foreground hover:bg-[#25243b]/20 hover:text-purple-300"
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
            "text-sm border-b-2 border-transparent rounded-none px-3",
            location.pathname === "/moderation" 
              ? "bg-[#25243b]/30 text-[#9b87f5] border-b-[#9b87f5]" 
              : "text-muted-foreground hover:bg-[#25243b]/20 hover:text-purple-300"
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
