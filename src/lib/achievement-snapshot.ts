import { supabase } from '@/lib/supabase';
import type { Tables } from '@/integrations/supabase/types';
export type VerifiedProgress = {
 id: string | null; user_id: string; achievement_id: string; current_value: number;
 created_at: string | null; updated_at: string | null; achievement: Tables<'achievements'>;
 tracked: boolean; completed: boolean; earned_at: string | null;
};
export type AchievementSnapshot = { trophies: number; rows: VerifiedProgress[] };
export async function loadAchievementSnapshot(): Promise<AchievementSnapshot> {
 const {data,error}=await supabase.rpc('sync_my_achievements').retry(false);
 if(error)throw error;
 if(!data || typeof data!=='object' || Array.isArray(data) || !Array.isArray(data.rows) || typeof data.trophies!=='number')
  throw new Error('Achievement totals could not be verified.');
 return data as unknown as AchievementSnapshot;
}
