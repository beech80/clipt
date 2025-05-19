import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, TrendingUp, BarChart3, Rocket } from 'lucide-react';

interface BoostEffect {
  type: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

interface BoostMetricsProps {
  metrics: {
    total_active: number;
    total_used: number;
    active_effects: BoostEffect[];
    boost_revenue: number;
    most_popular: string;
  };
}

export const BoostAnalytics = ({ metrics }: BoostMetricsProps) => {
  // Calculate percentages for the boost effect bars
  const totalEffects = metrics.active_effects.reduce((sum, effect) => sum + effect.count, 0);
  
  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 rounded-lg p-4 relative overflow-hidden"
        >
          {/* Cosmic Background Effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 100, 50, 0.8) 0%, rgba(0, 0, 0, 0) 70%)',
              }}
            />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-2">
              <Rocket className="h-5 w-5 text-orange-400 mr-2" />
              <h3 className="text-sm font-medium text-orange-300">Active Boosts</h3>
            </div>
            <p className="text-3xl font-bold text-white">{metrics.total_active}</p>
            <p className="text-sm text-orange-300 mt-1">Currently running</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 rounded-lg p-4 relative overflow-hidden"
        >
          {/* Cosmic Background Effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(100, 100, 255, 0.8) 0%, rgba(0, 0, 0, 0) 70%)',
              }}
            />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-2">
              <BarChart3 className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-sm font-medium text-blue-300">Total Boosts Used</h3>
            </div>
            <p className="text-3xl font-bold text-white">{metrics.total_used}</p>
            <p className="text-sm text-blue-300 mt-1">Lifetime usage</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 rounded-lg p-4 relative overflow-hidden"
        >
          {/* Cosmic Background Effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(100, 255, 100, 0.8) 0%, rgba(0, 0, 0, 0) 70%)',
              }}
            />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-400 mr-2" />
              <h3 className="text-sm font-medium text-green-300">Revenue Generated</h3>
            </div>
            <p className="text-3xl font-bold text-white">${metrics.boost_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            <p className="text-sm text-green-300 mt-1">From boosts</p>
          </div>
        </motion.div>
      </div>
      
      {/* Boost Effects Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Effect Distribution */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Boost Effect Distribution</h3>
          <div className="space-y-5 bg-gray-800/50 rounded-lg p-4">
            {metrics.active_effects.map((effect, index) => (
              <div key={effect.type} className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="p-1.5 rounded-full mr-2" style={{ backgroundColor: `${effect.color}30` }}>
                      {effect.icon}
                    </div>
                    <span className="text-white text-sm">{effect.type}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{effect.count} uses</span>
                </div>
                
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ backgroundColor: effect.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(effect.count / totalEffects) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Right Side: Performance Metrics */}
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Boost Performance</h3>
          
          <div className="grid gap-4">
            {/* Top Performing Boost */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
                <h4 className="text-white text-sm font-medium">Top Performing Boost</h4>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full" style={{ backgroundColor: metrics.active_effects[0]?.color + '30' || '#FF550030' }}>
                  {metrics.active_effects[0]?.icon || <Rocket size={24} />}
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{metrics.most_popular}</p>
                  <p className="text-sm text-blue-300">+245% viewer engagement</p>
                </div>
              </div>
            </div>
            
            {/* Engagement Impact */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 text-purple-400 mr-2" />
                <h4 className="text-white text-sm font-medium">Viewer Impact</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Viewer Retention</span>
                  <span className="text-sm font-medium text-green-400">+35%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Clip Sharing</span>
                  <span className="text-sm font-medium text-green-400">+68%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">New Followers</span>
                  <span className="text-sm font-medium text-green-400">+22%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-center pt-4">
        <motion.button
          className="px-6 py-2 rounded-lg mr-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Create New Boost
        </motion.button>
        
        <motion.button
          className="px-6 py-2 rounded-lg border border-blue-500 text-blue-400 font-medium"
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
          whileTap={{ scale: 0.95 }}
        >
          View Boost History
        </motion.button>
      </div>
    </div>
  );
};
