import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Rocket, Users, ArrowUpRight, Clock, TrendingUp, Trophy, Zap, Share2, Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

// Define boost types and their effects
export type BoostType = 'squad_blast' | 'chain_reaction' | 'king' | 'stream_surge';

interface BoostAnalytics {
  id: string;
  boostType: BoostType;
  startTime: string;
  endTime: string;
  progress: number; // 0-100
  metrics: {
    views: number;
    viewsFromBoost: number;
    engagement: number;
    engagementFromBoost: number;
    likes: number;
    likesFromBoost: number;
    shares: number;
    sharesFromBoost: number;
    newFollowers: number;
    reachedUsers: number;
    // For Chain Reaction
    chainMultiplier?: number;
    chainSpread?: number;
    // For King boost
    rankBefore?: number;
    rankDuring?: number;
    // For Stream Surge
    viewersBefore?: number;
    viewersPeak?: number;
    minutesWatched?: number;
  };
}

interface BoostDetailsProps {
  boost: BoostAnalytics;
  onExtend?: (boostId: string) => void;
}

const getBoostIcon = (boostType: BoostType) => {
  switch (boostType) {
    case 'squad_blast':
      return <Share2 className="h-5 w-5 text-blue-400" />;
    case 'chain_reaction':
      return <Zap className="h-5 w-5 text-purple-400" />;
    case 'king':
      return <Trophy className="h-5 w-5 text-yellow-400" />;
    case 'stream_surge':
      return <TrendingUp className="h-5 w-5 text-orange-400" />;
    default:
      return <Sparkles className="h-5 w-5 text-indigo-400" />;
  }
};

const getBoostTitle = (boostType: BoostType) => {
  switch (boostType) {
    case 'squad_blast':
      return 'Squad Blast';
    case 'chain_reaction':
      return 'Chain Reaction';
    case 'king':
      return 'I\'m the King Now';
    case 'stream_surge':
      return 'Stream Surge';
    default:
      return 'Boost';
  }
};

const getBoostDescription = (boostType: BoostType) => {
  switch (boostType) {
    case 'squad_blast':
      return 'Pushes your clip to ALL of your friends\' Squads Page for 24 hours.';
    case 'chain_reaction':
      return 'Each like/comment/share spreads your clip to 5 more users for 6 hours (stackable).';
    case 'king':
      return 'Places your stream in Top 10 for its game category for 2 hours + golden crown badge.';
    case 'stream_surge':
      return 'Pushes your stream to 200+ active viewers for 30 minutes + trending badge.';
    default:
      return 'Enhances your content visibility and engagement.';
  }
};

const getBoostCost = (boostType: BoostType) => {
  switch (boostType) {
    case 'squad_blast':
      return 40;
    case 'chain_reaction':
      return 60;
    case 'king':
      return 80;
    case 'stream_surge':
      return 50;
    default:
      return 50;
  }
};

const BoostTracker: React.FC<BoostDetailsProps> = ({ boost, onExtend }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    // Calculate time remaining
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endTime = new Date(boost.endTime);
      const diff = endTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeLeft(`${minutes}m remaining`);
      }
    };
    
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [boost.endTime]);

  const boostTitle = getBoostTitle(boost.boostType);
  const boostIcon = getBoostIcon(boost.boostType);
  const boostDescription = getBoostDescription(boost.boostType);
  
  // Format metric with + sign if it's from boost
  const formatMetric = (total: number, fromBoost: number) => {
    return <span>{total} <span className="text-green-400 font-medium">+{fromBoost}</span></span>;
  };

  return (
    <Card className="border border-indigo-800/30 bg-indigo-950/30 backdrop-blur-sm text-white overflow-hidden">
      <CardHeader className="pb-2 border-b border-indigo-800/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {boostIcon}
            <CardTitle className="text-lg">{boostTitle}</CardTitle>
          </div>
          <Badge variant="outline" className="bg-indigo-900/30 border-indigo-500/30 text-indigo-200">
            {timeLeft}
          </Badge>
        </div>
        <CardDescription className="text-indigo-300">{boostDescription}</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Boost Progress</span>
            <span>{boost.progress}%</span>
          </div>
          <Progress value={boost.progress} className="h-2 bg-indigo-950" />
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 bg-indigo-900/20 p-2 rounded-md">
              <Users className="h-4 w-4 text-blue-400" />
              <div>
                <div className="text-xs text-indigo-300">Reached Users</div>
                <div className="font-medium">{boost.metrics.reachedUsers}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-indigo-900/20 p-2 rounded-md">
              <ArrowUpRight className="h-4 w-4 text-green-400" />
              <div>
                <div className="text-xs text-indigo-300">Views</div>
                <div className="font-medium">
                  {formatMetric(boost.metrics.views, boost.metrics.viewsFromBoost)}
                </div>
              </div>
            </div>
          </div>

          {/* Specific metrics based on boost type */}
          {boost.boostType === 'chain_reaction' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-purple-900/20 p-2 rounded-md">
                <Zap className="h-4 w-4 text-purple-400" />
                <div>
                  <div className="text-xs text-indigo-300">Chain Multiplier</div>
                  <div className="font-medium">{boost.metrics.chainMultiplier}x</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-purple-900/20 p-2 rounded-md">
                <Share2 className="h-4 w-4 text-purple-400" />
                <div>
                  <div className="text-xs text-indigo-300">Chain Spread</div>
                  <div className="font-medium">{boost.metrics.chainSpread} users</div>
                </div>
              </div>
            </div>
          )}

          {boost.boostType === 'king' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-yellow-900/20 p-2 rounded-md">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <div>
                  <div className="text-xs text-indigo-300">Rank Before</div>
                  <div className="font-medium">#{boost.metrics.rankBefore}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-yellow-900/20 p-2 rounded-md">
                <Crown className="h-4 w-4 text-yellow-400" />
                <div>
                  <div className="text-xs text-indigo-300">Rank During</div>
                  <div className="font-medium text-yellow-300">#{boost.metrics.rankDuring}</div>
                </div>
              </div>
            </div>
          )}

          {boost.boostType === 'stream_surge' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-orange-900/20 p-2 rounded-md">
                <Users className="h-4 w-4 text-orange-400" />
                <div>
                  <div className="text-xs text-indigo-300">Peak Viewers</div>
                  <div className="font-medium">{boost.metrics.viewersPeak}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-orange-900/20 p-2 rounded-md">
                <Clock className="h-4 w-4 text-orange-400" />
                <div>
                  <div className="text-xs text-indigo-300">Minutes Watched</div>
                  <div className="font-medium">{boost.metrics.minutesWatched}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 pb-4 flex justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-indigo-900/30 border-indigo-500/30 hover:bg-indigo-800/40 hover:text-white"
                onClick={() => onExtend && onExtend(boost.id)}
              >
                <Rocket className="h-4 w-4 mr-2" />
                Extend Boost
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Extend this boost for {getBoostCost(boost.boostType)} Clipt Coins</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Badge className="bg-indigo-900/50 text-indigo-100">
          {getBoostCost(boost.boostType)} Clipt Coins
        </Badge>
      </CardFooter>
    </Card>
  );
};

export default BoostTracker;
