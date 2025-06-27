import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import levelingService from './levelingService';
import { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';

// Interfaces
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: "general" | "daily" | "trophy" | "streaming" | "social" | "special" | "gaming" | string;
  image?: string;
  requiredAmount?: number;
  target_value: number;
  points?: number;
  xp_reward: number; // XP awarded when achievement is completed
  token_reward: number; // Tokens awarded when achievement is completed
  progress_type?: "count" | "value" | "boolean" | string;
  reward_type?: "points" | "badge" | "title" | string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  icon?: string;
  icon_url?: string;
  iconUrl?: string;
  color?: string;
  visible?: boolean;
  game_id?: string;
  gameId?: string;
  rarity?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  targetValue?: number; // Alternative to target_value
  xpReward?: number; // Alternative to xp_reward
  tokenReward?: number; // Alternative to token_reward
}

export interface AchievementProgress {
  id: string;
  userId: string;
  achievementId: string;
  currentValue: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  achievement?: Achievement;
}

export interface AchievementProgressWithAchievement extends AchievementProgress {
  achievement: Achievement;
}

// Default achievement data to create for new users
const defaultAchievements: Achievement[] = [
  {
    id: 'login-streak',
    name: 'Login Streak',
    description: 'Login for consecutive days',
    category: 'daily',
    target_value: 7,
    xp_reward: 100,
    token_reward: 10,
    points: 100,
    difficulty: 'easy',
    icon: '🔥',
    color: '#FF5733',
    image: '/assets/achievements/login-streak.png',
  },
  {
    id: 'first-clip',
    name: 'First Clip',
    description: 'Create your first clip',
    category: 'general',
    target_value: 1,
    xp_reward: 50,
    token_reward: 5,
    points: 50,
    difficulty: 'easy',
    icon: '🎬',
    color: '#33FF57',
    image: '/assets/achievements/first-clip.png',
  },
  {
    id: 'clip-collector',
    name: 'Clip Collector',
    description: 'Create 10 clips',
    category: 'general',
    target_value: 10,
    xp_reward: 200,
    token_reward: 20,
    points: 200,
    difficulty: 'medium',
    icon: '📚',
    color: '#3357FF',
    image: '/assets/achievements/clip-collector.png',
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Follow 5 other users',
    category: 'social',
    target_value: 5,
    xp_reward: 100,
    token_reward: 10,
    points: 100,
    difficulty: 'easy',
    icon: '🦋',
    color: '#AA33FF',
    image: '/assets/achievements/social-butterfly.png',
  },
  {
    id: 'first-stream',
    name: 'First Stream',
    description: 'Start your first livestream',
    category: 'streaming',
    target_value: 1,
    xp_reward: 100,
    token_reward: 10,
    points: 100,
    difficulty: 'easy',
    icon: '📺',
    color: '#FF33AA',
    image: '/assets/achievements/first-stream.png',
  },
  {
    id: 'welcome',
    name: 'Welcome to Clipt',
    description: 'Sign up and create your account',
    category: 'general',
    target_value: 1,
    xp_reward: 50,
    token_reward: 5,
    points: 50,
    difficulty: 'easy',
    icon: '👋',
    color: '#33C6FF',
    image: '/assets/achievements/welcome.png',
  }
];

// Game-specific achievement mappings
const gameAchievements: Record<string, Achievement[]> = {
  'fortnite': [
    {
      id: 'fortnite-victory',
      name: 'Victory Royale',
      description: 'Win a match in Fortnite',
      category: 'gaming',
      game_id: '1',
      target_value: 1,
      xp_reward: 500,
      token_reward: 50,
      points: 500,
      difficulty: 'hard',
      icon: '👑',
      color: '#FFD700',
      image: '/assets/achievements/fortnite-victory.png',
    },
    {
      id: 'fortnite-kills',
      name: 'Elimination Machine',
      description: 'Get 10 eliminations in a single match',
      category: 'gaming',
      game_id: '1',
      target_value: 10,
      xp_reward: 300,
      token_reward: 30,
      points: 300,
      difficulty: 'medium',
      icon: '☠️',
      color: '#FF0000',
      image: '/assets/achievements/fortnite-kills.png',
    }
  ],
  'minecraft': [
    {
      id: 'minecraft-diamond',
      name: 'Diamond Hunter',
      description: 'Mine your first diamond',
      category: 'gaming',
      game_id: '2',
      target_value: 1,
      xp_reward: 200,
      token_reward: 20,
      points: 200,
      difficulty: 'medium',
      icon: '💎',
      color: '#00FFFF',
      image: '/assets/achievements/minecraft-diamond.png',
    }
  ],
  'apex': [
    {
      id: 'apex-champion',
      name: 'Apex Champion',
      description: 'Win a match in Apex Legends',
      category: 'gaming',
      game_id: '3',
      target_value: 1,
      xp_reward: 500,
      token_reward: 50,
      points: 500,
      difficulty: 'hard',
      icon: '🏆',
      color: '#FF4500',
      image: '/assets/achievements/apex-champion.png',
    }
  ]
};

// Utility to map game IDs to slugs
const getGameSlugFromId = (gameId: string): string => {
  const gameMap: Record<string, string> = {
    '1': 'fortnite',
    '2': 'minecraft',
    '3': 'apex'
  };
  return gameMap[gameId] || 'unknown';
};

