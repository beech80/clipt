import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
test('channel migration preserves public-post visibility, game integrity and private stream credentials',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema clipt_private;
 create table public.games(id uuid primary key);create table public.streams(id uuid,user_id uuid,is_live boolean,stream_key text,stream_settings jsonb);
 create table public.profiles(id uuid,username text,avatar_url text);
 create table public.posts(id uuid,content text,image_url text,created_at timestamptz default now(),game_id uuid,user_id uuid,is_published boolean default true,moderation_hidden boolean default false,is_premium boolean default false,is_subscriber_only boolean default false,required_tier_id uuid,post_type text,video_url text);
 create table clipt_private.held(id uuid);create function clipt_private.photo_review_held(target uuid)returns boolean language sql stable as $$select exists(select 1 from clipt_private.held where id=target)$$;`);
 await db.exec(readFileSync(new URL('../../supabase/migrations/20261029171137_clipt_game_channels_metadata.sql',import.meta.url),'utf8'));
 await db.query('insert into games values ($1),($2)',[id(1),id(2)]);
 await db.query('insert into profiles values ($1,$2,null)',[id(80),'creator']);
 for(let n=100;n<=110;n++)await db.query('insert into posts(id,user_id,game_id,content,image_url,post_type)values($1,$2,$3,$4,$5,$6)',[id(n),id(80),n===101?id(2):id(1),'Caption #game','owned/photo.jpg','photo']);
 await db.query('update posts set video_url=$1 where id=$2',['owned/clip.mp4',id(102)]);
 await db.query('update posts set is_published=false where id=$1',[id(103)]);await db.query("update posts set post_type='squad' where id=$1",[id(104)]);await db.query('insert into clipt_private.held values($1)',[id(105)]);await db.query('update posts set moderation_hidden=true where id=$1',[id(106)]);await db.query('update posts set is_premium=true where id=$1',[id(107)]);await db.query('update posts set is_subscriber_only=true where id=$1',[id(108)]);await db.query("update posts set created_at=now()+interval '1 day' where id=$1",[id(109)]);await db.query('update posts set required_tier_id=$1 where id=$2',[id(9),id(110)]);
 assert.deepEqual((await db.query('select id from public_channel_posts order by id')).rows.map(row=>row.id),[id(100),id(101)]);
 assert.deepEqual((await db.query('select id from public_channel_posts where game_id=$1',[id(1)])).rows.map(row=>row.id),[id(100)]);
 const grants=(await db.query("select has_column_privilege('authenticated','streams','game_id','UPDATE') as game_write,has_column_privilege('authenticated','streams','stream_key','SELECT') as key_read,has_column_privilege('authenticated','streams','stream_settings','SELECT') as settings_read")).rows[0];assert.deepEqual(grants,{game_write:true,key_read:false,settings_read:false});
 const options=(await db.query("select reloptions from pg_class where oid='public_channel_posts'::regclass")).rows[0].reloptions;assert.ok(options.includes('security_invoker=true'));assert.ok(options.includes('security_barrier=true'));
 await assert.rejects(db.query('insert into streams(id,user_id,game_id)values($1,$2,$3)',[id(40),id(80),id(999)]),/foreign key/);
 }finally{await db.close();}
});
