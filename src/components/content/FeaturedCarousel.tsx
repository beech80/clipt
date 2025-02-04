import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function FeaturedCarousel() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
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
      .limit(5);

    setFeatured(data || []);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featured.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length);
  };

  const handleGameClick = () => {
    const gameId = featured[currentIndex]?.game_id;
    if (gameId) {
      console.log("Navigating to game clips from carousel:", gameId);
      navigate(`/game/${gameId}/clips`);
    }
  };

  if (!featured.length) return null;

  return (
    <div className="relative">
      <Card 
        className="overflow-hidden aspect-video cursor-pointer"
        onClick={handleGameClick}
      >
        {featured[currentIndex]?.image_url && (
          <img
            src={featured[currentIndex].image_url}
            alt="Featured content"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-xl font-bold text-white mb-2">
            {featured[currentIndex]?.content}
          </h3>
          <p className="text-white/80">
            By {featured[currentIndex]?.profiles?.username}
          </p>
        </div>
      </Card>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-gaming-800/50 hover:bg-gaming-700/50"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-gaming-800/50 hover:bg-gaming-700/50"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  );
}