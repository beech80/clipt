import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Interfaces
interface LevelInfo {
  level: number;
  progress: number;
  totalXpForCurrentLevel: number;
  xpToNextLevel: number;
  prestige: number;
}

interface UserProgressInfo {
  id: string;
  xp: number;
  level: number;
  prestige: number;
  tokens: number;
  levelInfo: LevelInfo;
  unlocked_themes: string[];
}

// Supabase client is initialized elsewhere and imported here

// Extended profile type to include our custom fields for leveling
type ProfileWithLeveling = {
  id: string;
  xp: number;
  level: number;
  prestige: number;
  tokens: number;
  unlocked_themes?: string[];
  unlocked_badges?: string[];
  unlocked_titles?: string[];
  active_title?: string;
  badges?: string[];
  titles?: string[];
  [key: string]: any; // Allow other profile fields
};

// Constants
const MAX_LEVEL = 30; // Maximum level before prestige
const BASE_XP = 100; // XP required for first level
const SCALE_FACTOR = 50; // Additional XP per level
const TOTAL_XP_TO_MAX = 10000; // Approximate total XP to reach max level

/**
 * Leveling Service provides methods for managing user XP, levels, and prestige
 */
const levelingService = {
  /**
   * Calculate the XP required for a specific level
   * @param level The level to calculate XP for
   * @returns XP required to reach this level from the previous level
   */
  /**
   * Calculate the XP required for a specific level
   * Following the curve: level 1 = 100 XP, +50 XP per level after that
   * @param level The level to calculate XP for
   * @returns XP required to reach this level from the previous level
   */
  getXpRequiredForLevel: (level: number): number => {
    // Level 0 to level 1 requires BASE_XP
    if (level === 1) return BASE_XP;
    
    // Level 2 requires BASE_XP + SCALE_FACTOR
    if (level === 2) return BASE_XP + SCALE_FACTOR;
    
    // Formula: BASE_XP + (level-1) * SCALE_FACTOR
    // This gives us: L1=100, L2=150, L3=200, L4=250, etc.
    return BASE_XP + ((level - 1) * SCALE_FACTOR);
  },
  
  /**
   * Calculate the total XP required to reach a specific level
   * @param level The level to calculate XP for
   * @returns Total XP required to reach this level from level 1
   */
  getTotalXpForLevel: (level: number): number => {
    // Level 1 requires no XP
    if (level <= 1) return 0;
    
    // For level 2, it's just BASE_XP
    if (level === 2) return BASE_XP;
    
    // For the rest, we can use the formula to calculate directly:
    // Sum of: BASE_XP + BASE_XP + SCALE_FACTOR + BASE_XP + 2*SCALE_FACTOR + ... + BASE_XP + (level-2)*SCALE_FACTOR
    // = (level-1) * BASE_XP + SCALE_FACTOR * (0 + 1 + 2 + ... + (level-2))
    // The sum of consecutive integers from 0 to n is n(n+1)/2
    const consecutiveSum = (level - 2) * (level - 1) / 2;
    
    return (level - 1) * BASE_XP + SCALE_FACTOR * consecutiveSum;
  },
  
  /**
   * Calculate level from XP amount using the defined XP curve
   * Level 1: 0 XP (starting level)
   * Level 2: 100 XP
   * Level 3: 100 + 150 = 250 XP
   * Level 4: 100 + 150 + 200 = 450 XP
   * And so on...
   * 
   * @param xp Current XP amount
   * @returns Level calculated from XP (max MAX_LEVEL)
   */
  calculateLevelFromXp: (xp: number): number => {
    if (xp <= 0) return 0;
    
    let level = 0;
    let totalXpRequired = 0;
    
    // Keep increasing level until we find the right one or hit MAX_LEVEL
    while (level < MAX_LEVEL) {
      // Get XP needed for next level
      const nextLevelXp = levelingService.getXpRequiredForLevel(level + 1);
      totalXpRequired += nextLevelXp;
      
      // If user doesn't have enough XP for next level, they are at current level
      if (xp < totalXpRequired) break;
      
      // Otherwise they are at least the next level
      level++;
    }
    
    return level;
  },

  /**
   * Get detailed level info for a user
   * @param xp User's current XP
   * @returns Level info object with current level, progress to next level, and XP requirements
   */
  getUserLevelInfo: (xp: number): LevelInfo => {
    if (xp <= 0) {
      return {
        level: 0,
        progress: 0,
        totalXpForCurrentLevel: 0,
        xpToNextLevel: levelingService.getXpRequiredForLevel(1),
        prestige: 0
      };
    }
    
    const level = levelingService.calculateLevelFromXp(xp);
    const isMaxLevel = level >= MAX_LEVEL;
    
    // Calculate total XP needed for current level
    const totalXpForCurrentLevel = levelingService.getTotalXpForLevel(level);
    
    // XP needed for next level
    const xpToNextLevel = isMaxLevel ? 0 : levelingService.getXpRequiredForLevel(level + 1);
    
    // Current XP progress towards next level
    const currentLevelXp = xp - totalXpForCurrentLevel;
    
    // Progress percentage (0-100)
    const progress = isMaxLevel ? 100 : Math.floor((currentLevelXp / xpToNextLevel) * 100);
    
    return {
      level,
      progress,
      totalXpForCurrentLevel,
      xpToNextLevel,
      prestige: 0
    };
  },

  /**
   * Get user progress information including XP, level, tokens, prestige, etc.
   * @param userId User ID to get progress for
   * @returns User progress information
   */
  getUserProgress: async (userId: string): Promise<UserProgressInfo | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, xp, level, prestige, tokens, unlocked_themes')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user progress:', error);
        return null;
      }
      
      // Type assertion for profile data with safety check
      const profile = data as unknown as ProfileWithLeveling;
      
      // If unlocked_themes is not array, initialize it
      const unlocked_themes = Array.isArray(profile.unlocked_themes)
        ? profile.unlocked_themes
        : [];
      
      return {
        id: profile.id,
        xp: profile.xp || 0,
        level: profile.level || 1,
        prestige: profile.prestige || 0,
        tokens: profile.tokens || 0,
        unlocked_themes,
        levelInfo: levelingService.getUserLevelInfo(profile.xp || 0)
      };
    } catch (error) {
      console.error('Error in getUserProgress:', error);
      return null;
    }
  },

  /**
   * Award XP to a user and update their level
   * @param userId User ID
   * @param xp XP amount to award
   * @returns New level or null if error
   */
  awardXp: async (userId: string, xp: number): Promise<number | null> => {
    try {
      if (xp <= 0) {
        console.warn('Attempted to award zero or negative XP');
        return null;
      }
      
      // Get current user progress
      const { data, error } = await supabase
        .from('profiles')
        .select('xp, level')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      // Type assertion for profile data with safety check
      const profile = data as unknown as ProfileWithLeveling;
      
      // Calculate new XP and level
      const currentXp = profile.xp || 0;
      const currentLevel = profile.level || 1;
      const newXp = currentXp + xp;
      const newLevel = levelingService.calculateLevelFromXp(newXp);
      
      // Update user profile with new XP and level
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          xp: newXp,
          level: newLevel 
        } as unknown as ProfileWithLeveling) // Type assertion with double casting for safety
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating user XP:', updateError);
        return null;
      }
      
      // Show toast notification for XP gain
      toast.success(`+${xp} XP`, {
        description: 'Experience points earned!',
        position: 'bottom-right',
      });
      
      // If user leveled up, show level up notification
      if (newLevel > currentLevel) {
        toast.success(`Level Up! You're now level ${newLevel}`, {
          description: 'Congratulations!',
          position: 'bottom-right',
        });
        
        // Special milestone rewards
        if (newLevel % 5 === 0) {
          toast.success(`Reached Level ${newLevel}!`, {
            description: `You've earned a special milestone reward!`,
            icon: '🏆',
            duration: 5000
          });
        }
      }
      
      return newLevel;
    } catch (error) {
      console.error('Error in awardXp:', error);
      return null;
    }
  },
  
  /**
   * Award tokens to a user
   * @param userId User ID
   * @param tokens Token amount to award
   * @returns Boolean success
   */
  awardTokens: async (userId: string, tokens: number): Promise<boolean> => {
    try {
      if (tokens <= 0) {
        console.warn('Attempted to award zero or negative tokens');
        return false;
      }
      
      // Get current token balance
      const { data, error } = await supabase
        .from('profiles')
        .select('tokens')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return false;
      }
      
      // Type assertion for profile data with safety check
      const profile = data as unknown as ProfileWithLeveling;
      
      const currentTokens = profile.tokens || 0;
      const newTokens = currentTokens + tokens;
      
      // Update user profile with new token balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ tokens: newTokens } as unknown as ProfileWithLeveling) // Type assertion with double casting for safety
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating user tokens:', updateError);
        return false;
      }
      
      // Show toast notification
      toast.success(`+${tokens} Tokens`, {
        description: 'Tokens added to your account!',
        position: 'bottom-right',
      });
      
      return true;
    } catch (error) {
      console.error('Error in awardTokens:', error);
      return false;
    }
  },
  
  /**
   * Apply prestige to user account (reset level but keep benefits)
   * @param userId User ID
   * @returns Boolean success
   */
  applyPrestige: async (userId: string): Promise<boolean> => {
    try {
      // Get current user level data
      const { data, error } = await supabase
        .from('profiles')
        .select('level, prestige, unlocked_themes, badges, titles')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return false;
      }
      
      // Type assertion for profile data with safety check
      const profile = data as unknown as ProfileWithLeveling;
      
      const currentLevel = profile.level || 1;
      const currentPrestige = profile.prestige || 0;
      
      // Check if user is eligible for prestige (level 30)
      if (currentLevel < MAX_LEVEL) {
        toast.error("You need to reach level 30 before you can prestige", { 
          duration: 3000 
        });
        return false;
      }
      
      if (currentPrestige > 0) {
        toast.error("You've already achieved prestige", { 
          duration: 3000 
        });
        return false;
      }
      
      // Define prestige rewards
      const prestigeBadge = `prestige_${currentPrestige + 1}`;
      const prestigeTitle = `Prestige ${currentPrestige + 1} Master`;
      const prestigeTheme = `prestige_theme_${currentPrestige + 1}`;
      
      // Prepare unlocked themes array
      const unlockedThemes = profile.unlocked_themes || [];
      if ((currentPrestige + 1) % 2 === 0) {
        unlockedThemes.push(prestigeTheme);
      }
      
      // Prepare badges array
      const badges = profile.badges || [];
      badges.push(prestigeBadge);
      
      // Prepare titles array
      const titles = profile.titles || [];
      titles.push(prestigeTitle);
      
      // Update user profile with prestige changes
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          xp: 0,
          level: 1,
          prestige: currentPrestige + 1,
          unlocked_themes: unlockedThemes,
          badges: badges,
          titles: titles
        } as unknown as ProfileWithLeveling) // Type assertion with double casting for safety
        .eq('id', userId);
      
      // Show prestige notification
      toast.success('Prestige 1 Achieved!', {
        description: 'You are now a Clipt Legend with exclusive benefits!',
        icon: '✨',
        duration: 6000
      });
      
      return true;
    } catch (error) {
      console.error('Error in applyPrestige:', error);
      return false;
    }
  },
  
  /**
   * Spend tokens from user balance
   * @param userId User ID
   * @param tokens Amount to spend
   * @returns Boolean success
   */
  spendTokens: async (userId: string, tokens: number): Promise<boolean> => {
    try {
      if (tokens <= 0) {
        console.warn('Attempted to spend zero or negative tokens');
        return false;
      }
      
      // Get current token balance
      const { data, error } = await supabase
        .from('profiles')
        .select('tokens')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return false;
      }
      
      // Type assertion for profile data with safety check
      const profile = data as unknown as ProfileWithLeveling;
      
      // Check if user has enough tokens
      const currentTokens = profile.tokens || 0;
      if (currentTokens < tokens) {
        toast.error(`Not enough tokens! You have ${currentTokens} tokens.`, {
          position: 'bottom-right',
        });
        return false;
      }
      
      // Update token balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ tokens: currentTokens - tokens } as unknown as ProfileWithLeveling) // Type assertion with double casting for safety
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating tokens:', updateError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in spendTokens:', error);
      return false;
    }
  },
  
  /**
   * Use tokens for a specific purpose with notification
   * @param userId User ID spending tokens
   * @param amount Amount of tokens to spend
   * @param purpose Purpose for spending tokens
   * @returns Boolean success
   */
  useTokens: async (userId: string, amount: number, purpose: string): Promise<boolean> => {
    try {
      if (amount <= 0) {
        console.warn('Attempted to use zero or negative tokens');
        return false;
      }
      
      // Check if user has enough tokens
      const { data, error } = await supabase
        .from('profiles')
        .select('tokens')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return false;
      }
      
      // Type assertion for profile data with safety check
      const profile = data as unknown as ProfileWithLeveling;
      
      const currentTokens = profile.tokens || 0;
      
      if (currentTokens < amount) {
        toast.error(`Not enough tokens for ${purpose}!`, {
          description: `You need ${amount} tokens but only have ${currentTokens}`,
          position: 'bottom-right',
          duration: 3000
        });
        return false;
      }
      
      // Update token balance
      const newTokens = currentTokens - amount;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          tokens: newTokens
        } as unknown as ProfileWithLeveling) // Type assertion with double casting for safety
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating tokens:', updateError);
        return false;
      }
      
      // Show tokens spent notification
      toast.success(`${amount} tokens spent`, {
        description: purpose,
        position: 'bottom-right',
        duration: 3000
      });
      
      return true;
    } catch (error) {
      console.error('Error in useTokens:', error);
      return false;
    }
  }
};

export default levelingService;
export type { LevelInfo, UserProgressInfo };