/**
 * Helper function to transform achievement progress data from DB to TypeScript interface
 * Handles snake_case to camelCase conversion and adds default values if needed
 */
const transformAchievementProgressFromDb = (data: any): AchievementProgressWithAchievement => {
  // Ensure achievements data exists and use its properties
  const achievement: Achievement = data.achievements || {};

  return {
    id: data.id || '',
    userId: data.user_id || '',
    achievementId: data.achievement_id || '',
    currentValue: data.current_value || 0,
    completed: data.completed || false,
    createdAt: data.created_at || new Date().toISOString(),
    updatedAt: data.updated_at || new Date().toISOString(),
    achievement: {
      id: achievement.id || '',
      name: achievement.name || '',
      description: achievement.description || '',
      category: achievement.category || 'general',
      target_value: achievement.target_value || 0,
      xp_reward: achievement.xp_reward || 0,
      token_reward: achievement.token_reward || 0,
      points: achievement.points || 0,
      difficulty: achievement.difficulty || 'easy',
      icon: achievement.icon || '',
      color: achievement.color || '',
      image: achievement.image || '',
      icon_url: achievement.icon_url || '',
      gameId: achievement.game_id || '',
      visible: achievement.visible !== false
    }
  };
};

/**
 * Handles achievement completion, awarding XP and tokens
 * @param userId The user ID
 * @param achievementId The achievement ID that was completed
 * @return Promise<void>
 */
const handleAchievementCompletion = async (userId: string, achievementId: string): Promise<void> => {
  try {
    // Get achievement to determine rewards
    const { data: achievement, error: achievementError } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', achievementId)
      .single();

    if (achievementError || !achievement) {
      console.error('Error fetching achievement:', achievementError);
      return;
    }

    // Check if user has already been awarded XP/tokens for this achievement
    // to prevent duplicate rewards
    const { data: progress, error: progressError } = await supabase
      .from('achievement_progress')
      .select('xp_awarded, tokens_awarded')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (progressError) {
      console.error('Error checking achievement progress:', progressError);
      return;
    }

    // Only award XP and tokens if they haven't been awarded before
    if (progress && (!progress.xp_awarded || !progress.tokens_awarded)) {
      // Award XP
      if (!progress.xp_awarded && achievement.xp_reward) {
        await levelingService.addXp(userId, achievement.xp_reward);
        
        // Update the achievement progress to mark XP as awarded
        await supabase
          .from('achievement_progress')
          .update({ xp_awarded: true })
          .eq('user_id', userId)
          .eq('achievement_id', achievementId);

        // Show toast for XP reward
        toast.success(`Achievement: ${achievement.name}`, {
          description: `You earned ${achievement.xp_reward} XP!`,
          icon: '⭐',
          duration: 3000
        });
      }

      // Award tokens
      if (!progress.tokens_awarded && achievement.token_reward) {
        await levelingService.addTokens(userId, achievement.token_reward);
        
        // Update the achievement progress to mark tokens as awarded
        await supabase
          .from('achievement_progress')
          .update({ tokens_awarded: true })
          .eq('user_id', userId)
          .eq('achievement_id', achievementId);

        // Show toast for token reward
        toast.success(`Achievement: ${achievement.name}`, {
          description: `You earned ${achievement.token_reward} tokens!`,
          icon: '🪙',
          duration: 3000
        });
      }
    }
  } catch (error) {
    console.error('Error handling achievement completion:', error);
  }
};

// Interfaces
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: "general" | "daily" | "trophy" | "streaming" | "social" | "special" | "gaming" | string;
  image?: string;
  requiredAmount?: number;
  target_value: number;
  points?: number;
  xp_reward: number; // XP awarded when achievement is completed
  token_reward: number; // Tokens awarded when achievement is completed
  progress_type?: "count" | "value" | "boolean" | string;
  reward_type?: "points" | "badge" | "title" | string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  icon?: string;
  icon_url?: string;
  iconUrl?: string;
  color?: string;
  visible?: boolean;
  game_id?: string;
  gameId?: string;
  rarity?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  targetValue?: number; // Alternative to target_value
  xpReward?: number; // Alternative to xp_reward
  tokenReward?: number; // Alternative to token_reward
}

