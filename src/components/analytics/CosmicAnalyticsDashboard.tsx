import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, Users, Clock, MessageSquare, TrendingUp, 
  Star, Zap, DollarSign, ChevronUp, ChevronDown, ArrowUp, 
  Rocket, Gift, Award, Trophy, BarChart3, PieChart,
  Coins, Sparkles, UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { CosmicCoinBalance } from './CosmicCoinBalance';
import { BoostAnalytics } from './BoostAnalytics';
import { StreamMetricsChart } from './StreamMetricsChart';
import { ViewerEngagementChart } from './ViewerEngagementChart';

interface StreamAnalytics {
  id: string;
  stream_id: string;
  peak_viewers: number;
  average_viewers: number;
  stream_duration: string;
  chat_messages_count: number;
  follower_growth: number;
  subscriber_growth: number;
  clipt_count: number;
  created_at: string;
}

interface RevenueData {
  total: number;
  previous_period: number;
  change_percentage: number;
  breakdown: {
    coins: number;
    subscriptions: number;
    donations: number;
    boosts: number;
  };
}

interface BoostMetrics {
  total_active: number;
  total_used: number;
  active_effects: {
    type: string;
    count: number;
    icon: React.ReactNode;
    color: string;
  }[];
  boost_revenue: number;
  most_popular: string;
}

