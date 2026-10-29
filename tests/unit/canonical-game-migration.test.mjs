import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';import {PGlite} from '@electric-sql/pglite';
test('canonical channels preserve duplicate IDs and content while locking catalog writes to the verified importer',async()=>{
 const db=new PGlite();try{await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create table public.games(id uuid primary key default gen_random_uuid(),name text not null,cover_url text,created_at timestamptz not null default now());
 grant all on public.games to authenticated,service_role;grant select on public.games to anon;alter table public.games enable row level security;
 create policy public_game_catalog on public.games for select to anon,authenticated using(true);
 create policy "Allow authenticated users to insert/update games" on public.games for all to authenticated using(true) with check(true);
 create table public.posts(id uuid primary key,game_id uuid references public.games(id));
 insert into public.games(id,name,created_at) values('00000000-0000-4000-8000-000000000001','Fortnite','2025-01-01'),('00000000-0000-4000-8000-000000000002',' fortnite ','2025-02-01'),('00000000-0000-4000-8000-000000000003','Fort','2025-01-01'),('00000000-0000-4000-8000-000000000004','Other game','2025-01-01');
 insert into public.posts values('00000000-0000-4000-8000-000000000100','00000000-0000-4000-8000-000000000002');`);
 const file=readdirSync(new URL('../../supabase/migrations/',import.meta.url)).find(name=>name.endsWith('_canonical_game_catalog.sql'));await db.exec(readFileSync(new URL('../../supabase/migrations/'+file,import.meta.url),'utf8'));
 assert.equal((await db.query('select count(*)::int count from public.games')).rows[0].count,4);assert.equal((await db.query('select count(*)::int count from public.game_channel_catalog')).rows[0].count,3);
 const group=(await db.query("select member_ids from public.game_channel_catalog where name='Fortnite'")).rows[0].member_ids;assert.deepEqual(group,['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002']);assert.equal((await db.query('select game_id from posts')).rows[0].game_id,group[1]);
 await db.exec('set role authenticated');await assert.rejects(db.query("insert into public.games(name) values('Fake')"),/permission denied/);await assert.rejects(db.query("select cache_verified_game(700,'Fake',null,null,null)"),/permission denied/);assert.equal((await db.query('select count(*)::int count from game_channel_catalog')).rows[0].count,3);
 await db.exec('reset role;set role service_role');
 const input=[700,'Fortnite',null,2017,'PC',true];const a=await db.query('select cache_verified_game($1,$2,$3,$4,$5,$6) game',input),b=await db.query('select cache_verified_game($1,$2,$3,$4,$5,$6) game',input);assert.equal(a.rows[0].game.id,b.rows[0].game.id);assert.equal(a.rows[0].game.id,group[0]);
 await db.query("select cache_verified_game(701,'Same name',null,1993,'PC',false)");await db.query("select cache_verified_game(702,'Same name',null,2016,'Console',false)");assert.equal((await db.query("select count(*)::int count from games where name='Same name'")).rows[0].count,2);
 await assert.rejects(db.query("select cache_verified_game(703,'Bad cover','https://unrelated.example/cover.jpg',null,null)"),/Invalid verified/);
 }finally{await db.close();}
});
