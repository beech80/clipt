-- Add columns for XP and token rewards if they don't exist yet
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'xp_reward') THEN
        ALTER TABLE public.achievements ADD COLUMN xp_reward INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'token_reward') THEN
        ALTER TABLE public.achievements ADD COLUMN token_reward INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add XP and token rewards to existing achievements based on the specified plan
UPDATE public.achievements SET xp_reward = 200, token_reward = 5 WHERE name = 'First Taste of Gold';
UPDATE public.achievements SET xp_reward = 300, token_reward = 8 WHERE name = 'Crowd Favorite';
UPDATE public.achievements SET xp_reward = 500, token_reward = 10 WHERE name = 'Viral Sensation';
UPDATE public.achievements SET xp_reward = 800, token_reward = 15 WHERE name = 'Content King';
UPDATE public.achievements SET xp_reward = 1000, token_reward = 20 WHERE name = 'Clipt Icon';

-- Weekly leaderboard achievements
UPDATE public.achievements SET xp_reward = 300, token_reward = 8 WHERE name = 'Breaking In';
UPDATE public.achievements SET xp_reward = 400, token_reward = 10 WHERE name = 'Back-to-Back';
UPDATE public.achievements SET xp_reward = 500, token_reward = 12 WHERE name = 'Hot Streak';
UPDATE public.achievements SET xp_reward = 600, token_reward = 12 WHERE name = 'Unstoppable';
UPDATE public.achievements SET xp_reward = 800, token_reward = 15 WHERE name = 'Clipt Hall of Fame';

-- Follower achievements
UPDATE public.achievements SET xp_reward = 150, token_reward = 3 WHERE name = 'First Follower';
UPDATE public.achievements SET xp_reward = 300, token_reward = 5 WHERE name = 'Rising Star';
UPDATE public.achievements SET xp_reward = 400, token_reward = 8 WHERE name = 'Trending Now';
UPDATE public.achievements SET xp_reward = 500, token_reward = 10 WHERE name = 'Influencer Status';
UPDATE public.achievements SET xp_reward = 600, token_reward = 12 WHERE name = 'Clipt Famous';
UPDATE public.achievements SET xp_reward = 800, token_reward = 15 WHERE name = 'Elite Creator';

-- Streaming subscriber achievements
UPDATE public.achievements SET xp_reward = 150, token_reward = 3 WHERE name = 'First Supporter';
UPDATE public.achievements SET xp_reward = 300, token_reward = 6 WHERE name = 'Small but Mighty';
UPDATE public.achievements SET xp_reward = 500, token_reward = 10 WHERE name = 'Streaming Star';
UPDATE public.achievements SET xp_reward = 700, token_reward = 14 WHERE name = 'Big League Streamer';
UPDATE public.achievements SET xp_reward = 800, token_reward = 16 WHERE name = 'Streaming Legend';

-- Engagement achievements
UPDATE public.achievements SET xp_reward = 200, token_reward = 4 WHERE name = 'Hype Squad';
UPDATE public.achievements SET xp_reward = 250, token_reward = 5 WHERE name = 'Super Supporter';
UPDATE public.achievements SET xp_reward = 400, token_reward = 8 WHERE name = 'Conversation Starter';
UPDATE public.achievements SET xp_reward = 500, token_reward = 10 WHERE name = 'Community Builder';

-- Sharing achievements
UPDATE public.achievements SET xp_reward = 150, token_reward = 3 WHERE name = 'Signal Booster';
UPDATE public.achievements SET xp_reward = 300, token_reward = 6 WHERE name = 'Clipt Evangelist';
UPDATE public.achievements SET xp_reward = 350, token_reward = 7 WHERE name = 'The Connector';
UPDATE public.achievements SET xp_reward = 400, token_reward = 8 WHERE name = 'Trendsetter';
UPDATE public.achievements SET xp_reward = 500, token_reward = 10 WHERE name = 'Algorithm Whisperer';

-- Collab achievements
UPDATE public.achievements SET xp_reward = 300, token_reward = 6 WHERE name = 'Duo Dynamic';
UPDATE public.achievements SET xp_reward = 400, token_reward = 8 WHERE name = 'Mentor Mode';
UPDATE public.achievements SET xp_reward = 350, token_reward = 7 WHERE name = 'The Networker';
UPDATE public.achievements SET xp_reward = 450, token_reward = 9 WHERE name = 'Creator Spotlight';
UPDATE public.achievements SET xp_reward = 500, token_reward = 10 WHERE name = 'Industry Connector';

-- Hidden/special achievements
UPDATE public.achievements SET xp_reward = 500, token_reward = 10 WHERE name = 'OG Clipt Creator';
UPDATE public.achievements SET xp_reward = 300, token_reward = 6 WHERE name = 'Day One Grinder';
UPDATE public.achievements SET xp_reward = 400, token_reward = 8 WHERE name = 'Mystery Viral';
UPDATE public.achievements SET xp_reward = 350, token_reward = 7 WHERE name = 'Shadow Supporter';
UPDATE public.achievements SET xp_reward = 1000, token_reward = 20 WHERE name = 'The Legend of Clipt';

-- Daily achievements
UPDATE public.achievements SET xp_reward = 100, token_reward = 2 WHERE name = 'Complete 4 Daily Quests';
UPDATE public.achievements SET xp_reward = 100, token_reward = 2 WHERE name = 'Earn Your Way';

-- Special achievements
UPDATE public.achievements SET xp_reward = 100, token_reward = 3 WHERE name = 'Welcome to Clipt';
UPDATE public.achievements SET xp_reward = 200, token_reward = 4 WHERE name = 'Social Butterfly';

-- Calculate current levels for users based on their completed achievements
CREATE OR REPLACE FUNCTION calculate_user_levels() RETURNS void AS $$
DECLARE
    user_record RECORD;
    total_xp INTEGER;
    new_level INTEGER;
BEGIN
    FOR user_record IN SELECT id FROM public.profiles LOOP
        -- Calculate total XP from completed achievements
        SELECT COALESCE(SUM(a.xp_reward), 0) INTO total_xp
        FROM public.achievement_progress ap
        JOIN public.achievements a ON ap.achievement_id = a.id
        WHERE ap.user_id = user_record.id AND ap.completed = true;
        
        -- Determine level based on XP
        -- Follow the XP curve: Level 1: 100 XP, Level 2: +150 XP, etc.
        new_level := 1;
        DECLARE
            level_xp INTEGER := 0;
            next_level_req INTEGER := 100;
            remaining_xp INTEGER := total_xp;
        BEGIN
            WHILE remaining_xp >= next_level_req AND new_level < 30 LOOP
                remaining_xp := remaining_xp - next_level_req;
                new_level := new_level + 1;
                next_level_req := 100 + (new_level - 1) * 50;
            END LOOP;
        END;
        
        -- Update user's level and XP
        UPDATE public.profiles
        SET xp = total_xp,
            level = new_level
        WHERE id = user_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function to update all users' levels
SELECT calculate_user_levels();
