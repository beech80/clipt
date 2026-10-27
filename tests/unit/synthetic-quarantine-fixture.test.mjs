import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const owner='1b0ea76e-a629-4f54-8ec5-1e4ae0e7a251',original='0b28e432-16c4-4fc1-adc7-bec6ce263cd8',synthetic='a7dc97c8-70bf-4f51-95e2-4ab700946270';
test('approved synthetic fixture is separate, atomically hidden, bounded and cannot overwrite genuine review',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon;create role authenticated;create role service_role;
   create schema clipt_private;create schema auth;create schema storage;
   create table profiles(id uuid primary key);create table user_roles(user_id uuid,role text);
   create table posts(id uuid primary key,user_id uuid,is_published boolean default true,
    is_premium boolean default false,is_subscriber_only boolean default false,required_tier_id uuid,
    moderation_hidden boolean default false,post_type text default 'clipt',scheduled_publish_time timestamptz,
    image_url text,video_url text,content text);
   create table storage.objects(bucket_id text,name text);
   create function auth.uid() returns uuid language sql as $$select null::uuid$$;
   create function clipt_private.account_available() returns boolean language sql as $$select false$$;
   create table clipt_private.azure_dispatch_settings(singleton boolean primary key,enabled boolean);
   insert into clipt_private.azure_dispatch_settings values(true,false);`);
  for(const name of ['azure_review_pilot.sql','azure_auto_quarantine.sql'])await db.exec(await readFile(new URL('../../database/'+name,import.meta.url),'utf8'));
  await db.query('insert into profiles values($1)',[owner]);
  await db.query("insert into posts(id,user_id,image_url,content) values($1,$2,'https://dev.invalid/test.png','CLIPT Azure test')",[original,owner]);
  await db.query("select reserve_azure_review($1,$2,'c26f0d68-19f7-4f99-9c5a-52fe945caa10',2)",[owner,original]);
  await db.query("select finish_azure_review_with_quarantine($1,'c26f0d68-19f7-4f99-9c5a-52fe945caa10','no_flag_detected')",[owner]);
  const sql=await readFile(new URL('../../database/prepare_synthetic_quarantine_fixture.sql',import.meta.url),'utf8');
  await db.exec(sql);
  assert.equal((await db.query('select moderation_hidden from posts where id=$1',[synthetic])).rows[0].moderation_hidden,true);
  assert.equal((await db.query('select moderation_hidden from posts where id=$1',[original])).rows[0].moderation_hidden,false);
  assert.equal((await db.query("select state from clipt_private.azure_review_jobs where id='c26f0d68-19f7-4f99-9c5a-52fe945caa10'")).rows[0].state,'no_flag_detected');
  assert.equal((await db.query('select count(*)::int n from clipt_private.azure_photo_quarantines')).rows[0].n,1);
  assert.equal((await db.query('select enabled from clipt_private.azure_dispatch_settings')).rows[0].enabled,false);
  assert.equal((await db.query('select count(*)::int n from user_roles')).rows[0].n,0);
  await assert.rejects(db.exec(sql),/already exists/);await db.exec('rollback');
  assert.equal((await db.query('select count(*)::int n from posts')).rows[0].n,2);
 }finally{await db.close();}
});
