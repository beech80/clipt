import React from 'react';
import { 
  Coin, 
  Rocket, 
  Users, 
  Crown, 
  Zap, 
  Clock, 
  Shield, 
  Star, 
  Award, 
  ThumbsUp,
  MessageSquare,
  Eye,
  Video
} from 'lucide-react';
import { motion } from 'framer-motion';
import '@/styles/cosmic-buttons.css';
import '@/styles/token-system.css';

const CliptTokenSystem = () => {
  return (
    <div className="token-system-container bg-gradient-to-b from-indigo-950 to-black min-h-screen p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="token-header text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            <Coin className="inline-block mr-2 h-8 w-8 mb-1" />
            Clipt Coins Token System
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Power up your content, boost your reach, and unlock exclusive features with Clipt Coins
          </p>
        </motion.div>
        
        {/* What Are Tokens */}
        <motion.div 
          className="cosmic-card mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="cosmic-card-content">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Coin className="mr-2 text-yellow-400" /> 
              What Are Tokens?
            </h2>
            <p className="text-lg text-purple-200 mb-4">
              Clipt Coins are the in-app currency used to boost your streams or content visibility.
            </p>
          </div>
        </motion.div>
        
        {/* How You Earn Them */}
        <motion.div 
          className="cosmic-card mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="cosmic-card-content">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Rocket className="mr-2 text-purple-400" /> 
              How You Earn Them
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="token-tier-card p-4 rounded-lg border border-purple-500/30 bg-indigo-900/30">
                <h3 className="font-medium mb-2 text-center">Free Users</h3>
                <p className="text-2xl font-bold text-center text-yellow-400">Up to 10 tokens/day</p>
              </div>
              <div className="token-tier-card p-4 rounded-lg border border-pink-500/30 bg-indigo-900/30">
                <h3 className="font-medium mb-2 text-center">Pro Users</h3>
                <p className="text-2xl font-bold text-center text-yellow-400">Up to 20 tokens/day</p>
              </div>
              <div className="token-tier-card p-4 rounded-lg border border-blue-500/30 bg-indigo-900/30">
                <h3 className="font-medium mb-2 text-center">Maxed Users</h3>
                <p className="text-2xl font-bold text-center text-yellow-400">Up to 30 tokens/day</p>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Activity Breakdown */}
        <motion.div 
          className="cosmic-card mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="cosmic-card-content">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Zap className="mr-2 text-yellow-400" /> 
              Activity Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="activity-card">
                <Video className="activity-icon" />
                <p className="activity-text">Post a clip</p>
                <p className="activity-tokens">+2 tokens</p>
              </div>
              <div className="activity-card">
                <Eye className="activity-icon" />
                <p className="activity-text">Go live</p>
                <p className="activity-tokens">+3 tokens</p>
              </div>
              <div className="activity-card">
                <ThumbsUp className="activity-icon" />
                <p className="activity-text">10 likes on a post</p>
                <p className="activity-tokens">+2 tokens</p>
              </div>
              <div className="activity-card">
                <MessageSquare className="activity-icon" />
                <p className="activity-text">Comment 5x/day</p>
                <p className="activity-tokens">+1 token</p>
              </div>
              <div className="activity-card">
                <Eye className="activity-icon" />
                <p className="activity-text">Watch 10 clips</p>
                <p className="activity-tokens">+2 tokens</p>
              </div>
              <div className="activity-card">
                <Award className="activity-icon" />
                <p className="activity-text">Subscriber Streak</p>
                <p className="activity-tokens">+Token bonuses monthly</p>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Wallet Caps */}
        <motion.div 
          className="cosmic-card mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="cosmic-card-content">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Shield className="mr-2 text-blue-400" /> 
              Wallet Caps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="token-cap-card">
                <h3>Free</h3>
                <div className="token-amount">
                  <Coin className="coin-icon" />
                  <span>200 tokens</span>
                </div>
              </div>
              <div className="token-cap-card">
                <h3>Pro</h3>
                <div className="token-amount">
                  <Coin className="coin-icon" />
                  <span>400 tokens</span>
                </div>
              </div>
              <div className="token-cap-card">
                <h3>Maxed</h3>
                <div className="token-amount">
                  <Coin className="coin-icon" />
                  <span>800 tokens</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Subscription Tiers */}
        <motion.div 
          className="cosmic-card mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="cosmic-card-content">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Star className="mr-2 text-pink-400" /> 
              Subscription Tiers
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-purple-800">
                <thead>
                  <tr>
                    <th className="tier-table-header">Tier Name</th>
                    <th className="tier-table-header">Price/Month</th>
                    <th className="tier-table-header">Daily Token Cap</th>
                    <th className="tier-table-header">Wallet Cap</th>
                    <th className="tier-table-header">Perks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-800/50">
                  <tr className="hover:bg-indigo-900/20 transition-colors">
                    <td className="tier-table-cell font-medium">Free</td>
                    <td className="tier-table-cell">$0</td>
                    <td className="tier-table-cell">10/day</td>
                    <td className="tier-table-cell">200</td>
                    <td className="tier-table-cell">
                      <ul className="list-disc pl-4 text-sm">
                        <li>Watch, post, comment to earn tokens</li>
                        <li>Access all public streams and clips</li>
                        <li>Sub to streamers (optional)</li>
                        <li>Can buy 2–3 boosts/month (if active)</li>
                        <li>Ads shown</li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="hover:bg-indigo-900/20 transition-colors">
                    <td className="tier-table-cell font-medium">Pro (Better)</td>
                    <td className="tier-table-cell">$4.99</td>
                    <td className="tier-table-cell">20/day</td>
                    <td className="tier-table-cell">400</td>
                    <td className="tier-table-cell">
                      <ul className="list-disc pl-4 text-sm">
                        <li>Everything in Free</li>
                        <li>+100 bonus tokens/month</li>
                        <li>10% off all boosts</li>
                        <li>Access to exclusive Clipt squad chat</li>
                        <li>Fewer ads</li>
                        <li>1 free Squad Blast per week</li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="hover:bg-indigo-900/20 transition-colors">
                    <td className="tier-table-cell font-medium">Maxed (Best)</td>
                    <td className="tier-table-cell">$14.99</td>
                    <td className="tier-table-cell">30/day</td>
                    <td className="tier-table-cell">800</td>
                    <td className="tier-table-cell">
                      <ul className="list-disc pl-4 text-sm">
                        <li>Everything in Pro</li>
                        <li>+300 bonus tokens/month</li>
                        <li>25% off boosts</li>
                        <li>Priority ranking & premium visibility</li>
                        <li>1 free boost of your choice each week</li>
                        <li>Ad-free experience</li>
                        <li>Streamer chat access, early features, squad expansions</li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
        
        {/* Boost Types */}
        <motion.div 
          className="cosmic-card mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="cosmic-card-content">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Rocket className="mr-2 text-orange-400" /> 
              Boost Types
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Squad Blast */}
              <div className="boost-card border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-indigo-900/20">
                <div className="boost-header">
                  <h3>Squad Blast</h3>
                  <div className="boost-cost">
                    <Coin className="boost-coin" />
                    <span>40 Tokens</span>
                  </div>
                </div>
                <div className="boost-content">
                  <Users className="boost-icon text-purple-400" />
                  <p>Push your clip to your top 25 friends' Squads Page for 24 hours</p>
                </div>
              </div>
              
              {/* Chain Reaction */}
              <div className="boost-card border-pink-500/30 bg-gradient-to-br from-pink-900/40 to-purple-900/20">
                <div className="boost-header">
                  <h3>Chain Reaction</h3>
                  <div className="boost-cost">
                    <Coin className="boost-coin" />
                    <span>60 Tokens</span>
                  </div>
                </div>
                <div className="boost-content">
                  <Zap className="boost-icon text-pink-400" />
                  <p>Each like/comment/share spreads your clip to 5 more users for 6 hours (stackable)</p>
                </div>
              </div>
              
              {/* I'm the King Now */}
              <div className="boost-card border-amber-500/30 bg-gradient-to-br from-amber-900/40 to-orange-900/20">
                <div className="boost-header">
                  <h3>I'm the King Now</h3>
                  <div className="boost-cost">
                    <Coin className="boost-coin" />
                    <span>80 Tokens</span>
                  </div>
                </div>
                <div className="boost-content">
                  <Crown className="boost-icon text-yellow-400" />
                  <p>Place your stream in Top 10 for the selected game for 2 hours + golden crown badge</p>
                </div>
              </div>
              
              {/* Stream Surge */}
              <div className="boost-card border-blue-500/30 bg-gradient-to-br from-blue-900/40 to-indigo-900/20">
                <div className="boost-header">
                  <h3>Stream Surge</h3>
                  <div className="boost-cost">
                    <Coin className="boost-coin" />
                    <span>50 Tokens</span>
                  </div>
                </div>
                <div className="boost-content">
                  <Rocket className="boost-icon text-blue-400" />
                  <p>Push your stream to 200+ active viewers in your genre for 30 mins + trending badge</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CliptTokenSystem;
