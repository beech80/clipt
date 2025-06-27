import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Trophy, Tv, Zap, Compass, Sword, Brain, Building2, Skull, Puzzle, Map, Eye, User, Gamepad2, Flame, Sparkles, Gamepad, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const useGlobalAnimations = () => {
  React.useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes scanline {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100%); }
      }
      
      @keyframes glitch {
        0% { transform: translate(0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(-2px, -2px); }
        60% { transform: translate(2px, 2px); }
        80% { transform: translate(2px, -2px); }
        100% { transform: translate(0); }
      }
      
      @keyframes flicker {
        0% { opacity: 0.97; }
        5% { opacity: 0.95; }
        10% { opacity: 0.9; }
        15% { opacity: 0.85; }
        20% { opacity: 0.95; }
        25% { opacity: 0.85; }
        30% { opacity: 0.9; }
        35% { opacity: 0.95; }
        40% { opacity: 0.85; }
        45% { opacity: 0.9; }
        50% { opacity: 0.95; }
        55% { opacity: 0.85; }
        60% { opacity: 0.9; }
        65% { opacity: 0.95; }
        70% { opacity: 0.9; }
        75% { opacity: 0.85; }
        80% { opacity: 0.9; }
        85% { opacity: 0.95; }
        90% { opacity: 0.9; }
        100% { opacity: 0.97; }
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  return null;
};

// Removed styled components in favor of dynamic CSS injection via useEffect

// Add style to dynamically adjust grid layout
const GridStyleEffect = () => {
  React.useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `.streamers-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 1.5rem;
      padding: 1rem;
    }
    @media (min-width: 640px) {
      .streamers-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (min-width: 1024px) {
      .streamers-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    @media (min-width: 1280px) {
      .streamers-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }`;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  return null;
};

// RetroTitle component as a regular React component with Tailwind CSS
const RetroTitle: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  // Add keyframe animation to the document head
  React.useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes retroGlitch {
        0% { transform: translate(0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(-2px, -2px); }
        60% { transform: translate(2px, 2px); }
        80% { transform: translate(2px, -2px); }
        100% { transform: translate(0); }
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  return (
    <h1 
      className="text-4xl font-bold text-center mb-8 text-[#FF5500] relative py-4 border-b-2 border-orange-500/10"
      style={{
        textShadow: '0 0 10px rgba(255, 85, 0, 0.7), 0 0 20px rgba(255, 85, 0, 0.5), 0 0 30px rgba(255, 85, 0, 0.3)',
        animation: 'retroGlitch 3s infinite',
        fontFamily: '"Press Start 2P", system-ui',
        background: 'radial-gradient(circle at center, rgba(255, 85, 0, 0.1), transparent 70%)'
      }}
    >
      {children}
      <span 
        className="absolute top-0 left-0 w-full h-full" 
        style={{
          content: '"CLIPT DISCOVERY"',
          clipPath: 'rect(0, 900px, 0, 0)',
          textShadow: '-2px 0 #0ff',
          animation: 'retroGlitch 3s infinite',
          animationDelay: '-1s'
        }}
        aria-hidden="true"
      >
        {children}
      </span>
      <span 
        className="absolute top-0 left-0 w-full h-full" 
        style={{
          content: '"CLIPT DISCOVERY"',
          clipPath: 'rect(0, 900px, 0, 0)',
          textShadow: '2px 0 #f0f',
          animation: 'retroGlitch 3s infinite',
          animationDelay: '-2s'
        }}
        aria-hidden="true"
      >
        {children}
      </span>
    </h1>
  );
};


// RetroTabs as a regular React component using Tailwind CSS
const RetroTabs: React.FC<React.ComponentProps<typeof TabsList>> = (props) => {
  // Add custom styles via useEffect
  React.useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .retro-tabs-buttons {
        color: #FF5500;
      }
      .retro-tabs-buttons[data-state="active"] {
        background: rgba(255, 85, 0, 0.2);
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  return (
    <TabsList 
      {...props}
      className={`bg-orange-500/10 border border-orange-500/20 p-1 ${props.className || ''}`}
    />
  );
};

// Enhanced Discovery component with gaming-specific tags and categories
const allGenres = [
  { id: 'action', name: 'Action Games', icon: <Zap className="h-4 w-4" />, tags: ['fps-gameplay', 'melee-combat', 'boss-fights'] },
  { id: 'rpg', name: 'RPG', icon: <Sword className="h-4 w-4" />, tags: ['leveling', 'character-builds', 'loot-hunting'] },
  { id: 'fps', name: 'FPS', icon: <Gamepad2 className="h-4 w-4" />, tags: ['sniping', 'competitive-fps', 'tactical-shooter'] },
  { id: 'strategy', name: 'Strategy', icon: <Brain className="h-4 w-4" />, tags: ['rts-gaming', 'turn-based', 'city-builder'] },
  { id: 'mmo', name: 'MMO', icon: <Sword className="h-4 w-4" />, tags: ['raiding', 'pvp-battles', 'guild-events'] },
  { id: 'sports', name: 'Sports', icon: <Trophy className="h-4 w-4" />, tags: ['fifa-gameplay', 'nba2k', 'racing-games'] },
  { id: 'racing', name: 'Racing', icon: <Zap className="h-4 w-4" />, tags: ['drifting', 'sim-racing', 'track-mastery'] },
  { id: 'horror', name: 'Horror', icon: <Skull className="h-4 w-4" />, tags: ['jumpscares', 'survival-horror', 'spooky-games'] },
  { id: 'puzzle', name: 'Puzzle', icon: <Puzzle className="h-4 w-4" />, tags: ['speedsolving', 'brain-teasers', 'puzzle-games'] },
  { id: 'sandbox', name: 'Open World', icon: <Map className="h-4 w-4" />, tags: ['exploration', 'base-building', 'minecraft-like'] },
  { id: 'indie', name: 'Indie Games', icon: <Sparkles className="h-4 w-4" />, tags: ['indie-dev', 'roguelikes', 'pixel-art-games'] },
  { id: 'retro', name: 'Retro Games', icon: <Gamepad className="h-4 w-4" />, tags: ['speedrunning', 'classic-gaming', 'nes-snes'] },
] as const;

const DiscoveryFixedClean = () => {
  // Setup animations first
  useGlobalAnimations();
  // Add grid styles
  const GridStyles = GridStyleEffect();
  
  const navigate = useNavigate();
  const [activeGenres, setActiveGenres] = React.useState<Set<string>>(new Set(allGenres.map(g => g.id)));
  const [searchModalOpen, setSearchModalOpen] = React.useState(false);
  const [activeTags, setActiveTags] = React.useState<Set<string>>(new Set());
  const [userPreferences, setUserPreferences] = React.useState({
    favoriteGenres: ['fps', 'action', 'rpg'],
    recentlyViewed: ['valorant', 'fortnite', 'apex-legends'],
    followedStreamers: ['ninja_123', 'shroud_101', 'nickmercs_808'],
    watchTimeByGame: {
      'fortnite': 120, // minutes
      'valorant': 95,
      'apex-legends': 75,
      'league-of-legends': 60,
      'minecraft': 45
    }
  });

  const toggleGenre = (genreId: string) => {
    setActiveGenres(prev => {
      const newSet = new Set(prev);
      if (newSet.has(genreId)) {
        newSet.delete(genreId);
        if (selectedGenre === genreId) {
          setSelectedGenre('');
        }
      } else {
        newSet.add(genreId);
      }
      return newSet;
    });
  };
  
  const toggleTag = (tag: string) => {
    setActiveTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };
  interface Streamer {
    id: string;
    name: string;
    genres: string[];
    avatar: string;
    viewers: number;
    title: string;
    tags?: string[];
    recommendationScore?: number;
  }

  // Empty array to be populated from API in production
  const streamers: Streamer[] = [];

  const [selectedGenre, setSelectedGenre] = React.useState<string>('');

const getGenreDescription = (genreId: string) => {
  switch(genreId) {
    case 'action': return 'Fast-paced gameplay with reflex-based mechanics';
    case 'rpg': return 'Character progression and epic quests';
    case 'fps': return 'First-person shooter games with precision aim';
    case 'strategy': return 'Tactical decision-making and planning';
    case 'mmo': return 'Massive multiplayer online worlds';
    case 'sports': return 'Competitive sports and athletics';
    case 'racing': return 'High-speed racing and vehicle control';
    default: return '';
  }
};

  // Calculate recommendation scores based on user preferences and tag matching
  const calculateRecommendationScores = () => {
    return streamers.map(streamer => {
      let score = 0;
      
      // Genre match weight: 20 points
      const genreMatchCount = streamer.genres.filter(g => userPreferences.favoriteGenres.includes(g)).length;
      score += (genreMatchCount / streamer.genres.length) * 20;
      
      // Tags match weight: 25 points
      if (streamer.tags) {
        const tagMatchCount = streamer.tags.filter(tag => 
          userPreferences.recentlyViewed.some(game => tag.includes(game))
        ).length;
        score += (tagMatchCount / streamer.tags.length) * 25;
      }
      
      // Followed streamers bonus: 15 points
      if (userPreferences.followedStreamers.includes(streamer.id)) {
        score += 15;
      }
      
      // Watch time bonus: 40 points
      const watchTimeBonus = streamer.tags ? 
        streamer.tags.reduce((bonus, tag) => {
          // Check if any game in watchTimeByGame matches this tag
          const matchingGame = Object.keys(userPreferences.watchTimeByGame).find(game => tag.includes(game));
          if (matchingGame) {
            // Normalize watch time to a 0-40 scale
            const watchTime = userPreferences.watchTimeByGame[matchingGame];
            const normalizedBonus = (watchTime / 120) * 40; // 120 minutes = max points
            return bonus + normalizedBonus;
          }
          return bonus;
        }, 0) : 0;
      
      score += watchTimeBonus;
      
      // Normalize to 0-100 scale
      score = Math.min(Math.round(score), 100);
      
      return {
        ...streamer,
        recommendationScore: score
      };
    });
  };

  // Get all unique tags from streamers
  const getAllTags = () => {
    const tagCounts: Record<string, number> = {};
    streamers.forEach(streamer => {
      if (streamer.tags) {
        streamer.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Sort by frequency
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  };

  // Apply recommendation algorithm to streamers
  const streamersWithScores = React.useMemo(() => {
    return calculateRecommendationScores();
  }, [streamers, userPreferences]);
  
  // Get all available tags
  const allTags = React.useMemo(() => getAllTags(), [streamers]);

  // Filter streamers by active filters
  const filteredStreamers = React.useMemo(() => {
    return streamersWithScores
      .filter(streamer => 
        // Filter by genre if selectedGenre is set
        (!selectedGenre || streamer.genres.includes(selectedGenre)) &&
        // Filter by active tags if any are selected
        (activeTags.size === 0 || (streamer.tags && streamer.tags.some(tag => activeTags.has(tag))))
      )
      // Sort by recommendation score (high to low)
      .sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
  }, [streamersWithScores, selectedGenre, activeTags]);

  // Save user preferences to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('clipt_gaming_preferences', JSON.stringify(userPreferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, [userPreferences]);

  // Load user preferences from localStorage on mount
  React.useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('clipt_gaming_preferences');
      if (savedPreferences) {
        setUserPreferences(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
    
    console.log('DiscoveryFixedClean mounted with genre:', selectedGenre);
    return () => {
      console.log('DiscoveryFixedClean unmounted');
    };
  }, []);

  return (
    <div className="bg-gradient-to-b from-[#0C0C0C] via-[#151515] to-[#0C0C0C] min-h-screen relative overflow-hidden p-5 text-white">
      {/* New Cosmic Header - Top Middle */}
      <div className="w-full flex justify-center mb-6">
        <div className="relative text-center">
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-purple-400 to-orange-500 tracking-widest mb-2 animate-pulse">
            COSMIC EXPLORER
          </div>
          <div className="text-lg text-orange-300/70 uppercase tracking-wider font-medium">
            Discover the Universe
          </div>
          <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-orange-500/10 via-purple-500/5 to-orange-500/10 rounded-full blur-3xl"></div>
          <div className="flex justify-center items-center space-x-2 mt-2">
            <div className="h-1 w-1 bg-orange-500 rounded-full animate-ping"></div>
            <div className="h-1 w-16 bg-gradient-to-r from-orange-500/20 via-orange-500/70 to-orange-500/20 rounded-full"></div>
            <div className="h-1 w-1 bg-orange-500 rounded-full animate-ping" style={{animationDelay: '0.3s'}}></div>
          </div>
        </div>
      </div>

      <div className="relative mb-8 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1"></div>
          <RetroTitle>CLIPT DISCOVERY</RetroTitle>
          <div className="flex-1 flex items-center justify-end gap-3">
            <div 
              onClick={() => navigate('/streamers-for-you')} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/60 border-2 border-orange-500/40 cursor-pointer hover:bg-orange-500/20 hover:border-orange-500 transition-all hover:shadow-[0_0_15px_rgba(255,85,0,0.4)]"
            >
              <Search className="h-5 w-5 text-orange-500" />
            </div>
            <div 
              onClick={() => navigate('/all-streamers')} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/60 border-2 border-orange-500/40 cursor-pointer hover:bg-orange-500/20 hover:border-orange-500 transition-all hover:shadow-[0_0_15px_rgba(255,85,0,0.4)]"
              title="All Streamers Discovery"
            >
              <Tv className="h-5 w-5 text-orange-500" />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,85,0,0.1),transparent_70%)] animate-pulse" />
      </div>
      
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
          <button
            onClick={() => {
              const newSet = new Set(allGenres.map(g => g.id));
              setActiveGenres(activeGenres.size === allGenres.length ? new Set() : newSet);
              setSelectedGenre('');
            }}
            className={`px-4 py-2 rounded-lg transition-all ${activeGenres.size === allGenres.length ? 'bg-gradient-to-r from-orange-500/30 to-orange-500/20 border-orange-500 shadow-[0_0_10px_rgba(255,85,0,0.3)]' : 'bg-black/50 border-orange-500/30'} border hover:border-orange-500 hover:bg-orange-500/10 text-center transform hover:scale-105 active:scale-95`}
          >
            <span className="font-medium">All Genres</span>
          </button>
          {allGenres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => {
                // Toggle this genre in the active set
                const newActiveGenres = new Set(activeGenres);
                if (newActiveGenres.has(genre.id)) {
                  newActiveGenres.delete(genre.id);
                  if (selectedGenre === genre.id) setSelectedGenre('');
                } else {
                  newActiveGenres.add(genre.id);
                }
                setActiveGenres(newActiveGenres);
              }}
              className={`px-4 py-2 rounded-lg transition-all ${activeGenres.has(genre.id) ? (selectedGenre === genre.id ? 'bg-gradient-to-r from-orange-500/30 to-orange-500/20 border-orange-500 shadow-[0_0_10px_rgba(255,85,0,0.3)]' : 'bg-orange-500/20 border-orange-500/70') : 'bg-black/50 border-orange-500/30 opacity-70'} border hover:border-orange-500 hover:bg-orange-500/10 text-center transform hover:scale-105 active:scale-95`}
            >
              <span className="font-medium">{genre.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cosmic Tags Section removed */}
      
      {/* Cosmic Recommendations Section removed */}
      
      <div className="max-w-6xl mx-auto">
        {filteredStreamers.length > 0 ? (
          <div className="streamers-grid">
          {filteredStreamers.map((streamer, index) => (
          <div key={index} className="transform hover:scale-105 transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,85,0,0.2)] w-full bg-black/70 border-2 border-[#FF5500] hover:border-[#FF8800]">
            <CardContent className="p-4 relative z-10 backdrop-blur-sm bg-black/40">
              {/* Removed additional gradient divs as requested */}
              <div 
                className="stream-preview aspect-video bg-black/40 rounded-md mb-4 flex items-center justify-center text-orange-500/70 relative overflow-hidden group cursor-pointer transform transition-all hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,85,0,0.3)]"
                onClick={() => navigate(`/stream/${streamer.id}`)}
              >
                {/* Removed gradient divs as requested */}
                <img 
                  src={streamer.avatar} 
                  alt={`${streamer.name}'s stream preview`}
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  {/* Recommendation score removed */}
                  <div className="text-sm font-medium truncate">{streamer.title}</div>
                  <div className="text-xs flex flex-wrap items-center gap-1 mt-1">
                    {streamer.genres.map((genre, idx) => (
                      <span key={`genre-${idx}`} className="px-1.5 py-0.5 rounded-md bg-orange-500/30 border border-orange-500/20 text-[10px] uppercase font-bold tracking-wide text-orange-500/90">{genre}</span>
                    ))}
                    {streamer.tags && streamer.tags.slice(0, 3).map((tag, idx) => (
                      <span key={`tag-${idx}`} className="px-1.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-[10px] lowercase font-medium tracking-wide text-purple-300">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/80 rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                    <Zap className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-500/10 flex items-center justify-center overflow-hidden border-2 border-orange-500/30 hover:border-orange-500/60 transition-all cursor-pointer"
                  onClick={() => navigate(`/profile/${streamer.id}`)}
                >
                  <img 
                    src={streamer.avatar} 
                    alt={streamer.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div 
                  className="font-medium text-orange-300 hover:text-orange-400 transition-colors cursor-pointer bg-black/40 px-3 py-1 rounded border-r-2 border-orange-500/50 shadow-sm shadow-orange-500/20"
                  onClick={() => navigate(`/profile/${streamer.id}`)}
                >
                  {streamer.name}
                </div>
              </div>

            </CardContent>
          </div>
          ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-full max-w-md mx-auto bg-black/40 border-2 border-orange-500/50 rounded-xl p-8 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute -top-16 -left-16 w-32 h-32 bg-orange-500/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-xl"></div>
              
              <h2 className="text-center text-2xl font-bold bg-gradient-to-r from-orange-400 to-purple-500 text-transparent bg-clip-text mb-4">Discovery Portal</h2>
              
              <div className="w-16 h-16 mx-auto mb-5 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-purple-500/30 rounded-full animate-pulse"></div>
                <div className="absolute inset-1 bg-black rounded-full flex items-center justify-center">
                  <Compass className="h-8 w-8 text-orange-500 animate-spin" style={{ animationDuration: '10s' }} />
                </div>
              </div>
              
              <p className="text-center text-white/80 mb-4">Preparing for cosmic exploration</p>
              
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden mb-4">
                <div className="h-full w-full bg-gradient-to-r from-orange-500 to-purple-500 rounded-full" style={{ animation: 'shimmer 2s infinite linear' }}></div>
              </div>
              
              <p className="text-center text-sm text-white/60">Your Discovery portal will soon be filled with content from across the cosmos</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoveryFixedClean;