export interface AchievementProgress {
  id: string;
  userId: string;
  achievementId: string;
  currentValue: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default achievement data to create for new users
const defaultAchievements = [
  {
    id: 'login-streak',
    name: 'Login Streak',
    description: 'Login for consecutive days',
    category: 'daily',
    target_value: 7,
    xp_reward: 100,
    token_reward: 10,
    points: 100,
    difficulty: 'easy',
    icon: '🔥',
    color: '#FF5733',
    image: '/assets/achievements/login-streak.png',
  },
  {
    id: 'first-clip',
    name: 'First Clip',
    description: 'Create your first clip',
    category: 'general',
    target_value: 1,
    xp_reward: 50,
    token_reward: 5,
    points: 50,
    difficulty: 'easy',
    icon: '🎬',
    color: '#33FF57',
    image: '/assets/achievements/first-clip.png',
  },
  {
    id: 'clip-collector',
    name: 'Clip Collector',
    description: 'Create 10 clips',
    category: 'general',
    target_value: 10,
    xp_reward: 200,
    token_reward: 20,
    points: 200,
    difficulty: 'medium',
    icon: '📚',
    color: '#3357FF',
    image: '/assets/achievements/clip-collector.png',
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Follow 5 other users',
    category: 'social',
    target_value: 5,
    xp_reward: 100,
    token_reward: 10,
    points: 100,
    difficulty: 'easy',
    icon: '🦋',
    color: '#AA33FF',
    image: '/assets/achievements/social-butterfly.png',
  },
  {
    id: 'first-stream',
    name: 'First Stream',
    description: 'Start your first livestream',
    category: 'streaming',
    target_value: 1,
    xp_reward: 100,
    token_reward: 10,
    points: 100,
    difficulty: 'easy',
    icon: '📺',
    color: '#FF33AA',
    image: '/assets/achievements/first-stream.png',
  }
];

// Game-specific achievement mappings
const gameAchievements: Record<string, Achievement[]> = {
  'fortnite': [
    {
      id: 'fortnite-victory',
      name: 'Victory Royale',
      description: 'Win a match in Fortnite',
      category: 'gaming',
      game_id: '1',
      target_value: 1,
      xp_reward: 500,
      token_reward: 50,
      points: 500,
      difficulty: 'hard',
      icon: '👑',
      color: '#FFD700',
      image: '/assets/achievements/fortnite-victory.png',
    },
    {
      id: 'fortnite-kills',
      name: 'Elimination Machine',
      description: 'Get 10 eliminations in a single match',
      category: 'gaming',
      game_id: '1',
      target_value: 10,
      xp_reward: 300,
      token_reward: 30,
      points: 300,
      difficulty: 'medium',
      icon: '☠️',
      color: '#FF0000',
      image: '/assets/achievements/fortnite-kills.png',
    }
  ],
  'minecraft': [
    {
      id: 'minecraft-diamond',
      name: 'Diamond Hunter',
      description: 'Mine your first diamond',
      category: 'gaming',
      game_id: '2',
      target_value: 1,
      xp_reward: 200,
      token_reward: 20,
      points: 200,
      difficulty: 'medium',
      icon: '💎',
      color: '#00FFFF',
      image: '/assets/achievements/minecraft-diamond.png',
    }
  ],
  'apex': [
    {
      id: 'apex-champion',
      name: 'Apex Champion',
      description: 'Win a match in Apex Legends',
      category: 'gaming',
      game_id: '3',
      target_value: 1,
      xp_reward: 500,
      token_reward: 50,
      points: 500,
      difficulty: 'hard',
      icon: '🏆',
      color: '#FF4500',
      image: '/assets/achievements/apex-champion.png',
    }
  ]
};

// Utility to map game IDs to slugs
const getGameSlugFromId = (gameId: string): string => {
  const gameMap: Record<string, string> = {
    '1': 'fortnite',
    '2': 'minecraft',
    '3': 'apex'
  };
  return gameMap[gameId] || 'unknown';
};

// Add your default achievements for specific games or categories below this line
const additionalDefaultAchievements = [
  {
    id: 'welcome',
    name: 'Welcome to Clipt',
    description: 'Sign up and create your account',
    category: 'general',
    image: '/achievements/welcome.png',
    target_value: 1,
    points: 10,
    progress_type: 'boolean',
    reward_type: 'points',
    xp_reward: 50,
    token_reward: 5
  },
  // Daily Quests
  {
    name: 'Complete 4 Daily Quests',
    description: 'Complete 4 daily quests this week',
    target_value: 4,
    points: 10,
    category: 'daily',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Earn Your Way',
    description: 'Upload 3 clips or earn 3 trophies',
    target_value: 3,
    points: 10,
    category: 'daily',
    progress_type: 'count',
    reward_type: 'points',
  },
  
  // Trophy & Weekly Top 10 Achievements
  {
    name: 'First Taste of Gold',
    description: 'Earn 10 trophies on a single post',
    target_value: 10,
    points: 25,
    category: 'trophy',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Crowd Favorite',
    description: 'Get 50 trophies on a post',
    target_value: 50,
    points: 50,
    category: 'trophy',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Viral Sensation',
    description: 'Reach 100 trophies on a single post',
    target_value: 100,
    points: 100,
    category: 'trophy',
    progress_type: 'count',
    reward_type: 'badge',
  },
  {
    name: 'Content King',
    description: 'Earn 500 trophies on a post',
    target_value: 500,
    points: 200,
    category: 'trophy',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Clipt Icon',
    description: 'Reach 1,000 trophies on a post—true viral status',
    target_value: 1000,
    points: 300,
    category: 'trophy',
    progress_type: 'count',
    reward_type: 'title',
  },
  {
    name: 'Breaking In',
    description: 'Rank in the Top 10 of the weekly leaderboard for the first time',
    target_value: 1,
    points: 50,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Back-to-Back',
    description: 'Stay in the Top 10 for 2 consecutive weeks',
    target_value: 2,
    points: 75,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Hot Streak',
    description: 'Maintain a Top 10 spot for 5 weeks straight',
    target_value: 5,
    points: 150,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'badge',
  },
  {
    name: 'Unstoppable',
    description: 'Stay in the Top 10 for 10 consecutive weeks',
    target_value: 10,
    points: 250,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Clipt Hall of Fame',
    description: 'Rank in the Top 10 for 25 weeks total',
    target_value: 25,
    points: 500,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'title',
  },
  
  // Follower Achievements
  {
    name: 'First Follower',
    description: 'Get your first follower',
    target_value: 1,
    points: 20,
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Rising Star',
    description: 'Hit 1,000 followers on Clipt',
    target_value: 1000,
    points: 100, 
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Trending Now',
    description: 'Reach 5,000 followers—people love your content',
    target_value: 5000,
    points: 200,
    category: 'social',
    progress_type: 'count',
    reward_type: 'badge',
  },
  {
    name: 'Influencer Status',
    description: 'Gain 10,000 followers and grow your community',
    target_value: 10000,
    points: 300,
    category: 'social',
    progress_type: 'count',
    reward_type: 'title',
  },
  {
    name: 'Clipt Famous',
    description: 'Surpass 50,000 followers—your name is known',
    target_value: 50000,
    points: 500,
    category: 'social',
    progress_type: 'count',
    reward_type: 'badge',
  },
  {
    name: 'Elite Creator',
    description: 'Reach 100,000 followers and be among the platform\'s best',
    target_value: 100000,
    points: 1000,
    category: 'social',
    progress_type: 'count',
    reward_type: 'title',
  },
  
  // Streaming Subscriber Achievements
  {
    name: 'First Supporter',
    description: 'Gain your first subscriber on your streaming channel',
    target_value: 1,
    points: 20,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Small but Mighty',
    description: 'Hit 10 subscribers—your community is growing',
    target_value: 10,
    points: 40,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Streaming Star',
    description: 'Reach 100 subscribers—your audience is loyal',
    target_value: 100,
    points: 100,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'badge',
  },
  {
    name: 'Big League Streamer',
    description: 'Gain 1,000 subscribers and solidify your name',
    target_value: 1000,
    points: 250,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'title',
  },
  {
    name: 'Streaming Legend',
    description: 'Surpass 10,000 subscribers—you\'re a household name',
    target_value: 10000,
    points: 500,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'title',
  },
  
  // Engagement Achievements
  {
    name: 'Hype Squad',
    description: 'Leave 50 comments on other creators\' posts',
    target_value: 50,
    points: 30,
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Super Supporter',
    description: 'Give out 100 trophies to different posts',
    target_value: 100,
    points: 75,
    category: 'social',
    progress_type: 'count',
    reward_type: 'badge',
  },
  {
    name: 'Engagement Master',
    description: 'Your comments have 1,000 total likes',
    target_value: 1000,
    points: 150,
    category: 'social',
    progress_type: 'count',
    reward_type: 'title',
  },
  {
    name: 'Conversation Starter',
    description: 'Get 100 replies to your comments',
    target_value: 100,
    points: 75,
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Community Builder',
    description: 'Start a trending discussion (a post with 500+ comments)',
    target_value: 1,
    points: 200,
    category: 'social',
    progress_type: 'count',
    reward_type: 'badge',
  },
  
  // Sharing & Promotion Achievements
  {
    name: 'Signal Booster',
    description: 'Share 10 posts from other creators',
    target_value: 10,
    points: 30,
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Clipt Evangelist',
    description: 'Invite 5 friends who create an account',
    target_value: 5,
    points: 100,
    category: 'social',
    progress_type: 'count',
    reward_type: 'badge',
  },
  {
    name: 'The Connector',
    description: 'Tag 100 different users in posts or comments',
    target_value: 100,
    points: 75,
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Trendsetter',
    description: 'A post you shared helps another user reach Top 10 for the week',
    target_value: 1,
    points: 150,
    category: 'social',
    progress_type: 'count',
    reward_type: 'badge',
  },
  {
    name: 'Algorithm Whisperer',
    description: 'Share a post that reaches 10,000+ views within 24 hours',
    target_value: 1,
    points: 200,
    category: 'social',
    progress_type: 'count',
    reward_type: 'title',
  },
  
  // Collab & Creator Support Achievements
  {
    name: 'Duo Dynamic',
    description: 'Collaborate on a post with another creator that gets 50+ trophies',
    target_value: 1,
    points: 75,
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Mentor Mode',
    description: 'Shout out a smaller creator (under 500 followers) and help them grow to 1,000+',
    target_value: 1,
    points: 200,
    category: 'social',
    progress_type: 'count',
    reward_type: 'badge',
  },
  {
    name: 'The Networker',
    description: 'Get tagged in 100 different posts by other creators',
    target_value: 100,
    points: 100,
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
  },

  // Hidden & Special Achievements
  {
    name: 'OG Clipt Creator',
    description: 'Join Clipt within the first 3 months of launch',
    target_value: 1,
    points: 100,
    category: 'special',
    progress_type: 'boolean',
    reward_type: 'badge',
  },
  {
    name: 'Day One Grinder',
    description: 'Upload a post on launch day',
    target_value: 1,
    points: 100,
    category: 'special',
    progress_type: 'boolean',
    reward_type: 'title',
  },
  {
    name: 'Mystery Viral',
    description: 'A random old post of yours goes viral again after 30+ days',
    target_value: 1,
    points: 150,
    category: 'special',
    progress_type: 'boolean',
    reward_type: 'badge',
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Follow 10 people',
    category: 'social',
    image: '/achievements/social.png',
    target_value: 10,
    points: 50,
    progress_type: 'count',
    reward_type: 'badge',
  }
];

// Sample user progress data for demo purposes
const sampleUserProgress = [
  // Trophy & Weekly Achievements
  {
    achievementName: 'First Taste of Gold',
    currentValue: 4,
    completed: false
  },
  {
    achievementName: 'Crowd Favorite',
    currentValue: 0,
    completed: false
  },
  {
    achievementName: 'Viral Sensation',
    currentValue: 0,
    completed: false
  },
  {
    achievementName: 'Breaking In',
    currentValue: 1,
    completed: true
  },
  {
    achievementName: 'Back-to-Back',
    currentValue: 0,
    completed: false
  },
  
  // Follower Achievements
  {
    achievementName: 'First Follower',
    currentValue: 1,
    completed: true
  },
  {
    achievementName: 'Rising Star',
    currentValue: 245,
    completed: false
  },
  {
    achievementName: 'Trending Now',
    currentValue: 0,
    completed: false
  },
  
  // Streaming Achievements
  {
    achievementName: 'First Supporter',
    currentValue: 0,
    completed: false
  },
  {
    achievementName: 'Small but Mighty',
    currentValue: 0,
    completed: false
  },
  

  // Engagement Achievements
  {
    achievementName: 'Hype Squad',
    currentValue: 12,
    completed: false
  },
  {
    achievementName: 'Signal Booster',
    currentValue: 3,
    completed: false
  },
];

// Default gaming achievements for popular games
const defaultGameAchievements = {
  // Rest of the game achievements code remains unchanged
  // Halo
  'halo-series': [
    {
      name: 'Master Chief',
      description: 'Complete a campaign mission on Legendary difficulty',
      target_value: 1,
      points: 100,
      rarity: 'rare',
      total_players: 980,
      completed_players: 42
    },
    {
      name: 'Spartan Warrior',
      description: 'Win 10 multiplayer matches',
      target_value: 10,
      points: 50,
      rarity: 'common',
      total_players: 980,
      completed_players: 350
    }
  ],
  // Tomb Raider
  'tomb-raider': [
    {
      name: 'Survivor',
      description: 'Complete the game on Hard difficulty',
      target_value: 1,
      points: 75,
      rarity: 'uncommon',
      total_players: 725,
      completed_players: 33
    },
    {
      name: 'Treasure Hunter',
      description: 'Find 50 collectibles',
      target_value: 50,
      points: 25,
      rarity: 'common',
      total_players: 725,
      completed_players: 198
    }
  ],
  // Sea of Thieves
  'sea-of-thieves': [
    {
      name: 'Pirate Legend',
      description: 'Reach max reputation with all trading companies',
      target_value: 1,
      points: 100, 
      rarity: 'legendary',
      total_players: 85,
      completed_players: 10
    }
  ],
  // Template for dynamically generated games (as seen in the image)
  // These are the Xbox-style achievements we want to show for any game
  'game-template': [
    {
      name: 'Souls Saved',
      description: 'Complete the game on Normal',
      target_value: 1,
      points: 25,
      rarity: 'common',
      total_players: 1000,
      completed_players: 217
    },
    {
      name: 'Seeing You Sooner',
      description: 'Defeat the boss',
      target_value: 1,
      points: 50,
      rarity: 'uncommon',
      total_players: 1000,
      completed_players: 75
    },
    {
      name: 'King',
      description: 'Finish on a Bank or higher on all levels in forward run',
      target_value: 1,
      points: 100,
      rarity: 'rare',
      total_players: 1000,
      completed_players: 37
    },
    {
      name: 'Butter and Egg Man',
      description: 'Hidden achievement',
      target_value: 1,
      points: 75,
      rarity: 'rare',
      total_players: 1000,
      completed_players: 21
    }
  ]
};

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: "general" | "daily" | "trophy" | "streaming" | "social" | "special" | "gaming" | string;
  image?: string;
  requiredAmount?: number;
  target_value: number;
  points?: number;
  xp_reward: number; // XP awarded when achievement is completed
  token_reward: number; // Tokens awarded when achievement is completed
  progress_type?: "count" | "value" | "boolean" | string;
  reward_type?: "points" | "badge" | "title" | string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  icon?: string;
  icon_url?: string;
  iconUrl?: string;
  color?: string;
  visible?: boolean;
  game_id?: string;
  gameId?: string;
  rarity?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  targetValue?: number; // Alternative to target_value
  xpReward?: number; // Alternative to xp_reward
  tokenReward?: number; // Alternative to token_reward
}

