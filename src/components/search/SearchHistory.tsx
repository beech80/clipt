import { History } from "lucide-react";

interface SearchHistoryProps {
  searchHistory: any[];
  onHistoryItemClick: (item: any) => void;
}

export function SearchHistory({ searchHistory, onHistoryItemClick }: SearchHistoryProps) {
  if (!searchHistory || searchHistory.length === 0) return null;

  return (
    <div className="absolute top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-lg z-50">
      <div className="p-2">
        <h3 className="px-2 text-sm font-medium text-muted-foreground mb-2">Recent Searches</h3>
        {searchHistory.map((item: any) => (
          <button
            key={item.id}
            className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-md"
            onClick={() => onHistoryItemClick(item)}
          >
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{item.query}</span>
          </button>
        ))}
      </div>
    </div>
  );
}