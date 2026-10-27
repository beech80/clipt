import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../../supabase/functions/_shared/billing-return-review.ts',import.meta.url),'utf8'));
const {billingReturnReview,currentDevelopmentPreviewOrigin}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('return review recognizes only the exact corrected development Preview origin',()=>{
 for(const suffix of ['', '/'])assert.deepEqual(billingReturnReview(currentDevelopmentPreviewOrigin+suffix),{returnOriginValid:true,returnOriginMatchesCurrentPreview:true});
 for(const value of ['https://clipttest-bvos0jxuo-matthew-beechers-projects.vercel.app','https://example.com',currentDevelopmentPreviewOrigin+'.evil.test'])
  assert.deepEqual(billingReturnReview(value),{returnOriginValid:true,returnOriginMatchesCurrentPreview:false});
});
test('return review rejects malformed or credential-bearing config without returning raw values',()=>{
 for(const value of [undefined,'','invalid','http://localhost',currentDevelopmentPreviewOrigin+'/payment-success',currentDevelopmentPreviewOrigin+'?secret=hidden',currentDevelopmentPreviewOrigin+'#hidden','https://user:password@example.com',' '+currentDevelopmentPreviewOrigin])
  assert.deepEqual(billingReturnReview(value),{returnOriginValid:false,returnOriginMatchesCurrentPreview:false});
});
test('destination diagnostic stays additive and cannot certify billing or alter provider state',()=>{
 const handler=readFileSync(new URL('../../supabase/functions/billing-readiness/index.ts',import.meta.url),'utf8');
 assert.match(handler,/billingReturnReview\(Deno\.env\.get\('CLIPT_PAYMENT_RETURN_ORIGIN'\)\)/);
 assert.match(handler,/generalCheckoutVerified:false/);
 assert.doesNotMatch(handler,/sessions\.create|subscriptions\.(create|update)|\.from\(/);
 const ui=readFileSync(new URL('../../src/components/SubscriptionReadiness.tsx',import.meta.url),'utf8');
 assert.match(ui,/returnOriginMatchesCurrentPreview:z\.boolean\(\)\.optional\(\)/);
 assert.match(ui,/Not checked by this server version/);
});
