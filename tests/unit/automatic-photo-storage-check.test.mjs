import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../../src/lib/automatic-photo-storage-check.ts',import.meta.url),'utf8'));
const {automaticPhotoFixture:f,fixtureMedia,runAutomaticPhotoStorageCheck:run}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const config={project:f.project,stage:'staging'};
function fixture({owner=f.owner,state='processing',explicit=true,accepted=false,changed=false}={}){
 const marks=new Map();globalThis.sessionStorage={getItem:key=>marks.get(key)??null,setItem:(key,value)=>marks.set(key,value)};
 let writes=0,reads=0;
 const error=()=>({message:explicit?'Photo review in progress; please retry shortly':'DatabaseError',status:500});
 const blob=()=>new Blob([changed&&reads>1?'changed':'fixture'],{type:'image/png'});
 const storage={download:async()=>{reads++;return {data:blob(),error:null}},
  upload:async()=>{writes++;return {error:accepted?null:error()}},remove:async()=>{writes++;return {error:error()}}};
 const query={select(){return this},eq(){return this},single:async()=>({error:null,data:{id:f.post,user_id:f.owner,is_published:true,
  image_url:f.project+'/storage/v1/object/authenticated/media/'+f.owner+'/photo.png',video_url:null}})};
 return {client:{auth:{getUser:async()=>({error:null,data:{user:{id:owner,email_confirmed_at:'confirmed',is_anonymous:false}}})},
  from:()=>query,rpc:async()=>({error:null,data:[{post_id:f.post,state}]}),storage:{from:()=>storage}},writes:()=>writes,marks};
}
test('fixture Storage diagnostic rejects foreign origins, owners, paths and absent processing state',async()=>{
 assert.deepEqual(fixtureMedia(f.project+'/storage/v1/object/authenticated/media/'+f.owner+'/photo.png'),{bucket:'media',path:f.owner+'/photo.png'});
 for(const value of ['https://example.com/x',f.project+'/storage/v1/object/public/media/other/photo.png',
  f.project+'/storage/v1/object/public/media/'+f.owner+'/photo.png?key=hidden'])assert.throws(()=>fixtureMedia(value));
 for(const options of [{owner:'another-user'},{state:'queued'}]){const mock=fixture(options);await assert.rejects(run(mock.client,config,()=>{}));assert.equal(mock.writes(),0);}
 const mock=fixture();await assert.rejects(run(mock.client,{...config,stage:'production'},()=>{}));assert.equal(mock.writes(),0);
});
test('fixture diagnostic requires explicit denials and unchanged bytes and never silently reruns',async()=>{
 const mock=fixture(),messages=[];await run(mock.client,config,message=>messages.push(message));
 assert.equal(mock.writes(),2);assert.equal(messages.filter(x=>x.startsWith('PASS:')).length,3);
 await assert.rejects(run(mock.client,config,()=>{}),/already attempted/);assert.equal(mock.writes(),2);
 assert.equal([...mock.marks.values()][0],'explicit-denials');
});
test('generic errors require independent correlation; accepted mutation or changed bytes are failures',async()=>{
 const mock=fixture({explicit:false}),messages=[];await run(mock.client,config,message=>messages.push(message));
 assert.equal(messages.filter(x=>x.startsWith('UNVERIFIED:')).length,2);
 assert.equal([...mock.marks.values()][0],'requires-server-correlation');
 for(const options of [{accepted:true},{changed:true}]){const rejected=fixture(options);await assert.rejects(run(rejected.client,config,()=>{}),/FAIL:/);}
});
