import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

test('approved subscription catalog retains exact monthly pricing and economy limits',()=>{
  const source=stripTypeScriptTypes(readFileSync(new URL('../../src/lib/membership-catalog.ts',import.meta.url),'utf8')).replace('export const','const');
  const catalog=new Function(source+';return membershipCatalog;')();
  assert.deepEqual([catalog.premium.cents,catalog.premium.monthly,catalog.premium.discount,catalog.premium.dailyTokens,catalog.premium.storage],[499,true,10,30,400]);
  assert.deepEqual([catalog.maxed.cents,catalog.maxed.monthly,catalog.maxed.discount,catalog.maxed.dailyTokens,catalog.maxed.storage],[1499,true,20,50,1000]);
});
test('checkout return never claims successful payment based on route navigation',()=>{
  const source=readFileSync(new URL('../../src/pages/payment-success.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(source,/toast\.success|Payment Successful|setTimeout/);
  assert.match(source,/does not confirm payment/);
});
test('subscription UI passes selected plan to authenticated function and validates redirect origin',()=>{
  const source=readFileSync(new URL('../../src/pages/Subscription.tsx',import.meta.url),'utf8');
  assert.match(source,/supabase\.functions\.invoke\('create-checkout'/);
  assert.match(source,/body: \{ plan, requestId:/);
  assert.match(source,/busy\.current = true/);
  assert.match(source,/url\.origin !== 'https:\/\/checkout\.stripe\.com'/);
  assert.match(source,/const plan = membershipCatalog\[code\]/); // Display the approved typed catalog, not legacy object-valued DB features.
});
