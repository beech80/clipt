import React, { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SearchInput } from "./search/SearchInput";
import { SearchFilters } from "./search/SearchFilters";
import { useSearch } from "@/hooks/useSearch";
import { useSearchContext } from "@/contexts/SearchContext";
import { debounce } from "@/utils/debounce";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DOMPurify from 'dompurify';

// Lazy load components that aren't immediately needed
const SearchHistory = React.lazy(() => import("./search/SearchHistory"));
const SearchResults = React.lazy(() => import("./search/SearchResults"));

const MAX_SEARCH_LENGTH = 100;
const SEARCH_MIN_LENGTH = 2;

export function SearchBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { searchTerm, setSearchTerm, searchHistory, executeSearch } = useSearch();
  const { filters, setFilters } = useSearchContext();

  // Validate and sanitize search input
  const validateSearchTerm = (term: string): boolean => {
    if (term.length > MAX_SEARCH_LENGTH) {
      toast.error(`Search term must be less than ${MAX_SEARCH_LENGTH} characters`);
      return false;
    }
    // Check for potentially malicious patterns
    const maliciousPatterns = [/<script/i, /javascript:/i, /data:/i, /vbscript:/i];
    if (maliciousPatterns.some(pattern => pattern.test(term))) {
      toast.error("Invalid search term");
      return false;
    }
    return true;
  };

  const { data: searchResults, isLoading, error, refetch } = useQuery({
    queryKey: ['search', searchTerm, filters],
    queryFn: () => {
      // Sanitize search term before sending to backend
      const sanitizedTerm = DOMPurify.sanitize(searchTerm);
      return executeSearch(sanitizedTerm, filters);
    },
    enabled: searchTerm.length >= SEARCH_MIN_LENGTH && validateSearchTerm(searchTerm),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 1000 * 60 * 5, // Results stay fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Cache results for 30 minutes
    placeholderData: (previousData) => previousData,
    meta: {
      onError: () => {
        toast.error("Search failed. Please try again.");
      }
    }
  });

  const handleSearchHistoryClick = (historyItem: any) => {
    if (!validateSearchTerm(historyItem.query)) return;
    setSearchTerm(historyItem.query);
    if (historyItem.filters) {
      setFilters(historyItem.filters);
    }
    toast.success("Loaded search from history");
  };

  const handleProfileClick = (id: string) => {
    if (!user) {
      toast.error("Please sign in to view profiles");
      navigate('/login');
      return;
    }
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

  const debouncedSetSearchTerm = debounce((term: string) => {
    if (validateSearchTerm(term)) {
      setSearchTerm(term);
    }
  }, 300);

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
            aria-expanded={searchTerm.length >= SEARCH_MIN_LENGTH}
            aria-controls="search-results"
            aria-describedby={error ? "search-error" : undefined}
            isLoading={isLoading}
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

        <div 
          id="search-results" 
          role="region" 
          aria-live="polite"
          aria-busy={isLoading}
          aria-atomic="true"
        >
          <Suspense fallback={
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          }>
            {isLoading && searchTerm.length >= SEARCH_MIN_LENGTH ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            ) : searchTerm.length >= SEARCH_MIN_LENGTH ? (
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
          </Suspense>
        </div>
      </div>
    </ErrorBoundary>
  );
}