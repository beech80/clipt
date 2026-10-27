import {serve} from 'https://deno.land/std@0.190.0/http/server.ts'
import {authenticatedUser,errorResponse,HttpError,jsonResponse,requestBody,requestMethod,serverEnv,serviceClient} from '../_shared/request.ts'
import {inspectH264Mp4} from '../_shared/mp4-proof.ts'

serve(async req=>{
 const method=requestMethod(req);if(method)return method;
 try{
  const user=await authenticatedUser(req);
  if(user.is_anonymous)throw new HttpError(403,'A verified account is required');
  const body=await requestBody(req);
  if(typeof body.postId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.postId))throw new HttpError(400,'Invalid Clipt');
  const db=serviceClient();
  const {data:post,error}=await db.from('posts').select('id,user_id,video_url,is_published,is_premium,is_subscriber_only,required_tier_id,moderation_hidden,post_type').eq('id',body.postId).maybeSingle();
  if(error)throw new HttpError(503,'Clipt verification unavailable');
  if(!post||post.user_id!==user.id)throw new HttpError(403,'Only your own Clipt can be checked');
  if(!post.is_published||post.is_premium||post.is_subscriber_only||post.required_tier_id||post.moderation_hidden||!['clipt','clipts','video'].includes(post.post_type))throw new HttpError(422,'This Clipt is not eligible');
  const {data:previous,error:previousError}=await db.from('content_reward_verifications').select('awarded_tokens').eq('original_post_id',post.id).eq('user_id',user.id).maybeSingle();
  if(previousError)throw new HttpError(503,'Reward verification unavailable');
  if(previous)return jsonResponse({status:'already_checked',awarded:previous.awarded_tokens});
  const origin=new URL(serverEnv('SUPABASE_URL')).origin;
  const prefix=`${origin}/storage/v1/object/public/media/`;
  if(typeof post.video_url!=='string'||!post.video_url.startsWith(prefix))throw new HttpError(422,'Owned uploaded media is required');
  const path=post.video_url.slice(prefix.length);
  const expected=new RegExp(`^${user.id}/[0-9a-f-]{36}\\.mp4$`,'i');
  if(!expected.test(path))throw new HttpError(422,'Automatic rewards currently require an owned H.264 MP4 upload');
  const rate=await db.rpc('begin_content_reward_check',{p_user_id:user.id,p_post_id:post.id});
  if(rate.error)throw new HttpError(503,'Reward verification unavailable');
  if(rate.data!==true)throw new HttpError(429,'Please wait a minute before checking another reward');
  // Fixed trusted storage origin/path only. No user-supplied URLs, redirects,
  // credentials in URLs, or remote content fetches are accepted.
  const media=await fetch(`${prefix}${path}`,{redirect:'error',signal:AbortSignal.timeout(20000)});
  const size=Number(media.headers.get('content-length'));
  if(!media.ok||!Number.isSafeInteger(size)||size<32||size>50*1024*1024||!media.body)throw new HttpError(422,'Stored video could not be verified');
  const bytes=new Uint8Array(size),reader=media.body.getReader();let offset=0;
  try{while(true){const part=await reader.read();if(part.done)break;if(offset+part.value.length>size)throw new HttpError(422,'Unexpected media size');bytes.set(part.value,offset);offset+=part.value.length;}}
  finally{await reader.cancel().catch(()=>{});}
  if(offset!==size)throw new HttpError(422,'Incomplete media download');
  let proof;
  try{proof=inspectH264Mp4(bytes);}catch{throw new HttpError(422,'A structurally valid H.264 MP4 is required for this reward');}
  // Hash encoded media payload, not mutable container metadata/free boxes.
  // Changing a filename, title tag or padding must not create another reward.
  const mediaBytes=new Uint8Array(proof.mediaRanges.reduce((total,range)=>total+range.end-range.start,0));
  let mediaOffset=0;
  for(const range of proof.mediaRanges){mediaBytes.set(bytes.subarray(range.start,range.end),mediaOffset);mediaOffset+=range.end-range.start;}
  const digest=await crypto.subtle.digest('SHA-256',mediaBytes);
  const hash=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  const result=await db.rpc('reward_verified_clipt',{p_user_id:user.id,p_post_id:post.id,p_object_path:path,p_sha256:hash,p_byte_size:size,p_duration_seconds:proof.durationSeconds});
  if(result.error)throw new HttpError(503,'Reward was not confirmed; safely retry this Clipt');
  return jsonResponse({status:result.data.status,awarded:result.data.awarded});
 }catch(error){return errorResponse(error);}
});
