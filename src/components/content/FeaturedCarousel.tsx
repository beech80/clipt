import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

export function FeaturedCarousel() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: featuredPost } = useQuery({
    queryKey: ['featured-post'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          video_url,
          profiles:user_id (username, avatar_url)
        `)
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search games..."
        className="pl-9"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}