export interface AchievementProgress {
  id: string;
  userId: string;
  achievementId: string;
  currentValue: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock user achievements for development
const mockUserAchievements: (AchievementProgress & { achievement: Achievement })[] = [
  {
    // Progress fields
    id: 'mock-progress-1',
    userId: 'mock-user',
    achievementId: 'welcome',
    currentValue: 1,
    completed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    // Nested achievement
    achievement: {
      id: 'welcome',
      name: 'Welcome to Clipt',
      description: 'Sign up and create your account',
      category: 'general',
      target_value: 1,
      xp_reward: 50,
      token_reward: 5,
      points: 10,
      progress_type: 'boolean',
      reward_type: 'points',
      iconUrl: '/achievements/welcome.png',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
];

// Helper function to transform database results to AchievementProgress format
function transformAchievementProgressFromDb(data: any[]): (AchievementProgress & { achievement: Achievement })[] {
  return data.map(item => {
    // First convert the main achievement progress fields with proper camelCase
    const progress: AchievementProgress = {
      id: item.id || '',
      userId: item.user_id || '',
      achievementId: item.achievement_id || '',
      currentValue: item.current_value || 0,
      completed: item.completed || false,
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.updated_at || new Date().toISOString()
    };
    
    // Then convert the nested achievement object with proper field mappings
    const achievement: Achievement = {
      id: item.achievement?.id || '',
      name: item.achievement?.name || 'Untitled Achievement',
      description: item.achievement?.description || '',
      category: item.achievement?.category || 'general',
      target_value: item.achievement?.target_value || 1,
      targetValue: item.achievement?.target_value || 1, // Set both formats
      xp_reward: item.achievement?.xp_reward || 0,
      xpReward: item.achievement?.xp_reward || 0, // Set both formats
      token_reward: item.achievement?.token_reward || 0,
      tokenReward: item.achievement?.token_reward || 0, // Set both formats
      image: item.achievement?.image || '',
      points: item.achievement?.points || 0,
      progress_type: item.achievement?.progress_type || 'count',
      reward_type: item.achievement?.reward_type || 'points',
      icon_url: item.achievement?.icon_url || '',
      iconUrl: item.achievement?.icon_url || '', // Ensuring we set both formats for consistency
      created_at: item.achievement?.created_at || new Date().toISOString(),
      updated_at: item.achievement?.updated_at || new Date().toISOString(),
      createdAt: item.achievement?.created_at || new Date().toISOString(),
      updatedAt: item.achievement?.updated_at || new Date().toISOString()
    };
    
    // Return combined object
    return {
      ...progress,
      achievement
    };
  });
}

export const achievementService = {
  /**
   * Helper method to increment an achievement's progress and handle completion
   * @param userId User ID
   * @param achievementId Achievement ID 
   * @param incrementBy Amount to increment (default: 1)
   */
  async incrementAchievementProgress(userId: string, achievementId: string, incrementBy: number = 1): Promise<void> {
    try {
      // Get current achievement progress with type safety
      const { data: progressData, error: fetchError } = await supabase
        .from('achievement_progress')
        .select('id, current_value, completed')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .maybeSingle();
      
      // Type-safe access to progress data
      const currentProgress = progressData as unknown as {
        id: string;
        current_value: number;
        completed: boolean;
      } | null;
      
      // Get achievement target value
      const { data: achievementData, error: achievementError } = await supabase
        .from('achievements')
        .select('target_value')
        .eq('id', achievementId)
        .single();
      
      if (achievementError || !achievementData) {
        throw new Error(`Achievement not found: ${achievementId}`);
      }
      
      // Type-safe access to achievement data
      const achievement = achievementData as unknown as { target_value: number };
      
      // Calculate new progress value
      const baseValue = currentProgress?.current_value || 0;
      const newValue = baseValue + incrementBy;
      const targetValue = achievement.target_value || 1;
      const isCompleted = newValue >= targetValue;
      
      // Update the progress
      await this.updateAchievementProgress(userId, achievementId, newValue, isCompleted);
      
      // If completed and wasn't completed before, award rewards
      if (isCompleted && !currentProgress?.completed) {
        await this.handleAchievementCompletion(userId, achievementId);
      }
    } catch (error) {
      console.error('Error incrementing achievement progress:', error);
    }
  },

  /**
   * Awards XP and tokens when an achievement is completed
   * @param userId User ID
   * @param achievementId Achievement ID
   */
  async handleAchievementCompletion(userId: string, achievementId: string): Promise<void> {
    try {
      // Get the achievement details
      const { data, error: achievementError } = await supabase
        .from('achievements')
        .select('id, name, xp_reward, token_reward')
        .eq('id', achievementId)
        .single();

      if (achievementError || !data) {
        console.error('Error fetching achievement details:', achievementError);
        return;
      }
      
      // Safely access values with type assertions to handle potential type errors
      const achievementData = data as unknown as {
        id: string;
        name: string;
        xp_reward: number;
        token_reward: number;
      };

      // Extract rewards with safe defaults, using our type assertion
      const xpReward = achievementData.xp_reward || 0;
      const tokenReward = achievementData.token_reward || 0;
      const achievementName = achievementData.name || 'Achievement';
      
      // Award XP if there is a reward
      if (xpReward > 0) {
        try {
          await levelingService.awardXp(userId, xpReward);
          console.log(`Awarded ${xpReward} XP to user ${userId} for achievement ${achievementId}`);
        } catch (xpError) {
          console.error('Error awarding XP:', xpError);
        }
      }

      // Award tokens if there is a reward
      if (tokenReward > 0) {
        try {
          await levelingService.awardTokens(userId, tokenReward);
          console.log(`Awarded ${tokenReward} tokens to user ${userId} for achievement ${achievementId}`);
        } catch (tokenError) {
          console.error('Error awarding tokens:', tokenError);
        }
      }

      // Show a toast notification for the user
      toast.success(`Achievement Completed: ${achievementName}`, {
        description: `Reward: ${xpReward} XP${tokenReward > 0 ? `, ${tokenReward} tokens` : ''}`,
        duration: 5000,
      });
      
      console.log(`Achievement completed for user ${userId}: ${achievementName} - Awarded ${xpReward} XP and ${tokenReward} tokens`);
    } catch (error) {
      console.error('Error handling achievement completion:', error);
    }
  },

  /**
   * Updates achievement progress and handles completion if the target is reached
   * @param userId User ID
   * @param achievementId Achievement ID
   * @param currentValue Current progress value
   */
  async updateAchievementProgress(userId: string, achievementId: string, currentValue: number): Promise<void> {
    try {
      // Check if progress record already exists
      const { data: existingProgress, error: progressError } = await supabase
        .from('achievement_progress')
        .select('id, achievement_id, current_value, completed')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .maybeSingle();
      
      if (progressError) {
        console.error('Error fetching existing achievement progress:', progressError);
        return;
      }
      
      // Get achievement details to know target value
      const { data: achievementData, error: achievementError } = await supabase
        .from('achievements')
        .select('target_value, xp_reward, token_reward')
        .eq('id', achievementId)
        .single();
      
      if (achievementError) {
        console.error('Error fetching achievement details:', achievementError);
        return;
      }
      
      if (!achievementData) {
        console.error('Achievement not found:', achievementId);
        return;
      }
      
      // Cast to ensure type safety
      const achievement = achievementData as {
        target_value?: number;
        xp_reward?: number;
        token_reward?: number;
      };
      
      // Safely extract target value with fallback
      const targetValue = typeof achievement.target_value === 'number' ? achievement.target_value : 1;
      
      // If progress exists, update it
      if (existingProgress && !('error' in existingProgress)) {
        // Cast to ensure type safety
        const progress = existingProgress as {
          id: string;
          completed?: boolean;
          current_value?: number;
        };
        
        // Type-safe handling of progress data
        const wasCompleted = !!progress.completed;
        const previousValue = typeof progress.current_value === 'number' ? progress.current_value : 0;
        const newValue = currentValue > previousValue ? currentValue : previousValue;
        const isNowCompleted = newValue >= targetValue;
        
        // Update the progress
        const { error: updateError } = await supabase
          .from('achievement_progress')
          .update({
            current_value: newValue,
            completed: isNowCompleted,
            updated_at: new Date().toISOString()
          })
          .eq('id', progress.id);
        
        if (updateError) {
          console.error('Error updating achievement progress:', updateError);
          return;
        }
        
        // If achievement was just completed, handle completion rewards
        if (isNowCompleted && !wasCompleted) {
          console.log(`Achievement ${achievementId} completed for user ${userId}`);
          await this.handleAchievementCompletion(userId, achievementId);
        }
      } else {
        // Create new progress record
        const isCompleted = currentValue >= targetValue;
        
        const { error: insertError } = await supabase
          .from('achievement_progress')
          .insert({
            user_id: userId,
            achievement_id: achievementId,
            current_value: currentValue,
            completed: isCompleted,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error creating achievement progress:', insertError);
          return;
        }
        
        // If achievement is completed on first update, handle completion
        if (isCompleted) {
          console.log(`Achievement ${achievementId} completed on first update for user ${userId}`);
          await this.handleAchievementCompletion(userId, achievementId);
        }
      }
    } catch (error) {
      console.error('Error in updateAchievementProgress:', error);
    }
  },
  
  async getUserAchievements(userId: string): Promise<(AchievementProgress & { achievement: Achievement })[]> {
    // Use mock data in development if the flag is set
    if (process.env.VITE_USE_MOCK_DATA === 'true' || import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      console.log('Using mock achievements data for development');
      return mockUserAchievements;
    }

    try {
      const { data, error } = await supabase
        .from('achievement_progress')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      if (!data || !data.length) return [];

      // Transform data to match our interface with proper field mapping
      const progressWithAchievements = transformAchievementProgressFromDb(data);
      
      // Sort achievements: completed first, then by category/points
      return progressWithAchievements.sort((a, b) => {
        // First sort by completion status
        if (a.completed && !b.completed) return -1;
        if (!a.completed && b.completed) return 1;
        
        // Then by category
        if (a.achievement.category < b.achievement.category) return -1;
        if (a.achievement.category > b.achievement.category) return 1;
        
        // Then by points (higher first)
        return (b.achievement.points || 0) - (a.achievement.points || 0);
      });
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }
  },
  
  // Helper method to generate mock achievements with progress
  getMockAchievements(): (AchievementProgress & { achievement: Achievement })[] {
    const mockAchievements = defaultAchievements.map((achievement, index) => {
      // Find the progress info for this achievement from our sample data
      const progressInfo = sampleUserProgress.find(p => p.achievementName === achievement.name) || {
        currentValue: 0,
        completed: false
      }

      // If achievement was just completed, handle completion rewards
      if (isNowCompleted && !wasCompleted) {
        console.log(`Achievement ${achievementId} completed for user ${userId}`);
        await this.handleAchievementCompletion(userId, achievementId);
      }
    } else {
      // Create new progress record
      const isCompleted = currentValue >= targetValue;

      const { error: insertError } = await supabase
        .from('achievement_progress')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          current_value: currentValue,
          completed: isCompleted,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating achievement progress:', insertError);
        return;
      if (a.achievement.category === 'trophy' && b.achievement.category !== 'trophy') {
        return -1;
      }
      if (a.achievement.category !== 'trophy' && b.achievement.category === 'trophy') {
        return 1;
      }
      
      // Then sort by in-progress vs completed
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Then sort by category
      if (a.achievement.category !== b.achievement.category) {
        // Define category order priority
        const categoryOrder = {
          'trophy': 1,
          'daily': 2,
          'streaming': 3,
          'social': 4,
          'special': 5,
          'general': 6,
          'gaming': 7
        };
        return (categoryOrder[a.achievement.category as keyof typeof categoryOrder] || 99) - 
               (categoryOrder[b.achievement.category as keyof typeof categoryOrder] || 99);
      }
      
      // Finally sort by points (highest first)
      return b.achievement.points - a.achievement.points;
    });
  },
  
  async getGameAchievements(gameId: number): Promise<Achievement[]> {
    console.log('Getting game achievements for gameId:', gameId);
    
    // Get the game slug
    const gameSlug = this.getGameSlugFromId(gameId);
    console.log('Game slug:', gameSlug);
    
    // Get achievements for the specific game if they exist, or use the template
    let achievements: any[] = defaultGameAchievements[gameSlug] || [];
    
    // If there are no specific achievements for this game, use the template
    // This ensures that every game will show Xbox-style achievements
    if (achievements.length === 0) {
      console.log('No specific achievements found, using template');
      
      // Deep clone the template to avoid modifying the original
      achievements = JSON.parse(JSON.stringify(defaultGameAchievements['game-template']));
      
      // For dynamic games, we can customize the achievements with the game ID
      achievements = achievements.map(achievement => ({
        ...achievement,
        // Add a custom identifier to ensure uniqueness
        id: `game-${gameId}-${achievement.name.toLowerCase().replace(/\s+/g, '-')}`,
      }));
    }
    
    // Add game_id to each achievement and ensure all required fields are present
    return achievements.map(achievement => {
      // Ensure the object has all required Achievement interface properties
      const result: Achievement = {
        id: achievement.id || `${gameSlug}-${achievement.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category || 'ingame',
        // Required fields for Achievement interface
        target_value: achievement.target_value || 1,
        xp_reward: achievement.xp_reward || 0,
        token_reward: achievement.token_reward || 0,
        // Optional fields with proper mapping
        game_id: String(gameId),
        gameId: String(gameId),
        icon_url: achievement.icon_url || `/images/achievements/default-${achievement.rarity || 'common'}.png`,
        iconUrl: achievement.icon_url || `/images/achievements/default-${achievement.rarity || 'common'}.png`,
        points: achievement.points || 0,
        rarity: achievement.rarity || 'common',
        progress_type: achievement.progress_type,
        reward_type: achievement.reward_type,
        created_at: achievement.created_at || new Date().toISOString(),
        updated_at: achievement.updated_at || new Date().toISOString(),
        createdAt: achievement.created_at || new Date().toISOString(),
        updatedAt: achievement.updated_at || new Date().toISOString()
      };
      
      return result;
    });
  },

  async createDefaultAchievementsForUser(userId: string): Promise<void> {
    console.log('Creating default achievements for user:', userId);
    
    try {
      // First, check if achievements exist in the database
      const { data: existingAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('id');
      
      if (achievementsError) throw achievementsError;
      
      // If no achievements exist, create them first
      if (!existingAchievements || existingAchievements.length === 0) {
        const { error: insertError } = await supabase
          .from('achievements')
          .insert(defaultAchievements.map(achievement => ({
            ...achievement,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })));
        
        if (insertError) throw insertError;
      }
      
      // Get the achievements to create progress records
      const { data: achievements, error: getError } = await supabase
        .from('achievements')
        .select('id');
      
      if (getError) throw getError;
      
      // Create progress records for the user
      const progressRecords = achievements.map(achievement => ({
        user_id: userId,
        achievement_id: achievement.id,
        current_value: 0,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { error: progressError } = await supabase
        .from('achievement_progress')
        .insert(progressRecords);
      
      if (progressError) throw progressError;
      
      console.log('Successfully created default achievements for user:', userId);
    } catch (error) {
      console.error('Error creating default achievements:', error);
      throw error;
    }
  },

  // Update achievement progress
  async updateAchievementProgress(userId: string, achievementId: string, newValue: number, isCompleted: boolean = false): Promise<void> {
    try {
      // Check if a progress record already exists
      const { data: existingProgress, error: checkError } = await supabase
        .from('achievement_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .maybeSingle();
        
      if (checkError) {
        throw checkError;
      }
      
      if (existingProgress) {
        // Update existing progress
        const { error: updateError } = await supabase
          .from('achievement_progress')
          .update({
            current_value: newValue,
            completed: isCompleted,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('achievement_id', achievementId);
          
        if (updateError) throw updateError;
      } else {
        // Create new progress record
        const { error: insertError } = await supabase
          .from('achievement_progress')
          .insert({
            user_id: userId,
            achievement_id: achievementId,
            current_value: newValue,
            completed: isCompleted,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating achievement progress:', error);
    }
  },

  // Helper method to map game IDs to slugs for the mock data
  getGameSlugFromId(gameId: number): string {
    // Hardcoded game mappings for demo purposes
    const gameMap: Record<number, string> = {
      1: 'halo-series',
      2: 'tomb-raider',
      3: 'sea-of-thieves'
    };
    
    // If we have a specific mapping, use it
    if (gameMap[gameId]) {
      return gameMap[gameId];
    }
    
    // If it's a new game ID from search results, create a generic slug
    // This will ensure any game ID can be used
    return `game-${gameId}`;
  }
};



export default achievementService;
