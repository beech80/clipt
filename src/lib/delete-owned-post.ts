import type { SupabaseClient } from '@supabase/supabase-js';

/** A zero-row RLS response is not evidence of deletion. Never retry a mutation. */
export async function deleteOwnedPost(client: SupabaseClient, postId: string, ownerId: string) {
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user || user.id !== ownerId) throw new Error('Sign in as the post owner to delete it.');
  const { data, error } = await client.from('posts').delete()
    .eq('id', postId).eq('user_id', ownerId).select('id').retry(false).maybeSingle();
  if (error || !data || data.id !== postId) throw new Error('Deletion was not confirmed. Refresh before trying again.');
}
