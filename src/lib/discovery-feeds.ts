import { supabase } from '@/lib/supabase';
import { hashtagSearchExpression } from '@/utils/hashtagUtils';

export const DISCOVERY_PAGE_SIZE = 24;
function pageRange(page: number) {
  if (!Number.isSafeInteger(page) || page < 0 || page > 100000) throw new Error('Invalid discovery page.');
  return [page * DISCOVERY_PAGE_SIZE, page * DISCOVERY_PAGE_SIZE + DISCOVERY_PAGE_SIZE] as const;
}
export async function hashtagFeed(tag: string, page: number, signal?: AbortSignal) {
  const expression = hashtagSearchExpression(tag);
  const [from, to] = pageRange(page);
  let query = supabase.from('public_clipt_discovery')
    .select('id,content,image_url,created_at,game_id,user_id,username,avatar_url')
    .filter('content', 'imatch', expression)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.retry(false);
  if (error) throw error;
  const rows = data ?? [];
  return { items: rows.slice(0, DISCOVERY_PAGE_SIZE), more: rows.length > DISCOVERY_PAGE_SIZE };
}
export async function gameVideoFeed(gameId: string, page: number, signal?: AbortSignal) {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(gameId)) throw new Error('Choose a game from the Clipt catalog.');
  const [from, to] = pageRange(page);
  // This existing server-filtered invoker view contains only discoverable videos.
  let query = supabase.from('public_clipt_discovery')
    .select('id,content,image_url,created_at,game_id,user_id,username,avatar_url')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.retry(false);
  if (error) throw error;
  const rows = data ?? [];
  return { items: rows.slice(0, DISCOVERY_PAGE_SIZE), more: rows.length > DISCOVERY_PAGE_SIZE };
}
