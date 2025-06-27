import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Search as SearchIcon, 
  Users, 
  Heart,
  MessageCircle,
  Rocket,
  Eye
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Define types
interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  followers: number;
  isLive?: boolean;
  is_live?: boolean;
  game?: string;
  bio?: string;
}

interface Game {
  id: string;
  name: string;
  cover_url: string;
  viewers: number;
  clipCount?: number;
  recentClips?: Clip[];
}

interface Clip {
  id: string;
  title: string;
  thumbnail_url: string;
  view_count: number;
  duration: number;
  created_at: string;
  user: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  game?: Game;
}

interface SearchResults {
  users: User[];
  games: Game[];
  gameClips: Clip[];
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Always show all results for maximum coverage
  const [searchCategory, setSearchCategory] = useState<'all' | 'users' | 'games'>('all');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResults>({ users: [], games: [], gameClips: [] });

  // Mock game clips data for the featured section
  const mockGameClips: Clip[] = [
    {
      id: 'clip1',
      title: 'Amazing play in Stellar Warfare',
      thumbnail_url: 'https://images.unsplash.com/photo-1614729638149-e5c1f494e5d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Z2FtaW5nJTIwY2xpcHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60',
      view_count: 12500,
      duration: 32,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      user: {
        username: 'cosmicgamer',
        display_name: 'Cosmic Gamer',
        avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      game: { id: 'game1', name: 'Stellar Warfare', cover_url: 'https://picsum.photos/300/400?random=1', viewers: 15000 }
    },
    {
      id: 'clip2',
      title: 'Unbelievable headshot in Nebula Assault',
      thumbnail_url: 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGdhbWluZyUyMGNsaXB8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
      view_count: 45300,
      duration: 28,
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      user: {
        username: 'stardust',
        display_name: 'StarDust',
        avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg'
      },
      game: { id: 'game2', name: 'Nebula Assault', cover_url: 'https://picsum.photos/300/400?random=2', viewers: 22000 }
    },
    {
      id: 'clip3',
      title: 'Record speedrun in Galactic Raiders',
      thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGdhbWluZyUyMGNsaXB8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
      view_count: 8900,
      duration: 45,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      user: {
        username: 'astronova',
        display_name: 'AstroNova',
        avatar_url: 'https://randomuser.me/api/portraits/men/57.jpg'
      },
      game: { id: 'game3', name: 'Galactic Raiders', cover_url: 'https://picsum.photos/300/400?random=3', viewers: 12400 }
    }
  ];

  // Enhanced game search API configuration
  const searchAPI = {
    baseUrl: 'https://api.clipt.com/v2/search',
    maxResults: 100,
    categories: ['game', 'user', 'stream', 'clip'],
    filters: {
      games: {
        popularity: ['trending', 'all-time', 'new'],
        genres: ['action', 'adventure', 'rpg', 'fps', 'strategy', 'simulation', 'sports', 'racing', 'puzzle', 'fighting', 'platformer'],
        platforms: ['pc', 'console', 'mobile', 'vr', 'browser'],
        searchFields: ['title', 'description', 'developer', 'tags', 'genres']
      },
      users: {
        searchFields: ['username', 'display_name', 'bio', 'tags'],
        status: ['online', 'offline', 'all']
      }
    },
    // Simulated API call to maximize search depth and quality
    search: async (query: string, category: string, limit: number = 50) => {
      console.log(`Enhanced API Search: ${query} in ${category}, limit: ${limit}`);
      return new Promise(resolve => {
        setTimeout(() => {
          // In a real implementation, this would be an actual API call
          // For now, we'll simulate with our mock data but apply deep filtering
          if (category === 'games' || category === 'all') {
            const gameResults = applyAdvancedGameSearch(query, mockGames, limit);
            resolve(gameResults);
          } else {
            resolve([]);
          }
        }, 200); // Faster response time for better UX
      });
    }
  };

  // Advanced game search algorithm to maximize results and relevance
  const applyAdvancedGameSearch = (query: string, games: Game[], limit: number): Game[] => {
    if (!query || query.length < 1) return games.slice(0, limit); // Show results with just 1 character
    
    const searchTermLower = query.toLowerCase();
    const searchTerms = searchTermLower.split(' ').filter(term => term.length > 0);
    
    // Enhanced search algorithm for maximum coverage
    const results = games.map(game => {
      const nameLower = game.name.toLowerCase();
      let score = 0;

      // Perfect matches get highest priority
      if (nameLower === searchTermLower) score += 1000; // Perfect exact match
      
      // Check for exact word matches in any part of the name
      const gameWords = nameLower.split(/\s+/);
      searchTerms.forEach(term => {
        // Exact word match
        if (gameWords.includes(term)) score += 500;
        
        // Prioritize prefix matches
        if (nameLower.startsWith(term)) score += 300;
        if (gameWords.some(word => word.startsWith(term))) score += 200;
        
        // Partial match anywhere
        if (nameLower.includes(term)) score += 100;
        
        // Fuzzy matching for typo tolerance
        if (term.length >= 3) {
          // Substring matching (catches misspellings to some extent)
          for (let i = 0; i < term.length - 2; i++) {
            const substring = term.substring(i, i + 3);
            if (nameLower.includes(substring)) {
              score += 50; // Some relevance for partial string match
              break;
            }
          }
        }
      });
      
      // Lower threshold to show more results
      if (score < 50) score = 0;

      return { game, score };
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.game)
      .slice(0, limit);
    
    return results;
  };
  
  // Expanded mock data with more search options
  const mockUsers: User[] = [
    {
      id: 'user-1',
      username: 'cosmic_gamer',
      display_name: 'Cosmic Gamer',
      avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
      followers: 12500,
      isLive: true,
    },
    {
      id: 'user-2',
      username: 'space_streamer',
      display_name: 'Space Streamer',
      avatar_url: 'https://randomuser.me/api/portraits/women/2.jpg',
      followers: 8300,
      isLive: false,
    },
    {
      id: 'user-3',
      username: 'nebula_ninja',
      display_name: 'Nebula Ninja',
      avatar_url: 'https://randomuser.me/api/portraits/men/3.jpg',
      followers: 24700,
      isLive: true,
    },
    {
      id: 'user-4',
      username: 'galaxy_queen',
      display_name: 'Galaxy Queen',
      avatar_url: 'https://randomuser.me/api/portraits/women/4.jpg',
      followers: 15900,
      isLive: false,
    },
    {
      id: 'user-5',
      username: 'stardust_gamer',
      display_name: 'Stardust Gamer',
      avatar_url: 'https://randomuser.me/api/portraits/men/5.jpg',
      followers: 9800,
      isLive: true,
    },
    {
      id: 'user-6',
      username: 'astro_player',
      display_name: 'Astro Player',
      avatar_url: 'https://randomuser.me/api/portraits/men/6.jpg',
      followers: 32100,
      isLive: true,
    },
    {
      id: 'user-7',
      username: 'meteor_streamer',
      display_name: 'Meteor Streamer',
      avatar_url: 'https://randomuser.me/api/portraits/women/7.jpg',
      followers: 18700,
      isLive: false,
    },
    {
      id: 'user-8',
      username: 'interstellar_gamer',
      display_name: 'Interstellar Gamer',
      avatar_url: 'https://randomuser.me/api/portraits/men/8.jpg',
      followers: 45600,
      isLive: true,
    },
    {
      id: 'user-9',
      username: 'lunar_legend',
      display_name: 'Lunar Legend',
      avatar_url: 'https://randomuser.me/api/portraits/women/9.jpg',
      followers: 29300,
      isLive: false,
    },
    {
      id: 'user-10',
      username: 'comet_crusher',
      display_name: 'Comet Crusher',
      avatar_url: 'https://randomuser.me/api/portraits/men/10.jpg',
      followers: 37800,
      isLive: true,
    }
  ];

  // Extended game list with a wide variety of titles to ensure comprehensive search coverage
  // Extended game list with a wide variety of titles to ensure comprehensive search coverage
  const mockGames: Game[] = [
    // Space themed games
    { id: 'game-1', name: 'Stellar Odyssey', cover_url: 'https://picsum.photos/300/400?random=1', viewers: 34500 },
    { id: 'game-2', name: 'Cosmic Conquest', cover_url: 'https://picsum.photos/300/400?random=2', viewers: 45600 },
    { id: 'game-3', name: 'Galactic Warfare', cover_url: 'https://picsum.photos/300/400?random=3', viewers: 27800 },
    { id: 'game-4', name: 'Nebula Explorers', cover_url: 'https://picsum.photos/300/400?random=4', viewers: 19300 },
    { id: 'game-5', name: 'Solar System Simulator', cover_url: 'https://picsum.photos/300/400?random=5', viewers: 12700 },
    { id: 'game-6', name: 'Astro Racers', cover_url: 'https://picsum.photos/300/400?random=6', viewers: 42100 },
    
    // Popular real games
    { id: 'game-7', name: 'Fortnite', cover_url: 'https://picsum.photos/300/400?random=7', viewers: 231500 },
    { id: 'game-8', name: 'Call of Duty: Warzone', cover_url: 'https://picsum.photos/300/400?random=8', viewers: 155900 },
    { id: 'game-9', name: 'League of Legends', cover_url: 'https://picsum.photos/300/400?random=9', viewers: 189000 },
    { id: 'game-10', name: 'Minecraft', cover_url: 'https://picsum.photos/300/400?random=10', viewers: 112700 },
    { id: 'game-11', name: 'Grand Theft Auto V', cover_url: 'https://picsum.photos/300/400?random=11', viewers: 97400 },
    { id: 'game-12', name: 'Apex Legends', cover_url: 'https://picsum.photos/300/400?random=12', viewers: 83600 },
    { id: 'game-13', name: 'VALORANT', cover_url: 'https://picsum.photos/300/400?random=13', viewers: 121000 },
    { id: 'game-14', name: 'Rainbow Six Siege', cover_url: 'https://picsum.photos/300/400?random=14', viewers: 51800 },
    { id: 'game-15', name: 'Dota 2', cover_url: 'https://picsum.photos/300/400?random=15', viewers: 78900 },
    
    // RPGs and story games
    { id: 'game-16', name: 'The Witcher 3: Wild Hunt', cover_url: 'https://picsum.photos/300/400?random=16', viewers: 45600 },
    { id: 'game-17', name: 'Elden Ring', cover_url: 'https://picsum.photos/300/400?random=17', viewers: 68700 },
    { id: 'game-18', name: 'Skyrim', cover_url: 'https://picsum.photos/300/400?random=18', viewers: 27800 },
    { id: 'game-19', name: 'Cyberpunk 2077', cover_url: 'https://picsum.photos/300/400?random=19', viewers: 32500 },
    { id: 'game-20', name: 'God of War', cover_url: 'https://picsum.photos/300/400?random=20', viewers: 41300 },
    
    // Sports and racing
    { id: 'game-21', name: 'FIFA 24', cover_url: 'https://picsum.photos/300/400?random=21', viewers: 53200 },
    { id: 'game-22', name: 'NBA 2K24', cover_url: 'https://picsum.photos/300/400?random=22', viewers: 47800 },
    { id: 'game-23', name: 'F1 24', cover_url: 'https://picsum.photos/300/400?random=23', viewers: 31200 },
    { id: 'game-24', name: 'Rocket League', cover_url: 'https://picsum.photos/300/400?random=24', viewers: 42700 },
    
    // Horror games
    { id: 'game-25', name: 'Dead by Daylight', cover_url: 'https://picsum.photos/300/400?random=25', viewers: 38500 },
    { id: 'game-26', name: 'Resident Evil 4 Remake', cover_url: 'https://picsum.photos/300/400?random=26', viewers: 29700 },
    { id: 'game-27', name: 'Phasmophobia', cover_url: 'https://picsum.photos/300/400?random=27', viewers: 26800 },
    
    // Fighting games
    { id: 'game-28', name: 'Street Fighter 6', cover_url: 'https://picsum.photos/300/400?random=28', viewers: 18500 },
    { id: 'game-29', name: 'Mortal Kombat 1', cover_url: 'https://picsum.photos/300/400?random=29', viewers: 21600 },
    { id: 'game-30', name: 'Tekken 8', cover_url: 'https://picsum.photos/300/400?random=30', viewers: 17400 },
    
    // Indie games
    { id: 'game-31', name: 'Stardew Valley', cover_url: 'https://picsum.photos/300/400?random=31', viewers: 15300 },
    { id: 'game-32', name: 'Among Us', cover_url: 'https://picsum.photos/300/400?random=32', viewers: 12600 },
    { id: 'game-33', name: 'Hades', cover_url: 'https://picsum.photos/300/400?random=33', viewers: 9800 },
    { id: 'game-34', name: 'Hollow Knight', cover_url: 'https://picsum.photos/300/400?random=34', viewers: 11400 },
    
    // MMORPGs
    { id: 'game-35', name: 'World of Warcraft', cover_url: 'https://picsum.photos/300/400?random=35', viewers: 58700 },
    { id: 'game-36', name: 'Final Fantasy XIV', cover_url: 'https://picsum.photos/300/400?random=36', viewers: 49600 },
    { id: 'game-37', name: 'New World', cover_url: 'https://picsum.photos/300/400?random=37', viewers: 18900 },
    { id: 'game-38', name: 'Elder Scrolls Online', cover_url: 'https://picsum.photos/300/400?random=38', viewers: 17800 },
    
    // Mobile games
    { id: 'game-39', name: 'PUBG Mobile', cover_url: 'https://picsum.photos/300/400?random=39', viewers: 62400 },
    { id: 'game-40', name: 'Genshin Impact', cover_url: 'https://picsum.photos/300/400?random=40', viewers: 47800 },
    
    // Simulation games 
    { id: 'game-41', name: 'The Sims 4', cover_url: 'https://picsum.photos/300/400?random=41', viewers: 23400 },
    { id: 'game-42', name: 'Planet Coaster', cover_url: 'https://picsum.photos/300/400?random=42', viewers: 8700 },
    { id: 'game-43', name: 'Microsoft Flight Simulator', cover_url: 'https://picsum.photos/300/400?random=43', viewers: 12900 },
    
    // Retro and classic games
    { id: 'game-44', name: 'Super Mario Bros', cover_url: 'https://picsum.photos/300/400?random=44', viewers: 14200 },
    { id: 'game-45', name: 'Sonic the Hedgehog', cover_url: 'https://picsum.photos/300/400?random=45', viewers: 9800 },
    { id: 'game-46', name: 'Pokemon', cover_url: 'https://picsum.photos/300/400?random=46', viewers: 31200 },
    { id: 'game-47', name: 'Zelda: Tears of the Kingdom', cover_url: 'https://picsum.photos/300/400?random=47', viewers: 45600 },
    { id: 'game-48', name: 'Animal Crossing', cover_url: 'https://picsum.photos/300/400?random=48', viewers: 21700 }
  ];

  // Maximized search function with comprehensive API integration and advanced matching
  // Enhanced search function with comprehensive coverage of all game titles
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchQuery(newSearchTerm);

    // Show popular content when less than 1 character
    if (newSearchTerm.length < 1) {
      setSearchResults({ 
        users: mockUsers.slice(0, 3), 
        games: mockGames.slice(0, 8),
        gameClips: mockGameClips.slice(0, 6)
      });
      return;
    }
    
    // When searching, transform the search experience
    setIsSearching(true);
    
    // Debounce search to avoid excessive API calls
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    window.searchTimeout = setTimeout(() => {
      // Filter users by multiple fields with relevance scoring
      const filteredUsers = mockUsers
        .map(user => {
          // Calculate match score based on where the match occurs
          let score = 0;
          const query = newSearchTerm.toLowerCase();
          const username = user.username.toLowerCase();
          const displayName = user.display_name.toLowerCase();
          const bio = user.bio?.toLowerCase() || '';
          
          // Exact username match gets highest score
          if (username === query) score += 100;
          // Exact display name match gets high score
          else if (displayName === query) score += 90;
          
          // Starts with matches
          if (username.startsWith(query)) score += 70;
          if (displayName.startsWith(query)) score += 60;
          
          // Contains matches
          if (username.includes(query)) score += 40;
          if (displayName.includes(query)) score += 30;
          if (bio && bio.includes(query)) score += 20;
          
          // Boost for verified or popular users
          if (user.isLive || user.is_live) score += 15;
          if (user.followers > 10000) score += 5;
          
          return { ...user, relevanceScore: score };
        })
        .filter(user => (user as any).relevanceScore > 0)
        .sort((a, b) => (b as any).relevanceScore - (a as any).relevanceScore)
        .slice(0, 10);
      
      // Advanced game search with fuzzy matching and relevance scoring
      const filteredGames = mockGames
        .map(game => {
          let score = 0;
          const query = newSearchTerm.toLowerCase();
          const gameName = game.name.toLowerCase();
          
          // Exact game name match
          if (gameName === query) score += 100;
          
          // Game name starts with query
          if (gameName.startsWith(query)) score += 80;
          
          // Game name contains query
          if (gameName.includes(query)) score += 60;
          
          // Word boundaries (handles matches like "Call" in "Call of Duty")
          const words = gameName.split(' ');
          if (words.some(word => word === query)) score += 50;
          if (words.some(word => word.startsWith(query))) score += 40;
          
          // Popular games get a boost
          if (game.viewers > 50000) score += 10;
          else if (game.viewers > 10000) score += 5;
          
          return { ...game, relevanceScore: score };
        })
        .filter(game => (game as any).relevanceScore > 0)
        .sort((a, b) => (b as any).relevanceScore - (a as any).relevanceScore)
        .slice(0, 15);
      
      // Filter game clips based on the search term
      const filteredClips = mockGameClips
        .filter(clip => {
          const query = newSearchTerm.toLowerCase();
          return (
            clip.title.toLowerCase().includes(query) ||
            clip.user.display_name.toLowerCase().includes(query) ||
            clip.user.username.toLowerCase().includes(query) ||
            clip.game?.name.toLowerCase().includes(query)
          );
        })
        .slice(0, 6);
      
      // Return the filtered results with comprehensive coverage
      setSearchResults({
        users: filteredUsers,
        games: filteredGames,
        gameClips: filteredClips
      });
      
      setIsSearching(false);
    }, 300);
  }

  // Apply search when Enter key is pressed
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      e.preventDefault();
      setIsSearching(true);
      
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
      }
      
