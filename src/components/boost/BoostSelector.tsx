import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Share2, Zap, Trophy, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BoostType } from './BoostTracker';
import { toast } from '@/components/ui/use-toast';

interface BoostSelectorProps {
  postId: string;
  userId: string;
  userTokens: number;
  onBoostApplied: (boostType: BoostType, postId: string) => void;
}

interface BoostOption {
  id: BoostType;
  name: string;
  icon: React.ReactNode;
  description: string;
  effect: string;
  duration: string;
  cost: number;
  costText: string;
  color: string;
}

const boostOptions: BoostOption[] = [
  {
    id: 'squad_blast',
    name: 'Squad Blast',
    icon: <Share2 className="h-6 w-6" />,
    description: 'Push your clip to ALL of your friends\' Squads Page',
    effect: 'Increase views by ~40-60% from your friends network',
    duration: '24 hours',
    cost: 40,
    costText: '40 Clipt Coins',
    color: 'bg-blue-500/20 border-blue-400/40 text-blue-300',
  },
  {
    id: 'chain_reaction',
    name: 'Chain Reaction',
    icon: <Zap className="h-6 w-6" />,
    description: 'Each like/comment/share spreads clip to 5 more users',
    effect: 'Viral potential increases with every engagement (stackable)',
    duration: '6 hours',
    cost: 60,
    costText: '60 Clipt Coins',
    color: 'bg-purple-500/20 border-purple-400/40 text-purple-300',
  },
  {
    id: 'king',
    name: 'I\'m the King Now',
    icon: <Trophy className="h-6 w-6" />,
    description: 'Places stream in Top 10 for the selected game category',
    effect: 'Golden crown badge + featured position on live page',
    duration: '2 hours',
    cost: 80,
    costText: '80 Clipt Coins',
    color: 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300',
  },
  {
    id: 'stream_surge',
    name: 'Stream Surge',
    icon: <TrendingUp className="h-6 w-6" />,
    description: 'Pushes stream to 200+ active viewers in its genre',
    effect: 'Trending badge + personalized recommendation',
    duration: '30 minutes',
    cost: 50,
    costText: '50 Clipt Coins',
    color: 'bg-orange-500/20 border-orange-400/40 text-orange-300',
  }
];

const BoostSelector: React.FC<BoostSelectorProps> = ({ postId, userId, userTokens, onBoostApplied }) => {
  const [selectedBoost, setSelectedBoost] = useState<BoostType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const applyBoost = async () => {
    if (!selectedBoost) return;
    
    const boostOption = boostOptions.find(b => b.id === selectedBoost);
    if (!boostOption) return;
    
    if (userTokens < boostOption.cost) {
      toast({
        title: "Not enough tokens",
        description: `You need ${boostOption.cost} Clipt Coins to apply this boost. Go to your profile to purchase more.`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Here you would make an API call to apply the boost
      // For example:
      // await supabase.from('boosts').insert({
      //   user_id: userId,
      //   post_id: postId,
      //   boost_type: selectedBoost,
      //   created_at: new Date().toISOString(),
      //   status: 'active'
      // });

      // Call the onBoostApplied callback to update the parent component
      onBoostApplied(selectedBoost, postId);
      
      toast({
        title: "Boost applied!",
        description: `Your ${boostOption.name} boost is now active. Check your analytics soon to see the results!`,
        variant: "default"
      });
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error applying boost:', error);
      toast({
        title: "Failed to apply boost",
        description: "There was an error applying your boost. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-indigo-900/30 border-indigo-500/30 hover:bg-indigo-800/40 text-white hover:text-white"
        >
          <Sparkles className="h-4 w-4 mr-2 text-amber-400" />
          Boost Post
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-slate-900 border-indigo-700/30 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Boost Your Content
          </DialogTitle>
          <DialogDescription className="text-indigo-200">
            Amplify your content's reach with Clipt Coins. Choose the best boost for your content.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="flex justify-between mb-4 items-center">
            <span className="text-sm text-indigo-200">Your balance:</span>
            <Badge variant="outline" className="bg-indigo-900/30 border-indigo-500/30 text-amber-300 flex items-center">
              <Sparkles className="h-3 w-3 mr-1" />
              {userTokens} Clipt Coins
            </Badge>
          </div>
          
          <Tabs defaultValue="squad_blast" className="w-full" onValueChange={(value) => setSelectedBoost(value as BoostType)}>
            <TabsList className="grid grid-cols-4 mb-4">
              {boostOptions.map(boost => (
                <TabsTrigger 
                  key={boost.id} 
                  value={boost.id}
                  className="data-[state=active]:text-white"
                >
                  {boost.icon}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {boostOptions.map(boost => (
              <TabsContent 
                key={boost.id} 
                value={boost.id} 
                className={`p-4 rounded-md border ${boost.color}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {boost.icon}
                    {boost.name}
                  </h3>
                  <Badge className="bg-indigo-900/50">{boost.costText}</Badge>
                </div>
                
                <p className="text-sm mb-4">{boost.description}</p>
                
                <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                  <div>
                    <div className="text-indigo-300 mb-1">Effect</div>
                    <div>{boost.effect}</div>
                  </div>
                  <div>
                    <div className="text-indigo-300 mb-1">Duration</div>
                    <div>{boost.duration}</div>
                  </div>
                </div>
                
                <div className="mt-6 text-xs text-indigo-300">
                  <strong>Note:</strong> You'll receive detailed analytics about this boost's performance so you can see exactly how it helped your content perform.
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
        
        <DialogFooter className="flex gap-2 mt-4">
          <Button 
            variant="outline"
            onClick={() => setDialogOpen(false)}
            className="bg-indigo-950/50 border-indigo-700/30 hover:bg-indigo-900/30 text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={applyBoost}
            disabled={!selectedBoost || userTokens < (boostOptions.find(b => b.id === selectedBoost)?.cost || 0)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            Apply Boost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoostSelector;
