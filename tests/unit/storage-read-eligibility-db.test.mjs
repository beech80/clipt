import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { prepareLegacyMediaBoundary } from '../../scripts/private-media-release.mjs';

for (const projectRef of ['akiksrlzdqvipqbbjxpw','slnjliheyiiummxhrgmk']) test(`media read boundary intersects visibility and MFA for ${projectRef} in isolated PostgreSQL`, async t => {
  const db = new PGlite();
  const owner = '00000000-0000-4000-8000-000000000001';
  const other = '00000000-0000-4000-8000-000000000002';
  const reference = (name,bucket='media') => `https://${projectRef}.supabase.co/storage/v1/object/public/${bucket}/${owner}/${name}`;
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth; create schema clipt_private; create schema storage;
      grant usage on schema auth,clipt_private,storage,public to anon,authenticated;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
      create function clipt_private.blocked_with(actor uuid) returns boolean language sql stable as $$select coalesce(actor::text=nullif(current_setting('test.blocked',true),''),false)$$;
      create function clipt_private.account_available() returns boolean language sql stable as $$select auth.uid() is not null and (current_setting('test.enrolled',true)!='true' or current_setting('test.aal',true)='aal2')$$;
      create function clipt_private.beta_access_allowed() returns boolean language sql stable as $$select coalesce(current_setting('test.beta_denied',true),'false')!='true'$$;
      create table public.posts(id integer primary key,user_id uuid,video_url text,image_url text,is_published boolean,is_premium boolean default false,is_subscriber_only boolean default false,moderation_hidden boolean default false);
      create table public.profiles(id uuid primary key,avatar_url text);
      create table public.post_video_renditions(post_id integer,playback_url text);
      create table storage.objects(bucket_id text,name text,owner_id text,owner uuid,id uuid default gen_random_uuid());
      grant select on public.posts,public.profiles,storage.objects to anon,authenticated;
      grant select on public.post_video_renditions to anon,authenticated;
      alter table public.posts enable row level security;
      alter table public.profiles enable row level security;
      alter table storage.objects enable row level security;
      create policy existing_posts on public.posts for select using(true);
      create policy existing_profiles on public.profiles for select using(true);
      create policy existing_storage on storage.objects for select using(true);
      create policy post_visibility on public.posts as restrictive for select to anon,authenticated using((user_id=auth.uid() or (is_published and not is_premium and not is_subscriber_only)) and not clipt_private.blocked_with(user_id));
      create policy post_moderation on public.posts as restrictive for select to anon,authenticated using(not moderation_hidden or user_id=auth.uid());
      create policy post_account on public.posts as restrictive for all to authenticated using(clipt_private.account_available());
      create policy storage_account on storage.objects as restrictive for all to authenticated using(clipt_private.account_available());
    `);
    for (const [id,name,published,premium,subscriber,hidden] of [
      [1,'public.mp4',true,false,false,false], [2,'draft.mp4',false,false,false,false],
      [3,'premium.mp4',true,true,false,false], [4,'subscriber.mp4',true,false,true,false],
      [5,'hidden.mp4',true,false,false,true],
    ]) await db.query('insert into public.posts values($1,$2,$3,null,$4,$5,$6,$7)',[id,owner,reference(name),published,premium,subscriber,hidden]);
    await db.query('insert into public.posts values(6,$1,null,$2,true,false,false,false)',[owner,[reference('first.jpg'),reference('second.jpg')].join(',')]);
    // An attacker publishing a reference to another owner's draft cannot grant access.
    await db.query('insert into public.posts values(7,$1,$2,null,true,false,false,false)',[other,reference('draft.mp4')]);
    await db.exec('alter table public.posts add column required_tier_id uuid; alter table public.posts add column scheduled_publish_time timestamptz;');
    await db.query('insert into public.posts(id,user_id,video_url,is_published,required_tier_id) values(8,$1,$2,true,$1)',[owner,reference('tier.mp4')]);
    await db.query("insert into public.posts(id,user_id,video_url,is_published,scheduled_publish_time) values(9,$1,$2,true,now()+interval '1 day')",[owner,reference('scheduled.mp4')]);
    await db.query('insert into public.profiles values($1,$2)',[owner,reference('avatar.jpg','clipt-avatars')]);
    await db.query('insert into public.post_video_renditions values(1,$1),(2,$2)',[reference('converted-public.mp4'),reference('converted-draft.mp4')]);
    for (const [bucket,name] of [['media','public.mp4'],['media','draft.mp4'],['media','premium.mp4'],['media','subscriber.mp4'],['media','hidden.mp4'],['media','first.jpg'],['media','second.jpg'],['media','orphan.mp4'],['recordings','replay.mp4'],['clipt-avatars','avatar.jpg']]) {
      await db.query('insert into storage.objects values($1,$2,$3,$4)',[bucket,`${owner}/${name}`,owner,owner]);
    }
    await db.query('insert into storage.objects values($1,$2,$3,$4)',['media',`${other}/wrong-owner.mp4`,owner,owner]);
    await db.query('insert into storage.objects values($1,$2,null,$3)',['media',`${owner}/legacy.mp4`,owner]);
    for(const name of ['converted-public.mp4','converted-draft.mp4','tier.mp4','scheduled.mp4']) await db.query('insert into storage.objects values($1,$2,$3,$4)',['media',`${owner}/${name}`,owner,owner]);
    await db.exec(await prepareLegacyMediaBoundary(projectRef));
    const asRole = async (role,uid='',enrolled=false,aal='aal1',blocked='') => {
      await db.exec('reset role');
      await db.query("select set_config('test.uid',$1,false),set_config('test.enrolled',$2,false),set_config('test.aal',$3,false),set_config('test.blocked',$4,false)",[uid,String(enrolled),aal,blocked]);
      await db.exec(`set role ${role}`);
    };
    const visible = async () => (await db.query('select name from storage.objects order by name')).rows.map(row=>row.name.split('/').at(-1));
    const publicNames = ['avatar.jpg','converted-public.mp4','first.jpg','public.mp4','second.jpg'];
    await t.test('guest and independent third user see only referenced public content',async()=>{
      await asRole('anon'); assert.deepEqual(await visible(),publicNames);
      await asRole('authenticated',other); assert.deepEqual(await visible(),publicNames);
    });
    await t.test('owner can read drafts, recordings and legacy uploads but not mismatched ownership paths',async()=>{
      await asRole('authenticated',owner);
      const names=await visible();
      for(const name of ['draft.mp4','premium.mp4','subscriber.mp4','hidden.mp4','orphan.mp4','replay.mp4','legacy.mp4']) assert.ok(names.includes(name),name);
      assert.ok(!names.includes('wrong-owner.mp4'));
    });
    await t.test('enrolled password-only sessions cannot read even owned objects',async()=>{
      await asRole('authenticated',owner,true,'aal1'); assert.deepEqual(await visible(),[]);
      await asRole('authenticated',owner,true,'aal2'); assert.ok((await visible()).includes('draft.mp4'));
    });
    await t.test('blocking removes public media and avatar eligibility',async()=>{
      await asRole('authenticated',other,false,'aal1',owner); assert.deepEqual(await visible(),[]);
    });
    await t.test('deleted photo posts revoke third-user access to their previously referenced images',async()=>{
      await db.exec('reset role');await db.exec('delete from public.posts where id=6');
      await asRole('authenticated',other);
      const names=await visible();assert.ok(!names.includes('first.jpg'));assert.ok(!names.includes('second.jpg'));
      await asRole('authenticated',owner,true,'aal1');assert.deepEqual(await visible(),[]);
    });
    await t.test('registered legacy objects retain visibility checks without changing their owner/path',async()=>{
      await db.exec('reset role');
      const oldReference=name=>`https://${projectRef}.supabase.co/storage/v1/object/public/videos/${name}`;
      await db.query('insert into public.posts(id,user_id,video_url,is_published) values(20,$1,$2,true),(21,$1,$3,false)',[owner,oldReference('legacy-public.mp4'),oldReference('legacy-draft.mp4')]);
      for(const name of ['legacy-public.mp4','legacy-draft.mp4','unregistered.mp4']) {
        await db.query('insert into storage.objects(bucket_id,name,owner_id,owner) values($1,$2,$3,$4)',['videos',name,owner,owner]);
      }
      await db.exec("insert into clipt_private.legacy_media_paths(object_id,bucket_id,object_name,owner_id) select id,bucket_id,name,owner from storage.objects where name in ('legacy-public.mp4','legacy-draft.mp4')");
      await asRole('anon');assert.ok(!(await visible()).includes('legacy-public.mp4'));
      await asRole('authenticated',other);const publicView=await visible();
      assert.ok(publicView.includes('legacy-public.mp4'));assert.ok(!publicView.includes('legacy-draft.mp4'));
      await assert.rejects(db.query('select * from clipt_private.legacy_media_paths'));
      await asRole('authenticated',owner);assert.ok((await visible()).includes('legacy-draft.mp4'));
      assert.ok(!(await visible()).includes('unregistered.mp4'));
      await asRole('authenticated',other,false,'aal1',owner);assert.ok(!(await visible()).includes('legacy-public.mp4'));
      await asRole('authenticated',owner,true,'aal1');assert.deepEqual(await visible(),[]);
      await db.exec('reset role');await db.exec("update storage.objects set owner_id=null,owner=null where name='legacy-public.mp4'");
      await asRole('authenticated',owner);assert.ok(!(await visible()).includes('legacy-public.mp4'),'ownerless stays denied despite old registry row');
      await db.exec('reset role');await db.query("update storage.objects set owner_id=$1::text,owner=$2::uuid,id=gen_random_uuid() where name='legacy-public.mp4'",[owner,owner]);
      await asRole('authenticated',other);assert.ok(!(await visible()).includes('legacy-public.mp4'),'replacement object ID invalidates old registration');
      await db.exec('reset role');await db.exec("select set_config('test.beta_denied','true',false)");
      await asRole('authenticated',owner);assert.ok(!(await visible()).includes('legacy-draft.mp4'),'revoked beta access cannot use legacy exception');
    });
  } finally { await db.close(); }
});
