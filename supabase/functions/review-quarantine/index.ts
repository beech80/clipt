import {serve} from 'https://deno.land/std@0.190.0/http/server.ts'
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import {authenticatedUser,requestMethod,requestBody,serverEnv,serviceClient,HttpError,errorResponse,jsonResponse} from '../_shared/request.ts'
import {reviewStorageTarget} from '../_shared/photo-review-workflow.ts'
serve(async req=>{
 const method=requestMethod(req);if(method)return method
 try {
  await authenticatedUser(req)
  if(serverEnv('SUPABASE_URL')!=='https://akiksrlzdqvipqbbjxpw.supabase.co')throw new HttpError(503,'Review preview unavailable')
  const body=await requestBody(req)
  if(Object.keys(body).some(key=>key!=='jobId')||typeof body.jobId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.jobId))throw new HttpError(400,'Invalid review identifier')
  const caller=createClient(serverEnv('SUPABASE_URL'),serverEnv('SUPABASE_ANON_KEY'),{
   auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:req.headers.get('Authorization')!}}})
  const {data,error}=await caller.rpc('quarantined_photo_preview',{p_job:body.jobId})
  if(error||!Array.isArray(data)||data.length!==1)throw new HttpError(403,'MFA-verified staff review required')
  const row=data[0],target=reviewStorageTarget(row.image_url,row.user_id,serverEnv('SUPABASE_URL'))
  const signed=await serviceClient().storage.from(target.bucket).createSignedUrl(target.path,60)
  if(signed.error||!signed.data?.signedUrl)throw new HttpError(503,'Review media unavailable')
  return jsonResponse({postId:row.post_id,url:signed.data.signedUrl,caption:typeof row.caption==='string'?row.caption:''})
 }catch(error){return errorResponse(error)}
})
