// Public-domain game metadata. Only fixed, read-only Wikidata API operations are permitted.
export type PublicGame={id:string;name:string;cover_url:null;release_year:number|null;platforms:string|null;igdb_id:number|null;description?:string};
export const isPublicGameId=(id:unknown):id is string=>typeof id==='string'&&/^Q[1-9][0-9]{0,15}$/.test(id);
export function publicSearchText(term:string){
 const words=term.match(/[\p{L}\p{N}]+/gu)||[];
 return 'haswbstatement:P31=Q7889'+(words.length?' '+words.map(word=>word+'*').join(' '):'');
}
const values=(entity:any,property:string):any[]=>Array.isArray(entity?.claims?.[property])?entity.claims[property].filter((claim:any)=>claim.rank!=='deprecated'&&claim.mainsnak?.snaktype==='value').map((claim:any)=>claim.mainsnak.datavalue?.value):[];
export function publicGame(entity:any,platforms:Record<string,string>={}):PublicGame|null{
 if(!entity||!isPublicGameId(entity.id)||!values(entity,'P31').some(v=>v?.id==='Q7889'))return null;
 const label=entity.labels?.en?.value||entity.labels?.mul?.value;
 if(typeof label!=='string'||!label.trim()||label.length>240||/[\x00-\x1f]/.test(label))return null;
 const years=values(entity,'P577').flatMap(v=>{const match=typeof v?.time==='string'?/^\+([0-9]{4})-/.exec(v.time):null;const year=match?Number(match[1]):0;return year>=1000&&year<=9999?[year]:[];});
 const igdb=values(entity,'P5794').find(v=>typeof v==='string'&&/^[1-9][0-9]*$/.test(v)&&Number.isSafeInteger(Number(v)));
 const names=[...new Set(values(entity,'P400').flatMap(v=>typeof platforms[v?.id]==='string'?[platforms[v.id]]:[]))];
 return {id:entity.id,name:label.trim(),cover_url:null,release_year:years.length?Math.min(...years):null,platforms:names.join(', ').slice(0,1000)||null,igdb_id:igdb?Number(igdb):null};
}
// Search uses the provider's game-only index and small summaries. Selection re-verifies claims.
export function publicSummary(entity:any):PublicGame|null{
 if(!entity||!isPublicGameId(entity.id))return null;
 const label=entity.labels?.en?.value||entity.labels?.mul?.value;
 if(typeof label!=='string'||!label.trim()||label.length>240||/[\x00-\x1f]/.test(label))return null;
 const description=entity.descriptions?.en?.value||entity.descriptions?.mul?.value;
 return {id:entity.id,name:label.trim(),cover_url:null,release_year:null,platforms:null,igdb_id:null,...(typeof description==='string'&&!/[\x00-\x1f]/.test(description)?{description:description.slice(0,400)}:{})};
}
export function createPublicGameCatalog(fetcher:typeof fetch=fetch){
 const cache=new Map<string,{until:number;data:any}>(),pending=new Map<string,Promise<any>>();
 let cooldown=0,nextStart=0;
 async function api(params:Record<string,string>){
  const url=new URL('https://www.wikidata.org/w/api.php');url.search=new URLSearchParams({...params,format:'json',maxlag:'5'}).toString();
  const key=url.toString(),hit=cache.get(key);if(hit&&hit.until>Date.now())return hit.data;
  if(cooldown>Date.now())throw Error('Public catalog is cooling down.');if(pending.has(key))return pending.get(key);
  if(pending.size>=4)throw Error('Public catalog is busy.');
  const task=(async()=>{
   const wait=Math.max(0,nextStart-Date.now());nextStart=Math.max(nextStart,Date.now())+250;if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
   let response:Response;
   try{response=await fetcher(key,{headers:{Accept:'application/json','User-Agent':'CLIPTGameCatalog/1.0 (+https://github.com/beech80/clipt)'},redirect:'error',signal:AbortSignal.timeout(15000)});}catch(error){console.warn(JSON.stringify({event:'game_catalog_provider_failure',reason:error instanceof Error&&['TimeoutError','AbortError'].includes(error.name)?'timeout':'transport'}));throw Error('Public catalog unavailable.');}
   if(!response.ok){console.warn(JSON.stringify({event:'game_catalog_provider_failure',reason:'http',status:response.status}));if(response.status===429||response.status===503)cooldown=Date.now()+Math.min(3600,Math.max(10,Number(response.headers.get('Retry-After'))||60))*1000;throw Error('Public catalog unavailable.');}
   const text=await response.text();if(text.length>4000000)throw Error('Catalog response too large.');const data=JSON.parse(text);
   if(data?.error){console.warn(JSON.stringify({event:'game_catalog_provider_failure',reason:data.error.code==='maxlag'?'maxlag':'api'}));if(data.error.code==='maxlag')cooldown=Date.now()+10000;throw Error('Public catalog unavailable.');}
   if(cache.size>=200)cache.delete(cache.keys().next().value!);cache.set(key,{until:Date.now()+300000,data});return data;
  })().finally(()=>pending.delete(key));pending.set(key,task);return task;
 }
 async function entities(ids:string[],mode:'full'|'labels'|'summary'='full'){
  if(ids.some(id=>!isPublicGameId(id))||ids.length>100)throw Error('Invalid entity request.');
  const all:Record<string,any>={};
  for(let i=0;i<ids.length;i+=50){
   const data=await api({action:'wbgetentities',ids:ids.slice(i,i+50).join('|'),props:mode==='full'?'labels|claims':mode==='summary'?'labels|descriptions':'labels',languages:'en|mul',languagefallback:'1'});
   if(!data.entities||typeof data.entities!=='object'||Array.isArray(data.entities))throw Error('Invalid catalog response.');
   for(const id of ids.slice(i,i+50))if(data.entities[id]?.id===id)all[id]=data.entities[id];
  }return all;
 }
 async function decorate(ids:string[]){
  if(!ids.length)return [];const rows=await entities(ids);
  const platformIds=[...new Set(ids.flatMap(id=>values(rows[id],'P400').flatMap(v=>isPublicGameId(v?.id)?[v.id as string]:[])))].slice(0,100);
  const platformRows=platformIds.length?await entities(platformIds,'labels'):{};const labels:Record<string,string>={};
  for(const id of platformIds){const label=platformRows[id]?.labels?.en?.value||platformRows[id]?.labels?.mul?.value;if(typeof label==='string'&&label.length<160)labels[id]=label;}
  return ids.flatMap(id=>{const game=publicGame(rows[id],labels);return game?[game]:[];});
 }
 async function search(term:string,page:number){
  if(!Number.isSafeInteger(page)||page<0||page>=500)throw Error('Refine the game search.');
  const data=await api({action:'query',list:'search',srsearch:publicSearchText(term),srnamespace:'0',srlimit:'20',sroffset:String(page*20),srprop:''});
  if(!Array.isArray(data.query?.search)||data.query.search.length>20)throw Error('Invalid game search response.');
  const ids=data.query.search.flatMap((row:any)=>isPublicGameId(row.title)?[row.title]:[]);
  const unique=[...new Set(ids)],rows=unique.length?await entities(unique,'summary'):{};
  return {games:unique.flatMap(id=>{const game=publicSummary(rows[id]);return game?[game]:[];}),more:typeof data.continue?.sroffset==='number'&&data.continue.sroffset<10000,source:'wikidata' as const,total:Number.isSafeInteger(data.query.searchinfo?.totalhits)?data.query.searchinfo.totalhits:undefined};
 }
 async function resolve(id:string){
  if(!isPublicGameId(id))throw Error('Invalid game identifier.');const game=(await decorate([id]))[0];if(!game)throw Error('Not a verified video game.');
  const same=await search(game.name,0);const exact=same.games.filter(row=>row.name.toLocaleLowerCase()===game.name.toLocaleLowerCase());
  return {game,adopt:!same.more&&exact.length===1&&exact[0].id===id};
 }
 return {search,resolve};
}
