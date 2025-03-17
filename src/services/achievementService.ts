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
  ]
};

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
          category: progress.achievement.category as "streaming" | "social" | "general" | "gaming" | "trophy" | "special" | "daily"
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
          category: achievement.category as "streaming" | "social" | "general" | "gaming" | "trophy" | "special" | "daily",
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
      // Always set progress to 0 as requested
      currentValue: 0,
      targetValue: achievement.target_value,
      completed: false
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
      // First, check if the achievement progress entry exists
      const { data: existingProgress, error: fetchError } = await supabase
        .from('achievement_progress')
        .select('id, current_value, achievement_id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementType)
        .maybeSingle();
  
      if (fetchError) throw fetchError;
  
      if (existingProgress) {
        // Update existing progress
        const newValue = Math.min((existingProgress.current_value || 0) + incrementBy, 100); // Default max value of 100
        
        // Get the achievement to check target value
        const { data: achievement } = await supabase
          .from('achievements')
          .select('target_value')
          .eq('id', existingProgress.achievement_id)
          .single();
          
        const targetValue = achievement?.target_value || 100;
        const completed = newValue >= targetValue;
  
        const { error: updateError } = await supabase
          .from('achievement_progress')
          .update({ 
            current_value: newValue,
            completed,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);
  
        if (updateError) throw updateError;
      } else {
        // Create new progress entry with initial progress
        const { data: achievement, error: achievementError } = await supabase
          .from('achievements')
          .select('id, target_value')
          .eq('id', achievementType)
          .single();
  
        if (achievementError) throw achievementError;
  
        if (achievement) {
          const { error: insertError } = await supabase
            .from('achievement_progress')
            .insert({
              user_id: userId,
              achievement_id: achievementType,
              current_value: incrementBy, // Initialize with increment value
              completed: incrementBy >= achievement.target_value,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
  
          if (insertError) throw insertError;
        }
      }
    } catch (error) {
      console.error('Error updating achievement progress:', error);
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
