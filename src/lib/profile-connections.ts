import type { SupabaseClient } from '@supabase/supabase-js';
export type ConnectionKind = 'followers' | 'following';
export type ConnectionProfile = { id: string; username: string | null; display_name: string | null; avatar_url: string | null };
export async function loadProfileConnections(client: Pick<SupabaseClient, 'from'>, profileId: string, kind: ConnectionKind, page = 0) {
  if (!profileId || !['followers', 'following'].includes(kind) || !Number.isInteger(page) || page < 0) throw new Error('Invalid connections request');
  const key = kind === 'followers' ? 'following_id' : 'follower_id';
  const other = kind === 'followers' ? 'follower_id' : 'following_id';
  const { data: rows, error } = await client.from('follows').select('follower_id,following_id')
    .eq(key, profileId).order(other).range(page * 50, page * 50 + 49).retry(false);
  if (error) throw error;
  const ids = [...new Set((rows || []).map(row => String(row[other])))];
  if (!ids.length) return { profiles: [] as ConnectionProfile[], hasNext: false };
  // Normal caller-scoped reads: invisible/blocked profiles remain absent.
  const { data: profiles, error: profileError } = await client.from('profiles')
    .select('id,username,display_name,avatar_url').in('id', ids).retry(false);
  if (profileError) throw profileError;
  const byId = new Map((profiles || []).map(profile => [profile.id, profile as ConnectionProfile]));
  return { profiles: ids.flatMap(id => byId.has(id) ? [byId.get(id)!] : []), hasNext: rows?.length === 50 };
}
