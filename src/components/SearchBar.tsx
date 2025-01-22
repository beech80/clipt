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
import ErrorBoundary from "@/components/ErrorBoundary";

export function SearchBar() {
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm, searchHistory, executeSearch } = useSearch();
  const { filters, setFilters } = useSearchContext();

  const { data: searchResults, isLoading, error, refetch } = useQuery({
    queryKey: ['search', searchTerm, filters],
    queryFn: () => executeSearch(searchTerm, filters),
    enabled: searchTerm.length >= 2,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 1000 * 60 * 5, // Results stay fresh for 5 minutes
    cacheTime: 1000 * 60 * 30, // Cache results for 30 minutes
    keepPreviousData: true, // Keep showing previous results while fetching new ones
    meta: {
      onError: () => {
        toast.error("Search failed. Please try again.");
      }
    }
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

  const handleRetry = () => {
    toast.loading("Retrying search...");
    refetch();
  };

  const debouncedSetSearchTerm = debounce(setSearchTerm, 300);

  return (
    <ErrorBoundary>
      <div 
        className="relative w-full max-w-sm"
        role="search"
        aria-label="Site search"
      >
        <div className="relative flex gap-2">
          <SearchInput 
            searchTerm={searchTerm} 
            onSearchChange={debouncedSetSearchTerm}
            aria-label="Search input"
            aria-expanded={searchTerm.length >= 2}
            aria-controls="search-results"
            aria-describedby={error ? "search-error" : undefined}
          />
          <SearchFilters 
            filters={filters} 
            onFiltersChange={setFilters}
            aria-label="Search filters"
          />
        </div>

        {error && (
          <div 
            id="search-error"
            role="alert"
            className="mt-2 text-sm text-red-500"
          >
            Search failed. 
            <button 
              onClick={handleRetry}
              className="ml-2 underline hover:text-red-600"
              aria-label="Retry search"
            >
              Retry
            </button>
          </div>
        )}

        <div id="search-results" role="region" aria-live="polite">
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
      </div>
    </ErrorBoundary>
  );
}