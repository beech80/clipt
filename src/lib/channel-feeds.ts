import {supabase} from '@/lib/supabase';
import {storageProjectUrl} from '@/integrations/supabase/client';
import {DISCOVERY_PAGE_SIZE} from '@/lib/discovery-feeds';
export const verifiedLiveBackend=storageProjectUrl==='https://akiksrlzdqvipqbbjxpw.supabase.co';
export function validChannelGame(id:string){return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);}
function checkedGame(id?:string|null){if(id&&!validChannelGame(id))throw new Error('Choose a game from Clipt Channels.');}
export async function channelMediaPage(kind:'clipts'|'posts',gameId:string|undefined,page:number,signal?:AbortSignal){
  checkedGame(gameId);if(!Number.isSafeInteger(page)||page<0||page>100000)throw new Error('Invalid channel page.');
  let query=supabase.from(kind==='clipts'?'public_clipt_discovery':'public_channel_posts')
    .select('id,content,image_url,created_at,game_id,user_id,username,avatar_url')
    .order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*DISCOVERY_PAGE_SIZE,(page+1)*DISCOVERY_PAGE_SIZE);
  if(gameId)query=query.eq('game_id',gameId);if(signal)query=query.abortSignal(signal);
  const {data,error}=await query.retry(false);if(error)throw error;
  return {items:(data??[]).slice(0,DISCOVERY_PAGE_SIZE),more:(data?.length??0)>DISCOVERY_PAGE_SIZE};
}
export async function channelLivePage(gameId:string|undefined,cursor:string|null,following:string[]|undefined,signal?:AbortSignal){
  checkedGame(gameId);if(cursor&&!validChannelGame(cursor))throw new Error('Invalid live page.');
  if(following&&following.length===0)return {items:[],next:null};
  let query=supabase.from('streams').select('id,user_id,title,description,thumbnail_url,viewer_count,game_id')
    .eq('is_live',true).order('id',{ascending:true}).limit(24);
  if(gameId)query=query.eq('game_id',gameId);if(cursor)query=query.gt('id',cursor);if(following)query=query.in('user_id',following);if(signal)query=query.abortSignal(signal);
  const {data,error}=await query.retry(false);if(error)throw error;
  const rows=data??[];
  const items=verifiedLiveBackend?await Promise.all(rows.map(async row=>{const result=await supabase.rpc('get_verified_live_status',{p_stream_id:row.id});if(result.error)throw result.error;return result.data?.[0]?.is_live?{...row,viewer_count:null}:null;})):rows;
  return {items:items.filter((row):row is NonNullable<typeof row>=>row!==null),next:rows.length===24?rows.at(-1)!.id:null};
}
