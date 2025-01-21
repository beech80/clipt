import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal } from "lucide-react";
import { SearchFilters as SearchFiltersType } from "@/types/post";
import { toast } from "sonner";

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
}

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="touch-manipulation active:scale-95 transition-transform"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Search Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Content Type</Label>
            <Select
              value={filters.type}
              onValueChange={(value: any) => {
                onFiltersChange({ ...filters, type: value });
                toast.success(`Filtering by ${value}`);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="posts">Posts</SelectItem>
                <SelectItem value="profiles">Profiles</SelectItem>
                <SelectItem value="streams">Streams</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={filters.category}
              onValueChange={(value: any) => onFiltersChange({ ...filters, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="irl">IRL</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="esports">Esports</SelectItem>
                <SelectItem value="music">Music</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select
              value={filters.dateRange}
              onValueChange={(value: any) => onFiltersChange({ ...filters, dateRange: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Last 24 Hours</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(value: any) => onFiltersChange({ ...filters, sortBy: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sorting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="relevant">Most Relevant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={filters.language}
              onValueChange={(value: any) => onFiltersChange({ ...filters, language: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Maximum Results</Label>
            <Slider
              value={[filters.maxResults]}
              onValueChange={(value) => onFiltersChange({ ...filters, maxResults: value[0] })}
              min={5}
              max={50}
              step={5}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground text-right">{filters.maxResults} results</p>
          </div>

          <div className="flex items-center justify-between">
            <Label>Has Media</Label>
            <Switch
              checked={filters.hasMedia}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, hasMedia: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Verified Only</Label>
            <Switch
              checked={filters.verifiedOnly}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, verifiedOnly: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Include NSFW</Label>
            <Switch
              checked={filters.includeNSFW}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, includeNSFW: checked })}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}