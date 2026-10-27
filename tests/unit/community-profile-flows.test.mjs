import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const read=path=>readFileSync(new URL('../../src/'+path,import.meta.url),'utf8');
const load=async path=>import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(read(path))).toString('base64'));
const {communityTextWarning,communityErrorMessage,COMMUNITY_TEXT_WARNING}=await load('lib/community-text.ts');
const {loadProfileConnections}=await load('lib/profile-connections.ts');
const {directChatId}=await load('lib/message-history.ts');

test('positive-text warning catches normalization and disguises without blocking ordinary game words',()=>{
  for(const content of ['ＦＵＣＫ','sh1t','f\u200buck','f.u.c.k','bitch','heil hitler','nigg'+'er']) assert.equal(communityTextWarning(content),COMMUNITY_TEXT_WARNING);
  for(const content of ['Great game! Nice teamwork.','Classic assassin play','I like this stream','🎮🏆💜']) assert.equal(communityTextWarning(content),null);
});
test('server community rejection gets actionable copy without leaking database errors',()=>{
  assert.equal(communityErrorMessage({code:'23514',message:'Content is not allowed by Clipt community rules'},'fallback'),COMMUNITY_TEXT_WARNING);
  assert.equal(communityErrorMessage({message:'private diagnostic details'},'Retry safely'),'Retry safely');
});
function fixture(results){
  const calls=[];const client={from(table){calls.push(['from',table]);const response=results.shift();const query={};
    for(const key of ['select','eq','order','range','in']) query[key]=(...args)=>{calls.push([key,...args]);return query;};
    query.retry=async()=>response;return query;
  }};return {client,calls};
}
test('followers list uses correct relationship, bounded page and public profile fields',async()=>{
  const {client,calls}=fixture([{data:[{follower_id:'b',following_id:'a'},{follower_id:'c',following_id:'a'}]}, {data:[{id:'c',username:'charlie'},{id:'b',username:'bob'}]}]);
  const result=await loadProfileConnections(client,'a','followers',1);
  assert.deepEqual(result.profiles.map(row=>row.id),['b','c']);assert.equal(result.hasNext,false);
  assert.ok(calls.some(call=>JSON.stringify(call)===JSON.stringify(['eq','following_id','a'])));
  assert.ok(calls.some(call=>JSON.stringify(call)===JSON.stringify(['range',50,99])));
  assert.ok(calls.some(call=>call[0]==='select'&&call[1]==='id,username,display_name,avatar_url'));
});
test('following lists omit inaccessible profiles and retain next-page capability',async()=>{
  const rows=Array.from({length:50},(_,index)=>({follower_id:'a',following_id:String(index)}));
  const {client,calls}=fixture([{data:rows},{data:[{id:'1',username:'visible'}]}]);
  const result=await loadProfileConnections(client,'a','following');
  assert.deepEqual(result.profiles.map(row=>row.id),['1']);assert.equal(result.hasNext,true);
  assert.ok(calls.some(call=>call[0]==='eq'&&call[1]==='follower_id'&&call[2]==='a'));
});
test('connection failure is not an empty success; invalid input issues no reads',async()=>{
  const denied=fixture([{error:new Error('Denied')}]);await assert.rejects(loadProfileConnections(denied.client,'a','followers'),/Denied/);
  const empty=fixture([{data:[]}]);assert.deepEqual(await loadProfileConnections(empty.client,'a','followers'),{profiles:[],hasNext:false});assert.equal(empty.calls.filter(call=>call[0]==='from').length,1);
  const invalid=fixture([]);await assert.rejects(loadProfileConnections(invalid.client,'a','other'));await assert.rejects(loadProfileConnections(invalid.client,'a','following',-1));assert.equal(invalid.calls.length,0);
});
test('DM entry and inbox use one symmetric identity and subscribe even with no selected chat',()=>{
  assert.equal(directChatId('b','a'),directChatId('a','b'));
  const source=read('pages/Messages.tsx');const realtime=source.slice(source.indexOf('// Setup real-time messaging'),source.indexOf('// Read-only availability'));
  assert.match(realtime,/if \(!user\) return/);assert.doesNotMatch(realtime,/if \(!user \|\| !selectedChat\) return/);
  assert.match(realtime,/void fetchActiveChats\(\)/);assert.match(realtime,/receiver_id=eq\.\$\{user\.id\}/);
  assert.match(source,/directChatId\(user.id, targetUserId\)/);assert.match(source,/directChatId\(user.id, otherUserId\)/);
});
test('profile count controls and creator DM entry retain existing authorized destinations',()=>{
  for(const file of ['pages/Profile.tsx','pages/UserProfile.tsx']){
    const source=read(file);assert.match(source,/onClick=\{\(\) => setConnections\('followers'\)\}/);assert.match(source,/onClick=\{\(\) => setConnections\('following'\)\}/);
    assert.match(source,/ProfileConnectionsDialog/);
  }
  assert.match(read('pages/Profile.tsx'),/onClick=\{\(\) => setActiveTab\('achievements'\)\}/);
  assert.match(read('pages/UserProfile.tsx'),/navigate\(`\/messages\/\$\{profileData.id\}`\)/);
});
