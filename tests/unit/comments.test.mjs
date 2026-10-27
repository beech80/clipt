import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommentService } from '../../src/services/commentServiceCore.ts';

function fixture(result, user = { id: 'user-a' }) {
  const calls = [];
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      const query = new Proxy({}, { get: (_, method) => {
        if (method === 'then') return resolve => resolve(result);
        return (...args) => { calls.push({ table, method, args }); return query; };
      } });
      return query;
    },
  };
  return { service: createCommentService(client), calls };
}
const input = { post_id: 'post-a', user_id: 'user-a', content: 'A real comment' };
test('comment failure rejects so forms retain the draft', async () => {
  const { service } = fixture({ data: null, error: new Error('database failed') });
  await assert.rejects(service.createComment(input), /database failed/);
});
test('comments reject impersonation and anonymous writes', async () => {
  for (const user of [null, { id: 'user-b' }]) {
    const { service, calls } = fixture({}, user);
    await assert.rejects(service.createComment(input));
    assert.deepEqual(calls, []);
  }
});
test('comments validate empty and oversized content', async () => {
  const { service, calls } = fixture({});
  await assert.rejects(service.createComment({ ...input, content: '  ' }));
  await assert.rejects(service.createComment({ ...input, content: 'x'.repeat(2001) }));
  assert.deepEqual(calls, []);
});
test('reply cannot target a different post', async () => {
  const { service, calls } = fixture({ data: { id: 'parent', post_id: 'other-post' }, error: null });
  await assert.rejects(service.createComment({ ...input, parent_id: 'parent' }), /this post/);
  assert.equal(calls.some(call => call.method === 'insert'), false);
});
test('delete is owner-scoped and empty result is not success', async () => {
  const { service, calls } = fixture({ data: [], error: null });
  await assert.rejects(service.deleteComment('comment-a'));
  assert.ok(calls.some(call => call.method === 'eq' && call.args[0] === 'user_id' && call.args[1] === 'user-a'));
});
test('pagination uses an offset and stable order', async () => {
  const { service, calls } = fixture({ data: [], error: null });
  await service.getComments('post-a', 2, 20);
  assert.ok(calls.some(call => call.method === 'range' && call.args[0] === 40 && call.args[1] === 59));
  assert.ok(calls.some(call => call.method === 'order' && call.args[0] === 'id'));
});

test('cursor pagination is stable across newer inserts and validates filter input',async()=>{
  const {service,calls}=fixture({data:[],error:null});
  const cursor={id:'00000000-0000-4000-8000-000000000077',created_at:'2026-09-01T00:00:00+00:00'};
  await service.getComments('post-a',0,50,cursor);
  assert.ok(calls.some(call=>call.method==='or'&&call.args[0]===`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`));
  await assert.rejects(service.getComments('post-a',0,50,{...cursor,id:'invalid),id.gt.0'}),/cursor/);
  await assert.rejects(service.getComments('post-a',0,50,{...cursor,created_at:'invalid'}),/cursor/);
});
