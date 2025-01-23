import React, { createContext, useContext, useState } from 'react';
import { SearchFilters } from '@/types/post';

interface SearchContextType {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    dateRange: 'all',
    hasMedia: false,
    sortBy: 'recent',
    category: 'all',
    language: 'all',
    minRating: 0,
    maxResults: 20,
    includeNSFW: false,
    verifiedOnly: false
  });

  return (
    <SearchContext.Provider value={{ filters, setFilters }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
};