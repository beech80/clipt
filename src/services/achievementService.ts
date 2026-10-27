import { supabase } from '@/lib/supabase';
import type { Achievement, AchievementProgress } from '@/types/profile';

// Default achievement data to create for new users
const defaultAchievements = [
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
  
  // Platform-specific Achievements
  {
    name: 'Trophy Collector',
    description: 'Earn your first trophy by getting into the weekly top 10',
    target_value: 1,
    points: 25,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Growing Community',
    description: 'Reach 10 followers on your profile',
    target_value: 10,
    points: 50,
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Content Creator',
    description: 'Upload 5 clips to your profile',
    target_value: 5,
    points: 10,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'points',
  },

  // Trophy Achievements
  {
    name: 'Trophy Hunter',
    description: 'Earn 5 trophies across all categories',
    target_value: 5,
    points: 50,
    category: 'general',
    progress_type: 'count',
    reward_type: 'badge',
  },
  {
    name: 'Trophy Master',
    description: 'Earn 25 trophies across all categories',
    target_value: 25,
    points: 100,
    category: 'general',
    progress_type: 'count',
    reward_type: 'title',
  },
  
  // Comment Achievements
  {
    name: 'First Comment',
    description: 'Leave your first comment on a clip',
    target_value: 1,
    points: 15,
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Active Commenter',
    description: 'Leave 10 comments on clips',
    target_value: 10,
    points: 30,
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Community Influencer',
    description: 'Get 25 likes on your comments',
    target_value: 25,
    points: 50,
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
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
    description: 'Reach 50 followers',
    target_value: 50,
    points: 30, 
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Influencer',
    description: 'Reach 100 followers',
    target_value: 100,
    points: 75,
    category: 'social',
    progress_type: 'count',
    reward_type: 'badge',
  },
  
  // Weekly Top 10 Achievements
  {
    name: 'Weekly Top 10',
    description: 'Get into the weekly top 10 for the first time',
    target_value: 1,
    points: 50,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Consistent Performer',
    description: 'Get into the weekly top 10 three times',
    target_value: 3,
    points: 100,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Weekly Champion',
    description: 'Reach the #1 spot in the weekly top 10',
    target_value: 1,
    points: 150,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'title',
  },

  // Streaming Achievements
  {
    name: 'First Blood',
    description: 'Upload your first clip',
    target_value: 1,
    points: 20,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Clip Master',
    description: 'Upload 20 clips',
    target_value: 20,
    points: 40,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Viral Hit',
    description: 'Get 1000 views on a single clip',
    target_value: 1000,
    points: 60,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'badge',
  }
];

// Default gaming achievements for popular games
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
  ]
};

// Sample user progress data for demo purposes
const sampleUserProgress = [
  // Daily Quests
  {
    achievementName: 'Complete 4 Daily Quests',
    currentValue: 2,
    completed: false
  },
  {
    achievementName: 'Earn Your Way',
    currentValue: 1,
    completed: false
  },
  
  // Platform-specific Achievements
  {
    achievementName: 'Trophy Collector',
    currentValue: 0,
    completed: false
  },
  {
    achievementName: 'Growing Community',
    currentValue: 4,
    completed: false
  },
  {
    achievementName: 'Content Creator',
    currentValue: 3,
    completed: false
  },

  // Trophy Achievements
  {
    achievementName: 'Trophy Hunter',
    currentValue: 3,
    completed: false
  },
  {
    achievementName: 'Trophy Master',
    currentValue: 7,
    completed: false
  },
  
  // Comment Achievements
  {
    achievementName: 'First Comment',
    currentValue: 1,
    completed: true
  },
  {
    achievementName: 'Active Commenter',
    currentValue: 6,
    completed: false
  },
  {
    achievementName: 'Community Influencer',
    currentValue: 12,
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
    currentValue: 26,
    completed: false
  },
  {
    achievementName: 'Influencer',
    currentValue: 35,
    completed: false
  },
  
  // Weekly Top 10 Achievements
  {
    achievementName: 'Weekly Top 10',
    currentValue: 1,
    completed: true
  },
  {
    achievementName: 'Consistent Performer',
    currentValue: 1,
    completed: false
  },
  {
    achievementName: 'Weekly Champion',
    currentValue: 0,
    completed: false
  },
  
  // Streaming Achievements
  {
    achievementName: 'First Blood',
    currentValue: 1,
    completed: true
  },
  {
    achievementName: 'Clip Master',
    currentValue: 8,
    completed: false
  },
  {
    achievementName: 'Viral Hit',
    currentValue: 437,
    completed: false
  }
];

export const achievementService = {
  async getUserAchievements(userId: string): Promise<AchievementProgress[]> {
    const { data, error } = await supabase.from('achievement_progress')
      .select('*, achievement:achievements(*)').eq('user_id', userId).limit(500);
    if (error) throw error;
    return data.filter(row => row.achievement).map(row => {
      const achievement = row.achievement;
      return {
        id: row.id, userId: row.user_id, achievementId: row.achievement_id,
        currentValue: row.current_value ?? 0,
        completed: (row.current_value ?? 0) >= achievement.target_value,
        achievement: {
          id: achievement.id, name: achievement.name, description: achievement.description,
          target_value: achievement.target_value, points: achievement.points,
          category: achievement.category === 'gaming' || achievement.category === 'streaming' || achievement.category === 'social' || achievement.category === 'daily' ? achievement.category : 'general',
          progress_type: achievement.progress_type === 'value' || achievement.progress_type === 'boolean' ? achievement.progress_type : 'count',
          reward_type: achievement.reward_type === 'badge' || achievement.reward_type === 'title' ? achievement.reward_type : 'points',
          reward_value: { points: achievement.points },
        },
      };
    });
  },

  async getGameAchievements(gameId: number) {
    // In a real app, this would fetch from the database
    // For now, we'll return mock data based on the game ID
    const gameSlug = this.getGameSlugFromId(gameId);
    const achievements = defaultGameAchievements[gameSlug] || [];
    
    // Add game_id to each achievement
    return achievements.map(achievement => ({
      ...achievement,
      game_id: gameId,
      id: `${gameSlug}-${achievement.name.toLowerCase().replace(/\s+/g, '-')}`,
      icon_url: `/images/achievements/${gameSlug}/${achievement.name.toLowerCase().replace(/\s+/g, '-')}.png`,
      // Always set progress to 0 as requested
      currentValue: 0,
      targetValue: achievement.target_value,
      completed: false
    }));
  },


  // Helper method to map game IDs to slugs for the mock data
  getGameSlugFromId(gameId: number): string {
    const gameMap = {
      1: 'halo-series',
      2: 'tomb-raider',
      3: 'sea-of-thieves'
    };
    return gameMap[gameId] || 'unknown-game';
  }
};

export default achievementService;
