import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, X, Gamepad2, Users, Zap, Filter,
  ArrowLeft, Loader2, ArrowRight, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';
import '../styles/advanced-search.css';

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  is_live?: boolean;
  followers_count?: number;
  created_at?: string;
}

interface Game {
  id: string;
  name: string;
  cover_url?: string;
  popularity?: number;
  release_date?: string;
  genre?: string;
}

type SearchType = 'all' | 'users' | 'games';

const AdvancedSearch: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract query parameter if it exists
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    users: User[];
    games: Game[];
  }>({ users: [], games: [] });
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [animatedText, setAnimatedText] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Animation for placeholder text
  useEffect(() => {
    const placeholders = [
      'Search for your favorite games...',
      'Find new streamers to follow...',
      'Discover trending content...',
      'Search across the platform...'
    ];
    
    let currentIndex = 0;
    let currentChar = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    
    const typeAnimation = () => {
      const currentText = placeholders[currentIndex];
      
      if (isDeleting) {
        setAnimatedText(currentText.substring(0, currentChar - 1));
        currentChar--;
        typingSpeed = 50; // Faster when deleting
      } else {
        setAnimatedText(currentText.substring(0, currentChar + 1));
        currentChar++;
        typingSpeed = 100;
      }
      
      if (!isDeleting && currentChar === currentText.length) {
        // Finished typing word
        isDeleting = true;
        typingSpeed = 1000; // Pause before deleting
      } else if (isDeleting && currentChar === 0) {
        // Finished deleting word
        isDeleting = false;
        currentIndex = (currentIndex + 1) % placeholders.length;
        typingSpeed = 500; // Pause before typing next word
      }
      
      if (!searchTerm) {
        setTimeout(typeAnimation, typingSpeed);
      }
    };
    
    const animationTimeout = setTimeout(typeAnimation, 1000);
    return () => clearTimeout(animationTimeout);
  }, [searchTerm]);
  
  // Auto-focus search input on mount and trigger search if there's an initial query
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    
    // If we have an initial query from the URL, perform the search
    if (initialQuery.trim()) {
      setIsLoading(true);
      debouncedSearch(initialQuery, 'all');
    }
  }, []);

  // Create a debounced search function
  const debouncedSearch = useRef(
    debounce(async (query: string, type: SearchType) => {
      if (!query.trim()) {
        setSearchResults({ users: [], games: [] });
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setHasSearched(true);
        
        // Search for users if type is 'all' or 'users'
        let users: User[] = [];
        if (type === 'all' || type === 'users') {
          const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, created_at')
            .ilike('username', `%${query}%`)
            .order('created_at', { ascending: false })
            .limit(20);
            
          if (usersError) {
            console.error('Error searching users:', usersError);
            toast.error('Failed to search users. Please try again.');
          } else if (usersData) {
            users = usersData.map((user) => ({
              ...user,
              is_live: Math.random() > 0.7, // Mock live status
              followers_count: Math.floor(Math.random() * 10000), // Mock follower count
            }));
          }
        }
        
        // Search for games if type is 'all' or 'games'
        let games: Game[] = [];
        if (type === 'all' || type === 'games') {
          const { data: gamesData, error: gamesError } = await supabase
            .from('games')
            .select('id, name, cover_url')
            .ilike('name', `%${query}%`)
            .order('name', { ascending: true })
            .limit(20);
            
          if (gamesError) {
            console.error('Error searching games:', gamesError);
            toast.error('Failed to search games. Please try again.');
          } else if (gamesData) {
            games = gamesData.map((game) => ({
              ...game,
              popularity: Math.floor(Math.random() * 100), // Mock popularity score
              genre: ['Action', 'Adventure', 'RPG', 'FPS', 'Puzzle', 'Strategy'][
                Math.floor(Math.random() * 6)
              ], // Mock genre
            }));
          }
        }
        
        setSearchResults({ users, games });
      } catch (error) {
        console.error('Search error:', error);
        toast.error('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 300)
  ).current;
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim()) {
      setIsLoading(true);
      debouncedSearch(value, searchType);
    } else {
      setSearchResults({ users: [], games: [] });
      setIsLoading(false);
    }
  };
  
  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type);
    if (searchTerm.trim()) {
      setIsLoading(true);
      debouncedSearch(searchTerm, type);
    }
  };
  
  const navigateToUserProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };
  
  const navigateToGame = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };
  
  const handleBackClick = () => {
    navigate(-1);
  };
  
  const getResultsCount = () => {
    if (searchType === 'all') {
      return searchResults.users.length + searchResults.games.length;
    } else if (searchType === 'users') {
      return searchResults.users.length;
    } else {
      return searchResults.games.length;
    }
  };
  
  return (
    <div className="advanced-search-container min-h-screen bg-gradient-to-b from-black to-gaming-900 text-white">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={handleBackClick} className="mr-2">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold gradient-text">Advanced Search</h1>
        </div>
        
        {/* Search input with animation */}
        <div className="search-box mb-6 relative">
          <div className="flex items-center bg-gaming-800 border-2 border-cyan-700 rounded-xl overflow-hidden focus-within:border-cyan-500 focus-within:shadow-lg focus-within:shadow-cyan-900/30 transition-all">
            <div className="search-icon-container p-3 bg-cyan-900 flex items-center justify-center">
              <Search size={20} className="text-cyan-300" />
            </div>
            <Input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={animatedText}
              className="flex-1 bg-transparent border-0 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={() => setSearchTerm('')}
              >
                <X size={18} className="text-gray-400 hover:text-white" />
              </Button>
            )}
          </div>
          
          {/* Search type tabs */}
          <div className="search-tabs mt-3 flex space-x-2">
            <Button
              variant={searchType === 'all' ? 'default' : 'outline'}
              className={`flex-1 ${searchType === 'all' ? 'bg-cyan-700 hover:bg-cyan-600' : 'text-gray-400 hover:text-white'}`}
              onClick={() => handleSearchTypeChange('all')}
            >
              <Search size={16} className="mr-2" />
              All
            </Button>
            <Button
              variant={searchType === 'users' ? 'default' : 'outline'}
              className={`flex-1 ${searchType === 'users' ? 'bg-purple-700 hover:bg-purple-600' : 'text-gray-400 hover:text-white'}`}
              onClick={() => handleSearchTypeChange('users')}
            >
              <Users size={16} className="mr-2" />
              Users
            </Button>
            <Button
              variant={searchType === 'games' ? 'default' : 'outline'}
              className={`flex-1 ${searchType === 'games' ? 'bg-green-700 hover:bg-green-600' : 'text-gray-400 hover:text-white'}`}
              onClick={() => handleSearchTypeChange('games')}
            >
              <Gamepad2 size={16} className="mr-2" />
              Games
            </Button>
          </div>
          
          {/* Filters button */}
          <Button
            variant="outline"
            size="sm"
            className="absolute right-0 -bottom-10 text-xs"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={12} className="mr-1" />
            Filters
          </Button>
        </div>
        
        {/* Filter options - conditionally rendered */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="filters-container mb-6 overflow-hidden"
            >
              <div className="filters-content bg-gaming-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-sm font-medium mb-3 text-gray-300">Refine Your Search</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* User filters - only show when not searching for games only */}
                  {searchType !== 'games' && (
                    <div className="user-filters">
                      <h4 className="text-xs font-medium mb-2 text-purple-400">User Filters</h4>
                      <div className="space-y-2">
                        <div className="filter-option flex items-center space-x-2">
                          <input type="checkbox" id="live-only" className="checkbox" />
                          <label htmlFor="live-only" className="text-xs">Live Now</label>
                        </div>
                        <div className="filter-option flex items-center space-x-2">
                          <input type="checkbox" id="verified-only" className="checkbox" />
                          <label htmlFor="verified-only" className="text-xs">Verified Only</label>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Game filters - only show when not searching for users only */}
                  {searchType !== 'users' && (
                    <div className="game-filters">
                      <h4 className="text-xs font-medium mb-2 text-green-400">Game Filters</h4>
                      <div className="space-y-2">
                        <div className="filter-option flex items-center space-x-2">
                          <input type="checkbox" id="trending-only" className="checkbox" />
                          <label htmlFor="trending-only" className="text-xs">Trending Only</label>
                        </div>
                        <div className="filter-option flex items-center space-x-2">
                          <input type="checkbox" id="new-releases" className="checkbox" />
                          <label htmlFor="new-releases" className="text-xs">New Releases</label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-3">
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowFilters(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Search results */}
        <div className="search-results-container">
          {isLoading ? (
            <div className="loading-container flex flex-col items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin text-cyan-500 mb-4" />
              <p className="text-gray-400">Searching across the platform...</p>
            </div>
          ) : searchTerm && hasSearched ? (
            <div className="results-wrapper">
              {/* Results count */}
              <div className="results-count mb-4 pb-2 border-b border-gray-800">
                <p className="text-sm text-gray-400">
                  {getResultsCount()} results for "{searchTerm}"
                </p>
              </div>
              
              {/* User results */}
              {(searchType === 'all' || searchType === 'users') && searchResults.users.length > 0 && (
                <div className="users-results mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-purple-400">
                      <Users size={16} className="inline mr-2" />
                      Users
                    </h2>
                    {searchType === 'all' && searchResults.users.length > 4 && (
                      <Button variant="ghost" size="sm" className="text-xs text-purple-400" onClick={() => handleSearchTypeChange('users')}>
                        View All <ArrowRight size={12} className="ml-1" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="users-grid grid grid-cols-2 gap-3 md:grid-cols-4">
                    {(searchType === 'all' ? searchResults.users.slice(0, 4) : searchResults.users).map((user) => (
                      <div
                        key={user.id}
                        className="user-card bg-gaming-800 p-3 rounded-lg border border-purple-900/50 hover:border-purple-600 transition-all cursor-pointer"
                        onClick={() => navigateToUserProfile(user.id)}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-2">
                            <Avatar className="w-16 h-16 border-2 border-purple-700">
                              <AvatarImage src={user.avatar_url} alt={user.display_name} />
                              <AvatarFallback className="bg-purple-900 text-white">
                                {user.display_name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {user.is_live && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                LIVE
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium truncate w-full">{user.display_name}</h3>
                          <p className="text-xs text-gray-400 truncate w-full">@{user.username}</p>
                          <p className="text-xs text-gray-500 mt-1">{user.followers_count?.toLocaleString() || 0} followers</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Game results */}
              {(searchType === 'all' || searchType === 'games') && searchResults.games.length > 0 && (
                <div className="games-results mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-green-400">
                      <Gamepad2 size={16} className="inline mr-2" />
                      Games
                    </h2>
                    {searchType === 'all' && searchResults.games.length > 6 && (
                      <Button variant="ghost" size="sm" className="text-xs text-green-400" onClick={() => handleSearchTypeChange('games')}>
                        View All <ArrowRight size={12} className="ml-1" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="games-grid grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {(searchType === 'all' ? searchResults.games.slice(0, 6) : searchResults.games).map((game) => (
                      <div
                        key={game.id}
                        className="game-name-card p-3 rounded-md border border-green-900/50 hover:border-green-500 hover:bg-green-900/30 transition-all cursor-pointer group flex items-center"
                        onClick={() => navigateToGame(game.id)}
                      >
                        <div className="game-icon mr-3 bg-green-900/60 rounded-full p-2 flex-shrink-0">
                          <Gamepad2 size={18} className="text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-base">{game.name}</h3>
                          {game.genre && (
                            <p className="text-xs text-gray-400">{game.genre}</p>
                          )}
                        </div>
                        {game.popularity && game.popularity > 80 && (
                          <div className="ml-2 bg-yellow-600/80 text-white text-xs px-1.5 py-0.5 rounded-sm flex items-center self-start">
                            <Zap size={10} className="mr-1" />
                            Hot
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* No results */}
              {getResultsCount() === 0 && (
                <div className="no-results flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 w-16 h-16 rounded-full bg-gaming-800 flex items-center justify-center">
                    <Search size={30} className="text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No results found</h3>
                  <p className="text-gray-400 max-w-sm">
                    We couldn't find anything matching "{searchTerm}". Try different keywords or check your spelling.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="search-prompt flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 w-20 h-20 rounded-full bg-gaming-800 flex items-center justify-center">
                <Search size={36} className="text-cyan-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-medium mb-2">Search for anything</h3>
              <p className="text-gray-400 max-w-sm">
                Find users, games, and more by typing in the search box above.
              </p>
              
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-md">
                <button 
                  className="quick-search-btn p-2 bg-gaming-800 rounded-lg border border-purple-900/50 hover:border-purple-600 transition-all"
                  onClick={() => setSearchTerm('Fortnite')}
                >
                  Fortnite
                </button>
                <button 
                  className="quick-search-btn p-2 bg-gaming-800 rounded-lg border border-green-900/50 hover:border-green-600 transition-all"
                  onClick={() => setSearchTerm('Minecraft')}
                >
                  Minecraft
                </button>
                <button 
                  className="quick-search-btn p-2 bg-gaming-800 rounded-lg border border-blue-900/50 hover:border-blue-600 transition-all"
                  onClick={() => setSearchTerm('RPG')}
                >
                  RPG Games
                </button>
                <button 
                  className="quick-search-btn p-2 bg-gaming-800 rounded-lg border border-yellow-900/50 hover:border-yellow-600 transition-all"
                  onClick={() => setSearchTerm('trending')}
                >
                  Trending
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;
