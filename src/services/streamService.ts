import { supabase } from '@/lib/supabase';
import type { Tables } from '@/integrations/supabase/types';

const publicFields = 'id, title, description, user_id, is_live, started_at, ended_at, thumbnail_url, viewer_count, created_at, playback_url' as const;
export type Stream = Pick<Tables<'streams'>, 'id' | 'title' | 'description' | 'user_id' | 'is_live' | 'started_at' | 'ended_at' | 'thumbnail_url' | 'viewer_count' | 'created_at' | 'playback_url'>;
type StreamMetadata = Pick<Stream, 'title' | 'description' | 'thumbnail_url'>;
export interface StreamResponse<T = Stream> { data: T | null; error: Error | null }
export interface StreamCredentials { id: string; rtmp_url: string; stream_key: string }
export interface MuxTestLiveStatus { id: string; is_live: boolean; provider_status: 'active' | 'idle' | 'disabled'; playback_url: string; provider_stream_id?: string; checked_at?: string; test: true }
export async function getMuxTestLiveStatus(streamId: string): Promise<StreamResponse<MuxTestLiveStatus>> {
  try {
    if(!import.meta.env.DEV)throw new Error('Local development live pilot only');
    await currentUser();
    const {data,error}=await supabase.functions.invoke('mux-test-live',{body:{action:'status',streamId}});
    if(error){
      let detail='Verified provider status unavailable. The pilot must be securely configured.';
      if(error.context instanceof Response){
        detail+=' HTTP '+error.context.status+'.';
        try{
          const rejected=await error.context.clone().json();
          const safe=['Mux credentials were rejected','Mux token lacks permission to read this stream',
            'Mux test stream was not found in the configured token environment','Mux request limit reached; retry later',
            'Development live pilot is disabled','Designated stream owner required','This service is not configured',
            'Verify your authenticator to continue','Provider status unavailable; no live status assumed',
            'Mux stream identity could not be verified','Mux resource is not a verified test stream; paid streaming remains blocked',
            'Mux test duration could not be verified within the approved limit','Mux returned an unsupported live status',
            'Mux public test playback could not be verified','Mux response could not be verified',
            'Mux credential format is invalid; copy the API token pair without quotes or extra text',
            'Mux connection timed out; no live status assumed','Mux connection failed before an HTTP response; no live status assumed',
            ...['authentication','configuration','ownership','credentials','provider connection','provider validation'].map(phase=>'Live pilot failed during '+phase+'; no live status assumed')];
          if(safe.includes(rejected?.error))detail+=' '+rejected.error;
        }catch{/* Never expose raw provider responses or credentials. */}
      }
      throw new Error(detail);
    }
    if(data?.id!==streamId||data.test!==true||!['active','idle','disabled'].includes(data.provider_status)
      ||data.is_live!==(data.provider_status==='active')||typeof data.playback_url!=='string'
      ||!/^https:\/\/stream\.mux\.com\/[A-Za-z0-9]+\.m3u8$/.test(data.playback_url))
      throw new Error('Provider response could not be verified');
    return {data,error:null};
  }catch(error){return failure(error);}
}
const failure = (error: unknown) => ({ data: null, error: error instanceof Error ? error : new Error('Stream operation failed') });

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Sign in to manage your stream');
  return data.user;
}

export async function createStream(params: StreamMetadata): Promise<StreamResponse> {
  try {
    const user = await currentUser();
    const { data, error } = await supabase.from('streams').insert({
      user_id: user.id, title: params.title, description: params.description, thumbnail_url: params.thumbnail_url,
    }).select(publicFields).single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) { return failure(error); }
}

export async function getStreamById(streamId: string): Promise<StreamResponse> {
  try {
    const { data, error } = await supabase.from('streams').select(publicFields).eq('id', streamId).single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) { return failure(error); }
}

export async function getUserStream(): Promise<StreamResponse> {
  try {
    const user = await currentUser();
    const { data, error } = await supabase.from('streams').select(publicFields)
      .eq('user_id', user.id).order('is_live', { ascending: false }).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return { data, error: null };
  } catch (error) { return failure(error); }
}

// Credentials are never queried through public/browser table grants.
export async function getStreamCredentials(streamId: string): Promise<StreamResponse<StreamCredentials>> {
  try {
    await currentUser();
    const { data, error } = await supabase.functions.invoke('oauth', { body: { action: 'get_stream_credentials', streamId } });
    if (error) throw error;
    if (!data || data.id !== streamId || typeof data.rtmp_url !== 'string' || !data.rtmp_url || typeof data.stream_key !== 'string' || !data.stream_key) {
      throw new Error('Stream credentials are not configured');
    }
    return { data: { id: data.id, rtmp_url: data.rtmp_url, stream_key: data.stream_key }, error: null };
  } catch (error) { return failure(error); }
}

async function lifecycle(streamId: string, action: 'initialize_stream' | 'end_stream'): Promise<StreamResponse> {
  try {
    await currentUser();
    const { error } = await supabase.functions.invoke('oauth', { body: { action, streamId } });
    if (error) throw error;
    // Initializing ingestion is not proof that video is live. Read the backend state.
    return getStreamById(streamId);
  } catch (error) { return failure(error); }
}
export const startStream = (streamId: string) => lifecycle(streamId, 'initialize_stream');
export const endStream = (streamId: string) => lifecycle(streamId, 'end_stream');

export async function updateStream(streamId: string, updates: Partial<StreamMetadata>): Promise<StreamResponse> {
  try {
    const user = await currentUser();
    const metadata: Partial<StreamMetadata> = {};
    for (const key of ['title', 'description', 'thumbnail_url'] as const) {
      if (updates[key] !== undefined) metadata[key] = updates[key];
    }
    const { data, error } = await supabase.from('streams').update(metadata).eq('id', streamId).eq('user_id', user.id).select(publicFields).single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) { return failure(error); }
}

export async function regenerateStreamKey(_streamId: string): Promise<StreamResponse<StreamCredentials>> {
  // A local random value cannot rotate a real provider's ingest credential.
  return failure(new Error('Provider-backed stream key rotation is not configured'));
}

export async function getActiveStreams(limit = 10, page = 0): Promise<StreamResponse<{ streams: Stream[]; total: number; page: number; limit: number; hasMore: boolean }>> {
  try {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(page) || page < 0) throw new Error('Invalid pagination');
    const offset = page * limit;
    const { data, error, count } = await supabase.from('streams').select(publicFields, { count: 'exact' })
      .eq('is_live', true).order('viewer_count', { ascending: false }).order('id').range(offset, offset + limit - 1);
    if (error) throw error;
    return { data: { streams: data ?? [], total: count ?? 0, page, limit, hasMore: offset + limit < (count ?? 0) }, error: null };
  } catch (error) { return failure(error); }
}
