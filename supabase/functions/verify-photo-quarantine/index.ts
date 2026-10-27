import {serve} from 'https://deno.land/std@0.190.0/http/server.ts'
import {authenticatedUser,requestMethod,requestBody,serverEnv,serviceClient,HttpError,errorResponse,jsonResponse} from '../_shared/request.ts'
import {runPhotoReview} from '../_shared/photo-review-workflow.ts'
import {analyzeAzureReview} from '../_shared/azure-review.ts'

// Owner explicitly supplied this public photo for one development-only test.
// A fixed reservation prevents retries from spending another provider quota.
const owner='1b0ea76e-a629-4f54-8ec5-1e4ae0e7a251'
const post='0b28e432-16c4-4fc1-adc7-bec6ce263cd8'
const request='c26f0d68-19f7-4f99-9c5a-52fe945caa10'
serve(async req=>{
 const method=requestMethod(req);if(method)return method
 try {
  const user=await authenticatedUser(req)
  if(user.id!==owner||user.is_anonymous||!user.email_confirmed_at)throw new HttpError(403,'Designated verified photo owner required')
  const body=await requestBody(req)
  if(Object.keys(body).length)throw new HttpError(400,'No caller targets or content accepted')
  if(serverEnv('SUPABASE_URL')!=='https://akiksrlzdqvipqbbjxpw.supabase.co'
   ||Deno.env.get('CLIPT_AZURE_F0_VERIFIED')!=='true'
   ||serverEnv('AZURE_CONTENT_SAFETY_ENDPOINT')!=='https://clipt-content-safety-dev.cognitiveservices.azure.com/')
   throw new HttpError(503,'Approved Free development resource required')
  const client=serviceClient()
  const rpc=async(name:string,args:Record<string,unknown>)=>{const {data,error}=await client.rpc(name,args);if(error)throw Error('Photo review state unavailable');return data}
  const result=await runPhotoReview(owner,serverEnv('SUPABASE_URL'),{
   reserve:async()=>await rpc('reserve_azure_review',{p_user:owner,p_post:post,p_request:request,p_operations:2})===true,
   read:async()=>{
    const {data,error}=await client.from('posts').select('user_id,is_published,is_premium,is_subscriber_only,required_tier_id,moderation_hidden,post_type,image_url,video_url,content').eq('id',post).eq('user_id',owner).single()
    if(error||!data||data.content!=='CLIPT Azure test')throw Error('Approved public fixture unavailable')
    return data
   },
   download:async(bucket,path)=>{const {data,error}=await client.storage.from(bucket).download(path);if(error||!data||data.size>4*1024*1024)throw Error('Photo unavailable');return new Uint8Array(await data.arrayBuffer())},
   analyze:input=>analyzeAzureReview({endpoint:serverEnv('AZURE_CONTENT_SAFETY_ENDPOINT'),key:serverEnv('AZURE_CONTENT_SAFETY_KEY'),tier:'F0',verifiedF0:true},input),
   finish:async state=>{if(await rpc('finish_azure_review_with_quarantine',{p_user:owner,p_request:request,p_state:state})!==true)throw Error('Photo review completion unconfirmed')},
   log:event=>console.info(event),
  })
  return jsonResponse({state:result.state,requestId:request})
 }catch(error){return errorResponse(error)}
})
