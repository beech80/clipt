import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Boost, BoostAnalytics, getUserActiveBoosts, getBoostAnalytics } from '@/services/boostService';
import BoostTracker from './BoostTracker';
import { toast } from '@/components/ui/use-toast';

interface BoostDashboardProps {
  userId: string;
  userTokens: number;
  onRefreshTokens?: () => void;
}

const BoostDashboard: React.FC<BoostDashboardProps> = ({ 
  userId, 
  userTokens,
  onRefreshTokens 
}) => {
  const [activeBoosts, setActiveBoosts] = useState<Boost[]>([]);
  const [boostAnalytics, setBoostAnalytics] = useState<Record<string, BoostAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Fetch user's active boosts
  const fetchUserBoosts = async () => {
    setLoading(true);
    try {
      const boosts = await getUserActiveBoosts(userId);
      setActiveBoosts(boosts);
      
      // Get analytics for each active boost
      const analyticsMap: Record<string, BoostAnalytics> = {};
      
      await Promise.all(boosts.map(async (boost) => {
        const analytics = await getBoostAnalytics(boost.id);
        if (analytics) {
          analyticsMap[boost.id] = analytics;
        }
      }));
      
      setBoostAnalytics(analyticsMap);
    } catch (error) {
      console.error('Error fetching boosts:', error);
      toast({
        title: 'Failed to load boosts',
        description: 'We couldn\'t load your active boosts. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load boosts when component mounts
  useEffect(() => {
    fetchUserBoosts();
    
    // Set up interval to refresh analytics every minute
    const interval = setInterval(() => {
      if (activeTab === 'active') {
        fetchUserBoosts();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [userId, activeTab]);

  // Handle extending a boost
  const handleExtendBoost = async (boostId: string) => {
    try {
      // Here you would call your API to extend the boost
      // For example:
      // await boostService.extendBoost(boostId, userId);
      
      toast({
        title: 'Boost extended',
        description: 'Your boost duration has been extended successfully!',
      });
      
      // Refresh boosts and user tokens
      fetchUserBoosts();
      if (onRefreshTokens) {
        onRefreshTokens();
      }
    } catch (error) {
      console.error('Error extending boost:', error);
      toast({
        title: 'Failed to extend boost',
        description: 'There was an error extending your boost. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-indigo-800/30 bg-indigo-950/50 backdrop-blur-md text-white">
      <CardHeader className="pb-4 border-b border-indigo-800/30">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Boost Performance
          </CardTitle>
          <Badge 
            variant="outline" 
            className="bg-indigo-900/30 border-indigo-500/30 text-amber-300 flex items-center"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {userTokens} Clipt Coins
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 pb-2">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'active' | 'history')}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Active Boosts
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Boost History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full bg-indigo-900/20" />
                <Skeleton className="h-48 w-full bg-indigo-900/20" />
              </div>
            ) : activeBoosts.length > 0 ? (
              <div className="space-y-6">
                {activeBoosts.map((boost) => {
                  const analytics = boostAnalytics[boost.id];
                  
                  if (!analytics) {
                    return (
                      <Skeleton 
                        key={boost.id} 
                        className="h-48 w-full bg-indigo-900/20"
                      />
                    );
                  }
                  
                  return (
                    <BoostTracker 
                      key={boost.id}
                      boost={analytics}
                      onExtend={handleExtendBoost}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-indigo-700/30 rounded-lg bg-indigo-900/10">
                <Sparkles className="h-12 w-12 text-indigo-400 mx-auto mb-3 opacity-60" />
                <h3 className="text-xl font-medium mb-2">No active boosts</h3>
                <p className="text-indigo-300 mb-6 max-w-md mx-auto">
                  Boost your content to increase visibility and engagement.
                  Apply a boost to see detailed performance analytics here.
                </p>
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  onClick={() => {
                    // Navigate to content or open boost selector
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Boost Your Content
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <div className="text-center py-12 border border-dashed border-indigo-700/30 rounded-lg bg-indigo-900/10">
              <CalendarDays className="h-12 w-12 text-indigo-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-xl font-medium mb-2">Boost History</h3>
              <p className="text-indigo-300 max-w-md mx-auto">
                Track your past boosts and their performance over time.
                See which boost types work best for your content.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BoostDashboard;
