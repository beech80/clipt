import {HttpError} from './request.ts';
export async function endOwnerObsBeforeErasure(req:Request){
 if(Deno.env.get('SUPABASE_URL')!=='https://slnjliheyiiummxhrgmk.supabase.co')return;
 let response:Response;
 try{response=await fetch('https://slnjliheyiiummxhrgmk.supabase.co/functions/v1/obs-broadcast-session',{
  method:'POST',headers:{Authorization:req.headers.get('Authorization')||'','Content-Type':'application/json'},
  body:JSON.stringify({protocolVersion:1,action:'erase'}),redirect:'error',signal:AbortSignal.timeout(25000)});
 }catch{throw new HttpError(503,'Broadcast shutdown must be confirmed before deleting your account. Please retry.');}
 let value:any;try{value=await response.json();}catch{/* Fixed error below. */}
 if(!response.ok||value?.state!=='ended')throw new HttpError(503,'Broadcast shutdown is pending. No account deletion was committed; retry after server cleanup.');
}
