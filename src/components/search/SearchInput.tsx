import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "aria-describedby"?: string;
}

export function SearchInput({ 
  searchTerm, 
  onSearchChange,
  isLoading,
  ...ariaProps
}: SearchInputProps) {
  return (
    <div className="relative flex-1">
      {isLoading ? (
        <Loader2 className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        type="search"
        placeholder="Search posts, users, streams..."
        className="pl-8 touch-manipulation"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        {...ariaProps}
      />
    </div>
  );
}