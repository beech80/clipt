import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Trophy, Tv, Zap, Compass, Sword, Brain, Building2, Skull, Puzzle, Map, Eye, User, Gamepad2, Flame, Sparkles, Gamepad, ChevronDown } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const scanline = keyframes`
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
`;

const glitch = keyframes`
  0% {
    transform: translate(0);
  }
  20% {
    transform: translate(-2px, 2px);
  }
  40% {
    transform: translate(-2px, -2px);
  }
  60% {
    transform: translate(2px, 2px);
  }
  80% {
    transform: translate(2px, -2px);
  }
  100% {
    transform: translate(0);
  }
`;

const flicker = keyframes`
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
  100% { opacity: 0.97; }
  80% { opacity: 0.9; }
  85% { opacity: 0.95; }
  90% { opacity: 0.9; }
  95% { opacity: 0.85; }
  100% { opacity: 0.9; }
`;

const RetroContainer = styled.div`
  ::-webkit-scrollbar {
    display: none;
  }
  
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  background: linear-gradient(to bottom, #0C0C0C, #151515, #0C0C0C);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  padding: 20px;
  color: #fff;
  background-size: 100% 100%;
  background-attachment: fixed;
  
  &:before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255, 85, 0, 0.03) 0%,
      transparent 70%
    );
    animation: ${scanline} 8s linear infinite;
    pointer-events: none;
    z-index: 1;
  }
  
  &::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(18, 16, 16, 0.1);
    opacity: 0;
    animation: ${flicker} 0.3s infinite;
    pointer-events: none;
    z-index: 1;
  }
`;

const RetroCard = styled(Card)`
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  width: 100%;
  background: rgba(0, 0, 0, 0.7);
  border-color: #FF5500;
  border-width: 2px;
  border-style: solid;
  
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 0 25px rgba(255, 85, 0, 0.3), 0 0 10px rgba(0, 255, 255, 0.2);
    border-color: #FF8800;
  }

  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 2px solid transparent;
    background: linear-gradient(45deg, #FF5500, transparent, #FF5500, transparent) border-box;
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255, 85, 0, 0.8), transparent);
    animation: scan 2s linear infinite;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  @keyframes scan {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  &:hover::after {
    opacity: 1;
  }
`;

const RetroTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 2rem;
  color: #FF5500;
  text-shadow: 
    0 0 10px rgba(255, 85, 0, 0.7),
    0 0 20px rgba(255, 85, 0, 0.5),
    0 0 30px rgba(255, 85, 0, 0.3);
  position: relative;
  animation: ${glitch} 3s infinite;
  padding: 15px;
  background: radial-gradient(circle at center, rgba(255, 85, 0, 0.1), transparent 70%);
  border-bottom: 2px solid rgba(255, 85, 0, 0.1);
  
  &:before,
  &:after {
    content: 'CLIPT DISCOVERY';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    clip: rect(0, 900px, 0, 0);
  }

  &:before {
    text-shadow: -2px 0 #0ff;
    animation: ${glitch} 3s infinite;
    animation-delay: -1s;
  }

  &:after {
    text-shadow: 2px 0 #f0f;
    animation: ${glitch} 3s infinite;
    animation-delay: -2s;
  }
  font-family: 'Press Start 2P', system-ui;
`;

const RetroTabs = styled(TabsList)`
  background: rgba(255, 85, 0, 0.1);
  border: 1px solid rgba(255, 85, 0, 0.2);
  padding: 4px;
  
  button {
    color: #FF5500;
    
    &[data-state="active"] {
      background: rgba(255, 85, 0, 0.2);
    }
  }
