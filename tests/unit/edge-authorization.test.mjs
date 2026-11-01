import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Execute the checked-in handler and shared guard, replacing only external
// imports/runtime boundaries. No provider, database, or network can be reached.
function handlerFor(name, options = {}) {
  let handler;
  const calls = [];
  const admissionCalls = [];
  const user = { id: options.userId ?? 'user-a', factors: options.factors ?? [] };
  const createClient = (_url, key) => ({
    storage:{from:bucket=>({download:async path=>{calls.push({storageDownload:{bucket,path}});return {data:new Blob([new Uint8Array([255,216,255,224,0,0,0,0,0,0,0,0])]),error:null};}})},
    auth: { getUser: async token => {
      calls.push({ auth: token });
      return token === (options.validToken ?? 'valid-token') ? { data: { user }, error: null } : { data: {}, error: new Error('invalid') };
    } },
    rpc: async (operation, args) => {
      // Keep admission reads distinct from provider/database side effects;
      // their presence, result and ordering are asserted explicitly below.
      if (operation === 'clipt_beta_access') {
        admissionCalls.push({ operation, args, key });
        return { data: Object.hasOwn(options, 'betaApproved') ? options.betaApproved : true,
          error: options.betaApprovalError ?? null };
      }
      calls.push({ operation, args, key });
      return { data: options.rpcResult ? options.rpcResult(operation,args) : options.rpcData ?? { exported: true }, error: options.rpcError?.(operation,args) ?? null };
    },
    from: table => {
      const query = new Proxy({}, { get: (_target, method) => {
        if (method === 'then') return resolve => resolve({ data: Object.hasOwn(options, 'queryData') ? options.queryData : { id: 'record' }, error: null });
        return (...args) => { calls.push({ table, method, args }); return query; };
      } });
      return query;
    },
  });
  class Mux {
    constructor() { this.Video = { Assets: {
      get: async id => { calls.push({ providerRead: id }); return { passthrough: options.owner ?? 'user-b' }; },
      del: async id => { calls.push({ providerDelete: id }); },
    } }; }
  }
  class Stripe {
    static createSubtleCryptoProvider() { return {}; }
    constructor() {
      this.subscriptions={
        list:async()=>({data:options.providerSubscription?[options.providerSubscription]:[],has_more:false}),
        retrieve:async id=>{calls.push({providerRead:id});return options.providerSubscription;},
        cancel:async(id,args,config)=>{calls.push({providerCancel:id,args,config});options.providerSubscription={...options.providerSubscription,status:'canceled',schedule:null};return options.providerSubscription;},
        update:async(id,args,config)=>{calls.push({providerUpdate:'subscription',id,args,config});if(options.providerUpdateFailure)throw new Error('Synthetic timeout');return {...options.providerSubscription,cancel_at_period_end:args.cancel_at_period_end};},
      };
      this.prices={retrieve:async id=>{calls.push({priceRead:id});return {id,livemode:false,active:true,currency:'usd',unit_amount:id==='price_premium'?499:1499,type:'recurring',recurring:{interval:'month',interval_count:1,usage_type:'licensed'},...options.priceOverride};}};
      this.webhookEndpoints={list:async args=>{calls.push({webhookList:args});return {data:options.webhookEndpoints??[],has_more:false};}};
      this.customers={retrieve:async()=>({id:'cus_fixture',livemode:false,metadata:{clipt_user_id:'user-a'}}),create:async(args,config)=>{calls.push({providerCreate:'customer',args,config});return {id:'cus_fixture',livemode:false,metadata:{clipt_user_id:'user-a'}};}};
      this.invoices={list:async()=>({data:[],has_more:false})};
      this.webhooks = { constructEventAsync: async (raw, signature) => {
        calls.push({ signatureCheck: true, raw });
        if (signature !== 'fixture-valid') throw new Error('Invalid signature');
        return options.event;
      } };
      this.paymentIntents = { create: async (args,config) => { calls.push({providerCreate:'intent',args,config}); return {livemode:false,client_secret:'synthetic_test_client_secret'}; } };
      this.checkout = { sessions: { list:async args=>{calls.push({checkoutInventory:args});return {data:[],has_more:false};}, create: async (args,config) => { calls.push({providerCreate:'checkout',args,config}); return options.createdSession??{livemode:false,url:'https://checkout.stripe.com/c/pay/synthetic_test_session'}; }, retrieve: async id => {
      calls.push({ providerRead: id });
      if (options.session) return options.session;
      return { client_reference_id: options.owner ?? 'user-b', metadata: { clipt_user_id: options.owner ?? 'user-b' }, payment_status: 'paid', customer_email: 'private@example.invalid' };
    } } }; }
  }
  const load = path => stripTypeScriptTypes(readFileSync(new URL(path, import.meta.url), 'utf8')
    .replace(/^import .*$/gm, '').replace(/^export /gm, ''));
  const shared = load('../../supabase/functions/_shared/request.ts');
  const billing = load('../../supabase/functions/_shared/subscription.ts');
  const billingReview = load('../../supabase/functions/_shared/billing-return-review.ts');
  const source = load('../../supabase/functions/' + name + '/index.ts');
  const obsErasure=name==='account-deletion'?load('../../supabase/functions/_shared/obs-beta-erasure.ts'):'';
  const review=name==='review-public-photo'?load('../../supabase/functions/_shared/azure-review.ts')+'\n'+load('../../supabase/functions/_shared/photo-review-workflow.ts'):'';
  new Function('serve', 'createClient', 'Mux', 'Stripe', 'Deno', 'fetch', shared + '\n' + billing + '\n' + billingReview + '\n' + review + '\n' + obsErasure + '\n' + source)(
    value => { handler = value; }, createClient, Mux, Stripe,
    { env: { get: key => options.env?.[key] ?? (['CLIPT_SUBSCRIPTION_TEST_CLOCK_ID','CLIPT_AZURE_VERIFICATION_USER_ID','CLIPT_AZURE_VERIFICATION_POST_ID'].includes(key) ? undefined : key === 'SUPABASE_URL' ? 'http://local.invalid' : 'test-only-value') } },
    options.fetcher??(() => { throw new Error('Unexpected network request'); }),
  );
  return { handler, calls, admissionCalls };
}

