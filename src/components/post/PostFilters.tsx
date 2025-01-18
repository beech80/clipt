import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal, Clock, Flame, ThumbsUp } from "lucide-react";
import { useState } from "react";

export type PostSortOption = 'recent' | 'trending' | 'most_liked';
export type PostFilterOption = 'all' | 'images' | 'videos';

interface PostFiltersProps {
  onSortChange: (sort: PostSortOption) => void;
  onFilterChange: (filter: PostFilterOption) => void;
}

export function PostFilters({ onSortChange, onFilterChange }: PostFiltersProps) {
  const [activeSort, setActiveSort] = useState<PostSortOption>('recent');
  const [activeFilter, setActiveFilter] = useState<PostFilterOption>('all');

  const handleSortChange = (sort: PostSortOption) => {
    setActiveSort(sort);
    onSortChange(sort);
  };

  const handleFilterChange = (filter: PostFilterOption) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg mb-4">
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem 
              onClick={() => handleFilterChange('all')}
              className={activeFilter === 'all' ? 'bg-accent' : ''}
            >
              All Posts
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleFilterChange('images')}
              className={activeFilter === 'images' ? 'bg-accent' : ''}
            >
              Images Only
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleFilterChange('videos')}
              className={activeFilter === 'videos' ? 'bg-accent' : ''}
            >
              Videos Only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              {activeSort === 'recent' && <Clock className="h-4 w-4" />}
              {activeSort === 'trending' && <Flame className="h-4 w-4" />}
              {activeSort === 'most_liked' && <ThumbsUp className="h-4 w-4" />}
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem 
              onClick={() => handleSortChange('recent')}
              className={activeSort === 'recent' ? 'bg-accent' : ''}
            >
              <Clock className="h-4 w-4 mr-2" />
              Most Recent
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleSortChange('trending')}
              className={activeSort === 'trending' ? 'bg-accent' : ''}
            >
              <Flame className="h-4 w-4 mr-2" />
              Trending
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleSortChange('most_liked')}
              className={activeSort === 'most_liked' ? 'bg-accent' : ''}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Most Liked
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}