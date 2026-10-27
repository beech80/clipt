import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEVELOPMENT_PROJECT as ref,requireDevelopmentTarget} from '../../scripts/development-target.mjs';
test('fixture guard rejects default and original production-shared target',()=>{
  assert.throws(()=>requireDevelopmentTarget({}),/Fixture writes disabled/);
  assert.throws(()=>requireDevelopmentTarget({CLIPT_TEST_PROJECT_REF:'slnjliheyiiummxhrgmk',CLIPT_TEST_SCHEMA_VERIFIED:ref}),/forbidden/);
});
test('fixture guard requires verified isolated schema',()=>{
  assert.throws(()=>requireDevelopmentTarget({CLIPT_TEST_PROJECT_REF:ref}),/schema is verified/);
  assert.equal(requireDevelopmentTarget({CLIPT_TEST_PROJECT_REF:ref,CLIPT_TEST_SCHEMA_VERIFIED:ref}),ref);
});
test('fixture guard rejects unverified and mismatched Preview',()=>{
  const env={CLIPT_TEST_PROJECT_REF:ref,CLIPT_TEST_SCHEMA_VERIFIED:ref,CLIPT_TEST_PREVIEW_ACCESS:'https://test.vercel.app/?_vercel_share=fixture'};
  assert.throws(()=>requireDevelopmentTarget(env),/Preview fixture writes disabled/);
  assert.throws(()=>requireDevelopmentTarget({...env,CLIPT_TEST_PREVIEW_BASE:'https://other.vercel.app',CLIPT_TEST_PREVIEW_BACKEND_VERIFIED:ref}),/Preview fixture writes disabled/);
  assert.equal(requireDevelopmentTarget({...env,CLIPT_TEST_PREVIEW_BASE:'https://test.vercel.app',CLIPT_TEST_PREVIEW_BACKEND_VERIFIED:ref}),ref);
});