const cases = [
  ['mux-stream', { action: 'create', userId: 'user-b' }],
  ['account-deletion', { action: 'begin', userId: 'user-b' }],
  ['user-data-management', { action: 'export', userId: 'user-b' }],
  ['oauth', { action: 'end_stream', userId: 'user-b' }],
  ['mux-handler', { action: 'deleteAsset', assetId: 'asset-b' }],
  ['verify-payment', { sessionId: 'cs_test_other' }],
  ['discord-auth', { action: 'token', userId: 'user-b', code: 'code' }],
  ['twitch-auth', { action: 'link-account', userId: 'user-b', code: 'code' }],
  ['send-sms', { phoneNumber: '+15550000000', message: 'test' }],
  ['cloudinary-upload', {}],
  ['gaming-ai-chat', {}],
  ['game-chatbot', {}],
  ['regenerate-sitemap', {}],
  ['cdn-config', {}],
  ['igdb', {}],
  ['vision-analysis', {}],
  ['cloudflare-check', {}],
  ['process-donation', { userId:'user-b' }],
  ['create-checkout', { userId:'user-b' }],
  ['manage-subscription', { userId:'user-b' }],
  ['billing-readiness', { userId:'user-b' }],
  ['scan-media-content', { userId:'user-b', imageUrl:'http://private.invalid/media' }],
];
const request = (body, token) => new Request('http://local.invalid/function', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
  body: JSON.stringify(body),
});
test('cdn-config denies uninvited users and never rewrites private media URLs', async () => {
  const { handler, calls, admissionCalls } = handlerFor('cdn-config', {
    env: { CLIPT_BETA_ACCESS_REQUIRED: 'true' }, betaApproved: false,
  });
  const response = await handler(request({ fileUrl: 'https://private.invalid/file?token=secret-fixture' }, 'valid-token'));
  assert.equal(response.status, 403);
  assert.deepEqual(admissionCalls.map(call => call.operation), ['clipt_beta_access']);
  assert.equal(calls.some(call => call.table || call.storageDownload || call.providerRead), false);
  assert.doesNotMatch(await response.text(), /secret-fixture|private\.invalid|cdnUrl/);
});
test('a missing or false deployment flag cannot bypass live beta admission', async () => {
  for (const flag of [undefined, 'false']) {
    const { handler, calls, admissionCalls } = handlerFor('oauth', {
      env: { CLIPT_BETA_ACCESS_REQUIRED: flag }, betaApproved: false,
    });
    assert.equal((await handler(request({ action: 'get_stream_credentials', streamId: 'stream-a' }, 'valid-token'))).status, 403);
    assert.equal(calls.some(call => call.table || call.providerRead || call.providerDelete), false);
    assert.equal(admissionCalls.length, 1);
  }
});
test('production free beta cannot initiate donations even with an authenticated approved account', async () => {
  const { handler, calls, admissionCalls } = handlerFor('process-donation', {
    env: { SUPABASE_URL: 'https://slnjliheyiiummxhrgmk.supabase.co', CLIPT_PAYMENTS_MODE: 'test',
      STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_WEBHOOK_SECRET: 'whsec_fixture', CLIPT_DONATIONS_VERIFIED: 'true' },
  });
  const response = await handler(request({}, 'valid-token'));
  assert.equal(response.status, 503);
  assert.equal(admissionCalls.length, 1);
  assert.equal(calls.some(call => call.providerCreate || call.providerRead || call.operation || call.table), false);
});
for (const name of ['igdb', 'vision-analysis', 'cloudflare-check']) test(name + ' checks beta approval before provider calls', async () => {
  const { handler, calls, admissionCalls } = handlerFor(name, {
    env: { CLIPT_BETA_ACCESS_REQUIRED: 'true' }, betaApproved: false,
  });
  assert.equal((await handler(request({}, 'valid-token'))).status, 403);
  assert.deepEqual(admissionCalls.map(call => call.operation), ['clipt_beta_access']);
});
test('approved game lookup preserves provider results without credentials in URLs', async () => {
  const outbound = [];
  const { handler } = handlerFor('igdb', {
    env: { CLIPT_BETA_ACCESS_REQUIRED: 'true' }, rpcResult: () => true,
    fetcher: async (url, init) => {
      outbound.push({ url, init });
      return Response.json(outbound.length === 1 ? { access_token: 'synthetic-provider-token' } : [{ id: 22, name: 'Fixture game' }]);
    },
  });
  const response = await handler(request({ endpoint: 'games', query: 'fields name; limit 22;' }, 'valid-token'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), [{ id: 22, name: 'Fixture game' }]);
  assert.equal(outbound.length, 2);
  assert.equal(outbound[0].url, 'https://id.twitch.tv/oauth2/token');
  assert.ok(outbound[0].init.body instanceof URLSearchParams);
  assert.equal(outbound[1].init.body, 'fields name; limit 22;');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('approved image analysis preserves the existing analysis response', async () => {
  const { handler } = handlerFor('vision-analysis', {
    env: { CLIPT_BETA_ACCESS_REQUIRED: 'true' }, rpcResult: () => true,
    fetcher: async () => Response.json({ responses: [{ labelAnnotations: [{ description: 'Fixture' }] }] }),
  });
  const response = await handler(request({ imageBase64: 'fixture', features: ['LABEL_DETECTION'] }, 'valid-token'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { labelAnnotations: [{ description: 'Fixture' }] });
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('beta Edge guard rejects uninvited sessions before privileged stream access',async()=>{
 const {handler,calls,admissionCalls}=handlerFor('oauth',{
  env:{CLIPT_BETA_ACCESS_REQUIRED:'true'},betaApproved:false,
 });
 assert.equal((await handler(request({action:'get_stream_credentials',streamId:'stream-a'},'valid-token'))).status,403);
 assert.deepEqual(admissionCalls.map(call=>call.operation),['clipt_beta_access']);
});
test('beta Edge guard fails closed on unavailable or malformed approval responses',async()=>{
 for(const response of [null,{},'true',1]) {
  const {handler,calls}=handlerFor('oauth',{
   env:{CLIPT_BETA_ACCESS_REQUIRED:'true'},betaApproved:response,
  });
  assert.equal((await handler(request({action:'get_stream_credentials',streamId:'stream-a'},'valid-token'))).status,403);
  assert.equal(calls.some(call=>call.table),false);
 }
 const {handler}=handlerFor('oauth',{
  env:{CLIPT_BETA_ACCESS_REQUIRED:'true'},betaApprovalError:new Error('unavailable'),
 });
 assert.equal((await handler(request({action:'get_stream_credentials',streamId:'stream-a'},'valid-token'))).status,503);
});
test('beta Edge guard preserves explicitly approved owner-scoped stream access',async()=>{
 const {handler,calls,admissionCalls}=handlerFor('oauth',{
  env:{CLIPT_BETA_ACCESS_REQUIRED:'true'},
  queryData:{id:'stream-a',rtmp_url:'rtmps://test.invalid/live',stream_key:'synthetic-test-key'},
  rpcResult:operation=>operation==='clipt_beta_access'?true:{exported:true},
 });
 assert.equal((await handler(request({action:'get_stream_credentials',streamId:'stream-a'},'valid-token'))).status,200);
 assert.equal(admissionCalls.length,1);
});
test('beta membership never removes authenticated own-account export rights',async()=>{
 const {handler,calls,admissionCalls}=handlerFor('user-data-management',{
  env:{CLIPT_BETA_ACCESS_REQUIRED:'true'},rpcResult:()=>({exported:true}),
 });
 assert.equal((await handler(request({action:'export'},'valid-token'))).status,200);
 assert.equal(admissionCalls.length,0);
});
test('development erasure cancels bound billing before destructive SQL and never grants benefits',async()=>{
 const requestId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 const env={SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',STRIPE_SECRET_KEY:'sk_test_fixture',CLIPT_PAYMENTS_MODE:'test',STRIPE_PREMIUM_PRICE_ID:'price_premium',STRIPE_MAXED_PRICE_ID:'price_maxed',STRIPE_WEBHOOK_SECRET:'whsec_fixture',CLIPT_PAYMENT_RETURN_ORIGIN:'https://development.invalid'};
 const {handler,calls}=handlerFor('account-deletion',{env,
  providerSubscription:{id:'sub_fixture',customer:'cus_fixture',metadata:{clipt_user_id:'user-a'},livemode:false,status:'active'},
  rpcResult:(operation,args)=>operation==='sandbox_billing_erasure'?{state:args.p_stage==='prepare'?'reserved':'verified',user_id:'user-a',customer_id:'cus_fixture',subscription_id:'sub_fixture'}:{state:'complete'},
 });
 const result=await handler(request({action:'begin',confirmation:'DELETE',requestId,receipt:'a'.repeat(64)},'valid-token'));
 assert.equal(result.status,200);
 const cancel=calls.findIndex(call=>call.providerCancel);const erasure=calls.findIndex(call=>call.operation==='account_erasure');
 assert.ok(cancel>=0&&erasure>cancel);assert.ok(calls.some(call=>call.args?.p_stage==='verify'&&call.args.p_proof.status==='canceled'));
 assert.deepEqual(calls[cancel].args,{invoice_now:false,prorate:false});
});
test('development erasure never calls destructive SQL if billing proof cannot be persisted',async()=>{
 const env={SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',STRIPE_SECRET_KEY:'sk_test_fixture',CLIPT_PAYMENTS_MODE:'test',STRIPE_PREMIUM_PRICE_ID:'price_premium',STRIPE_MAXED_PRICE_ID:'price_maxed',STRIPE_WEBHOOK_SECRET:'whsec_fixture',CLIPT_PAYMENT_RETURN_ORIGIN:'https://development.invalid'};
 const {handler,calls}=handlerFor('account-deletion',{env,
  providerSubscription:{id:'sub_fixture',customer:'cus_fixture',metadata:{clipt_user_id:'user-a'},livemode:false,status:'active'},
  rpcResult:(_op,args)=>args.p_stage==='prepare'?{state:'reserved',user_id:'user-a',customer_id:'cus_fixture',subscription_id:'sub_fixture'}:null,
 });
 const result=await handler(request({action:'begin',confirmation:'DELETE',requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',receipt:'a'.repeat(64)},'valid-token'));
 assert.equal(result.status,503);assert.equal(calls.filter(call=>call.operation==='account_erasure').length,0);
});
test('provider refusal after deletion reservation preserves retry capability instead of definitive rejection',async()=>{
 const env={SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',STRIPE_SECRET_KEY:'sk_test_fixture',CLIPT_PAYMENTS_MODE:'test',STRIPE_PREMIUM_PRICE_ID:'price_premium',STRIPE_MAXED_PRICE_ID:'price_maxed',STRIPE_WEBHOOK_SECRET:'whsec_fixture',CLIPT_PAYMENT_RETURN_ORIGIN:'https://development.invalid'};
 const {handler,calls}=handlerFor('account-deletion',{env,
  providerSubscription:{id:'sub_fixture',customer:'cus_fixture',metadata:{clipt_user_id:'other-user'},livemode:false,status:'active'},
  rpcResult:()=>({state:'reserved',user_id:'user-a',customer_id:'cus_fixture',subscription_id:'sub_fixture'}),
 });
 const result=await handler(request({action:'begin',confirmation:'DELETE',requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',receipt:'a'.repeat(64)},'valid-token'));
 assert.equal(result.status,503);assert.match((await result.json()).error,/keep this tab/);
 assert.equal(calls.filter(call=>call.operation==='account_erasure').length,0);
});
test('resource review after confirmed billing shutdown preserves the original deletion receipt',async()=>{
 const env={SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',STRIPE_SECRET_KEY:'sk_test_fixture',CLIPT_PAYMENTS_MODE:'test',STRIPE_PREMIUM_PRICE_ID:'price_premium',STRIPE_MAXED_PRICE_ID:'price_maxed',STRIPE_WEBHOOK_SECRET:'whsec_fixture',CLIPT_PAYMENT_RETURN_ORIGIN:'https://development.invalid'};
 const {handler}=handlerFor('account-deletion',{env,
  providerSubscription:{id:'sub_fixture',customer:'cus_fixture',metadata:{clipt_user_id:'user-a'},livemode:false,status:'active'},
  rpcResult:(_op,args)=>({state:args.p_stage==='prepare'?'reserved':'verified',user_id:'user-a',customer_id:'cus_fixture',subscription_id:'sub_fixture'}),
  rpcError:operation=>operation==='account_erasure'?{code:'P0001'}:null,
 });
 const result=await handler(request({action:'begin',confirmation:'DELETE',requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',receipt:'a'.repeat(64)},'valid-token'));
 assert.equal(result.status,503);assert.match((await result.json()).error,/original deletion receipt/);
});

test('pending photo review returns a definitive refusal only before billing shutdown',async()=>{
 const {handler,calls}=handlerFor('account-deletion',{
  env:{SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co'},
  rpcResult:()=>null,
  rpcError:operation=>operation==='account_erasure'?{code:'55000',message:'Photo review in progress; please retry shortly'}:null,
 });
 const response=await handler(request({action:'begin',confirmation:'DELETE',requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',receipt:'a'.repeat(64)},'valid-token'));
 assert.equal(response.status,409);assert.match((await response.json()).error,/No account deletion was committed/);
 assert.equal(calls.some(call=>call.providerCancel||call.storageDownload),false);
});
test('configured isolated sandbox checkout retries stable provider parameters and never grants benefits',async()=>{
 const requestId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 const env={SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',STRIPE_SECRET_KEY:'sk_test_fixture',CLIPT_PAYMENTS_MODE:'test',STRIPE_PREMIUM_PRICE_ID:'price_premium',STRIPE_MAXED_PRICE_ID:'price_maxed',STRIPE_WEBHOOK_SECRET:'whsec_fixture',CLIPT_PAYMENT_RETURN_ORIGIN:'https://development.invalid',CLIPT_SUBSCRIPTION_TEST_USER_ID:'user-a'};
 const {handler,calls}=handlerFor('create-checkout',{env,createdSession:{id:'cs_test_fixture',livemode:false,url:'https://checkout.stripe.com/c/fixture'},
  rpcResult:(_op,args)=>args.p_action==='reserve'?{request_id:requestId,plan:'maxed'}:true});
 for(let i=0;i<2;i++){const result=await handler(request({plan:'maxed',requestId},'valid-token'));assert.equal(result.status,200);assert.equal((await result.json()).fulfillmentStatus,'unverified');}
 const attempts=calls.filter(call=>call.providerCreate==='checkout');assert.equal(attempts.length,2);
 assert.deepEqual(attempts[0],attempts[1]);assert.equal(attempts[0].args.expires_at,undefined);
 assert.deepEqual(attempts[0].args.line_items,[{price:'price_maxed',quantity:1}]);
 assert.equal(calls.some(call=>call.args?.p_action==='reconcile'),false);
});
test('another identity cannot enter pre-verification sandbox checkout',async()=>{
 const {handler,calls}=handlerFor('create-checkout',{env:{STRIPE_SECRET_KEY:'sk_test_fixture',CLIPT_PAYMENTS_MODE:'test',STRIPE_PREMIUM_PRICE_ID:'price_premium',STRIPE_MAXED_PRICE_ID:'price_maxed',STRIPE_WEBHOOK_SECRET:'whsec_fixture',CLIPT_PAYMENT_RETURN_ORIGIN:'https://development.invalid',CLIPT_SUBSCRIPTION_TEST_USER_ID:'other'}});
 assert.equal((await handler(request({plan:'premium',requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},'valid-token'))).status,503);
 assert.equal(calls.some(call=>call.providerCreate||call.operation),false);
});
const sandboxEnvironment={SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',STRIPE_SECRET_KEY:'sk_test_fixture',CLIPT_PAYMENTS_MODE:'test',STRIPE_PREMIUM_PRICE_ID:'price_premium',STRIPE_MAXED_PRICE_ID:'price_maxed',STRIPE_WEBHOOK_SECRET:'whsec_fixture',CLIPT_PAYMENT_RETURN_ORIGIN:'https://development.invalid',CLIPT_SUBSCRIPTION_TEST_USER_ID:'user-a'};
test('foreign project cannot create Sandbox checkout even for an allowlisted account',async()=>{
 const {handler,calls}=handlerFor('create-checkout',{env:{...sandboxEnvironment,SUPABASE_URL:'https://foreign-project.supabase.co'}});
 const response=await handler(request({plan:'premium',requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},'valid-token'));
 assert.equal(response.status,503);
 assert.equal(calls.some(call=>call.providerCreate||call.priceRead||call.operation),false);
});
const readinessUser='1b0ea76e-a629-4f54-8ec5-1e4ae0e7a251';
test('enabled public photo endpoint integrates reserve, owned storage, Azure and confirmed review persistence',async()=>{
 const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',postId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',requestId='cccccccc-cccc-4ccc-8ccc-cccccccccccc';let outbound=0;
 const {handler,calls}=handlerFor('review-public-photo',{userId:owner,
  env:{SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',CLIPT_AZURE_REVIEW_ENABLED:'true',CLIPT_AZURE_F0_VERIFIED:'true',AZURE_CONTENT_SAFETY_ENDPOINT:'https://clipt-test.cognitiveservices.azure.com/',AZURE_CONTENT_SAFETY_KEY:'synthetic-key'},
  queryData:{user_id:owner,is_published:true,is_premium:false,is_subscriber_only:false,required_tier_id:null,moderation_hidden:false,post_type:'clipt',video_url:null,content:'Great game!',image_url:'https://akiksrlzdqvipqbbjxpw.supabase.co/storage/v1/object/public/media/'+owner+'/photo.jpg'},rpcData:true,
  fetcher:async()=>{outbound++;return Response.json({categoriesAnalysis:['Hate','SelfHarm','Sexual','Violence'].map(category=>({category,severity:2}))});}});
 const response=await handler(request({postId,requestId},'valid-token'));assert.equal(response.status,200);assert.equal((await response.json()).state,'needs_review');assert.equal(outbound,2);
 assert.equal(calls.filter(call=>call.operation==='reserve_azure_review').length,1);assert.equal(calls.filter(call=>call.storageDownload).length,1);assert.equal(calls.find(call=>call.operation==='finish_azure_review').args.p_state,'needs_review');
});
test('enabled public photo endpoint refuses caller content before reservation',async()=>{
 const {handler,calls}=handlerFor('review-public-photo',{env:{SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',CLIPT_AZURE_REVIEW_ENABLED:'true',CLIPT_AZURE_F0_VERIFIED:'true'}});
 assert.equal((await handler(request({imageUrl:'https://private.invalid/a'},'valid-token'))).status,400);assert.equal(calls.some(call=>call.operation||call.storageDownload),false);
});
test('public photo review remains disabled before database, storage or provider calls',async()=>{
 const {handler,calls}=handlerFor('review-public-photo',{env:{SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co'}});
 assert.equal((await handler(request({postId:'fixture'},'valid-token'))).status,503);
 assert.equal(calls.some(call=>call.operation||call.table||call.providerCreate),false);
});

test('Azure verification mode cannot broaden caller or fixture scope',async()=>{
 const owner='f6a4f8e9-891f-4598-adaf-a30016f47b35',postId='ecb368d2-8241-45a1-9d19-18698b3ef849';
 const env={SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',CLIPT_AZURE_REVIEW_ENABLED:'false',CLIPT_AZURE_VERIFICATION_ONLY:'true',CLIPT_AZURE_F0_VERIFIED:'true',AZURE_CONTENT_SAFETY_ENDPOINT:'https://clipt-content-safety-dev.cognitiveservices.azure.com/'};
 for(const [userId,target] of [['other',postId],[owner,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb']]) {
  const {handler,calls}=handlerFor('review-public-photo',{userId,env});
  assert.equal((await handler(request({postId:target,requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},'valid-token'))).status,503);
  assert.equal(calls.some(call=>call.operation||call.storageDownload),false);
 }
 const {handler,calls}=handlerFor('review-public-photo',{userId:owner,env,rpcData:false});
 const response=await handler(request({postId,requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},'valid-token'));
 assert.equal(response.status,200);assert.equal((await response.json()).state,'already_reserved');
 assert.equal(calls.some(call=>call.storageDownload),false);
});

test('replacement Azure fixture uses exact server-only scope and rejects partial configuration',async()=>{
 const userId='875b6725-b8fd-4999-a5e5-9527daf01073',postId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 const base={SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',CLIPT_AZURE_REVIEW_ENABLED:'false',CLIPT_AZURE_VERIFICATION_ONLY:'true',CLIPT_AZURE_F0_VERIFIED:'true',AZURE_CONTENT_SAFETY_ENDPOINT:'https://clipt-content-safety-dev.cognitiveservices.azure.com/',CLIPT_AZURE_VERIFICATION_USER_ID:userId,CLIPT_AZURE_VERIFICATION_POST_ID:postId};
 const matched=handlerFor('review-public-photo',{userId,env:base,rpcData:false});
 const response=await matched.handler(request({postId,requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},'valid-token'));
 assert.equal(response.status,200);assert.equal((await response.json()).state,'already_reserved');
 for(const overrides of [{CLIPT_AZURE_VERIFICATION_USER_ID:''},{CLIPT_AZURE_VERIFICATION_POST_ID:''},{CLIPT_AZURE_VERIFICATION_POST_ID:'not-a-uuid'}]) {
  const denied=handlerFor('review-public-photo',{userId,env:{...base,...overrides}});
  assert.equal((await denied.handler(request({postId,requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},'valid-token'))).status,503);
  assert.equal(denied.calls.some(call=>call.operation||call.storageDownload),false);
 }
 const wrong=handlerFor('review-public-photo',{userId:'other',env:base});
 assert.equal((await wrong.handler(request({postId,requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},'valid-token'))).status,503);
 assert.equal(wrong.calls.some(call=>call.operation||call.storageDownload),false);
});

test('Azure verification refuses a different resource before any reservation',async()=>{
 const {handler,calls}=handlerFor('review-public-photo',{userId:'f6a4f8e9-891f-4598-adaf-a30016f47b35',env:{SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',CLIPT_AZURE_VERIFICATION_ONLY:'true',CLIPT_AZURE_F0_VERIFIED:'true',AZURE_CONTENT_SAFETY_ENDPOINT:'https://other.cognitiveservices.azure.com/'}});
 assert.equal((await handler(request({postId:'ecb368d2-8241-45a1-9d19-18698b3ef849',requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},'valid-token'))).status,503);
 assert.equal(calls.some(call=>call.operation||call.storageDownload),false);
});
test('public photo review rejects enrolled password-only sessions before scanning',async()=>{
 const {handler,calls}=handlerFor('review-public-photo',{factors:[{status:'verified'}]});
 assert.equal((await handler(request({},'valid-token'))).status,403);
 assert.equal(calls.some(call=>call.operation||call.table),false);
});
const readinessEnv={...sandboxEnvironment,SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',CLIPT_SUBSCRIPTIONS_VERIFIED:'false'};

test('securely configured disposable account can read readiness without general billing approval',async()=>{
 const userId='46dcc41c-5405-41b2-9be3-251089480809';
 const {handler,calls}=handlerFor('billing-readiness',{userId,env:{...readinessEnv,CLIPT_SUBSCRIPTION_TEST_USER_ID:userId}});
 const response=await handler(request({},'valid-token'));assert.equal(response.status,200);
 const body=await response.json();assert.equal(body.isolatedCheckoutAllowed,true);assert.equal(body.generalCheckoutVerified,false);
 assert.equal(body.lifecycleVerified,false);assert.equal(calls.some(call=>call.operation||call.providerCreate||call.providerUpdate),false);
});

test('unconfigured or malformed test identity cannot read readiness',async()=>{
 for(const configured of ['', 'user-a', '46dcc41c-5405-41b2-9be3-251089480809']){
  const {handler,calls}=handlerFor('billing-readiness',{userId:'user-a',env:{...readinessEnv,CLIPT_SUBSCRIPTION_TEST_USER_ID:configured}});
  assert.equal((await handler(request({},'valid-token'))).status,403);
  assert.equal(calls.some(call=>call.priceRead||call.webhookList||call.operation),false);
 }
});

test('configured readiness account cannot bypass enrolled MFA',async()=>{
 const userId='46dcc41c-5405-41b2-9be3-251089480809';
 const {handler,calls}=handlerFor('billing-readiness',{userId,factors:[{status:'verified'}],env:{...readinessEnv,CLIPT_SUBSCRIPTION_TEST_USER_ID:userId}});
 assert.equal((await handler(request({},'valid-token'))).status,403);
 assert.equal(calls.some(call=>call.priceRead||call.webhookList||call.operation),false);
});
test('designated readiness check reads exact sandbox prices without granting or exposing credentials',async()=>{
 const {handler,calls}=handlerFor('billing-readiness',{env:readinessEnv,userId:readinessUser,webhookEndpoints:[{livemode:false,status:'enabled',url:readinessEnv.SUPABASE_URL+'/functions/v1/stripe-webhook',enabled_events:['*'],secret:'synthetic_hidden_secret'}]});
 const response=await handler(request({},'valid-token'));assert.equal(response.status,200);
 const body=await response.json();assert.equal(body.pricesVerified,true);assert.equal(body.webhookConfigured,true);assert.equal(body.generalCheckoutVerified,false);assert.equal(body.lifecycleVerified,false);assert.equal(body.webhookSignatureVerified,false);
 const encoded=JSON.stringify(body);for(const secret of ['sk_test_fixture','whsec_fixture','synthetic_hidden_secret'])assert.equal(encoded.includes(secret),false);
 assert.equal(calls.some(call=>call.operation||call.providerCreate||call.providerUpdate),false);
});
for(const [name,change] of [
 ['wrong project',{SUPABASE_URL:'https://other-project.supabase.co'}],
 ['enabled verification flag',{CLIPT_SUBSCRIPTIONS_VERIFIED:'true'}],
 ['missing verification flag',{CLIPT_SUBSCRIPTIONS_VERIFIED:''}],
 ['live mode',{CLIPT_PAYMENTS_MODE:'live'}],
 ['live key',{STRIPE_SECRET_KEY:'sk_live_fixture'}],
])test('readiness denies '+name+' before provider reads',async()=>{
 const {handler,calls}=handlerFor('billing-readiness',{userId:readinessUser,env:{...readinessEnv,...change}});
 assert.ok((await handler(request({},'valid-token'))).status>=400);
 assert.equal(calls.some(call=>call.priceRead||call.webhookList||call.operation||call.providerCreate),false);
});
test('wrong test-account identity cannot inspect sandbox configuration',async()=>{
 const {handler,calls}=handlerFor('billing-readiness',{env:readinessEnv});
 assert.equal((await handler(request({userId:readinessUser},'valid-token'))).status,403);
 assert.deepEqual(calls,[{auth:'valid-token'}]);
});
test('readiness does not call mismatched prices or report invalid/live prices as verified',async()=>{
 const missing=handlerFor('billing-readiness',{env:{...readinessEnv,STRIPE_PREMIUM_PRICE_ID:''},userId:readinessUser});
 const body=await (await missing.handler(request({},'valid-token'))).json();assert.equal(body.pricesVerified,false);assert.ok(body.missingFields.includes('STRIPE_PREMIUM_PRICE_ID'));
 assert.equal(missing.calls.some(call=>call.priceRead),false);
 const live=handlerFor('billing-readiness',{env:readinessEnv,userId:readinessUser,priceOverride:{livemode:true}});
 const result=await (await live.handler(request({},'valid-token'))).json();assert.equal(result.pricesVerified,false);
});
test('completed management retry replays its durable result without another provider mutation',async()=>{
 const result={testMode:true,fulfillmentStatus:'awaiting_webhook',cancelAtPeriodEnd:true};
 const {handler,calls}=handlerFor('manage-subscription',{env:sandboxEnvironment,rpcResult:()=>({state:'complete',result})});
 const response=await handler(request({action:'cancel',requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},'valid-token'));
 assert.equal(response.status,200);assert.deepEqual(await response.json(),result);
 assert.equal(calls.some(call=>call.providerUpdate||call.providerRead),false);
});
test('membership cancellation completes durable request but never reconciles browser-triggered benefits',async()=>{
 const {handler,calls}=handlerFor('manage-subscription',{env:sandboxEnvironment,
  providerSubscription:{id:'sub_fixture',customer:'cus_fixture',livemode:false,status:'active',metadata:{clipt_user_id:'user-a'},schedule:null,items:{has_more:false,data:[{quantity:1}]}},
  rpcResult:(_op,args)=>args.p_action==='management_reserve'?{state:'pending',subscription_id:'sub_fixture'}:
   args.p_action==='account'?{subscription_id:'sub_fixture',customer_id:'cus_fixture',risk_hold:false}:{result:args.p_payload.result},
 });
 const response=await handler(request({action:'cancel',requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},'valid-token'));
 assert.equal(response.status,200);assert.equal((await response.json()).fulfillmentStatus,'awaiting_webhook');
 const update=calls.find(call=>call.providerUpdate);
 assert.deepEqual(update.args,{cancel_at_period_end:true,proration_behavior:'none'});
 assert.equal(calls.filter(call=>call.args?.p_action==='management_complete').length,1);
 assert.equal(calls.some(call=>call.args?.p_action==='reconcile'),false);
});
test('uncertain cancellation leaves durable request pending instead of falsely completing it',async()=>{
 const {handler,calls}=handlerFor('manage-subscription',{env:sandboxEnvironment,providerUpdateFailure:true,
  providerSubscription:{id:'sub_fixture',customer:'cus_fixture',livemode:false,status:'active',metadata:{clipt_user_id:'user-a'},schedule:null,items:{has_more:false,data:[{quantity:1}]}},
  rpcResult:(_op,args)=>args.p_action==='management_reserve'?{state:'pending',subscription_id:'sub_fixture'}:{subscription_id:'sub_fixture',customer_id:'cus_fixture',risk_hold:false},
 });
 assert.equal((await handler(request({action:'cancel',requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},'valid-token'))).status,500);
 assert.equal(calls.some(call=>call.args?.p_action==='management_complete'),false);
});

test('legacy stream endpoint cannot mint fake credentials or mutate live records',async()=>{
  for(const action of ['create','end']) {
    const {handler,calls}=handlerFor('mux-stream');
    const response=await handler(request({action},'valid-token'));
    assert.equal(response.status,503);
    const result=await response.json();
    assert.equal(result.stream_key,undefined);assert.equal(result.is_live,undefined);
    assert.deepEqual(calls,[{auth:'valid-token'}]);
  }
});
test('media scanner issues no false approval and never fetches caller URLs',async()=>{
  const {handler,calls}=handlerFor('scan-media-content');
  const response=await handler(request({imageUrl:'http://private.invalid/media'},'valid-token'));
  assert.equal(response.status,503);
  const body=await response.json();assert.equal(body.safe,undefined);
  assert.deepEqual(calls,[{auth:'valid-token'}]);
});

for (const [name, body] of cases) {
  test(name + ' denies enrolled password-only sessions before side effects', async () => {
    const token='fixture.'+Buffer.from(JSON.stringify({sub:'user-a',aal:'aal1'})).toString('base64url')+'.fixture';
    const {handler,calls}=handlerFor(name,{validToken:token,factors:[{status:'verified'}]});
    assert.equal((await handler(request(body,token))).status,403);
    assert.deepEqual(calls,[{auth:token}]);
  });
  test(name + ' rejects anonymous callers before side effects', async () => {
    const { handler, calls } = handlerFor(name);
    assert.equal((await handler(request(body))).status, 401);
    assert.deepEqual(calls, []);
  });
  test(name + ' rejects invalid JWTs before side effects', async () => {
    const { handler, calls } = handlerFor(name);
    assert.equal((await handler(request(body, 'invalid-token'))).status, 401);
    assert.deepEqual(calls, [{ auth: 'invalid-token' }]);
  });
}
for (const [name, body] of cases.filter(([name]) => !['send-sms', 'cloudinary-upload', 'gaming-ai-chat', 'game-chatbot', 'regenerate-sitemap', 'cdn-config', 'igdb', 'vision-analysis', 'cloudflare-check'].includes(name))) {
  test(name + ' refuses another account target', async () => {
    const { handler, calls } = handlerFor(name);
    assert.equal((await handler(request(body, 'valid-token'))).status, 403);
    assert.equal(calls.some(call => call.operation || call.table || call.providerDelete), false);
  });
}
test('account export derives RPC owner from authenticated identity', async () => {
  const { handler, calls } = handlerFor('user-data-management');
  const response = await handler(request({ action: 'export' }, 'valid-token'));
  assert.equal(response.status, 200);
  assert.deepEqual(calls[1].args, { user_id_param: 'user-a' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('enrolled AAL2 session retains account export access',async()=>{
  const token='fixture.'+Buffer.from(JSON.stringify({sub:'user-a',aal:'aal2'})).toString('base64url')+'.fixture';
  const {handler}=handlerFor('user-data-management',{validToken:token,factors:[{status:'verified'}]});
  assert.equal((await handler(request({action:'export'},token))).status,200);
});
test('legacy account deletion cannot invoke archive-and-delete RPC', async () => {
  const { handler } = handlerFor('user-data-management', { rpcData: { success: false } });
  assert.equal((await handler(request({ action: 'delete' }, 'valid-token'))).status, 409);
});

test('new deletion requires explicit confirmation before RPC', async () => {
  const { handler, calls } = handlerFor('account-deletion');
  assert.equal((await handler(request({ action: 'begin' }, 'valid-token'))).status, 400);
  assert.equal(calls.some(call => call.operation), false);
});

test('provider uploads remain disabled without explicit server configuration', async () => {
  const { handler, calls } = handlerFor('mux-handler');
  assert.equal((await handler(request({ action: 'createUpload' }, 'valid-token'))).status, 503);
  assert.equal(calls.some(call => call.operation || call.table || call.providerRead || call.providerDelete), false);
});

test('Twitch does not exchange credentials using a caller-selected Origin', async () => {
  const { handler, calls } = handlerFor('twitch-auth');
  const req = request({ action: 'link-account', code: 'code' }, 'valid-token');
  req.headers.set('Origin', 'https://attacker.invalid');
  assert.equal((await handler(req)).status, 503);
  assert.deepEqual(calls, [{ auth: 'valid-token' }]);
});

for (const name of ['cloudinary-upload', 'gaming-ai-chat', 'game-chatbot', 'regenerate-sitemap', 'cdn-config']) test(name + ' remains closed without provider or data side effects', async () => {
  const { handler, calls } = handlerFor(name);
  assert.equal((await handler(request({}, 'valid-token'))).status, 503);
  assert.deepEqual(calls, [{ auth: 'valid-token' }]);
  assert.equal((await handler(new Request('http://local.invalid'))).status, 405);
});

test('deletion resume rejects malformed receipts before database access', async () => {
  const { handler, calls } = handlerFor('account-deletion');
  assert.equal((await handler(request({ action: 'resume', receipt: 'guess' }))).status, 400);
  assert.equal(calls.length, 0);
});

test('enrolled MFA requires AAL2 before account deletion', async () => {
  for (const aal of ['aal1','aal2']) {
    const token = 'fixture.' + Buffer.from(JSON.stringify({ aal })).toString('base64url') + '.fixture';
    const { handler, calls } = handlerFor('account-deletion', { validToken: token, factors: [{ status: 'verified' }], rpcData: { state: 'complete' } });
    const response = await handler(request({ action: 'begin', confirmation: 'DELETE', requestId: '11111111-1111-4111-8111-111111111111', receipt: 'a'.repeat(64) }, token));
    assert.equal(response.status, aal === 'aal1' ? 403 : 200);
    assert.equal(calls.some(call => call.operation), aal === 'aal2');
  }
});

test('account export excludes stream credentials and unrecognized provider fields', async () => {
  const { handler } = handlerFor('user-data-management', { rpcData: {
    profile: { id: 'user-a' }, streams: [{ id: 'stream-a', user_id: 'user-a', title: 'My stream',
      stream_key: 'secret-fixture', encrypted_stream_key: 'encrypted-fixture', rtmp_key: 'rtmp-fixture',
      ingest_url: 'secret-url', stream_settings: { password: 'nested-secret' }, future_secret: 'future-secret' }],
  } });
  const response = await handler(request({ action: 'export' }, 'valid-token'));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data.streams, [{ id: 'stream-a', user_id: 'user-a', title: 'My stream' }]);
});
test('payment result excludes customer data and does not claim fulfillment', async () => {
  const { handler } = handlerFor('verify-payment', { owner: 'user-a' });
  const response = await handler(request({ sessionId: 'cs_test_owned' }, 'valid-token'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, paymentStatus: 'paid', fulfillmentStatus: 'unverified' });
});
test('method validation occurs before authentication', async () => {
  const { handler, calls } = handlerFor('user-data-management');
  assert.equal((await handler(new Request('http://local.invalid'))).status, 405);
  assert.deepEqual(calls, []);
});
test('oversized body is rejected without database calls', async () => {
  const { handler, calls } = handlerFor('user-data-management');
  assert.equal((await handler(request({ action: 'export', padding: 'x'.repeat(17000) }, 'valid-token'))).status, 413);
  assert.equal(calls.length, 1);
});

test('stream credentials are owner-scoped, explicitly projected and not cached', async () => {
  const { handler, calls } = handlerFor('oauth', { queryData: { id: 'stream-a', rtmp_url: 'rtmps://test.invalid/live', stream_key: 'synthetic-test-key', private_extra: 'excluded' } });
  const response = await handler(request({ action: 'get_stream_credentials', streamId: 'stream-a' }, 'valid-token'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: 'stream-a', rtmp_url: 'rtmps://test.invalid/live', stream_key: 'synthetic-test-key' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.ok(calls.some(call => call.method === 'eq' && call.args[0] === 'user_id' && call.args[1] === 'user-a'));
  assert.ok(calls.some(call => call.method === 'eq' && call.args[0] === 'id' && call.args[1] === 'stream-a'));
  assert.equal(calls.some(call => ['update', 'insert', 'upsert'].includes(call.method)), false);
});

test('stream credentials reject missing or unowned streams without writes', async () => {
  const { handler, calls } = handlerFor('oauth', { queryData: null });
  assert.equal((await handler(request({ action: 'get_stream_credentials', streamId: 'stream-b' }, 'valid-token'))).status, 404);
  assert.equal(calls.some(call => call.operation || ['update', 'insert', 'upsert'].includes(call.method)), false);
});

test('legacy stream credentials are decoded only after the owner query', async () => {
  const { handler, calls } = handlerFor('oauth', { queryData: { id:'stream-a',rtmp_url:'rtmps://test.invalid/live',stream_key:null,encrypted_stream_key:'fixture-encoded' },rpcData:'fixture-decoded' });
  const response = await handler(request({ action:'get_stream_credentials',streamId:'stream-a' },'valid-token'));
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{id:'stream-a',rtmp_url:'rtmps://test.invalid/live',stream_key:'fixture-decoded'});
  const decode = calls.findIndex(call => call.operation === 'decrypt_stream_key');
  const owner = calls.findIndex(call => call.method === 'eq' && call.args[0] === 'user_id');
  assert.ok(owner >= 0 && decode > owner);
  assert.deepEqual(calls[decode].args,{encrypted_key:'fixture-encoded'});
});

test('stream initialization rejects an unowned ID before token generation', async () => {
  const { handler, calls } = handlerFor('oauth', { queryData: null });
  assert.equal((await handler(request({ action: 'initialize_stream', streamId: 'stream-b' }, 'valid-token'))).status, 404);
  assert.equal(calls.some(call => call.operation || ['update', 'insert', 'upsert'].includes(call.method)), false);
});

const donationBody={streamId:'00000000-0000-4000-8000-000000000011',requestId:'00000000-0000-4000-8000-000000000012',amountCents:500,message:'Keep going'};
const paymentEnv={CLIPT_PAYMENTS_MODE:'test',STRIPE_SECRET_KEY:'sk_test_synthetic_fixture',STRIPE_WEBHOOK_SECRET:'whsec_synthetic_fixture',STRIPE_TEST_PRICE_ID:'price_synthetic',CLIPT_PAYMENT_RETURN_ORIGIN:'https://preview.example.invalid',CLIPT_DONATION_TEST_USER_ID:'user-a'};
test('configured Stripe keys alone cannot activate unfinished donations',async()=>{
 const {handler,calls}=handlerFor('process-donation',{env:{...paymentEnv,CLIPT_DONATION_TEST_USER_ID:'other-user'}});
 const response=await handler(request(donationBody,'valid-token'));
 assert.equal(response.status,503);assert.equal(calls.some(call=>call.providerCreate||call.table),false);
});
test('payment endpoints fail closed without test configuration or with live keys',async()=>{
  for(const name of ['process-donation','create-checkout']) for(const env of [{},{...paymentEnv,STRIPE_SECRET_KEY:'sk_live_synthetic_fixture'}]) {
    const {handler,calls}=handlerFor(name,{env});
    assert.equal((await handler(request({...donationBody,plan:'premium'},'valid-token'))).status,503);
    assert.equal(calls.some(call=>call.providerCreate || call.table),false);
  }
});
test('donation rejects unsafe amounts and malformed IDs before provider access',async()=>{
  for(const change of [{amountCents:-1},{amountCents:100.5},{amountCents:'500'},{amountCents:50001},{requestId:'bad'},{message:'x'.repeat(201)}]) {
    const {handler,calls}=handlerFor('process-donation',{env:paymentEnv});
    assert.equal((await handler(request({...donationBody,...change},'valid-token'))).status,400);
    assert.equal(calls.some(call=>call.providerCreate || call.table),false);
  }
});
test('donation binds payer and recipient, uses retry identity and never claims fulfillment',async()=>{
  const {handler,calls}=handlerFor('process-donation',{env:paymentEnv,queryData:{id:donationBody.streamId,user_id:'creator-b',is_live:true}});
  for(let index=0;index<2;index++) {
    const response=await handler(request({...donationBody,recipient_id:'forged'},'valid-token'));
    assert.equal(response.status,200);
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal((await response.json()).fulfillmentStatus,'unverified');
  }
  const writes=calls.filter(call=>call.providerCreate);
  assert.equal(writes.length,2);
  assert.equal(writes[0].args.metadata.clipt_user_id,'user-a');
  assert.equal(writes[0].args.metadata.recipient_id,'creator-b');
  assert.equal(writes[0].config.idempotencyKey,writes[1].config.idempotencyKey);
});
test('donation rejects offline, missing and own streams',async()=>{
  for(const queryData of [null,{is_live:false,user_id:'creator-b'},{is_live:true,user_id:'user-a'}]) {
    const {handler,calls}=handlerFor('process-donation',{env:paymentEnv,queryData});
    assert.equal((await handler(request(donationBody,'valid-token'))).status,403);
    assert.equal(calls.some(call=>call.providerCreate),false);
  }
});
test('Token checkout is disabled and subscription checkout fails closed pending lifecycle setup',async()=>{
  const {handler,calls}=handlerFor('create-checkout',{env:paymentEnv});
  assert.equal((await handler(request({...donationBody},'valid-token'))).status,400);
  for(const plan of ['premium','maxed']) assert.equal((await handler(request({...donationBody,plan},'valid-token'))).status,503);
  assert.equal(calls.some(call=>call.providerCreate || call.operation),false);
});
const webhookRequest = (signature='fixture-valid',body='{"fixture":true}') => new Request('http://local.invalid',{
  method:'POST',headers:{'stripe-signature':signature},body,
});

test('async Checkout success uses server-paid invoice projection, never the event label alone',async()=>{
 const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 const env={...paymentEnv,SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',STRIPE_PREMIUM_PRICE_ID:'price_premium',STRIPE_MAXED_PRICE_ID:'price_maxed'};
 const event={id:'evt_async',created:1,livemode:false,type:'checkout.session.async_payment_succeeded',data:{object:{id:'cs_test_async'}}};
 const session={mode:'subscription',livemode:false,payment_status:'paid',client_reference_id:owner,metadata:{clipt_user_id:owner},subscription:'sub_async'};
 const sub={id:'sub_async',livemode:false,status:'active',customer:'cus_async',collection_method:'charge_automatically',metadata:{clipt_user_id:owner},items:{data:[{price:{id:'price_premium'},quantity:1}],has_more:false},latest_invoice:null};
 for(const override of [{mode:'payment'},{payment_status:'unpaid'}]) {
  const {handler,calls}=handlerFor('stripe-webhook',{env,event,session:{...session,...override}});
  assert.equal((await handler(webhookRequest())).status,200);
  assert.equal(calls.some(c=>c.operation),false);
 }
 const unpaid=handlerFor('stripe-webhook',{env,event,session,providerSubscription:sub,rpcData:true});
 assert.equal((await unpaid.handler(webhookRequest())).status,200);
 assert.equal(unpaid.calls.find(c=>c.operation)?.args.p_payload.snapshot.paid_tier,undefined);
 const paidInvoice={livemode:false,status:'paid',currency:'usd',amount_paid:499,customer:'cus_async',subscription:'sub_async',lines:{data:[{price:{id:'price_premium'},quantity:1,proration:false,period:{start:1700000000,end:1702592000}}],has_more:false}};
 const paid=handlerFor('stripe-webhook',{env,event,session,providerSubscription:{...sub,latest_invoice:paidInvoice},rpcData:true});
 assert.equal((await paid.handler(webhookRequest())).status,200);
 assert.equal(paid.calls.find(c=>c.operation)?.args.p_payload.snapshot.paid_tier,'premium');
});
test('webhook rejects unsigned, invalid, oversized and live events without side effects',async()=>{
  for(const [signature,body,status] of [['','{}',400],['invalid','{}',400],['fixture-valid','x'.repeat(65537),413]]) {
    const {handler,calls}=handlerFor('stripe-webhook',{env:paymentEnv});
    assert.equal((await handler(webhookRequest(signature,body))).status,status);
    assert.equal(calls.some(call=>call.operation || call.providerRead),false);
  }
  const {handler}=handlerFor('stripe-webhook',{env:paymentEnv,event:{livemode:true,type:'invoice.paid'}});
  assert.equal((await handler(webhookRequest())).status,400);
});
test('one-time Token payment events never credit Tokens or grant membership',async()=>{
  for(const type of ['checkout.session.completed','checkout.session.async_payment_succeeded','invoice.paid','customer.subscription.updated','customer.subscription.deleted']) {
    const {handler,calls}=handlerFor('stripe-webhook',{env:paymentEnv,event:{livemode:false,type,data:{object:{id:'fixture'}}}});
    const response=await handler(webhookRequest());
    assert.equal(response.status,503);
    assert.equal(calls.some(call=>call.operation || call.providerRead),false);
    assert.notEqual((await response.json()).fulfilled,true);
  }
});
