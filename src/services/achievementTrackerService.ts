import { supabase } from '@/lib/supabase';
import { achievementService } from './achievementService';

// Define database schema interfaces to match what Supabase actually returns
interface SupabaseUserAchievement {
  id?: string;
  achievement_id: string;
  user_id: string;
  current_value?: number;
  completed?: boolean;
  achievement?: SupabaseAchievement;
  created_at?: string;
  updated_at?: string;
  earned_at?: string;
}

interface SupabaseAchievement {
  id: string;
  name: string;
  description: string;
  category: 'streaming' | 'social' | 'general' | 'gaming' | 'trophy' | 'special' | 'daily';
  icon_url?: string;
  target_value: number;
  points?: number;
  progress_type?: 'count' | 'value' | 'boolean';
  reward_type?: 'points' | 'badge' | 'title';
  visible?: boolean;
  created_at: string;
  updated_at: string;
  chain_requirement?: string;
  frequency?: string;
}

// Define our application interfaces
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  current_value: number;
  completed: boolean;
  achievement?: Achievement;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'streaming' | 'social' | 'general' | 'gaming' | 'trophy' | 'special' | 'daily';
  icon_url?: string;
  target_value: number;
  points?: number;
  progress_type?: 'count' | 'value' | 'boolean';
  reward_type?: 'points' | 'badge' | 'title';
  visible?: boolean;
  created_at: string;
  updated_at: string;
}

interface Post {
  id: string;
  user_id: string;
  likes_count: number;
}

// Helper function to convert DB achievement to our app model
function mapToUserAchievement(dbAchievement: SupabaseUserAchievement): UserAchievement {
  return {
    id: dbAchievement.id || '',
    user_id: dbAchievement.user_id,
    achievement_id: dbAchievement.achievement_id,
    current_value: dbAchievement.current_value || 0,
    completed: dbAchievement.completed || false,
    achievement: dbAchievement.achievement ? {
      id: dbAchievement.achievement.id,
      name: dbAchievement.achievement.name,
      description: dbAchievement.achievement.description,
      category: dbAchievement.achievement.category,
      icon_url: dbAchievement.achievement.icon_url,
      target_value: dbAchievement.achievement.target_value,
      points: dbAchievement.achievement.points,
      progress_type: dbAchievement.achievement.progress_type,
      reward_type: dbAchievement.achievement.reward_type,
      visible: dbAchievement.achievement.visible,
      created_at: dbAchievement.achievement.created_at,
      updated_at: dbAchievement.achievement.updated_at
    } : undefined,
    created_at: dbAchievement.created_at || new Date().toISOString(),
    updated_at: dbAchievement.updated_at || new Date().toISOString()
  };
}

/**
 * Service to track and update achievement progress in real-time
 */
