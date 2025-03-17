import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { achievementService } from '@/services/achievementService';

// Achievement tracking utilities
export const achievementTracker = {
  // Track trophy-related achievements
  async trackTrophyAchievement(userId: string, postId: string, trophyCount: number): Promise<void> {
    if (!userId) return;
    
    try {
      // Check for trophy milestones
      const trophyMilestones = [
        { name: 'First Taste of Gold', threshold: 10 },
        { name: 'Crowd Favorite', threshold: 50 },
        { name: 'Viral Sensation', threshold: 100 },
        { name: 'Content King', threshold: 500 },
        { name: 'Clipt Icon', threshold: 1000 }
      ];
      
      // Find the highest achieved milestone
      const achievedMilestone = trophyMilestones
        .filter(milestone => trophyCount >= milestone.threshold)
        .sort((a, b) => b.threshold - a.threshold)[0];
      
      if (achievedMilestone) {
        // Get the achievement ID for this milestone
        const { data: achievement } = await supabase
          .from('achievements')
          .select('id')
          .eq('name', achievedMilestone.name)
          .single();
        
        if (achievement) {
          try {
            // Check if the user already has this achievement
            const { data: existingProgress } = await supabase
              .from('achievement_progress')
              .select('id, current_value')
              .eq('user_id', userId)
              .eq('achievement_id', achievement.id)
              .single();
            
            // If not at maximum value, update it
            const isCompleted = existingProgress && existingProgress.current_value >= achievedMilestone.threshold;
            
            if (!isCompleted) {
              await achievementService.updateAchievementProgress(
                userId, 
                achievement.id, 
                achievedMilestone.threshold
              );
              
              toast.success(`Achievement Unlocked: ${achievedMilestone.name}!`);
            }
          } catch (error) {
            console.error('Error checking achievement progress:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error tracking trophy achievement:', error);
    }
  },
  
  // Track sharing-related achievements
  async trackSharingAchievement(userId: string): Promise<void> {
    if (!userId) return;
    
    try {
      // Check for the achievement first
      const { data: achievement } = await supabase
        .from('achievements')
        .select('id')
        .eq('name', 'Signal Booster')
        .single();
        
      if (achievement) {
        // Check the current progress
        const { data: existingProgress } = await supabase
          .from('achievement_progress')
          .select('id, current_value')
          .eq('user_id', userId)
          .eq('achievement_id', achievement.id)
          .single();
          
        // Increment the count by 1 for this share
        const currentValue = (existingProgress?.current_value || 0) + 1;
        
        // If we've reached 10 shares, award the achievement
        if (currentValue === 10) {
          await achievementService.updateAchievementProgress(
            userId,
            achievement.id,
            10
          );
          
          toast.success('Achievement Unlocked: Signal Booster!');
        } else {
          // Just update the progress
          await achievementService.updateAchievementProgress(
            userId,
            achievement.id,
            currentValue
          );
        }
      }
    } catch (error) {
      console.error('Error tracking sharing achievement:', error);
    }
  },
  
  // Track weekly leaderboard achievements
  async trackWeeklyLeaderboardAchievement(userId: string, consecutiveWeeks: number): Promise<void> {
    if (!userId) return;
    
    try {
      const leaderboardMilestones = [
        { name: 'Breaking In', threshold: 1 },
        { name: 'Back-to-Back', threshold: 2 },
        { name: 'Hot Streak', threshold: 5 },
        { name: 'Unstoppable', threshold: 10 },
        { name: 'Clipt Hall of Fame', threshold: 25 }
      ];
      
      // Find the highest achieved milestone
      const achievedMilestone = leaderboardMilestones
        .filter(milestone => consecutiveWeeks >= milestone.threshold)
        .sort((a, b) => b.threshold - a.threshold)[0];
      
      if (achievedMilestone) {
        // Get the achievement ID for this milestone
        const { data: achievement } = await supabase
          .from('achievements')
          .select('id')
          .eq('name', achievedMilestone.name)
          .single();
        
        if (achievement) {
          try {
            // Check if the user already has this achievement
            const { data: existingProgress } = await supabase
              .from('achievement_progress')
              .select('id, current_value')
              .eq('user_id', userId)
              .eq('achievement_id', achievement.id)
              .single();
            
            // If not at maximum value, update it
            const isCompleted = existingProgress && existingProgress.current_value >= achievedMilestone.threshold;
            
            if (!isCompleted) {
              await achievementService.updateAchievementProgress(
                userId, 
                achievement.id, 
                achievedMilestone.threshold
              );
              
              toast.success(`Achievement Unlocked: ${achievedMilestone.name}!`);
            }
          } catch (error) {
            console.error('Error checking achievement progress:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error tracking leaderboard achievement:', error);
    }
  },
  
  // Track follower-related achievements
  async trackFollowerAchievement(userId: string, followerCount: number): Promise<void> {
    if (!userId) return;
    
    try {
      const followerMilestones = [
        { name: 'First Follower', threshold: 1 },
        { name: 'Rising Star', threshold: 1000 },
        { name: 'Trending Now', threshold: 5000 },
        { name: 'Influencer Status', threshold: 10000 },
        { name: 'Clipt Famous', threshold: 50000 },
        { name: 'Elite Creator', threshold: 100000 }
      ];
      
      // Find the highest achieved milestone
      const achievedMilestone = followerMilestones
        .filter(milestone => followerCount >= milestone.threshold)
        .sort((a, b) => b.threshold - a.threshold)[0];
      
      if (achievedMilestone) {
        // Get the achievement ID for this milestone
        const { data: achievement } = await supabase
          .from('achievements')
          .select('id')
          .eq('name', achievedMilestone.name)
          .single();
        
        if (achievement) {
          try {
            // Check if the user already has this achievement
            const { data: existingProgress } = await supabase
              .from('achievement_progress')
              .select('id, current_value')
              .eq('user_id', userId)
              .eq('achievement_id', achievement.id)
              .single();
            
            // If not at maximum value, update it
            const isCompleted = existingProgress && existingProgress.current_value >= achievedMilestone.threshold;
            
            if (!isCompleted) {
              await achievementService.updateAchievementProgress(
                userId, 
                achievement.id, 
                achievedMilestone.threshold
              );
              
              toast.success(`Achievement Unlocked: ${achievedMilestone.name}!`);
            }
          } catch (error) {
            console.error('Error checking achievement progress:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error tracking follower achievement:', error);
    }
  }
};

export default achievementTracker;
