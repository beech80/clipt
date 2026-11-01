/** Fixed, public metadata only; no caller-controlled search or database writes. */
export function createPublicCatalogProbe(search:(term:string,page:number)=>Promise<{games:unknown[]}>,now=Date.now){
 let cached:{until:number;available:boolean}|null=null;
 let pending:Promise<boolean>|null=null;
 return async()=>{
  if(cached&&cached.until>now())return cached.available;
  if(pending)return pending;
  pending=(async()=>{let available=false;try{available=(await search('Overwatch',0)).games.length>0;}catch{/* Provider logs use fixed redacted labels. */}
   cached={until:now()+(available?300000:30000),available};return available;
  })().finally(()=>{pending=null;});return pending;
 };
}
