import { supabase } from '@/lib/supabase';
import type { Achievement, AchievementProgress } from '@/types/profile';

// Default achievement data to create for new users
const defaultAchievements = [
  {
    name: 'First Blood',
    description: 'Upload your first clip',
    target_value: 1,
    points: 50,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Clip Master',
    description: 'Upload 10 clips',
    target_value: 10,
    points: 100,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Social Butterfly',
    description: 'Follow 5 other users',
    target_value: 5,
    points: 75,
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Popular Content',
    description: 'Get 50 views on your clips',
    target_value: 50,
    points: 150,
    category: 'streaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Gaming Newbie',
    description: 'Add your first game to your profile',
    target_value: 1,
    points: 25,
    category: 'gaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Game Enthusiast',
    description: 'Play 5 different games',
    target_value: 5,
    points: 125,
    category: 'gaming',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Community Member',
    description: 'Comment on 10 clips',
    target_value: 10,
    points: 100,
    category: 'social',
    progress_type: 'count',
    reward_type: 'points',
  },
  {
    name: 'Trophy Hunter',
    description: 'Complete 5 achievements',
    target_value: 5,
    points: 200,
    category: 'general',
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
  {
    achievementName: 'First Blood',
    currentValue: 1,
    completed: true
  },
  {
    achievementName: 'Clip Master',
    currentValue: 4,
    completed: false
  },
  {
    achievementName: 'Social Butterfly',
    currentValue: 3,
    completed: false
  },
  {
    achievementName: 'Popular Content',
    currentValue: 22,
    completed: false
  },
  {
    achievementName: 'Gaming Newbie',
    currentValue: 1,
    completed: true
  },
  {
    achievementName: 'Game Enthusiast',
    currentValue: 2,
    completed: false
  },
  {
    achievementName: 'Community Member',
    currentValue: 5,
    completed: false
  },
  {
    achievementName: 'Trophy Hunter',
    currentValue: 2,
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
