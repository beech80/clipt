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
    description: 'Unlock 3 achievements or play 3 different Game Pass games',
    target_value: 3,
    points: 10,
    category: 'daily',
    progress_type: 'count',
    reward_type: 'points',
  },
  
  // Game-specific Achievements
  {
    name: 'Dead Space',
    description: 'Play Dead Space and earn 100 points',
    target_value: 1,
    points: 25,
    category: 'gaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'The Long Dark',
    description: 'Travel 10 km in The Long Dark and earn 50 points',
    target_value: 2,
    points: 50,
    category: 'gaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Earn an Achievement in Game Pass',
    description: 'Earn an achievement in any Game Pass game and earn 10 points',
    target_value: 1,
    points: 10,
    category: 'gaming',
    progress_type: 'count',
    reward_type: 'points',
  },

  // Trophy Achievements
  {
    name: 'Trophy Collector',
    description: 'Earn your first trophy',
    target_value: 1,
    points: 25,
    category: 'general',
    progress_type: 'count',
    reward_type: 'points',
  },
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
    description: 'Reach 10 followers',
    target_value: 10,
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
    name: 'Content Creator',
    description: 'Upload 10 clips',
    target_value: 10,
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
  
  // Game-specific Achievements
  {
    achievementName: 'Dead Space',
    currentValue: 0,
    completed: false
  },
  {
    achievementName: 'The Long Dark',
    currentValue: 0,
    completed: false
  },
  {
    achievementName: 'Earn an Achievement in Game Pass',
    currentValue: 0,
    completed: false
  },

  // Trophy Achievements
  {
    achievementName: 'Trophy Collector',
    currentValue: 1,
    completed: true
  },
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
    currentValue: 6,
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
    achievementName: 'Content Creator',
    currentValue: 4,
    completed: false
  },
  {
    achievementName: 'Viral Hit',
    currentValue: 437,
    completed: false
  }
];

export const achievementService = {
  async getUserAchievements(userId: string): Promise<(AchievementProgress & { achievement: Achievement })[]> {
    // For demo purposes, we'll return mock data with progress
    // In a real app, we would fetch from the database
    try {
      // First check if we should create default achievements
      const { data: existingProgress, error } = await supabase
        .from('achievement_progress')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      if (error) {
        console.error('Error checking achievements:', error);
        // Fall back to mock data
        return this.getMockAchievements();
      }
      
      // If no achievements, create defaults
      if (!existingProgress || existingProgress.length === 0) {
        try {
          await this.createDefaultAchievementsForUser(userId);
        } catch (e) {
          console.error('Error creating default achievements:', e);
          // Fall back to mock data
          return this.getMockAchievements();
        }
      }
      
      // Fetch real achievements from database
      const { data, error: fetchError } = await supabase
        .from('achievement_progress')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId);

      if (fetchError) {
        console.error('Error fetching user achievements:', fetchError);
        // Fall back to mock data
        return this.getMockAchievements();
      }

      if (!data || data.length === 0) {
        // Fall back to mock data
        return this.getMockAchievements();
      }

      // Transform and sort the data
      return (data as any[]).map(progress => ({
        ...progress,
        completed: progress.current_value >= progress.achievement.target_value,
        achievement: {
          ...progress.achievement,
          reward_value: {
            points: progress.achievement.points
          },
          progress_type: progress.achievement.progress_type as "count" | "value" | "boolean",
          reward_type: progress.achievement.reward_type as "points" | "badge" | "title",
          category: progress.achievement.category as "streaming" | "social" | "general" | "gaming"
        }
      })).sort((a, b) => {
        if (a.completed === b.completed) {
          if (a.achievement.category === b.achievement.category) {
            return b.achievement.points - a.achievement.points;
          }
          return a.achievement.category.localeCompare(b.achievement.category);
        }
        return a.completed ? 1 : -1;
      });
    } catch (error) {
      console.error('Error in getUserAchievements:', error);
      // Fall back to mock data
      return this.getMockAchievements();
    }
  },
  
  // Helper method to generate mock achievements with progress
  getMockAchievements(): (AchievementProgress & { achievement: Achievement })[] {
    return defaultAchievements.map((achievement, index) => {
      const progressInfo = sampleUserProgress.find(p => p.achievementName === achievement.name) || {
        currentValue: 0,
        completed: false
      };
      
      return {
        id: `mock-${index}`,
        user_id: 'mock-user',
        achievement_id: `achievement-${index}`,
        current_value: progressInfo.currentValue,
        completed: progressInfo.completed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        achievement: {
          id: `achievement-${index}`,
          name: achievement.name,
          description: achievement.description,
          category: achievement.category as "streaming" | "social" | "general" | "gaming",
          target_value: achievement.target_value,
          points: achievement.points,
          progress_type: achievement.progress_type as "count" | "value" | "boolean",
          reward_type: achievement.reward_type as "points" | "badge" | "title",
          reward_value: {
            points: achievement.points
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    });
  },

  async getGameAchievements(gameId: number): Promise<any[]> {
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
      progress: Math.floor(Math.random() * achievement.target_value),
      completed: Math.random() > 0.7
    }));
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

  async updateAchievementProgress(userId: string, achievementType: string, incrementBy: number = 1): Promise<void> {
    try {
      // Get achievements matching the type
      const { data: achievements, error: getError } = await supabase
        .from('achievements')
        .select('id')
        .eq('category', achievementType);
      
      if (getError) throw getError;
      
      // For each matching achievement, update the progress
      for (const achievement of achievements) {
        const { error: updateError } = await supabase
          .from('achievement_progress')
          .update({
            current_value: supabase.rpc('increment', { x: incrementBy }),
            updated_at: new Date().toISOString()
          })
          .match({ user_id: userId, achievement_id: achievement.id });
        
        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error updating achievement progress:', error);
      throw error;
    }
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
