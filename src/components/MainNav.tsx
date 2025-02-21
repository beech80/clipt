
import React from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

  return (
    <nav className="flex items-center space-x-4">
      <Button
        variant="ghost"
        className={cn(
          "text-muted-foreground",
          location.pathname === "/" && "text-foreground"
        )}
        onClick={() => navigate("/")}
      >
        Feed
      </Button>
      <Button
        variant="ghost"
        className={cn(
          "text-muted-foreground",
          location.pathname === "/clipts" && "text-foreground"
        )}
        onClick={() => navigate("/clipts")}
      >
        Clipts
      </Button>
      {isModerator && (
        <Button
          variant="ghost"
          className={cn(
            "text-muted-foreground",
            location.pathname === "/moderation" && "text-foreground"
          )}
          onClick={() => navigate("/moderation")}
        >
          Moderation
        </Button>
      )}
    </nav>
  );
}
