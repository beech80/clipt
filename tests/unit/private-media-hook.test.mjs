import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {privateMediaReference} from '../../src/lib/private-media-reference.ts';

const origin='https://development-example.supabase.co';
const path='00000000-0000-4000-8000-000000000001/clip.mp4';
const reference=`${origin}/storage/v1/object/public/media/${path}`;
function harness({user='viewer',loading=false,result={},signedUrl=`${origin}/storage/v1/object/sign/media/${path}?token=test`,error=null}={}){
  let configs;const calls=[];
  const dependencies={
    '@tanstack/react-query':{useQueries:options=>{configs=options.queries;return configs.map(()=>({isPending:true,isError:false,refetch:async()=>({isError:false}),...result}));}},
    '@/contexts/AuthContext':{useAuth:()=>({user:user?{id:user}:null,loading})},
    '@/integrations/supabase/client':{storageProjectUrl:origin,supabase:{storage:{from:bucket=>({createSignedUrl:async(object,ttl)=>{calls.push({bucket,object,ttl});return {data:{signedUrl},error};}})}}},
    '@/lib/private-media-reference':{privateMediaReference},
  };
  const output=ts.transpileModule(readFileSync(new URL('../../src/hooks/usePrivateMedia.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{}};
  new Function('require','module','exports',output)(name=>dependencies[name],mod,mod.exports);
  return {hook:mod.exports.usePrivateMediaUrls,configs:()=>configs,calls};
}
test('private media never exposes an unsigned reference while signing is pending',()=>{
  const h=harness();const [media]=h.hook([reference],false);
  assert.equal(media.src,undefined);assert.equal(media.isLoading,true);
  assert.deepEqual(h.configs()[0].queryKey,['private-media-url',origin,'viewer','media',path]);
  assert.equal(h.configs()[0].retry,false);assert.equal(h.configs()[0].refetchInterval,false);
});
test('private signing uses the normal caller client with a five-minute lifetime',async()=>{
  const h=harness();h.hook([reference]);
  assert.match(await h.configs()[0].queryFn(),/object\/sign\/media/);
  assert.deepEqual(h.calls,[{bucket:'media',object:path,ttl:300}]);
  assert.equal(h.configs()[0].refetchIntervalInBackground,false);
});
test('signing rejects foreign or mismatched provider responses and access denial',async()=>{
  for(const options of [{signedUrl:reference.replace(origin,'https://foreign.supabase.co')},{signedUrl:reference.replace('clip.mp4','other.mp4')},{error:new Error('denied')}]){
    const h=harness(options);h.hook([reference]);await assert.rejects(h.configs()[0].queryFn());
  }
});
test('invalid storage origins fail closed while external images remain usable',async()=>{
  const h=harness();const [invalid,external]=h.hook([reference.replace(origin,'https://foreign.supabase.co'),'https://images.example.com/cover.jpg']);
  assert.equal(invalid.src,undefined);assert.ok(invalid.error);assert.equal((await invalid.retry()).isError,true);
  assert.equal(h.configs()[0].enabled,false);assert.equal(external.src,'https://images.example.com/cover.jpg');
});
test('auth-loading defers signing and identities receive separate cache keys',()=>{
  const h=harness({loading:true,user:null});h.hook([reference]);
  assert.equal(h.configs()[0].enabled,false);assert.equal(h.configs()[0].queryKey[2],'guest');
});
