import test from 'node:test';
import assert from 'node:assert/strict';
import {publicReviewEligible,azureReviewDecision,analyzeAzureReview} from '../../supabase/functions/_shared/azure-review.ts';
const post={user_id:'owner',is_published:true,is_premium:false,is_subscriber_only:false,required_tier_id:null,moderation_hidden:false,post_type:'clipt',image_url:'https://example.invalid/photo.jpg',video_url:null};
const config={endpoint:'https://clipt-test.cognitiveservices.azure.com/',key:'synthetic-key',tier:'F0',verifiedF0:true};
const result=severity=>({categoriesAnalysis:['Hate','SelfHarm','Sexual','Violence'].map(category=>({category,severity}))});
test('public review eligibility excludes foreign, private, draft, subscriber and video content',()=>{
 assert.equal(publicReviewEligible(post,'owner'),true);
 for(const change of [{post_type:'squad'},{image_url:null},{video_url:'video.mp4'},{video_url:undefined}])assert.equal(publicReviewEligible({...post,...change},'owner'),false);
 for(const change of [{user_id:'other'},{is_published:false},{is_premium:true},{is_subscriber_only:true},{required_tier_id:'tier'},{moderation_hidden:true},{post_type:'video'},{is_premium:null}])assert.equal(publicReviewEligible({...post,...change},'owner'),false);
});
test('Azure scores produce review flags, never deletion, bans or safety guarantees',()=>{
 assert.equal(azureReviewDecision(result(0)),'no_flag_detected');assert.equal(azureReviewDecision(result(2)),'needs_review');
 for(const value of [null,{},result(1),{categoriesAnalysis:result(0).categoriesAnalysis.slice(1)}, {categoriesAnalysis:Array(4).fill({category:'Hate',severity:0})}])assert.throws(()=>azureReviewDecision(value));
});
test('paid or unverified configuration and foreign endpoints cause no outbound request',async()=>{
 for(const change of [{tier:'S0'},{verifiedF0:false},{endpoint:'https://example.com/'},{endpoint:'https://clipt-test.cognitiveservices.azure.com/path'}])await assert.rejects(analyzeAzureReview({...config,...change},{caption:'Great game!'},()=>{throw Error('must not call')}),/free-tier/);
});
test('quota and provider errors keep review pending without exposing provider details',async()=>{
 for(const status of [429,401,500])await assert.rejects(analyzeAzureReview(config,{caption:'Great game!'},async()=>new Response('secret provider payload',{status})),error=>!error.message.includes('secret')&&/quota|unavailable/.test(error.message));
});
test('Azure request uses fixed API, server header, timeout and redirect refusal',async()=>{
 const decision=await analyzeAzureReview(config,{caption:'Great game!'},async(url,options)=>{
  assert.equal(url.hostname,'clipt-test.cognitiveservices.azure.com');assert.equal(options.redirect,'error');assert.ok(options.signal);assert.equal(options.headers['Ocp-Apim-Subscription-Key'],'synthetic-key');
  return Response.json(result(2));
 });assert.equal(decision,'needs_review');
});

test('oversized streamed provider responses are cancelled without issuing approval',async()=>{
 let cancelled=false;
 const body=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(16385));},cancel(){cancelled=true;}});
 await assert.rejects(analyzeAzureReview(config,{caption:'Great game!'},async()=>new Response(body)),/unavailable/);
 assert.equal(cancelled,true);
});

test('malformed successful responses and transport failures never approve content',async()=>{
 for(const body of ['not json','null','{}',JSON.stringify({categoriesAnalysis:[]})])
  await assert.rejects(analyzeAzureReview(config,{caption:'Great game!'},async()=>new Response(body)),/unavailable/);
 let calls=0;
 await assert.rejects(analyzeAzureReview(config,{caption:'Great game!'},async()=>{calls++;throw Error('secret key and caption');}),/temporarily unavailable/);
 assert.equal(calls,1);
});

test('ambiguous inputs and endpoint credentials are rejected before transmission',async()=>{
 let calls=0;const never=async()=>{calls++;throw Error('must not transmit');};
 for(const input of [{},{caption:'Great game!',imageBase64:'AAAA'},{caption:' '},{caption:'x'.repeat(501)},{imageBase64:'invalid!'}])
  await assert.rejects(analyzeAzureReview(config,input,never));
 for(const endpoint of ['http://clipt-test.cognitiveservices.azure.com/','https://user:secret@clipt-test.cognitiveservices.azure.com/','https://clipt-test.cognitiveservices.azure.com/?key=secret','https://clipt-test.cognitiveservices.azure.com/#secret'])
  await assert.rejects(analyzeAzureReview({...config,endpoint},{caption:'Great game!'},never));
 assert.equal(calls,0);
});
