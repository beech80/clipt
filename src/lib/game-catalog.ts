import { supabase } from '@/lib/supabase';
import { searchPattern } from '@/lib/search-pattern';

/** Stable pages expose the entire configured catalog, not only its first matches. */
export async function gameCatalogPage(term: string, page: number, signal?: AbortSignal) {
  let request = supabase.from('games').select('id,name,cover_url').order('name').order('id').range(page * 40, page * 40 + 39);
  if (term.trim()) request = request.ilike('name', searchPattern(term.trim()));
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request.retry(false);
  if (error) throw error;
  return data;
}

export async function completeGameCatalog(term: string, signal?: AbortSignal) {
  const rows: Awaited<ReturnType<typeof gameCatalogPage>> = [];
  for (let page = 0; ; page++) {
    const result = await gameCatalogPage(term, page, signal);
    rows.push(...result);
    if (result.length < 40) return rows;
  }
}
