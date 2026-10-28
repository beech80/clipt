import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';

function schema(path,name) {
  const source=readFileSync(new URL(`../../src/${path}`,import.meta.url),'utf8');
  const start=source.indexOf(`const ${name} =`);
  assert.ok(start>=0,`Actual ${name} exists`);
  const end=source.indexOf('\ntype ',start);
  assert.ok(end>start);
  const output=ts.transpileModule(source.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  return new Function('z',`${output}; return ${name};`)(z);
}

test('security fixes are pinned in manifest and lockfile',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../../package.json',import.meta.url),'utf8'));
  const lock=JSON.parse(readFileSync(new URL('../../package-lock.json',import.meta.url),'utf8'));
  for(const [name,version] of Object.entries({'zod':'4.6.6','@hookform/resolvers':'5.2.2','react-hook-form':'7.55.0'})) {
    assert.equal(manifest.dependencies[name],version);
    assert.equal(lock.packages[''].dependencies[name],version);
    assert.equal(lock.packages[`node_modules/${name}`].version,version);
  }
  for(const [name,version] of Object.entries({'fast-uri':'3.1.9','serialize-javascript':'7.1.3','undici':'7.30.1'})) {
    assert.equal(manifest.overrides[name],version);
    // An unused dependency can disappear entirely; every retained instance must stay patched.
    for(const [path,pkg] of Object.entries(lock.packages)) {
      if(path.split('node_modules/').at(-1)===name) assert.equal(pkg.version,version);
    }
  }
});

test('actual profile schema preserves limits and inline resolver errors with Zod 4',async()=>{
  const profile=schema('components/profile/ProfileEditForm.tsx','profileFormSchema');
  const valid={username:'beta_tester',displayName:'Beta Tester',bioDescription:'Gaming',website:''};
  assert.deepEqual(profile.parse(valid),valid);
  for(const invalid of [{username:'a'},{username:'bad name'},{displayName:'x'},{bioDescription:'x'.repeat(501)},{website:'not a URL'}]) {
    assert.equal(profile.safeParse({...valid,...invalid}).success,false);
  }
  const resolver=zodResolver(profile);
  const options={fields:{},shouldUseNativeValidation:false};
  assert.deepEqual((await resolver(valid,{},options)).errors,{});
  const rejected=await resolver({...valid,username:'!'}, {},options);
  assert.equal(rejected.errors.username.message,'Use 3-50 letters, numbers, or underscores');
  assert.deepEqual(rejected.values,{});
});

test('actual schedule schema preserves coercion, date bounds and private choice',async()=>{
  const schedule=schema('components/streaming/schedule/ScheduleStream.tsx','scheduleFormSchema');
  const input={title:'  Beta stream  ',description:'Testing',scheduled_for:new Date(Date.now()+86400000),duration_minutes:'60',tags:'gaming',is_public:false};
  const parsed=schedule.parse(input);
  assert.equal(parsed.title,'Beta stream');
  assert.equal(parsed.duration_minutes,60);
  assert.equal(parsed.is_public,false);
  for(const patch of [{duration_minutes:'14'},{duration_minutes:'721'},{duration_minutes:'oops'},{scheduled_for:new Date(0)},{title:'x'}]) {
    assert.equal(schedule.safeParse({...input,...patch}).success,false);
  }
  const resolved=await zodResolver(schedule)(input,{}, {fields:{},shouldUseNativeValidation:false});
  assert.deepEqual(resolved.errors,{});
  assert.equal(resolved.values.duration_minutes,60);
  assert.equal(resolved.values.is_public,false);
});