export const achievementTrackerService = {
  /**
   * Update trophy-related achievements for a user based on a post's trophy count
   */
  async updateTrophyAchievements(userId: string, postId: string, trophyCount: number): Promise<void> {
    try {
      // Get all trophy-related achievements for this user
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', userId)
        .eq('achievement->category', 'trophy');
      
      if (error) throw error;
      
      // Type cast before further processing
      const achievementsData = data as any[];
      
      // Get the highest trophy count on any post by this user
      // Note: We're using likes_count as a proxy for trophy count in the posts table
      const { data: postsData } = await supabase
        .from('posts')
        .select('id, likes_count') 
        .eq('user_id', userId)
        .order('likes_count', { ascending: false })
        .limit(1);
      
      // Convert DB data to our app model - safer type handling
      const achievements: UserAchievement[] = achievementsData.map(item => {
        const dbAchievement: SupabaseUserAchievement = {
          id: item.id,
          user_id: item.user_id,
          achievement_id: item.achievement_id,
          current_value: item.current_value,
          completed: item.completed,
          achievement: item.achievement,
          created_at: item.created_at,
          updated_at: item.updated_at,
          earned_at: item.earned_at
        };
        return mapToUserAchievement(dbAchievement);
      });
      
      // Handle posts data safely
      const posts = postsData ? postsData as Post[] : [];
      
      if (!achievements?.length) return;
      
      const highestTrophyCount = posts[0]?.likes_count || 0;
      
      // Update achievements based on trophy milestones
      const trophyMilestones = [
        { name: 'First Taste of Gold', target: 10 },
        { name: 'Crowd Favorite', target: 50 },
        { name: 'Viral Sensation', target: 100 },
        { name: 'Content King', target: 500 },
        { name: 'Clipt Icon', target: 1000 },
      ];
      
      for (const userAchievement of achievements) {
        // Find the corresponding milestone
        const milestone = trophyMilestones.find(m => 
          m.name === userAchievement.achievement?.name
        );
        
        if (!milestone) continue;
        
        // If this post's trophy count exceeds the milestone, mark as completed
        if (trophyCount >= milestone.target) {
          await supabase
            .from('user_achievements')
            .update({
              current_value: trophyCount,
              completed: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', userAchievement.id);
        } 
        // Otherwise, just update with the highest trophy count
        else if (highestTrophyCount > userAchievement.current_value) {
          await supabase
            .from('user_achievements')
            .update({
              current_value: highestTrophyCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', userAchievement.id);
        }
      }
    } catch (error) {
      console.error('Error updating trophy achievements:', error);
    }
  },
  
  /**
   * Update weekly leaderboard streak achievements
   */
  async updateLeaderboardAchievements(userId: string, consecutiveWeeks: number, totalWeeks: number): Promise<void> {
    try {
      // Get all leaderboard-related achievements for this user
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', userId)
        .in('achievement->name', [
          'Breaking In',
          'Back-to-Back',
          'Hot Streak',
          'Unstoppable',
          'Clipt Hall of Fame'
        ]);
      
      if (error) throw error;
      
      // Type cast before further processing
      const achievementsData = data as any[];
      
      // Convert DB data to our app model - safer type handling
      const achievements: UserAchievement[] = achievementsData.map(item => {
        const dbAchievement: SupabaseUserAchievement = {
          id: item.id,
          user_id: item.user_id,
          achievement_id: item.achievement_id,
          current_value: item.current_value,
          completed: item.completed,
          achievement: item.achievement,
          created_at: item.created_at,
          updated_at: item.updated_at,
          earned_at: item.earned_at
        };
        return mapToUserAchievement(dbAchievement);
      });
      
      if (!achievements?.length) return;
      
      // Update achievements based on streak milestones
      for (const userAchievement of achievements) {
        let shouldUpdate = false;
        let newValue = userAchievement.current_value;
        let isCompleted = userAchievement.completed;
        
        if (!userAchievement.achievement?.name) continue;
        
        switch (userAchievement.achievement.name) {
          case 'Breaking In':
            if (totalWeeks >= 1 && !isCompleted) {
              newValue = 1;
              isCompleted = true;
              shouldUpdate = true;
            }
            break;
          case 'Back-to-Back':
            if (consecutiveWeeks >= 2) {
              newValue = 2;
              isCompleted = true;
              shouldUpdate = true;
            } else if (consecutiveWeeks > userAchievement.current_value) {
              newValue = consecutiveWeeks;
              shouldUpdate = true;
            }
            break;
          case 'Hot Streak':
            if (consecutiveWeeks >= 5) {
              newValue = 5;
              isCompleted = true;
              shouldUpdate = true;
            } else if (consecutiveWeeks > userAchievement.current_value) {
              newValue = consecutiveWeeks;
              shouldUpdate = true;
            }
            break;
          case 'Unstoppable':
            if (consecutiveWeeks >= 10) {
              newValue = 10;
              isCompleted = true;
              shouldUpdate = true;
            } else if (consecutiveWeeks > userAchievement.current_value) {
              newValue = consecutiveWeeks;
              shouldUpdate = true;
            }
            break;
          case 'Clipt Hall of Fame':
            if (totalWeeks >= 25) {
              newValue = 25;
              isCompleted = true;
              shouldUpdate = true;
            } else if (totalWeeks > userAchievement.current_value) {
              newValue = totalWeeks;
              shouldUpdate = true;
            }
            break;
        }
        
        if (shouldUpdate) {
          await supabase
            .from('user_achievements')
            .update({
              current_value: newValue,
              completed: isCompleted,
              updated_at: new Date().toISOString()
            })
            .eq('id', userAchievement.id);
        }
      }
    } catch (error) {
      console.error('Error updating leaderboard achievements:', error);
    }
  },
  
  /**
   * Update follower-related achievements
   */
  async updateFollowerAchievements(userId: string, followerCount: number): Promise<void> {
    try {
      // Get all follower-related achievements for this user
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', userId)
        .in('achievement->name', [
          'First Follower',
          'Rising Star',
          'Trending Now',
          'Influencer Status',
          'Clipt Famous',
          'Elite Creator'
        ]);
      
      if (error) throw error;
      
      // Type cast before further processing
      const achievementsData = data as any[];
      
      // Convert DB data to our app model - safer type handling
      const achievements: UserAchievement[] = achievementsData.map(item => {
        const dbAchievement: SupabaseUserAchievement = {
          id: item.id,
          user_id: item.user_id,
          achievement_id: item.achievement_id,
          current_value: item.current_value,
          completed: item.completed,
          achievement: item.achievement,
          created_at: item.created_at,
          updated_at: item.updated_at,
          earned_at: item.earned_at
        };
        return mapToUserAchievement(dbAchievement);
      });
      
      if (!achievements?.length) return;
      
      // Update achievements based on follower milestones
      const followerMilestones = [
        { name: 'First Follower', target: 1 },
        { name: 'Rising Star', target: 1000 },
        { name: 'Trending Now', target: 5000 },
        { name: 'Influencer Status', target: 10000 },
        { name: 'Clipt Famous', target: 50000 },
        { name: 'Elite Creator', target: 100000 },
      ];
      
      for (const userAchievement of achievements) {
        // Find the corresponding milestone
        const milestone = followerMilestones.find(m => 
          m.name === userAchievement.achievement?.name
        );
        
        if (!milestone) continue;
        
        // If follower count exceeds the milestone, mark as completed
        if (followerCount >= milestone.target) {
          await supabase
            .from('user_achievements')
            .update({
              current_value: followerCount,
              completed: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', userAchievement.id);
        } 
        // Otherwise, just update the current follower count
        else if (followerCount > userAchievement.current_value) {
          await supabase
            .from('user_achievements')
            .update({
              current_value: followerCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', userAchievement.id);
        }
      }
    } catch (error) {
      console.error('Error updating follower achievements:', error);
    }
  },
  
  /**
   * Update subscriber-related achievements
   */
  async updateSubscriberAchievements(userId: string, subscriberCount: number): Promise<void> {
    try {
      // Get all subscriber-related achievements for this user
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', userId)
        .in('achievement->name', [
          'First Supporter',
          'Small but Mighty',
          'Streaming Star',
          'Big League Streamer',
          'Streaming Legend'
        ]);
      
      if (error) throw error;
      
      // Type cast before further processing
      const achievementsData = data as any[];
      
      // Convert DB data to our app model - safer type handling
      const achievements: UserAchievement[] = achievementsData.map(item => {
        const dbAchievement: SupabaseUserAchievement = {
          id: item.id,
          user_id: item.user_id,
          achievement_id: item.achievement_id,
          current_value: item.current_value,
          completed: item.completed,
          achievement: item.achievement,
          created_at: item.created_at,
          updated_at: item.updated_at,
          earned_at: item.earned_at
        };
        return mapToUserAchievement(dbAchievement);
      });
      
      if (!achievements?.length) return;
      
      // Update achievements based on subscriber milestones
      const subscriberMilestones = [
        { name: 'First Supporter', target: 1 },
        { name: 'Small but Mighty', target: 10 },
        { name: 'Streaming Star', target: 100 },
        { name: 'Big League Streamer', target: 1000 },
        { name: 'Streaming Legend', target: 10000 },
      ];
      
      for (const userAchievement of achievements) {
        // Find the corresponding milestone
        const milestone = subscriberMilestones.find(m => 
          m.name === userAchievement.achievement?.name
        );
        
        if (!milestone) continue;
        
        // If subscriber count exceeds the milestone, mark as completed
        if (subscriberCount >= milestone.target) {
          await supabase
            .from('user_achievements')
            .update({
              current_value: subscriberCount,
              completed: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', userAchievement.id);
        } 
        // Otherwise, just update the current subscriber count
        else if (subscriberCount > userAchievement.current_value) {
          await supabase
            .from('user_achievements')
            .update({
              current_value: subscriberCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', userAchievement.id);
        }
      }
    } catch (error) {
      console.error('Error updating subscriber achievements:', error);
    }
  },
  
  /**
   * Update engagement-related achievements
   */
  async updateEngagementAchievements(
    userId: string, 
    commentCount: number,
    trophiesGivenCount: number,
    commentLikesCount: number,
    commentRepliesCount: number
  ): Promise<void> {
    try {
      // Get all engagement-related achievements for this user
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', userId)
        .in('achievement->name', [
          'Hype Squad',
          'Super Supporter',
          'Engagement Master',
          'Conversation Starter',
          'Community Builder'
        ]);
      
      if (error) throw error;
      
      // Type cast before further processing
      const achievementsData = data as any[];
      
      // Convert DB data to our app model - safer type handling
      const achievements: UserAchievement[] = achievementsData.map(item => {
        const dbAchievement: SupabaseUserAchievement = {
          id: item.id,
          user_id: item.user_id,
          achievement_id: item.achievement_id,
          current_value: item.current_value,
          completed: item.completed,
          achievement: item.achievement,
          created_at: item.created_at,
          updated_at: item.updated_at,
          earned_at: item.earned_at
        };
        return mapToUserAchievement(dbAchievement);
      });
      
      if (!achievements?.length) return;
      
      // Update each achievement based on its specific metric
      for (const userAchievement of achievements) {
        let shouldUpdate = false;
        let newValue = userAchievement.current_value;
        let isCompleted = userAchievement.completed;
        
        if (!userAchievement.achievement?.name) continue;
        
        switch (userAchievement.achievement.name) {
          case 'Hype Squad': // Leave 50 comments
            if (commentCount >= 50) {
              newValue = 50;
              isCompleted = true;
              shouldUpdate = true;
            } else if (commentCount > userAchievement.current_value) {
              newValue = commentCount;
              shouldUpdate = true;
            }
            break;
          case 'Super Supporter': // Give 100 trophies
            if (trophiesGivenCount >= 100) {
              newValue = 100;
              isCompleted = true;
              shouldUpdate = true;
            } else if (trophiesGivenCount > userAchievement.current_value) {
              newValue = trophiesGivenCount;
              shouldUpdate = true;
            }
            break;
          case 'Engagement Master': // Comments have 1000 likes
            if (commentLikesCount >= 1000) {
              newValue = 1000;
              isCompleted = true;
              shouldUpdate = true;
            } else if (commentLikesCount > userAchievement.current_value) {
              newValue = commentLikesCount;
              shouldUpdate = true;
            }
            break;
          case 'Conversation Starter': // Get 100 replies
            if (commentRepliesCount >= 100) {
              newValue = 100;
              isCompleted = true;
              shouldUpdate = true;
            } else if (commentRepliesCount > userAchievement.current_value) {
              newValue = commentRepliesCount;
              shouldUpdate = true;
            }
            break;
        }
        
        if (shouldUpdate) {
          await supabase
            .from('user_achievements')
            .update({
              current_value: newValue,
              completed: isCompleted,
              updated_at: new Date().toISOString()
            })
            .eq('id', userAchievement.id);
        }
      }
    } catch (error) {
      console.error('Error updating engagement achievements:', error);
    }
  },
  
  /**
   * Get achievement progress by categories with organized structure
   */
  async getAchievementsByCategories(userId: string): Promise<Record<string, UserAchievement[]>> {
    try {
      // Get all achievements for this user with their progress
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', userId)
        .order('achievement->category');
      
      if (error) throw error;
      
      // Type cast before further processing
      const achievementsData = data as any[];
      
      // Convert DB data to our app model - safer type handling
      const achievements: UserAchievement[] = achievementsData.map(item => {
        const dbAchievement: SupabaseUserAchievement = {
          id: item.id,
          user_id: item.user_id,
          achievement_id: item.achievement_id,
          current_value: item.current_value,
          completed: item.completed,
          achievement: item.achievement,
          created_at: item.created_at,
          updated_at: item.updated_at,
          earned_at: item.earned_at
        };
        return mapToUserAchievement(dbAchievement);
      });
      
      if (!achievements?.length) return {};
      
      // Organize achievements by category
      const categorizedAchievements: Record<string, UserAchievement[]> = {};
      
      for (const userAchievement of achievements) {
        const category = userAchievement.achievement?.category || 'general';
        
        if (!categorizedAchievements[category]) {
          categorizedAchievements[category] = [];
        }
        
        categorizedAchievements[category].push(userAchievement);
      }
      
      return categorizedAchievements;
    } catch (error) {
      console.error('Error fetching achievements by categories:', error);
      return {};
    }
  }
};

export default achievementTrackerService;
