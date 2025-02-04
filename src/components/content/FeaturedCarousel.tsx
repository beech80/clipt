import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export function FeaturedCarousel() {
  const [featured, setFeatured] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadFeatured();
  }, []);

  const loadFeatured = async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(1);

    setFeatured(data || []);
  };

  const handleGameClick = () => {
    const gameId = featured[0]?.game_id;
    if (gameId) {
      console.log("Navigating to game clips:", gameId);
      navigate(`/game/${gameId}/clips`);
    }
  };

  if (!featured.length) return null;

  return (
    <Card 
      className="overflow-hidden aspect-video cursor-pointer"
      onClick={handleGameClick}
    >
      {featured[0]?.image_url && (
        <img
          src={featured[0].image_url}
          alt="Featured content"
          className="w-full h-full object-cover"
        />
      )}
    </Card>
  );
}