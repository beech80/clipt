import {serve} from 'https://deno.land/std@0.190.0/http/server.ts'
import {authenticatedUser,requestMethod,requestBody,requiredString,serverEnv,serviceClient,HttpError,errorResponse,jsonResponse} from '../_shared/request.ts'
import {analyzeAzureReview} from '../_shared/azure-review.ts'
import {runPhotoReview} from '../_shared/photo-review-workflow.ts'
serve(async req=>{
 const method=requestMethod(req);if(method)return method
 try {
  const user=await authenticatedUser(req)
  if(user.is_anonymous)throw new HttpError(403,'Verified account required')
  const body=await requestBody(req)
  // A single public repository-image fixture can certify real provider access
  // without turning on general scanning. Authentication, locking and quotas
  // remain identical; no caller content/URLs or private media are accepted.
  const configuredUser=Deno.env.get('CLIPT_AZURE_VERIFICATION_USER_ID')
  const configuredPost=Deno.env.get('CLIPT_AZURE_VERIFICATION_POST_ID')
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  // Any partial/malformed replacement fails closed instead of falling back.
  // These IDs are server configuration, never caller-selected scope.
  const replacement=configuredUser!==undefined||configuredPost!==undefined
  const verificationScope=replacement
   ?typeof configuredUser==='string'&&typeof configuredPost==='string'
    &&uuid.test(configuredUser)&&uuid.test(configuredPost)
    &&user.id===configuredUser&&body.postId===configuredPost
   :user.id==='f6a4f8e9-891f-4598-adaf-a30016f47b35'
    &&body.postId==='ecb368d2-8241-45a1-9d19-18698b3ef849'
  const verificationOnly=Deno.env.get('CLIPT_AZURE_VERIFICATION_ONLY')==='true'&&verificationScope
  if(serverEnv('SUPABASE_URL')!=='https://akiksrlzdqvipqbbjxpw.supabase.co'
   ||(Deno.env.get('CLIPT_AZURE_REVIEW_ENABLED')!=='true'&&!verificationOnly)
   ||Deno.env.get('CLIPT_AZURE_F0_VERIFIED')!=='true')throw new HttpError(503,'Public photo review pilot is disabled')
  if(verificationOnly&&serverEnv('AZURE_CONTENT_SAFETY_ENDPOINT')!=='https://clipt-content-safety-dev.cognitiveservices.azure.com/')
   throw new HttpError(503,'Approved verification resource required')
  if(Object.keys(body).some(key=>!['postId','requestId'].includes(key)))throw new HttpError(400,'Only post and request identifiers are accepted')
  const postId=requiredString(body.postId,'post ID',36),requestId=requiredString(body.requestId,'request ID',36)
  if(![postId,requestId].every(id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))throw new HttpError(400,'Invalid identifier')
  const client=serviceClient()
  // Disabled by default. Verification-only probes must never quarantine records.
  const autoQuarantine=Deno.env.get('CLIPT_AZURE_AUTO_QUARANTINE_ENABLED')==='true'
   &&Deno.env.get('CLIPT_AZURE_REVIEW_ENABLED')==='true'&&!verificationOnly
  const rpc=async(name:string,args:Record<string,unknown>)=>{const {data,error}=await client.rpc(name,args);if(error)throw new Error('Review state unavailable');return data}
  const result=await runPhotoReview(user.id,serverEnv('SUPABASE_URL'),{
   reserve:async()=>await rpc('reserve_azure_review',{p_user:user.id,p_post:postId,p_request:requestId,p_operations:2})===true,
   read:async()=>{const {data,error}=await client.from('posts').select('user_id,is_published,is_premium,is_subscriber_only,required_tier_id,moderation_hidden,post_type,image_url,video_url,content').eq('id',postId).eq('user_id',user.id).single();if(error||!data)throw Error('Photo unavailable');return data},
   download:async(bucket,path)=>{const {data,error}=await client.storage.from(bucket).download(path);if(error||!data||data.size>4*1024*1024)throw Error('Photo unavailable');return new Uint8Array(await data.arrayBuffer())},
   analyze:input=>analyzeAzureReview({endpoint:serverEnv('AZURE_CONTENT_SAFETY_ENDPOINT'),key:serverEnv('AZURE_CONTENT_SAFETY_KEY'),tier:'F0',verifiedF0:true},input),
   finish:async state=>{if(await rpc(autoQuarantine?'finish_azure_review_with_quarantine':'finish_azure_review',{p_user:user.id,p_request:requestId,p_state:state})!==true)throw Error('Review completion not confirmed')},
   log:event=>console.info(event),
  })
  return jsonResponse(result)
 }catch(error){return errorResponse(error)}
})
