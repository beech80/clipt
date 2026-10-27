import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const buyer = '00000000-0000-4000-8000-000000000001';
const creator = '00000000-0000-4000-8000-000000000002';
const stranger = '00000000-0000-4000-8000-000000000003';
const stream = '00000000-0000-4000-8000-000000000010';
const gift = '00000000-0000-4000-8000-000000000020';
const request = '00000000-0000-4000-8000-000000000030';

test('token ledger executes in local PostgreSQL against an explicit contract fixture', async t => {
  const db = new PGlite();
  try {
    await db.exec(await readFile(new URL('../fixtures/token-ledger-bootstrap.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../supabase/migrations/20260909000300_token_ledger.sql', import.meta.url), 'utf8'));
    await db.exec(`insert into auth.users values ('${buyer}'),('${creator}'),('${stranger}');
      insert into public.streams values ('${stream}','${creator}',true);
      insert into public.virtual_gifts values ('${gift}',30,true);`);
    const asRole = async (role, user = '') => {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
      await db.exec(`set role ${role}`);
    };
    const balance = async () => (await db.query('select balance from public.token_wallets')).rows;
    await t.test('only the service role can credit purchases', async () => {
      await asRole('authenticated', buyer);
      await assert.rejects(db.query('select public.credit_token_purchase($1,100,$2)', [buyer, 'checkout-1']), /permission denied/i);
      await asRole('service_role');
      const first = await db.query('select public.credit_token_purchase($1,100,$2) as id', [buyer, 'checkout-1']);
      const replay = await db.query('select public.credit_token_purchase($1,100,$2) as id', [buyer, 'checkout-1']);
      assert.equal(first.rows[0].id, replay.rows[0].id);
      await assert.rejects(db.query('select public.credit_token_purchase($1,101,$2)', [buyer, 'checkout-1']), /conflict/i);
      await asRole('authenticated', buyer);
      assert.equal(Number((await balance())[0].balance), 100);
    });
    await t.test('wallets are owner-readable and cannot be directly edited', async () => {
      await asRole('authenticated', stranger);
      assert.deepEqual(await balance(), []);
      await assert.rejects(db.query('update public.token_wallets set balance=999'), /permission denied/i);
      await assert.rejects(db.query("insert into public.token_ledger(user_id,amount,kind,idempotency_key,reference_id) values ($1,99,'REWARD','fake','fake')", [stranger]), /permission denied/i);
      await asRole('anon');
      await assert.rejects(db.query('select * from public.token_wallets'), /permission denied/i);
    });
    await t.test('gift purchase debits once and does not transfer raw tokens to the creator', async () => {
      await asRole('authenticated', buyer);
      const args = [stream, gift, request, 'Great stream'];
      const first = await db.query('select public.purchase_stream_gift($1,$2,$3,$4) as id', args);
      const replay = await db.query('select public.purchase_stream_gift($1,$2,$3,$4) as id', args);
      assert.equal(first.rows[0].id, replay.rows[0].id);
      assert.equal(Number((await balance())[0].balance), 70);
      await assert.rejects(db.query('select public.purchase_stream_gift($1,$2,$3,$4)', [stream,gift,request,'changed']), /conflict/i);
      await asRole('authenticated', creator);
      assert.deepEqual(await balance(), []);
      await db.exec('reset role');
      assert.equal((await db.query('select * from public.stream_gifts')).rows.length, 1);
      assert.equal((await db.query("select * from public.token_ledger where kind='GIFT'")).rows.length, 1);
    });
    await t.test('insufficient balance and inactive gifts leave no partial purchase', async () => {
      await asRole('authenticated', stranger);
      await assert.rejects(db.query('select public.purchase_stream_gift($1,$2,$3)', [stream,gift,'00000000-0000-4000-8000-000000000031']), /Insufficient tokens/i);
      await db.exec('reset role');
      await db.query('update public.virtual_gifts set is_active=false where id=$1', [gift]);
      await asRole('authenticated', buyer);
      await assert.rejects(db.query('select public.purchase_stream_gift($1,$2,$3)', [stream,gift,'00000000-0000-4000-8000-000000000032']), /unavailable/i);
      assert.equal(Number((await balance())[0].balance), 70);
      await db.exec('reset role');
      assert.equal((await db.query('select * from public.stream_gifts')).rows.length, 1);
      assert.equal((await db.query('select * from public.token_wallets where user_id=$1', [stranger])).rows.length, 0);
    });
  } finally { await db.close(); }
});