`;

// Extremely simple Discovery component using proper React patterns
const allGenres = [
  { id: 'action', name: 'Action Games', icon: <Zap className="h-4 w-4" /> },
  { id: 'rpg', name: 'RPG', icon: <Sword className="h-4 w-4" /> },
  { id: 'fps', name: 'FPS', icon: <Gamepad2 className="h-4 w-4" /> },
  { id: 'strategy', name: 'Strategy', icon: <Brain className="h-4 w-4" /> },
  { id: 'mmo', name: 'MMO', icon: <Sword className="h-4 w-4" /> },
  { id: 'sports', name: 'Sports', icon: <Trophy className="h-4 w-4" /> },
  { id: 'racing', name: 'Racing', icon: <Zap className="h-4 w-4" /> },
  { id: 'horror', name: 'Horror', icon: <Skull className="h-4 w-4" /> },
  { id: 'puzzle', name: 'Puzzle', icon: <Puzzle className="h-4 w-4" /> },
  { id: 'sandbox', name: 'Open World', icon: <Map className="h-4 w-4" /> },
] as const;

const DiscoveryFixedClean = () => {
  const navigate = useNavigate();
  const [activeGenres, setActiveGenres] = React.useState<Set<string>>(new Set(allGenres.map(g => g.id)));
  const [searchModalOpen, setSearchModalOpen] = React.useState(false);

  const toggleGenre = (genreId: string) => {
    setActiveGenres(prev => {
      const newSet = new Set(prev);
      if (newSet.has(genreId)) {
        newSet.delete(genreId);
      } else {
        newSet.add(genreId);
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
  }

  const streamers: Streamer[] = [
    { 
      id: 'ninja_123',
      name: 'Ninja',
      genres: ['action', 'fps'],
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/ninja-profile_image-0c9e41f5c0bf1585-300x300.png',
      viewers: 45000,
      title: 'FORTNITE VICTORY ROYALES!'
    },
    {
      id: 'pokimane_456',
      name: 'Pokimane',
      genres: ['rpg', 'mmo'],
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/pokimane-profile_image-5e0c8c07cd69e392-300x300.png',
      viewers: 32000,
      title: 'LEAGUE OF LEGENDS RANKED GRIND'
    },
    {
      id: 'drdisrespect_789',
      name: 'DrDisrespect',
      genres: ['fps', 'action'],
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/drdisrespect-profile_image-abc1fc67d2ea1ae1-300x300.png',
      viewers: 28000,
      title: 'DOMINATING IN WARZONE || BEST PLAYS'
    },
    {
      id: 'shroud_101',
      name: 'Shroud',
      genres: ['fps', 'strategy'],
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/shroud-profile_image-8e82d2e9bd839842-300x300.png',
      viewers: 35000,
      title: 'VALORANT TACTICAL PLAYS'
    },
    {
      id: 'tfue_202',
      name: 'Tfue',
      genres: ['fps', 'sandbox'],
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/tfue-profile_image-b39c3b7f89736d77-300x300.png',
      viewers: 25000,
      title: 'MINECRAFT SURVIVAL GAMES'
    },
    {
      id: 'thegrefg_303',
      name: 'TheGrefg',
      genres: ['racing', 'sports'],
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/thegrefg-profile_image-2c3bbc8cd193eae3-300x300.png',
      viewers: 22000,
      title: 'GRAN TURISMO 7 CHAMPIONSHIPS!'
    },
    {
      id: 'markiplier_404',
      name: 'Markiplier',
      genres: ['horror', 'puzzle'],
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/markiplier-profile_image-f258c5b7fc43d960-300x300.png',
      viewers: 30000,
      title: 'FNAF + RESIDENT EVIL SPEEDRUNS'
    },
    { 
      id: 'xqc_505',
      name: 'xQc',
      genres: ['variety', 'fps', 'rpg'],
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/xqc-profile_image-9298dca608632101-300x300.jpeg',
      viewers: 52000,
      title: 'JUST CHATTING THEN GAMING W/ VIEWERS!!'
    },
    { 
      id: 'asmongold_606',
      name: 'Asmongold',
      genres: ['rpg', 'mmo'],
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/asmongold-profile_image-f7ddcbd0332f5d28-300x300.png',
      viewers: 43215,
      title: 'WOW MYTHIC RAIDING'
    },
    { 
      name: 'Sodapoppin',
      genres: ['variety', 'mmo', 'horror'],
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/sodapoppin-profile_image-2015d618b3b819b7-300x300.png',
      viewers: 31452,
      title: 'TRYING NEW HORROR GAMES!'
    },
    { 
      name: 'NICKMERCS',
      genres: ['fps', 'sports'],
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/nickmercs-profile_image-2001b43f3b85d6c5-300x300.png',
      viewers: 35678,
      title: 'APEX LEGENDS RANKED GRIND'
    }
  ];

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

  React.useEffect(() => {
    console.log('DiscoveryFixedClean mounted with genre:', selectedGenre);
    return () => {
      console.log('DiscoveryFixedClean unmounted');
    };
  }, [selectedGenre]);

  return (
    <RetroContainer>
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
      
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
        {streamers
          .filter(streamer => !selectedGenre || streamer.genres.includes(selectedGenre))
          .map((streamer, index) => (
          <RetroCard key={index} className="transform hover:scale-105 transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,85,0,0.2)]">
            <CardContent className="p-4 relative z-10 backdrop-blur-sm bg-black/40">
              <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
              <div 
                className="stream-preview aspect-video bg-black/40 rounded-md mb-4 flex items-center justify-center text-orange-500/70 relative overflow-hidden group cursor-pointer transform transition-all hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,85,0,0.3)]"
                onClick={() => navigate(`/stream/${streamer.id}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-orange-500/10" />
                <img 
                  src={streamer.avatar} 
                  alt={`${streamer.name}'s stream preview`}
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white">

                  <div className="text-sm font-medium truncate">{streamer.title}</div>
                  <div className="text-xs text-orange-500/90 flex items-center gap-2 mt-1">
                    {streamer.genres.map((genre, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded-md bg-orange-500/30 border border-orange-500/20 text-[10px] uppercase font-bold tracking-wide">{genre}</span>
                    ))}
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative flex flex-col items-center gap-2 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                    <div className="bg-black/80 rounded-full p-3 relative">
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.8)] border border-red-400/30"></div>
                      <Zap className="h-8 w-8 text-orange-500" />
                    </div>
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
          </RetroCard>
        ))}
        </div>
      </div>
    </RetroContainer>
  );
};

export default DiscoveryFixedClean;
