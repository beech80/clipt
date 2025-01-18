import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeaturedCarousel() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  if (!featured.length) return null;

  return (
    <div className="relative">
      <Card className="overflow-hidden aspect-video">
        {featured[currentIndex]?.image_url && (
          <img
            src={featured[currentIndex].image_url}
            alt="Featured content"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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
        className="absolute left-2 top-1/2 -translate-y-1/2"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  );
}