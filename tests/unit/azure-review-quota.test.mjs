import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
test('Azure pilot quota and privacy contract executes in isolated PostgreSQL',async()=>{
 const db=new PGlite();const user=randomUUID(),other=randomUUID(),post=randomUUID(),privatePost=randomUUID();
 try {
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema clipt_private;
   create table profiles(id uuid primary key);create table posts(id uuid primary key,user_id uuid,is_published boolean,is_premium boolean,is_subscriber_only boolean,required_tier_id uuid,moderation_hidden boolean,post_type text,scheduled_publish_time timestamptz);
   create schema storage;create table storage.objects(bucket_id text,name text);
   create schema auth;create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
   create function clipt_private.account_available() returns boolean language sql as $$select current_setting('test.aal',true)='aal2'$$;
   create table user_roles(user_id uuid,role text);
   grant usage on schema public to anon,authenticated,service_role;
   grant usage on schema clipt_private to authenticated;`);
  await db.exec(await readFile(new URL('../../database/azure_review_pilot.sql',import.meta.url),'utf8'));
  await db.query('insert into profiles values($1),($2)',[user,other]);
  await db.query("insert into posts values($1,$2,true,false,false,null,false,'photo',null),($3,$2,false,false,false,null,false,'photo',null)",[post,user,privatePost]);
  await db.exec("alter table posts add column image_url text default 'https://development.invalid/photo.jpg';alter table posts add column video_url text");
  await db.query("update posts set image_url=$1 where id=$2",['https://development.invalid/storage/v1/object/public/media/'+user+'/photo.jpg',post]);
  await db.query('insert into storage.objects values($1,$2)',['media',user+'/photo.jpg']);
  const reserve=(target=post,key=randomUUID(),actor=user,operations=2)=>db.query('select reserve_azure_review($1,$2,$3,$4) ok',[actor,target,key,operations]);
  for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);await assert.rejects(reserve(),/permission denied/);await assert.rejects(db.query('select * from clipt_private.azure_review_jobs'),/permission denied/);await db.exec('reset role');}
  await db.exec('set role service_role');
  await assert.rejects(reserve(privatePost),/Public owned photo/);await assert.rejects(reserve(post,randomUUID(),other),/Public owned photo/);
  const key=randomUUID();assert.equal((await reserve(post,key)).rows[0].ok,true);assert.equal((await reserve(post,key)).rows[0].ok,false);assert.equal((await reserve(post)).rows[0].ok,false);
  await db.exec('reset role');
  await db.exec('alter table posts add column likes_count integer default 0;alter table posts add column content text');
  await db.query('update posts set likes_count=likes_count+1 where id=$1',[post]);
  assert.equal((await db.query('select likes_count from posts where id=$1',[post])).rows[0].likes_count,1);
  await assert.rejects(db.query("update posts set content='Changed caption' where id=$1",[post]),/review in progress/);
  await assert.rejects(db.query('update posts set user_id=$1 where id=$2',[other,post]),/review in progress/);
  await db.exec('reset role');await assert.rejects(db.query('update posts set is_published=false where id=$1',[post]),/review in progress/);
  await assert.rejects(db.query('delete from posts where id=$1',[post]),/review in progress/);
  await assert.rejects(db.query('delete from profiles where id=$1',[user]),/review in progress/);
  await assert.rejects(db.query('delete from storage.objects where name=$1',[user+'/photo.jpg']),/review in progress/);
  await db.query("select set_config('test.uid',$1,false),set_config('test.aal','aal2',false)",[other]);
  await db.exec('set role authenticated');await assert.rejects(db.query('select * from azure_photo_review_queue()'),/Moderator/);
  await db.exec('reset role');await db.query("insert into user_roles values($1,'moderator')",[other]);
  await db.exec('set role authenticated');assert.equal((await db.query('select * from azure_photo_review_queue()')).rows.length,1);
  await db.exec('reset role');await db.query("select set_config('test.aal','aal1',false)");
  await db.exec('set role authenticated');await assert.rejects(db.query('select * from azure_photo_review_queue()'),/Moderator/);
  await db.exec('set role service_role');await assert.rejects(db.query("select finish_azure_review($1,$2,'failed')",[other,key]),/ownership/);
  await db.query("select finish_azure_review($1,$2,'needs_review')",[user,key]);
  await db.exec('reset role');
  assert.equal((await db.query('select state from clipt_private.azure_review_jobs where id=$1',[key])).rows[0].state,'needs_review');
  for(let i=0;i<4;i++){await db.exec('reset role');const id=randomUUID();await db.query("insert into posts(id,user_id,is_published,is_premium,is_subscriber_only,required_tier_id,moderation_hidden,post_type,scheduled_publish_time) values($1,$2,true,false,false,null,false,'photo',null)",[id,user]);await db.exec('set role service_role');await reserve(id);}
  await db.exec('reset role');const extra=randomUUID();await db.query("insert into posts(id,user_id,is_published,is_premium,is_subscriber_only,required_tier_id,moderation_hidden,post_type,scheduled_publish_time) values($1,$2,true,false,false,null,false,'photo',null)",[extra,user]);await db.exec('set role service_role');await assert.rejects(reserve(extra),/quota reached/);
  await db.exec('reset role');assert.equal((await db.query('select sum(operations)::int total from clipt_private.azure_review_jobs')).rows[0].total,10);
  await db.query('delete from posts where id=$1',[post]);
  await db.exec('set role service_role');await assert.rejects(reserve(extra),/quota reached/);
  await db.exec('reset role');assert.equal((await db.query('select max(operations) total from clipt_private.azure_review_budget')).rows[0].total,10);
  // Simulate an operator reconciling workers only AFTER they have terminated.
  const pending=(await db.query("select id from clipt_private.azure_review_jobs where state='pending' and user_id=$1",[user])).rows;
  await db.exec('set role service_role');
  for(const job of pending) {
   assert.equal((await db.query("select finish_azure_review($1,$2,'failed') ok",[user,job.id])).rows[0].ok,true);
   assert.equal((await db.query("select finish_azure_review($1,$2,'failed') ok",[user,job.id])).rows[0].ok,false);
  }
  await db.exec('reset role');await db.query('delete from profiles where id=$1',[user]);
  assert.equal((await db.query('select count(*)::int count from clipt_private.azure_review_jobs where user_id=$1',[user])).rows[0].count,0);
  assert.equal((await db.query("select count(*)::int count from clipt_private.azure_review_budget where budget_key like 'actor:%'")).rows[0].count,0);
  assert.equal((await db.query("select min(operations) total from clipt_private.azure_review_budget")).rows[0].total,10);
 } finally {await db.close();}
});
