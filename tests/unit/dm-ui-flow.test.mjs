import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire,stripTypeScriptTypes} from 'node:module';
import ts from 'typescript';
import React from 'react';
const require=createRequire(import.meta.url);
const read=path=>readFileSync(new URL('../../src/'+path,import.meta.url),'utf8');
const pure=async path=>import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(read(path))).toString('base64'));
const community=await pure('lib/community-text.ts');
const history=await pure('lib/message-history.ts');
const tick=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));};
function find(node,predicate){if(!node||typeof node!=='object')return null;if(predicate(node))return node;for(const child of React.Children.toArray(node.props?.children)){const result=find(child,predicate);if(result)return result;}return null;}
function fixture({draft='Great game!',selected=true,reject=false,delay=false}={}){
  let release; const pending=new Promise(resolve=>{release=resolve;});
  const states=[],refs=[],effects=[],calls=[],errors=[],listeners=[];let stateIndex=0,refIndex=0;
  states[11]=selected?{id:history.directChatId('alice','bob'),recipient_id:'bob',recipient_name:'Bob',messages:[]}:null;
  states[12]=draft;
  const saved={id:'saved',sender_id:'alice',receiver_id:'bob',content:draft,read:false,created_at:'2026-10-04T00:00:00Z'};
  const supabase={from(table){calls.push(['from',table]);let inserting=false;
    const response=()=>inserting?(reject?{error:{message:'Content is not allowed by Clipt community rules'}}:{data:saved,error:null}):{data:table==='messages'?[{...saved,profiles:{username:'alice'}}]:[{id:'bob',username:'bob'}],error:null};
    const query={};for(const name of ['select','or','order','eq','in','retry','limit'])query[name]=(...args)=>{calls.push([name,...args]);return query;};
    query.insert=values=>{inserting=true;calls.push(['insert',values]);return query;};query.single=async()=>{if(inserting&&delay)await pending;return response();};query.then=(resolve,reject)=>Promise.resolve(response()).then(resolve,reject);return query;
  },channel(){return {on(event,filter,callback){listeners.push({filter,callback});return this;},subscribe(callback){listeners.push({status:callback});return {unsubscribe(){}};}};}};
  const mockedReact={...React,useState(initial){const index=stateIndex++;if(!(index in states))states[index]=initial;return [states[index],value=>{states[index]=typeof value==='function'?value(states[index]):value;}];},useRef(initial){const index=refIndex++;return refs[index]??(refs[index]={current:initial});},useEffect(callback){effects.push(callback);}};
  const deps={react:mockedReact,'@/contexts/AuthContext':{useAuth:()=>({user:{id:'alice'}})},'react-router-dom':{useNavigate:()=>()=>{},useParams:()=>({})},'@/lib/supabase':{supabase,checkTableExists:async()=>true},sonner:{toast:{error:message=>errors.push(message)}},'@/lib/message-history':history,'@/lib/community-text':community,'@/components/user/UserLink':{UserLink:'a'}};
  const output=ts.transpileModule(read('pages/Messages.tsx'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const mod={exports:{}};new Function('require','module','exports',output)(name=>deps[name]??(name.startsWith('@/components/ui/')?new Proxy({},{get:(_,key)=>key}):require(name)),mod,mod.exports);
  const render=()=>{stateIndex=0;refIndex=0;effects.length=0;return mod.exports.default();};
  return {states,effects,calls,errors,listeners,render,release};
}
test('DM submit renders only a server-confirmed message and then clears its own draft',async()=>{
  const f=fixture();const form=find(f.render(),node=>node.type==='form');form.props.onSubmit({preventDefault(){}});await tick();
  assert.equal(f.states[11].messages[0].id,'saved');assert.equal(f.states[12],'');
  const insert=f.calls.find(call=>call[0]==='insert')[1];assert.equal(insert.sender_id,'alice');assert.equal(insert.receiver_id,'bob');
});
test('DM profanity is rejected before insert and its draft stays editable',async()=>{
  const f=fixture({draft:'sh1t'});find(f.render(),node=>node.type==='form').props.onSubmit({preventDefault(){}});await tick();
  assert.equal(f.calls.some(call=>call[0]==='insert'),false);assert.equal(f.states[12],'sh1t');assert.equal(f.states[13],community.COMMUNITY_TEXT_WARNING);
  assert.ok(find(f.render(),node=>node.props?.role==='alert'));
});
test('DM server rejection retains draft, shows warning and never invents a sent message',async()=>{
  const f=fixture({reject:true});find(f.render(),node=>node.type==='form').props.onSubmit({preventDefault(){}});await tick();
  assert.equal(f.states[11].messages.length,0);assert.equal(f.states[12],'Great game!');assert.equal(f.states[13],community.COMMUNITY_TEXT_WARNING);
});
test('empty inbox receives participant-filtered realtime and refreshes conversations',async()=>{
  const f=fixture({selected:false});f.render();const effect=f.effects.find(callback=>callback.toString().includes('.channel('));assert.ok(effect);effect();
  const incoming=f.listeners.find(listener=>listener.filter?.event==='INSERT');assert.equal(incoming.filter.filter,'receiver_id=eq.alice');
  incoming.callback({new:{id:'incoming',sender_id:'bob',receiver_id:'alice'}});await tick();
  assert.ok(f.calls.some(call=>call[0]==='from'&&call[1]==='messages'));assert.equal(f.states[8].length,1);assert.equal(f.states[11],null);
});

test('repeated DM submit while pending inserts only once',async()=>{
  const f=fixture({delay:true}); const form=find(f.render(),node=>node.type==='form');
  form.props.onSubmit({preventDefault(){}});form.props.onSubmit({preventDefault(){}});
  assert.equal(f.calls.filter(call=>call[0]==='insert').length,1);
  f.release();await tick();assert.equal(f.states[11].messages.length,1);
});

for(const reject of [false,true])test(`delayed ${reject?'failed':'successful'} send cannot change a later conversation draft`,async()=>{
  const f=fixture({delay:true,reject});const tree=f.render();find(tree,node=>node.type==='form').props.onSubmit({preventDefault(){}});
  find(tree,node=>node.props?.['aria-label']==='Back to conversations').props.onClick();
  f.states[11]={id:history.directChatId('alice','carol'),recipient_id:'carol',recipient_name:'Carol',messages:[]};
  f.states[12]='Great game!';f.release();await tick();
  assert.equal(f.states[12],'Great game!');assert.equal(f.states[13],'');assert.equal(f.states[11].messages.length,0);
});
