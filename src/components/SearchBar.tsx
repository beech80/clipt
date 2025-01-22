import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SearchInput } from "./search/SearchInput";
import { SearchFilters } from "./search/SearchFilters";
import { SearchHistory } from "./search/SearchHistory";
import { SearchResults } from "./search/SearchResults";
import { useSearch } from "@/hooks/useSearch";
import { useSearchContext } from "@/contexts/SearchContext";
import { debounce } from "@/utils/debounce";

export function SearchBar() {
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm, searchHistory, executeSearch } = useSearch();
  const { filters, setFilters } = useSearchContext();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', searchTerm, filters],
    queryFn: () => executeSearch(searchTerm, filters),
    enabled: searchTerm.length >= 2
  });

  const handleSearchHistoryClick = (historyItem: any) => {
    setSearchTerm(historyItem.query);
    if (historyItem.filters) {
      setFilters(historyItem.filters);
    }
    toast.success("Loaded search from history");
  };

  const handleProfileClick = (id: string) => {
    navigate(`/profile/${id}`);
    setSearchTerm("");
  };

  const handlePostClick = (id: string) => {
    navigate(`/post/${id}`);
    setSearchTerm("");
  };

  const handleStreamClick = (id: string) => {
    navigate(`/stream/${id}`);
    setSearchTerm("");
  };

  const debouncedSetSearchTerm = debounce(setSearchTerm, 300);

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative flex gap-2">
        <SearchInput 
          searchTerm={searchTerm} 
          onSearchChange={debouncedSetSearchTerm} 
        />
        <SearchFilters 
          filters={filters} 
          onFiltersChange={setFilters} 
        />
      </div>

      {searchTerm.length >= 2 ? (
        <SearchResults
          isLoading={isLoading}
          results={searchResults}
          onProfileClick={handleProfileClick}
          onPostClick={handlePostClick}
          onStreamClick={handleStreamClick}
        />
      ) : (
        <SearchHistory
          searchHistory={searchHistory || []}
          onHistoryItemClick={handleSearchHistoryClick}
        />
      )}
    </div>
  );
}