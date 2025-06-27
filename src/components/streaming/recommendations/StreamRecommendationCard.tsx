import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StreamRecommendation } from '@/services/recommendationService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Users, Eye, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDuration } from '@/lib/utils';

interface StreamRecommendationCardProps {
  recommendation: StreamRecommendation;
  size?: 'sm' | 'md' | 'lg';
}

export const StreamRecommendationCard: React.FC<StreamRecommendationCardProps> = ({ 
  recommendation,
  size = 'md'
}) => {
  const navigate = useNavigate();
  const {
    id,
    title,
    thumbnail_url,
    username,
    avatar_url,
    is_live,
    viewer_count,
    duration,
    created_at,
    category,
    tags,
    reason
  } = recommendation;
  
  const handleClick = () => {
    navigate(`/stream/${id}`);
  };
  
  const cardSizes = {
    sm: 'w-full max-w-[240px]',
    md: 'w-full max-w-[300px]',
    lg: 'w-full max-w-[400px]'
  };
  
  const imageSizes = {
    sm: 'h-32',
    md: 'h-40',
    lg: 'h-48'
  };
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  return (
    <Card 
      className={`${cardSizes[size]} overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg`}
      onClick={handleClick}
    >
      <div className="relative">
        <img 
          src={thumbnail_url || 'https://placehold.co/600x400/111/333?text=No+Thumbnail'} 
          alt={title}
          className={`${imageSizes[size]} w-full object-cover`}
          loading="lazy"
        />
        
        {/* Live badge or duration */}
        {is_live ? (
          <Badge variant="destructive" className="absolute top-2 right-2 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            LIVE
          </Badge>
        ) : (
          <Badge variant="secondary" className="absolute bottom-2 right-2">
            {formatDuration(duration)}
          </Badge>
        )}
        
        {/* Category badge */}
        {category && (
          <Badge variant="outline" className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm border-none text-white">
            {category}
          </Badge>
        )}
      </div>
      
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className={`font-semibold leading-tight line-clamp-2 ${textSizes[size === 'sm' ? 'sm' : 'md']}`}>
            {title}
          </h3>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={avatar_url} alt={username} />
            <AvatarFallback>{username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <span className={`text-muted-foreground ${textSizes[size === 'lg' ? 'md' : 'sm']}`}>{username}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {is_live ? (
              <div className="flex items-center text-red-500 text-xs gap-1">
                <Users className="w-3 h-3" />
                <span>{viewer_count?.toLocaleString() || 0}</span>
              </div>
            ) : (
              <div className="flex items-center text-muted-foreground text-xs gap-1">
                <Eye className="w-3 h-3" />
                <span>{recommendation.views?.toLocaleString() || 0}</span>
              </div>
            )}
            
            <div className="flex items-center text-muted-foreground text-xs gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        
        {/* Recommendation reason */}
        {reason && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className={`text-xs text-muted-foreground italic`}>{reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StreamRecommendationCard;
