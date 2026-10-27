import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {muxTestSnapshot} from '../../supabase/functions/_shared/mux-test-live.ts';
const resource={id:'approved',test:true,status:'idle',max_continuous_duration:300,playback_ids:[{id:'public123',policy:'public'}],stream_key:'never-return-me'};
test('staged adapter retains server-only development binding and makes no provider writes',()=>{
 const handler=readFileSync(new URL('../../supabase/functions/mux-test-live/index.ts',import.meta.url),'utf8');
 assert.match(handler,/await authenticatedUser\(req\)/);
 assert.match(handler,/assertOwnUser\(body.userId,user.id\)/);
 assert.match(handler,/user.id!==owner\|\|body.streamId!==localId/);
 assert.match(handler,/\.eq\('user_id',user.id\)/);
 assert.match(handler,/CLIPT_MUX_TEST_LIVE_ENABLED/);
 assert.match(handler,/akiksrlzdqvipqbbjxpw/);
 assert.match(handler,/redirect:'error'/);
 assert.match(handler,/AbortSignal.timeout\(10000\)/);
 assert.doesNotMatch(handler,/method:\s*['"](?:POST|PUT|DELETE)['"]/);
 assert.doesNotMatch(handler,/console\.(?:log|error)/);
});
test('test live snapshot follows provider state and never contains ingest credentials',()=>{
 assert.equal(muxTestSnapshot(resource,'approved').is_live,false);
 assert.equal(muxTestSnapshot({...resource,status:'active'},'approved').is_live,true);
 assert.equal(muxTestSnapshot({...resource,status:'disabled'},'approved').is_live,false);
 assert.ok(!JSON.stringify(muxTestSnapshot(resource,'approved')).includes('never-return-me'));
});
test('paid, foreign, long-running and unknown provider states fail closed',()=>{
 for(const override of [{test:false},{id:'foreign'},{max_continuous_duration:301},{max_continuous_duration:NaN},{max_continuous_duration:0},{status:'connected'}])
  assert.throws(()=>muxTestSnapshot({...resource,...override},'approved'));
});
test('signed or malformed playback cannot become public pilot playback',()=>{
 for(const playback_ids of [[{id:'secret',policy:'signed'}],[{id:'../bad',policy:'public'}],[]])
  assert.throws(()=>muxTestSnapshot({...resource,playback_ids},'approved'));
});