export const CosmicAnalyticsDashboard = ({ streamId, timeRange }: { streamId: string, timeRange: string }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showCosmicEffects, setShowCosmicEffects] = useState(true);
  
  // Mock data for the revenue section
  const revenueData: RevenueData = {
    total: 3287.45,
    previous_period: 2954.30,
    change_percentage: 11.28,
    breakdown: {
      coins: 1842.25,
      subscriptions: 895.00,
      donations: 379.20,
      boosts: 171.00
    }
  };
  
  // Mock data for boost metrics
  const boostMetrics: BoostMetrics = {
    total_active: 3,
    total_used: 28,
    active_effects: [
      { type: 'Squad Blast', count: 12, icon: <Rocket size={16} />, color: '#FF5500' },
      { type: 'Spotlight', count: 8, icon: <Sparkles size={16} />, color: '#FFD700' },
      { type: 'Victory Lane', count: 5, icon: <Trophy size={16} />, color: '#FF00FF' },
      { type: 'Hype Train', count: 3, icon: <Zap size={16} />, color: '#00CFFD' }
    ],
    boost_revenue: 171.00,
    most_popular: 'Squad Blast'
  };

  // Main analytics data query
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['cosmic-analytics', streamId, timeRange],
    queryFn: async () => {
      // In a real app, this would fetch from your actual API/database
      // For now, we're using mock data that would match our Supabase structure
      const { data, error } = await supabase
        .from('stream_analytics')
        .select('*')
        .eq('stream_id', streamId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Enhance with some random follower/subscriber data if we got a result
      if (data) {
        return {
          ...data,
          follower_growth: Math.floor(Math.random() * 50) + 10,
          subscriber_growth: Math.floor(Math.random() * 15) + 2,
          clipt_count: Math.floor(Math.random() * 25) + 5
        } as StreamAnalytics;
      }
      
      return null;
    },
  });

  // Toggle section expansion
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-[60px] w-[200px]" />
          <Skeleton className="h-[60px] w-[120px]" />
        </div>
        <Skeleton className="h-[200px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load analytics data</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cosmic Header with Interactive Elements */}
      <motion.div 
        className="relative overflow-hidden rounded-lg bg-black p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,30,0.9) 0%, rgba(10,10,40,0.9) 100%)',
          boxShadow: '0 0 30px rgba(0, 80, 255, 0.2)',
          border: '1px solid rgba(50, 50, 150, 0.3)',
        }}
      >
        {/* Animated Particle Background (if enabled) */}
        {showCosmicEffects && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  background: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-white">
              <span className="mr-2">Analytics Hub</span>
              <span className="text-sm font-normal text-blue-300">{timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}</span>
            </h2>
            <p className="text-blue-300 mt-1">
              Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
            </p>
          </div>

          {/* Clipt Coins Balance Widget */}
          <CosmicCoinBalance balance={5280} />
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/30 overflow-hidden relative">
            {showCosmicEffects && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-3xl z-0" />
            )}
            <div className="flex items-center space-x-2 relative z-10">
              <div className="bg-blue-900/30 p-2 rounded-full">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-medium text-blue-300">Peak Viewers</h3>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <p className="text-3xl font-bold text-white">{analytics?.peak_viewers || 0}</p>
              <div className="flex items-center text-green-400 text-sm">
                <ArrowUp className="h-3 w-3 mr-1" />
                <span>18%</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/30 overflow-hidden relative">
            {showCosmicEffects && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-3xl z-0" />
            )}
            <div className="flex items-center space-x-2 relative z-10">
              <div className="bg-purple-900/30 p-2 rounded-full">
                <UserPlus className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-sm font-medium text-purple-300">Follower Growth</h3>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <p className="text-3xl font-bold text-white">+{analytics?.follower_growth || 0}</p>
              <div className="flex items-center text-green-400 text-sm">
                <ArrowUp className="h-3 w-3 mr-1" />
                <span>12%</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/30 overflow-hidden relative">
            {showCosmicEffects && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-bl-3xl z-0" />
            )}
            <div className="flex items-center space-x-2 relative z-10">
              <div className="bg-orange-900/30 p-2 rounded-full">
                <Award className="h-5 w-5 text-orange-400" />
              </div>
              <h3 className="text-sm font-medium text-orange-300">Total Clipts</h3>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <p className="text-3xl font-bold text-white">{analytics?.clipt_count || 0}</p>
              <div className="flex items-center text-green-400 text-sm">
                <ArrowUp className="h-3 w-3 mr-1" />
                <span>8%</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/30 overflow-hidden relative">
            {showCosmicEffects && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-3xl z-0" />
            )}
            <div className="flex items-center space-x-2 relative z-10">
              <div className="bg-green-900/30 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="text-sm font-medium text-green-300">Revenue</h3>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <p className="text-3xl font-bold text-white">${revenueData.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <div className="flex items-center text-green-400 text-sm">
                <ArrowUp className="h-3 w-3 mr-1" />
                <span>{revenueData.change_percentage}%</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Boost Analytics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/30">
          <div 
            className="p-6 cursor-pointer flex justify-between items-center"
            onClick={() => toggleSection('boosts')}
          >
            <div className="flex items-center">
              <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-orange-600 to-red-600">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Clipt Boosts Analytics</h3>
                <p className="text-blue-300">Active boosts and engagement metrics</p>
              </div>
            </div>
            <button>
              {expandedSection === 'boosts' ? (
                <ChevronUp className="h-6 w-6 text-blue-400" />
              ) : (
                <ChevronDown className="h-6 w-6 text-blue-400" />
              )}
            </button>
          </div>
          
          <AnimatePresence>
            {expandedSection === 'boosts' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
                  <BoostAnalytics metrics={boostMetrics} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Revenue Breakdown Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/30">
          <div 
            className="p-6 cursor-pointer flex justify-between items-center"
            onClick={() => toggleSection('revenue')}
          >
            <div className="flex items-center">
              <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-green-600 to-teal-600">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Revenue Breakdown</h3>
                <p className="text-blue-300">Detailed financial analytics</p>
              </div>
            </div>
            <button>
              {expandedSection === 'revenue' ? (
                <ChevronUp className="h-6 w-6 text-blue-400" />
              ) : (
                <ChevronDown className="h-6 w-6 text-blue-400" />
              )}
            </button>
          </div>
          
          <AnimatePresence>
            {expandedSection === 'revenue' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Revenue Sources</h4>
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <div className="space-y-4">
                          {/* Coins Revenue */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="p-2 bg-yellow-900/30 rounded-full mr-3">
                                <Coins className="h-4 w-4 text-yellow-400" />
                              </div>
                              <span className="text-white">Clipt Coins</span>
                            </div>
                            <div className="text-white font-semibold">
                              ${revenueData.breakdown.coins.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          
                          {/* Subscriptions Revenue */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="p-2 bg-purple-900/30 rounded-full mr-3">
                                <Star className="h-4 w-4 text-purple-400" />
                              </div>
                              <span className="text-white">Subscriptions</span>
                            </div>
                            <div className="text-white font-semibold">
                              ${revenueData.breakdown.subscriptions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          
                          {/* Donations Revenue */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-900/30 rounded-full mr-3">
                                <Gift className="h-4 w-4 text-blue-400" />
                              </div>
                              <span className="text-white">Donations</span>
                            </div>
                            <div className="text-white font-semibold">
                              ${revenueData.breakdown.donations.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          
                          {/* Boosts Revenue */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="p-2 bg-orange-900/30 rounded-full mr-3">
                                <Rocket className="h-4 w-4 text-orange-400" />
                              </div>
                              <span className="text-white">Boosts</span>
                            </div>
                            <div className="text-white font-semibold">
                              ${revenueData.breakdown.boosts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          
                          <div className="pt-2 mt-2 border-t border-gray-700 flex justify-between items-center">
                            <span className="text-white font-semibold">Total Revenue</span>
                            <span className="text-white font-bold">
                              ${revenueData.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Revenue Growth</h4>
                      <div className="bg-gray-800/50 p-4 rounded-lg h-[calc(100%-32px)] flex flex-col justify-center">
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-white mb-2">
                              +{revenueData.change_percentage.toFixed(1)}%
                            </div>
                            <div className="text-blue-300">
                              vs Previous {timeRange === '24h' ? '24 Hours' : timeRange === '7d' ? '7 Days' : '30 Days'}
                            </div>
                            <div className="mt-4 flex items-center justify-center text-sm text-gray-400">
                              <span className="mr-2">Previous: </span>
                              <span className="text-white font-medium">
                                ${revenueData.previous_period.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-center text-sm text-gray-400">
                              <span className="mr-2">Current: </span>
                              <span className="text-white font-medium">
                                ${revenueData.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Viewer Engagement Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Viewer Trends</h3>
              </div>
              <div className="text-sm text-blue-300">{timeRange === '24h' ? 'Hourly' : timeRange === '7d' ? 'Daily' : 'Weekly'}</div>
            </div>
            <div className="h-[300px]">
              <ViewerEngagementChart streamId={streamId} />
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <PieChart className="h-5 w-5 text-purple-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Engagement Metrics</h3>
              </div>
              <div className="text-sm text-purple-300">{timeRange}</div>
            </div>
            <div className="h-[300px]">
              <StreamMetricsChart streamId={streamId} />
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
