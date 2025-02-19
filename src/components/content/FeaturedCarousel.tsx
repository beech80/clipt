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
    <div className="relative group">
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gaming-400 transition-colors group-focus-within:text-gaming-200" />
      <Input
        type="search"
        placeholder="Search games..."
        className="w-full pl-10 py-6 text-lg bg-gaming-800/50 border-gaming-600 rounded-xl 
                   placeholder:text-gaming-500 focus:ring-2 focus:ring-gaming-400 
                   transition-all duration-300 hover:bg-gaming-800/70"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}