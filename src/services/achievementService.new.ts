import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import levelingService from './levelingService';
import { PostgrestError } from '@supabase/supabase-js';

// Interfaces
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: "general" | "daily" | "trophy" | "streaming" | "social" | "special" | "gaming" | string;
  target_value: number;
  xp_reward: number; 
  token_reward: number;
  points?: number;
  image?: string;
  requiredAmount?: number;
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
  // Properties with alternative names
  targetValue?: number;
  xpReward?: number;
  tokenReward?: number;
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
  // Trophy & Top 10 Category
  {
    id: 'first-taste-of-gold',
    name: 'First Taste of Gold',
    description: 'Earn 10 trophies on a post',
    category: 'trophy',
    target_value: 10,
    xp_reward: 200,
    token_reward: 5,
    points: 200,
    difficulty: 'medium',
    icon: '🏆',
    color: '#FFD700',
    image: '/assets/achievements/first-taste-gold.png',
  },
  {
    id: 'viral-sensation',
    name: 'Viral Sensation',
    description: 'Get 100 trophies on a post',
    category: 'trophy',
    target_value: 100,
    xp_reward: 500,
    token_reward: 10,
    points: 500,
    difficulty: 'hard',
    icon: '🚀',
    color: '#FF4500',
    image: '/assets/achievements/viral-sensation.png',
  },
  {
    id: 'breaking-in',
    name: 'Breaking In',
    description: 'Rank in Top 10 weekly leaderboard once',
    category: 'trophy',
    target_value: 1,
    xp_reward: 300,
    token_reward: 8,
    points: 300,
    difficulty: 'medium',
    icon: '📊',
    color: '#4B0082',
    image: '/assets/achievements/breaking-in.png',
  },
  {
    id: 'hot-streak',
    name: 'Hot Streak',
    description: 'Stay in Top 10 for 5 weeks',
    category: 'trophy',
    target_value: 5,
    xp_reward: 600,
    token_reward: 12,
    points: 600,
    difficulty: 'hard',
    icon: '🔥',
    color: '#FF0000',
    image: '/assets/achievements/hot-streak.png',
  },
  
  // Followers Category
  {
    id: 'rising-star',
    name: 'Rising Star',
    description: 'Reach 1,000 followers',
    category: 'social',
    target_value: 1000,
    xp_reward: 300,
    token_reward: 5,
    points: 300,
    difficulty: 'medium',
    icon: '⭐',
    color: '#FFA500',
    image: '/assets/achievements/rising-star.png',
  },
  {
    id: 'influencer-status',
    name: 'Influencer Status',
    description: 'Reach 10,000 followers',
    category: 'social',
    target_value: 10000,
    xp_reward: 600,
    token_reward: 12,
    points: 600,
    difficulty: 'hard',
    icon: '👑',
    color: '#9932CC',
    image: '/assets/achievements/influencer-status.png',
  },
  
  // Stream Subs Category
  {
    id: 'first-supporter',
    name: 'First Supporter',
    description: 'Get your first sub',
    category: 'streaming',
    target_value: 1,
    xp_reward: 150,
    token_reward: 3,
    points: 150,
    difficulty: 'easy',
    icon: '💖',
    color: '#FF69B4',
    image: '/assets/achievements/first-supporter.png',
  },
  {
    id: 'streaming-star',
    name: 'Streaming Star',
    description: 'Reach 100 streaming subs',
    category: 'streaming',
    target_value: 100,
    xp_reward: 500,
    token_reward: 10,
    points: 500,
    difficulty: 'hard',
    icon: '🎥',
    color: '#8A2BE2',
    image: '/assets/achievements/streaming-star.png',
  },
  
  // Engagement Category
  {
    id: 'hype-squad',
    name: 'Hype Squad',
    description: 'Leave 50 comments',
    category: 'general',
    target_value: 50,
    xp_reward: 200,
    token_reward: 4,
    points: 200,
    difficulty: 'medium',
    icon: '💬',
    color: '#1E90FF',
    image: '/assets/achievements/hype-squad.png',
  },
  {
    id: 'super-supporter',
    name: 'Super Supporter',
    description: 'Give out 100 trophies',
    category: 'general',
    target_value: 100,
    xp_reward: 250,
    token_reward: 5,
    points: 250,
    difficulty: 'medium',
    icon: '🏅',
    color: '#FFD700',
    image: '/assets/achievements/super-supporter.png',
  },
  {
    id: 'conversation-starter',
    name: 'Conversation Starter',
    description: '100 replies to your comments',
    category: 'general',
    target_value: 100,
    xp_reward: 400,
    token_reward: 8,
    points: 400,
    difficulty: 'medium',
    icon: '💭',
    color: '#20B2AA',
    image: '/assets/achievements/conversation-starter.png',
  },
  {
    id: 'community-builder',
    name: 'Community Builder',
    description: 'Post gets 500+ comments',
    category: 'general',
    target_value: 500,
    xp_reward: 500,
    token_reward: 10,
    points: 500,
    difficulty: 'hard',
    icon: '🏙️',
    color: '#32CD32',
    image: '/assets/achievements/community-builder.png',
  },
  
  // Sharing & Invites Category
  {
    id: 'signal-booster',
    name: 'Signal Booster',
    description: 'Share 10 creators\'posts',
    category: 'social',
    target_value: 10,
    xp_reward: 150,
    token_reward: 3,
    points: 150,
    difficulty: 'easy',
    icon: '📢',
    color: '#00CED1',
    image: '/assets/achievements/signal-booster.png',
  },
  {
    id: 'clipt-evangelist',
    name: 'Clipt Evangelist',
    description: 'Invite 5 friends',
    category: 'social',
    target_value: 5,
    xp_reward: 300,
    token_reward: 6,
    points: 300,
    difficulty: 'medium',
    icon: '📨',
    color: '#6495ED',
    image: '/assets/achievements/clipt-evangelist.png',
  },
  
  // Collabs Category
  {
    id: 'duo-dynamic',
    name: 'Duo Dynamic',
    description: 'Collab on a post with 50 trophies',
    category: 'special',
    target_value: 50,
    xp_reward: 300,
    token_reward: 6,
    points: 300,
    difficulty: 'medium',
    icon: '👯',
    color: '#BA55D3',
    image: '/assets/achievements/duo-dynamic.png',
  },
  {
    id: 'mentor-mode',
    name: 'Mentor Mode',
    description: 'Help a creator reach 1K followers',
    category: 'special',
    target_value: 1,
    xp_reward: 400,
    token_reward: 8,
    points: 400,
    difficulty: 'hard',
    icon: '🧠',
    color: '#4682B4',
    image: '/assets/achievements/mentor-mode.png',
  },
  
  // Hidden & Special Category
  {
    id: 'og-clipt-creator',
    name: 'OG Clipt Creator',
    description: 'Joined in first 3 months',
    category: 'special',
    target_value: 1,
    xp_reward: 500,
    token_reward: 10,
    points: 500,
    difficulty: 'special',
    icon: '🔰',
    color: '#FF8C00',
    image: '/assets/achievements/og-clipt-creator.png',
  },
  {
    id: 'day-one-grinder',
    name: 'Day One Grinder',
    description: 'Posted on launch day',
    category: 'special',
    target_value: 1,
    xp_reward: 300,
    token_reward: 6,
    points: 300,
    difficulty: 'special',
    icon: '🎮',
    color: '#9400D3',
    image: '/assets/achievements/day-one-grinder.png',
  },
  {
    id: 'mystery-viral',
    name: 'Mystery Viral',
    description: 'Old post goes viral after 30 days',
    category: 'special',
    target_value: 1,
    xp_reward: 400,
    token_reward: 8,
    points: 400,
    difficulty: 'medium',
    icon: '🎭',
    color: '#800080',
    image: '/assets/achievements/mystery-viral.png',
  },
  {
    id: 'shadow-supporter',
    name: 'Shadow Supporter',
    description: 'Like/comment on someone\'s posts for 30 days',
    category: 'special',
    target_value: 30,
    xp_reward: 350,
    token_reward: 7,
    points: 350,
    difficulty: 'medium',
    icon: '👥',
    color: '#708090',
    image: '/assets/achievements/shadow-supporter.png',
  },
  
  // Original achievements to keep
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
    }
  ],
  'minecraft': [
    {
      id: 'minecraft-diamond',
      name: 'Diamond Hunter',
      description: 'Mine your first diamond in Minecraft',
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

// Default gaming achievements templates for any game
const defaultGameAchievements = {
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
  // Template for dynamically generated games
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

// Mock user achievements for development
const mockUserAchievements: AchievementProgressWithAchievement[] = [
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
function transformAchievementProgressFromDb(data: any[]): AchievementProgressWithAchievement[] {
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
      // Get current achievement progress
      const { data: progressData, error: fetchError } = await supabase
        .from('achievement_progress')
        .select('id, current_value, completed')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error fetching achievement progress:', fetchError);
        return;
      }
      
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
        console.error('Achievement not found:', achievementId);
        return;
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
      
      // Safely access values with type assertions
      const achievementData = data as unknown as {
        id: string;
        name: string;
        xp_reward: number;
        token_reward: number;
      };

      // Extract rewards with safe defaults
      const xpReward = achievementData.xp_reward || 0;
      const tokenReward = achievementData.token_reward || 0;
      const achievementName = achievementData.name || 'Achievement';
      
      // Award XP if there is a reward
      if (xpReward > 0) {
        try {
          // Fixed: Use awardXp instead of addXp
          await levelingService.awardXp(userId, xpReward);
          console.log(`Awarded ${xpReward} XP to user ${userId} for achievement ${achievementId}`);
        } catch (xpError) {
          console.error('Error awarding XP:', xpError);
        }
      }

      // Award tokens if there is a reward
      if (tokenReward > 0) {
        try {
          // Fixed: Use awardTokens instead of addTokens
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
   * @param isCompleted Whether the achievement is completed
   */
  async updateAchievementProgress(userId: string, achievementId: string, currentValue: number, isCompleted: boolean = false): Promise<void> {
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
            current_value: currentValue,
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
            current_value: currentValue,
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
  
  /**
   * Get all achievements for a user with their progress
   * @param userId User ID
   * @returns Array of achievement progress with achievement details
   */
  async getUserAchievements(userId: string): Promise<AchievementProgressWithAchievement[]> {
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
        // First sort by trophy vs non-trophy
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
        return (b.achievement.points || 0) - (a.achievement.points || 0);
      });
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }
  },
  
  /**
   * Helper method to generate mock achievements with progress
   * @returns Array of mock achievements with progress
   */
  getMockAchievements(): AchievementProgressWithAchievement[] {
    return mockUserAchievements;
  },
  
  /**
   * Get achievements for a specific game
   * @param gameId Game ID
   * @returns Array of game achievements
   */
  async getGameAchievements(gameId: number): Promise<Achievement[]> {
    console.log('Getting game achievements for gameId:', gameId);
    
    // Get the game slug
    const gameSlug = this.getGameSlugFromId(gameId);
    console.log('Game slug:', gameSlug);
    
    // Get achievements for the specific game if they exist, or use the template
    let achievements: any[] = defaultGameAchievements[gameSlug] || [];
    
    // If there are no specific achievements for this game, use the template
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
        category: achievement.category || 'gaming',
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

  /**
   * Create default achievements for a new user
   * @param userId User ID
   */
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

  /**
   * Helper method to map game IDs to slugs for the mock data
   * @param gameId Game ID
   * @returns Game slug
   */
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
    return `game-${gameId}`;
  }
};

export default achievementService;