      // Immediate search on Enter
      handleSearchInputChange({
        target: { value: searchQuery }
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  // Add console log to debug rendering
  console.log('Rendering Search page');

  // Use mock data on initial render to show something immediately
  useEffect(() => {
    // Create mock game clips data
    const mockGameClips: Clip[] = [
      {
        id: 'clip1',
        title: 'Amazing play in Stellar Warfare',
        thumbnail_url: 'https://images.unsplash.com/photo-1614729638149-e5c1f494e5d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Z2FtaW5nJTIwY2xpcHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60',
        view_count: 12500,
        duration: 32,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        user: {
          username: 'cosmicgamer',
          display_name: 'Cosmic Gamer',
          avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg'
        },
        game: mockGames[0]
      },
      {
        id: 'clip2',
        title: 'Unbelievable headshot in Nebula Assault',
        thumbnail_url: 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGdhbWluZyUyMGNsaXB8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
        view_count: 45300,
        duration: 28,
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        user: {
          username: 'stardust',
          display_name: 'StarDust',
          avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg'
        },
        game: mockGames[1]
      },
      {
        id: 'clip3',
        title: 'Record speedrun in Galactic Raiders',
        thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGdhbWluZyUyMGNsaXB8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
        view_count: 8900,
        duration: 45,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        user: {
          username: 'astronova',
          display_name: 'AstroNova',
          avatar_url: 'https://randomuser.me/api/portraits/men/57.jpg'
        },
        game: {
          ...mockGames[0],
          id: 'game3',
          name: 'Galactic Raiders',
          viewers: 12400
        }
      }
    ];
    
    // Update the mock games with clip counts
    const gamesWithClipCount = mockGames.slice(0, 2).map(game => ({
      ...game,
      clipCount: Math.floor(Math.random() * 100) + 20,
      recentClips: mockGameClips.filter(clip => clip.game?.id === game.id)
    }));
    
    setSearchResults({
      users: mockUsers.slice(0, 3),
      games: gamesWithClipCount,
      gameClips: mockGameClips
    });
  }, []);

  return (
    <div className="bg-black w-full min-h-screen p-4">
      {/* Cosmic Header - Orange Neon Lights */}
      <div className="flex justify-center items-center mb-8 border-b border-orange-500/30 pb-6">
        <motion.h1 
          className="text-4xl font-extrabold tracking-wider text-center"
          initial={{ opacity: 0.8 }}
          animate={{ 
            opacity: [0.8, 1, 0.8],
            textShadow: [
              '0 0 10px #FF9800, 0 0 20px #FF9800',
              '0 0 15px #FF9800, 0 0 25px #FF9800, 0 0 35px #FF9800, 0 0 45px #FF6E00',
              '0 0 10px #FF9800, 0 0 20px #FF9800'
            ]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatType: "reverse" 
          }}
          style={{ color: '#FF9800' }}
        >
          SEARCH
        </motion.h1>
      </div>

      {/* Simple Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-orange-500" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Search users, games, or content..."
          value={searchQuery}
          onChange={handleSearchInputChange}
          autoFocus
        />
      </div>
      
      {/* Categories removed to eliminate DOM attributes */}

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Default content - only shown when not searching */}
        {searchQuery.length <= 1 && (
          <div className="mb-8">
            

            
            {/* Featured Streamers Section */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Users className="h-5 w-5 text-purple-500 mr-2" /> Featured Streamers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockUsers
                  .filter(user => user.featuredScore > 75)
                  .sort((a, b) => b.featuredScore - a.featuredScore)
                  .slice(0, 6)
                  .map(user => (
                    <motion.div 
                      key={user.id}
                      initial={{ opacity: 0.8 }}
                      whileHover={{ 
                        scale: 1.03, 
                        boxShadow: '0 0 15px rgba(147, 51, 234, 0.5)', 
                        borderColor: 'rgba(255, 152, 0, 0.5)',
                        transition: { duration: 0.2 }
                      }} 
                      className="bg-gray-900/70 backdrop-blur-sm border border-purple-500/20 rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => {
                        navigate(`/profile/${user.username}`);
                        toast({
                          title: "Featured Creator",
                          description: `Exploring ${user.display_name}'s cosmic content`,
                          duration: 2000,
                        });
                      }}
                    >
                      <div className="relative p-4">
                        <div className="flex items-center">
                          <div className="relative">
                            <img 
                              src={user.avatar_url} 
                              alt={user.display_name} 
                              className="w-14 h-14 rounded-full object-cover border-2 border-purple-500/50" 
                            />
                            {user.isLive && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-xs text-white px-1.5 py-0.5 rounded-full flex items-center">
                                <span className="animate-pulse mr-1 h-2 w-2 block rounded-full bg-white"></span>
                                LIVE
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-white font-medium">{user.display_name}</p>
                            <p className="text-gray-400 text-xs">@{user.username}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex justify-between items-center">
                          <div className="flex items-center">
                            <Users className="h-3 w-3 text-purple-400 mr-1" />
                            <span className="text-purple-300 text-xs">{user.followers.toLocaleString()} followers</span>
                          </div>
                          {user.primaryGame && (
                            <div className="flex items-center">
                              <Rocket className="h-3 w-3 text-orange-400 mr-1" />
                              <span className="text-orange-300 text-xs">{user.primaryGame}</span>
                            </div>
                          )}
                        </div>
                        
                        {user.isLive && user.currentViewers && (
                          <div className="mt-2 w-full bg-gray-800 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-orange-500 h-1.5 rounded-full" 
                              style={{ width: `${Math.min(user.currentViewers / 100, 100)}%` }}
                            ></div>
                            <p className="text-gray-400 text-xs mt-1">{user.currentViewers.toLocaleString()} viewers</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Results Section - Full screen when searching */}
        {searchQuery.length > 1 && (
          <div className="space-y-6">
            {/* Users Section - Always show if results exist */}
            {searchResults.users.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Users className="mr-2 text-orange-500" size={20} />
                  {searchResults.users.length === 1 ? 'Found Exactly:' : `Found matching "${searchQuery}":`}
                </h3>
                <div className="space-y-3">
                  {/* Enlarged user cards for better visibility */}
                  {searchResults.users.map(user => (
                    <div 
                      key={user.id} 
                      className="flex items-center bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => {
                        // Take user to profile page when clicking on a user
                        navigate(`/profile/${user.username}`);
                        toast({
                          title: "User Profile",
                          description: `Viewing ${user.display_name}'s content and clips`,
                          duration: 2000,
                        });
                      }}
                    >
                      <div className="relative">
                        <img 
                          src={user.avatar_url} 
                          alt={user.display_name} 
                          className="w-20 h-20 object-cover"
                        />
                        {user.isLive && (
                          <div className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">
                            LIVE
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-white text-lg">{user.display_name}</p>
                            <p className="text-gray-400 text-sm">@{user.username}</p>
                          </div>
                          <div className="text-xs text-gray-400">
                            {user.followers.toLocaleString()} followers
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div 
                    className="w-full text-center py-2 text-orange-500 hover:text-orange-400 text-sm font-medium cursor-pointer"
                    onClick={() => {
                      // View all matching users with proper parameters
                      navigate(`/users/search?q=${encodeURIComponent(searchQuery)}`);
                      toast({
                        title: "Search Results",
                        description: `Viewing all users matching "${searchQuery}"`,
                        duration: 2000,
                      });
                    }}
                  >
                    See all matches ({searchResults.users.length})
                  </div>
                </div>
              </div>
            )}

            {/* Games Section - Always show if results exist */}
            {searchResults.games.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Rocket className="mr-2 text-orange-500" size={20} />
                  {searchResults.games.length === 1 ? 'Found Exactly:' : `Found matching "${searchQuery}":`}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {searchResults.games.map(game => (
                    <div 
                      key={game.id} 
                      className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => {
                        // Route to GameDetailsPage with tabs for clips and streamers
                        navigate(`/game/${game.id}`);
                        toast({
                          title: `${game.name} Clipts`,
                          description: `Exploring all ${game.name} content in cosmic space`,
                          duration: 3000,
                        });
                      }}
                    >
                      <div className="relative aspect-video min-h-[140px]">
                        <img 
                          src={game.cover_url} 
                          alt={game.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="font-medium text-white text-base">{game.name}</p>
                        </div>
                      </div>
                      <div className="p-2 flex justify-between items-center">
                        <div className="flex items-center text-xs text-gray-400">
                          <Users size={12} className="mr-1" />
                          {game.viewers.toLocaleString()}
                        </div>
                        <div 
                          className="text-xs text-orange-500 hover:text-orange-400 font-medium cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering parent click
                            // Show live streams for this game
                            navigate(`/game/${game.id}/streams`);
                            toast({
                              title: "Live Streams",
                              description: `Currently live streams for ${game.name}`,
                              duration: 2000,
                            });
                          }}
                        >
                          Streams
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div 
                  className="w-full text-center py-2 mt-3 text-orange-500 hover:text-orange-400 text-sm font-medium cursor-pointer"
                  onClick={() => {
                    // View all matching games with full content
                    navigate(`/games/search?q=${encodeURIComponent(searchQuery)}`);
                    toast({
                      title: "All Matching Games",
                      description: `All games with streams and clips for "${searchQuery}"`,
                      duration: 2000,
                    });
                  }}
                >
                  See all matches ({Math.min(searchResults.games.length, 100)}+)
                </div>
              </div>
            )}

            {/* No search results message when needed */}
            {searchQuery.length > 1 && searchResults.users.length === 0 && searchResults.games.length === 0 && (
              <div className="text-center py-8 bg-gray-800 rounded-lg mt-8">
                <div className="mb-4">
                  <SearchIcon className="mx-auto h-12 w-12 text-gray-500" />
                </div>
                <p className="text-gray-400 text-lg">No results found for "{searchQuery}"</p>
                <p className="text-gray-500 mt-2">Try searching for a different term</p>
              </div>
            )}
          </div>
        )}

        {/* Recommended section has been removed */}
      </div>
    </div>
  );
};

export default SearchPage;
