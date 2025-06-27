import React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import StreamRecommendationCard from './StreamRecommendationCard';
import { StreamRecommendation } from '@/services/recommendationService';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface RecommendationSectionProps {
  title: string;
  recommendations: StreamRecommendation[];
  viewAllRoute?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  cardSize?: 'sm' | 'md' | 'lg';
}

export const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  title,
  recommendations,
  viewAllRoute,
  isLoading = false,
  emptyMessage = 'No recommendations available',
  cardSize = 'md'
}) => {
  const navigate = useNavigate();
  
  const viewAll = () => {
    if (viewAllRoute) {
      navigate(viewAllRoute);
    }
  };
  
  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {viewAllRoute && (
          <Button variant="ghost" size="sm" onClick={viewAll} className="text-orange-400">
            View all <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex gap-4 pb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-40 w-[300px] rounded-md" />
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <ScrollArea className="w-full whitespace-nowrap pb-4">
          <div className="flex w-max space-x-4 p-1">
            {recommendations.map((recommendation) => (
              <StreamRecommendationCard 
                key={recommendation.id}
                recommendation={recommendation}
                size={cardSize}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="w-full py-12 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </div>
  );
};

export default RecommendationSection;
