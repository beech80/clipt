import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";

interface GameSearchProps {
  searchTerm: string | undefined;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  filters?: {
    platform?: string;
    ageRating?: string;
    releaseYear?: string;
    hasClips?: boolean;
  };
  onFiltersChange?: (filters: any) => void;
  isLoading?: boolean;
}

export function GameSearch({ 
  searchTerm = '', 
  onSearchChange, 
  sortBy, 
  onSortChange,
  filters = {},
  onFiltersChange = () => {},
  isLoading = false
}: GameSearchProps) {
  // Ensure searchTerm is always a string
  const effectiveSearchTerm = searchTerm || '';
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search games..."
            className="pl-9"
            value={effectiveSearchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Advanced Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select 
                  value={filters.platform} 
                  onValueChange={(value) => onFiltersChange({ ...filters, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="pc">PC</SelectItem>
                    <SelectItem value="console">Console</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Age Rating</Label>
                <Select 
                  value={filters.ageRating}
                  onValueChange={(value) => onFiltersChange({ ...filters, ageRating: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Rating</SelectItem>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="teen">Teen</SelectItem>
                    <SelectItem value="mature">Mature</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Release Year</Label>
                <Select 
                  value={filters.releaseYear}
                  onValueChange={(value) => onFiltersChange({ ...filters, releaseYear: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Year</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="older">Older</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Has Clips</Label>
                <Switch 
                  checked={filters.hasClips}
                  onCheckedChange={(checked) => onFiltersChange({ ...filters, hasClips: checked })}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="recent">Recently Added</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}