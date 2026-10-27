import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pageControllerLayout, pageControllerContext, pageActionTarget, activatePageControl} from '../../src/lib/page-controller.ts';

const routes=['/discovery','/retro-search','/profile','/user/creator','/messages','/messages/creator','/live','/creator-dashboard','/notifications','/achievements','/tokens','/boosts','/settings','/new-post','/edit-profile','/top-games','/top-clipts','/game/42','/game-streamers/42','/drafts','/subscription','/comments/post','/post/post/comments','/stream-setup','/admin','/moderation','/privacy','/terms','/login','/signup','/start','/delete-account','/unknown'];
for(const route of routes) test(`page controller has bounded, typed, meaningful actions: ${route}`,()=>{
  const layout=pageControllerLayout(route);
  assert.ok(layout.actions.length>0 && layout.actions.length<=4);
  assert.equal(new Set(layout.actions.map(a=>a.id)).size,layout.actions.length);
  assert.equal(new Set(layout.actions.map(a=>a.slot)).size,layout.actions.length);
  for(const action of layout.actions){
    assert.ok(action.label && action.icon);
    assert.ok(action.kind==='navigate' ? action.to?.startsWith('/') : action.selector);
    assert.ok(['like','comment','follow','trophy'].includes(action.slot));
  }
});
test('profile ownership swaps actions without exposing edit for another creator',()=>{
  const own=pageControllerLayout('/user/me',{ownProfile:true});
  const other=pageControllerLayout('/user/other',{ownProfile:false});
  assert.equal(own.pageId,'own-profile');assert.equal(other.pageId,'creator-profile');
  assert.ok(own.actions.some(a=>a.id==='edit'));
  assert.ok(other.actions.some(a=>a.id==='follow'));
  assert.ok(!other.actions.some(a=>/edit|settings|drafts/.test(a.id)));
});
test('inbox and conversation use distinct existing controls, never invent requests or send automatically',()=>{
  const inbox=pageControllerLayout('/messages');
  const dm=pageControllerLayout('/messages/user',{conversation:true});
  assert.equal(inbox.pageId,'inbox');assert.equal(dm.pageId,'conversation');
  assert.ok(inbox.actions.some(a=>a.id==='new'));
  assert.equal(dm.actions.find(a=>a.id==='compose').kind,'focus');
  assert.ok(![...inbox.actions,...dm.actions].some(a=>/request|send/.test(a.id)));
});
test('financial and publish shortcuts only reveal review and never submit transactions',()=>{
  const create=pageControllerLayout('/new-post');
  assert.equal(create.actions.find(a=>a.id==='review').kind,'reveal');
  for(const route of ['/boosts','/tokens','/subscription']){
    const actions=pageControllerLayout(route).actions;
    assert.ok(!actions.some(a=>a.kind==='click' && /purchase|confirm|subscribe|cancel|redeem/i.test(`${a.id} ${a.text}`)));
  }
  assert.ok(!pageControllerLayout('/creator-dashboard').actions.some(a=>/earning|revenue/.test(a.id)));
});
test('DOM context is based on currently rendered permission-controlled page controls',()=>{
  const root={querySelectorAll:()=>[{textContent:'Edit Profile'}],querySelector:()=>({})};
  assert.deepEqual(pageControllerContext(root),{ownProfile:true,conversation:true});
  assert.deepEqual(pageControllerContext({querySelectorAll:()=>[],querySelector:()=>null}),{ownProfile:false,conversation:false});
});
test('target resolver rejects disabled, inert, hidden and stale controls; exact labels only',()=>{
  const saved=globalThis.getComputedStyle;
  globalThis.getComputedStyle=e=>({display:e.display??'block',visibility:e.visibility??'visible'});
  try{
    const action=pageControllerLayout('/notifications').actions[3];
    const element=(text='Mark as read',props={})=>({textContent:text,closest:()=>null,matches:()=>false,getClientRects:()=>[{}],...props});
    const valid=element();
    const candidates=[element('Mark all as read'),element(undefined,{matches:()=>true}),element(undefined,{closest:()=>({})}),element(undefined,{display:'none'}),element(undefined,{visibility:'hidden'}),element(undefined,{getClientRects:()=>[]}),valid];
    assert.equal(pageActionTarget({querySelectorAll:()=>candidates},action),valid);
    assert.equal(pageActionTarget({querySelectorAll:()=>candidates.slice(0,-1)},action),null);
    assert.equal(pageActionTarget({querySelectorAll:()=>[]},action),null);
  }finally{globalThis.getComputedStyle=saved;}
});
test('controller keeps feed semantics, uses universal navigation, and removes non-feed Menu/Post',()=>{
  const source=readFileSync(new URL('../../src/components/GameBoyControls.tsx',import.meta.url),'utf8');
  assert.match(source,/aria-label="CLIPT — Open navigation" onClick=\{\(\) => setMenuOpen\(true\)\}/);
  assert.match(source,/\{horizontal && <div className="clipt-controller-secondary">/);
  assert.match(source,/data-controller-action=\{mediaContext \? action : pageAction\(action\)\?\.id\}/);
  assert.match(source,/pageControllerLayout\(location.pathname, root \? pageControllerContext\(root\) : \{\}\)/);
  assert.match(source,/Current page controller actions/);
  assert.doesNotMatch(source,/location\.reload|requestFullscreen/);
});
test('all non-feed pages restore the classic joystick and diamond console in either orientation',()=>{
  const css=readFileSync(new URL('../../src/components/GameBoyControls.css',import.meta.url),'utf8');
  const rules=css.slice(css.indexOf('/* Page-aware controls:'));
  assert.doesNotMatch(rules,/orientation: portrait/);
  assert.doesNotMatch(rules,/\.clipt-controller-joystick[^}]*display: none/);
  assert.match(rules,/grid-template-columns: minmax\(0,1fr\) auto minmax\(0,1fr\)/);
  assert.doesNotMatch(rules,/padding-right: calc\(76px|width: calc\(72px/);
  assert.match(css,/\.clipt-controller-like \{ top: 0; left: 32px;/);
  assert.match(css,/\.clipt-controller-trophy \{ left: 0; top: 32px;/);
  assert.match(css,/\.clipt-controller-comment \{ right: 0; top: 32px;/);
  assert.match(css,/\.clipt-controller-follow \{ bottom: 0; left: 32px;/);
  assert.match(rules,/data-hand="left"/);
  assert.match(rules,/padding-left: max\(clamp\(18px,4vw,64px\),env\(safe-area-inset-left,0px\)\)/);
  assert.match(rules,/padding-right: max\(clamp\(18px,4vw,64px\),env\(safe-area-inset-right,0px\)\)/);
  assert.match(rules,/overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain/);
  assert.doesNotMatch(rules,/scaleX\(-1\)|\.clipt-fyp/);
  assert.ok(css.includes('@media (prefers-reduced-motion: reduce) { .clipt-controller[data-page-controller]:not([data-page-media="true"]) .clipt-controller-action svg { animation: none; } }'),'reduced-motion override must match the animated selector specificity');
  const source=readFileSync(new URL('../../src/components/GameBoyControls.tsx',import.meta.url),'utf8');
  assert.match(source,/useImmersiveController\(horizontal, preferences, location.pathname, horizontal\)/);
});
test('existing Radix Tabs receive Enter activation rather than an ineffective synthetic click',()=>{
  const saved=globalThis.KeyboardEvent;const calls=[];
  globalThis.KeyboardEvent=class{constructor(type,options){this.type=type;Object.assign(this,options);}};
  try{
    activatePageControl({getAttribute:()=> 'tab',dispatchEvent:event=>calls.push([event.type,event.key,event.bubbles,event.cancelable]),click:()=>assert.fail('Tab click would not select it')});
    activatePageControl({getAttribute:()=>null,click:()=>calls.push('native click')});
    assert.deepEqual(calls,[['keydown','Enter',true,true],'native click']);
  }finally{globalThis.KeyboardEvent=saved;}
});
test('full-panel availability can describe its temporarily inert background without allowing activation or pre-existing inert controls',()=>{
  const saved=globalThis.getComputedStyle;globalThis.getComputedStyle=()=>({display:'block',visibility:'visible'});
  try{
    const element={closest:selector=>selector.includes(':not(')?null:{},matches:()=>false,getClientRects:()=>[{}]};
    const root={querySelectorAll:()=>[element]},action=pageControllerLayout('/settings').actions[0];
    assert.equal(pageActionTarget(root,action),null);
    assert.equal(pageActionTarget(root,action,true),element);
    element.closest=()=>({});assert.equal(pageActionTarget(root,action,true),null);
  }finally{globalThis.getComputedStyle=saved;}
});
