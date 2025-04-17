import React, { createContext, useState, useContext, ReactNode } from 'react';

// Create context with default values
interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  effectiveSearchTerm: string; // Always a safe non-undefined string
  clearSearch: () => void;
}

const defaultContext: SearchContextType = {
  searchTerm: '',
  setSearchTerm: () => {},
  effectiveSearchTerm: '',
  clearSearch: () => {},
};

export const SearchContext = createContext<SearchContextType>(defaultContext);

// Create provider component
interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchTerm, setSearchTermState] = useState<string>('');
  
  // Ensure searchTerm is always a string
  const effectiveSearchTerm = searchTerm || '';
  
  const setSearchTerm = (term: string) => {
    setSearchTermState(term || '');
  };
  
  const clearSearch = () => {
    setSearchTermState('');
  };
  
  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        effectiveSearchTerm,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

// Custom hook to use the search context
export const useSearch = () => useContext(SearchContext);
