import {supabase} from '@/lib/supabase';
import {searchPattern} from '@/lib/search-pattern';
export const GAME_FIELDS='id,name,cover_url,igdb_id,release_year,platforms,member_ids';
export async function gameCatalogPage(term:string,page:number,signal?:AbortSignal){
 if(!Number.isSafeInteger(page)||page<0)throw new Error('Invalid game page');
 let query=supabase.from('game_channel_catalog').select(GAME_FIELDS).order('name').order('id').range(page*40,page*40+39);
 if(term.trim())query=query.ilike('name',searchPattern(term.trim()));if(signal)query=query.abortSignal(signal);
 const {data,error}=await query.retry(false);if(error)throw error;return data??[];
}
export async function completeGameCatalog(term:string,signal?:AbortSignal){
 const rows:Awaited<ReturnType<typeof gameCatalogPage>>=[];
 for(let page=0;;page++){const result=await gameCatalogPage(term,page,signal);rows.push(...result);if(result.length<40)return rows;}
}
export async function gameChannel(id:string,signal?:AbortSignal){
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))throw new Error('Choose a game from the catalog.');
 let query=supabase.from('game_channel_catalog').select(GAME_FIELDS).contains('member_ids',[id]);
 if(signal)query=query.abortSignal(signal);const {data,error}=await query.retry(false).maybeSingle();if(error)throw error;return data;
}
export async function gameChannelIds(id:string,signal?:AbortSignal){const game=await gameChannel(id,signal);if(!game)throw new Error('Game channel not found.');return game.member_ids?.length?game.member_ids:[game.id];}
export function gameLabel(game:{name:string|null;igdb_id?:number|null;release_year?:number|null;platforms?:string|null}){
 return [game.name||'Game',game.release_year?String(game.release_year):null,game.platforms||null].filter(Boolean).join(' · ');
}
