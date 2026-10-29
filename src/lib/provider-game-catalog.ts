import {supabase} from '@/lib/supabase';
export type ProviderGame={id:number;name:string;cover_url:string|null;release_year:number|null;platforms:string|null};
export async function providerCatalogPage(term:string,page:number,signal?:AbortSignal){
 const {data,error}=await supabase.functions.invoke('game-catalog',{body:{action:'search',term:term.trim().slice(0,80),page},signal});
 if(error)throw new Error('Full game catalog search is unavailable. Your configured Clipt channels still work.');
 if(!data||!Array.isArray(data.games)||typeof data.more!=='boolean')throw new Error('The catalog returned an invalid response.');
 return {games:data.games as ProviderGame[],more:data.more};
}
export async function chooseProviderGame(id:number){
 if(!Number.isSafeInteger(id)||id<=0)throw new Error('Choose a game from the catalog.');
 const {data,error}=await supabase.functions.invoke('game-catalog',{body:{action:'resolve',id}});
 if(error||!data?.game||typeof data.game.name!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(data.game.id))throw new Error('This game could not be opened. Please retry.');
 return data.game as {id:string;name:string};
}
