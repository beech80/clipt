export type CatalogAction={action:'search';term:string;page:number}|{action:'resolve';id:number};
export function catalogAction(body:Record<string,unknown>):CatalogAction{
 if(body.action==='resolve'){if(!Number.isSafeInteger(body.id)||Number(body.id)<=0)throw Error('Invalid game ID');return {action:'resolve',id:Number(body.id)};}
 if(body.action!=='search'||typeof body.term!=='string'||body.term.length>80||/[\x00-\x1f]/.test(body.term)||!Number.isSafeInteger(body.page)||Number(body.page)<0||Number(body.page)>100000)throw Error('Invalid catalog search');
 return {action:'search',term:body.term.trim(),page:Number(body.page)};
}
export const CATALOG_PAGE_SIZE=20;
const fields='fields id,name,cover.image_id,first_release_date,platforms.name;';
export function catalogQuery(action:CatalogAction){
 if(action.action==='resolve')return fields+' where id = '+action.id+'; limit 1;';
 return fields+' '+(action.term?'search '+JSON.stringify(action.term)+';':'sort id asc;')+' limit 21; offset '+action.page*CATALOG_PAGE_SIZE+';';
}
export type CatalogGame={id:number;name:string;cover_url:string|null;release_year:number|null;platforms:string|null};
export function catalogGame(value:unknown):CatalogGame|null{
 if(!value||typeof value!=='object')return null;const row=value as Record<string,unknown>;
 if(!Number.isSafeInteger(row.id)||Number(row.id)<=0||typeof row.name!=='string'||!row.name.trim()||row.name.length>240)return null;
 const image=(row.cover as {image_id?:unknown}|null)?.image_id;
 const year=typeof row.first_release_date==='number'?new Date(row.first_release_date*1000).getUTCFullYear():null;
 const names=Array.isArray(row.platforms)?row.platforms.flatMap(p=>p&&typeof p.name==='string'&&p.name.length<160?[p.name]:[]):[];
 return {id:Number(row.id),name:row.name.trim(),cover_url:typeof image==='string'&&/^[A-Za-z0-9_-]+$/.test(image)?'https://images.igdb.com/igdb/image/upload/t_cover_big/'+image+'.jpg':null,
 release_year:year&&year>=1000&&year<=9999?year:null,platforms:[...new Set(names)].join(', ').slice(0,1000)||null};
}
