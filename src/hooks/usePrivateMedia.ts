import { useQueries } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, storageProjectUrl } from '@/integrations/supabase/client';
import { privateMediaReference } from '@/lib/private-media-reference';

function storageAddress(value?: string | null) {
  try { return new URL(value ?? '').pathname.startsWith('/storage/v1/object/'); }
  catch { return false; }
}

/** Signing uses the caller's normal client and verified object RLS, never a
 * service key. AuthContext clears this scoped query cache when identity changes.
 */
export function usePrivateMediaUrls(values: readonly (string | null | undefined)[], refresh = true) {
  const { user, loading } = useAuth();
  const references = values.map(value => value && storageProjectUrl ? privateMediaReference(value, storageProjectUrl, true) : null);
  const queries = useQueries({ queries: references.map((reference,index) => ({
    queryKey: ['private-media-url', storageProjectUrl, user?.id ?? 'guest', reference?.bucket ?? 'none', reference?.path ?? index],
    enabled: Boolean(reference) && !loading,
    queryFn: async () => {
      if (!reference || !storageProjectUrl) throw new Error('Media reference is unavailable.');
      const { data, error } = await supabase.storage.from(reference.bucket).createSignedUrl(reference.path, 300);
      if (error || !data?.signedUrl) throw new Error('Media access is unavailable.');
      const signedReference = privateMediaReference(data.signedUrl, storageProjectUrl, true);
      if (!signedReference || signedReference.bucket !== reference.bucket || signedReference.path !== reference.path) throw new Error('Media response could not be verified.');
      return data.signedUrl;
    },
    staleTime: 240_000,
    gcTime: 300_000,
    refetchInterval: refresh ? 240_000 : false as const,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: false,
  })) });
  return values.map((value,index) => {
    const query = queries[index];
    const invalid = !references[index] && storageAddress(value);
    return {
      src: invalid || query.isError ? undefined : references[index] ? query.data : value ?? undefined,
      isLoading: Boolean(references[index]) && (loading || query.isPending),
      isFetching: Boolean(references[index]) && query.isFetching,
      error: invalid ? new Error('Media belongs to an unavailable storage environment.') : query.error,
      retry: async () => invalid ? { isError: true } : references[index] ? query.refetch() : { isError: false },
    };
  });
}

export function usePrivateMediaUrl(value?: string | null, refresh = true) {
  return usePrivateMediaUrls([value], refresh)[0];
}
