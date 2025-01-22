import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";

interface SearchHistoryProps {
  searchHistory: any[];
  onHistoryItemClick: (item: any) => void;
}

export default function SearchHistory({ searchHistory, onHistoryItemClick }: SearchHistoryProps) {
  if (searchHistory.length === 0) return null;

  return (
    <div className="absolute top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-lg z-50">
      <ScrollArea className="h-[calc(100vh-200px)] sm:h-[300px]">
        <div className="p-2">
          <h3 className="px-2 text-sm font-medium text-muted-foreground mb-2" id="search-history">
            Recent Searches
          </h3>
          <div role="list" aria-labelledby="search-history">
            {searchHistory.map((item, index) => (
              <button
                key={index}
                className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                onClick={() => onHistoryItemClick(item)}
                role="listitem"
                aria-label={`Search again for ${item.query}`}
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{item.query}</span>
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}