import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {authenticatedUser,errorResponse,requestBody,requestMethod,serverEnv,jsonResponse,HttpError,serviceClient} from '../_shared/request.ts';
import {catalogAction,catalogGame,catalogQuery,CATALOG_PAGE_SIZE} from './catalog.ts';
import {createPublicGameCatalog} from './wikidata.ts';
const publicCatalog=createPublicGameCatalog();
let token:{value:string;until:number}|null=null;let tokenFlight:Promise<string>|null=null;
const cache=new Map<string,{until:number;data:unknown[]}>(),rates=new Map<string,{until:number;count:number}>();
const configured=()=>Deno.env.get('CLIPT_IGDB_CATALOG_ENABLED')==='true'&&Boolean(Deno.env.get('TWITCH_CLIENT_ID')&&Deno.env.get('TWITCH_CLIENT_SECRET'));
async function accessToken(){
 if(token&&token.until>Date.now())return token.value;if(tokenFlight)return tokenFlight;
 tokenFlight=(async()=>{const response=await fetch('https://id.twitch.tv/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:serverEnv('TWITCH_CLIENT_ID'),client_secret:serverEnv('TWITCH_CLIENT_SECRET'),grant_type:'client_credentials'}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new HttpError(503,'The full game catalog is temporarily unavailable.');
 const result=await response.json();if(typeof result.access_token!=='string'||!Number.isFinite(result.expires_in))throw new HttpError(503,'Catalog authentication unavailable.');
 token={value:result.access_token,until:Date.now()+Math.max(0,result.expires_in-60)*1000};return token.value;})().finally(()=>{tokenFlight=null;});return tokenFlight;
}
async function provider(query:string){
 const hit=cache.get(query);if(hit&&hit.until>Date.now())return hit.data;
 const response=await fetch('https://api.igdb.com/v4/games',{method:'POST',headers:{'Client-ID':serverEnv('TWITCH_CLIENT_ID'),Authorization:'Bearer '+await accessToken(),'Content-Type':'text/plain'},body:query,signal:AbortSignal.timeout(12000)});
 if(!response.ok){if(response.status===401)token=null;throw new HttpError(response.status===429?429:503,'The full game catalog is temporarily unavailable. Please retry.');}
 const result:unknown=await response.json();if(!Array.isArray(result)||result.length>21)throw new HttpError(503,'Invalid catalog response.');
 if(cache.size>=200)cache.delete(cache.keys().next().value!);cache.set(query,{until:Date.now()+60000,data:result});return result;
}
serve(async req=>{
 if(req.method==='GET'&&new URL(req.url).pathname.endsWith('/status'))return jsonResponse({provider:configured()?'igdb':'wikidata',configured:true});
 const method=requestMethod(req);if(method)return method;
 try{
 const user=await authenticatedUser(req);
 const now=Date.now();for(const [key,value]of rates){if(value.until<=now)rates.delete(key);}const rate=rates.get(user.id)||{until:now+60000,count:0};
 if(rate.count>=30||rates.size>=2000&&!rates.has(user.id))throw new HttpError(429,'Please wait a minute before searching again.');rate.count++;rates.set(user.id,rate);
 let action;try{action=catalogAction(await requestBody(req));}catch(error){if(error instanceof HttpError)throw error;throw new HttpError(400,'Invalid game catalog request.');}
 if(action.action==='resolve'&&typeof action.id==='string'||action.action==='search'&&!configured()){
  try{
   if(action.action==='search')return jsonResponse(await publicCatalog.search(action.term,action.page));
   const {game,adopt}=await publicCatalog.resolve(String(action.id));
   const result=await serviceClient().rpc('cache_verified_public_game',{p_wikidata_id:game.id,p_name:game.name,p_release_year:game.release_year,p_platforms:game.platforms,p_igdb_id:game.igdb_id,p_adopt_legacy:adopt});
   if(result.error||!result.data)throw Error('Game import unavailable.');return jsonResponse({game:result.data});
  }catch{throw new HttpError(503,'The public game catalog is temporarily unavailable. Please retry.');}
 }
 if(!configured())throw new HttpError(503,'This catalog record is no longer available. Search again.');
 const rows=await provider(catalogQuery(action));
 if(action.action==='search'){const games=rows.slice(0,CATALOG_PAGE_SIZE).flatMap(row=>{const game=catalogGame(row);return game?[game]:[];});return jsonResponse({games,more:rows.length>CATALOG_PAGE_SIZE,source:'igdb'});}
 const game=catalogGame(rows[0]);if(!game||game.id!==action.id)throw new HttpError(404,'Game not found in the provider catalog.');
 // Adopt a legacy title only when the provider says the exact name is unambiguous.
 const exact=await provider('fields id; where name = '+JSON.stringify(game.name)+'; limit 2;');
 const adopt=exact.length===1&&(exact[0]as {id?:number})?.id===game.id;
 const result=await serviceClient().rpc('cache_verified_game',{p_provider_id:game.id,p_name:game.name,p_cover_url:game.cover_url,p_release_year:game.release_year,p_platforms:game.platforms,p_adopt_legacy:adopt});
 if(result.error||!result.data)throw new HttpError(503,'Game could not be added to Clipt. Please retry.');
 return jsonResponse({game:result.data});
 }catch(error){return errorResponse(error);}
});
