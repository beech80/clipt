import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface ContentFiltersProps {
  contentFilter: string;
  setContentFilter: (value: string) => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
}

export const ContentFilters = ({
  contentFilter,
  setContentFilter,
  sortOrder,
  setSortOrder
}: ContentFiltersProps) => {
  return (
    <div className="flex gap-4 items-center bg-gaming-800/50 p-4 rounded-lg">
      <Select value={contentFilter} onValueChange={setContentFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter content" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Content</SelectItem>
          <SelectItem value="clips">Clips Only</SelectItem>
          <SelectItem value="streams">Streams Only</SelectItem>
          <SelectItem value="posts">Posts Only</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortOrder} onValueChange={setSortOrder}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="trending">Trending</SelectItem>
          <SelectItem value="popular">Most Popular</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};