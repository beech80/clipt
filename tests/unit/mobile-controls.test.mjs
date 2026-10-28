import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
import React from 'react';
const require=createRequire(import.meta.url);
function load(path,deps={}){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('../../src/'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText)(name=>deps[name]??require(name),m,m.exports);return m.exports;}
const module={exports:{}};
new Function('module','exports',ts.transpileModule(readFileSync(new URL('../../src/lib/mobile-controls.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports);
const {readMobileControls,portraitSwipeDirection,panelSizeAfterDrag}=module.exports;
test('bottom swipe cue is decorative dust, confined to the gesture zone and reduced-motion aware',()=>{
  const source=readFileSync(new URL('../../src/pages/Clipts.tsx',import.meta.url),'utf8');
  const css=readFileSync(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
  assert.doesNotMatch(source,/Swipe here/);
  assert.match(source,/className="clipt-bottom-swipe-zone" data-swipe-menu/);
  assert.match(source,/aria-label="CLIPT — Open navigation" aria-haspopup="dialog"/);
  assert.match(source,/clipt:open-navigation/);
  assert.match(css,/\.clipt-bottom-swipe-zone::before/);
  assert.match(css,/animation: clipt-swipe-dust 8s/);
  assert.match(css,/prefers-reduced-motion: reduce[^]*?clipt-bottom-swipe-zone::before[^]*?animation: none/);
  assert.match(css,/pointer-events: none; opacity: 0/);
});
test('mobile preferences default right and validate hostile or obsolete storage',()=>{
  for(const value of [null,'null','broken','[]','42','{"hand":"custom"}'])assert.deepEqual(readMobileControls(value),{hand:'right',trail:true});
  assert.deepEqual(readMobileControls('{"hand":"left","trail":false}'),{hand:'left',trail:false});
  assert.deepEqual(readMobileControls('{"hand":"left","trail":"false"}'),{hand:'left',trail:true});
});
test('vertical swipe requires intentional distance, axis and duration',()=>{
  assert.equal(portraitSwipeDirection(5,-100,300),1);
  assert.equal(portraitSwipeDirection(5,100,300),-1);
  for(const input of [[0,20,100],[100,60,100],[0,100,1500],[0,100,-1],[NaN,100,100]])assert.equal(portraitSwipeDirection(...input),0);
});
test('sliding panel snap sizes clamp and ignore small handle movements',()=>{
  assert.equal(panelSizeAfterDrag('half',-80),'expanded');
  assert.equal(panelSizeAfterDrag('expanded',-80),'full');
  assert.equal(panelSizeAfterDrag('full',-80),'full');
  assert.equal(panelSizeAfterDrag('full',80),'expanded');
  assert.equal(panelSizeAfterDrag('half',80),'half');
  assert.equal(panelSizeAfterDrag('expanded',8),'expanded');
});
test('hand preference partial updates persist across fresh mounts without touching controller settings',()=>{
  const saved={localStorage:globalThis.localStorage,window:globalThis.window};const storage=new Map([['clipt-controller-preferences-v1','unchanged']]);
  try{
    globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
    const events=[];globalThis.window={dispatchEvent:e=>events.push(e.type)};
    const {useMobileControlsPreferences}=load('hooks/useMobileControlsPreferences.ts',{
      react:{useEffect(){},useState:initial=>[typeof initial==='function'?initial():initial,()=>{}]},'@/lib/mobile-controls':module.exports,
    });
    useMobileControlsPreferences().update({hand:'left'});useMobileControlsPreferences().update({trail:false});
    assert.deepEqual(useMobileControlsPreferences().preferences,{hand:'left',trail:false});
    assert.equal(storage.get('clipt-controller-preferences-v1'),'unchanged');assert.deepEqual(events,['clipt:mobile-controls','clipt:mobile-controls']);
  }finally{Object.assign(globalThis,saved);}
});
test('panel drag and keyboard controls use the same bounded snap model',()=>{
  let value='half';const {AdjustablePanel}=load('components/AdjustablePanel.tsx',{
    react:{...React,useCallback:fn=>fn,useEffect(){},useRef:()=>({current:null}),useState:()=>[value,next=>{value=typeof next==='function'?next(value):next;}]},
    '@/components/ui/dialog':{DialogContent:()=>null,DialogClose:()=>null},'@/lib/mobile-controls':module.exports,
    '@/hooks/useMobileControlsPreferences':{useMobileControlsPreferences:()=>({preferences:{hand:'left'}})},'./AdjustablePanel.css':{},
  });
  const tree=AdjustablePanel.render({children:'Original content'},null),handle=tree.props.children[0].props.children[1];
  assert.equal(tree.props['data-hand'],'left');
  handle.props.onPointerDown({button:0,pointerId:1,clientY:300,currentTarget:{setPointerCapture(){}}});
  handle.props.onPointerUp({pointerId:1,clientY:200});assert.equal(value,'expanded');
  handle.props.onKeyDown({key:'End',preventDefault(){}});assert.equal(value,'full');
  handle.props.onKeyDown({key:'Home',preventDefault(){}});assert.equal(value,'half');
});
test('constrained page navigation uses a real full-height modal and does not start a resize gesture',()=>{
  const {AdjustablePanel}=load('components/AdjustablePanel.tsx',{
    react:{...React,useCallback:fn=>fn,useEffect(){},useRef:()=>({current:null}),useState:initial=>[initial,()=>{}]},
    '@/components/ui/dialog':{DialogContent:()=>null,DialogClose:()=>null},'@/lib/mobile-controls':module.exports,
    '@/hooks/useMobileControlsPreferences':{useMobileControlsPreferences:()=>({preferences:{hand:'right'}})},'./AdjustablePanel.css':{},
  });
  const tree=AdjustablePanel.render({children:'Real page actions',constrained:true},null);
  assert.equal(tree.props['data-panel-size'],'full');assert.equal(tree.props['aria-modal'],true);assert.equal(tree.props['data-constrained'],true);
  tree.props.children[0].props.children[1].props.onPointerDown({button:0,pointerId:1,clientY:300,currentTarget:{setPointerCapture(){assert.fail('Constrained panel must not capture a drag');}}});
});
test('blocked storage still broadcasts the selected hand to mounted controls for this session',()=>{
  const saved={localStorage:globalThis.localStorage,window:globalThis.window};
  try{
    const events=new Map(),updates=[];let slot=0;
    globalThis.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
    globalThis.window={addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name),dispatchEvent:event=>{events.get(event.type)?.(event);return true;}};
    const effects=[];
    const {useMobileControlsPreferences}=load('hooks/useMobileControlsPreferences.ts',{
      react:{useEffect:fn=>effects.push(fn),useState:initial=>{const index=slot++;return [typeof initial==='function'?initial():initial,value=>updates.push({index,value})];}},'@/lib/mobile-controls':module.exports,
    });
    const settings=useMobileControlsPreferences();const cleanup=effects[0]();settings.update({hand:'left',trail:false});
    assert.ok(updates.some(x=>x.index===1&&x.value===false),'storage error remains visible');
    assert.equal(updates.filter(x=>x.index===0&&x.value.hand==='left'&&x.value.trail===false).length,2,'local update and mounted subscriber both receive session choice');
    cleanup();assert.equal(events.size,0);
  }finally{Object.assign(globalThis,saved);}
});
test('portrait gesture routes one swipe, cancels media click and does not attach a visible touchpad',()=>{
  const keys=['window','document','Element','matchMedia','requestAnimationFrame','cancelAnimationFrame'];const saved=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
  try{
    const handlers=new Map(),events=[],effects=[];const surface={addEventListener:(k,v)=>handlers.set(k,v),removeEventListener:k=>handlers.delete(k)};
    const zone={setPointerCapture(){}};
    globalThis.Element=class{constructor(inZone=true,menuButton=false){this.inZone=inZone;this.menuButton=menuButton;}closest(selector){if(selector==='.clipt-bottom-swipe-zone')return this.inZone?zone:null;if(selector==='button'||selector==='[data-swipe-menu]')return this.menuButton?this:null;return null;}};
    globalThis.document={documentElement:{classList:{contains:()=>false}},querySelector:()=>null};
    globalThis.window={dispatchEvent:e=>events.push(e),addEventListener(){},removeEventListener(){}};
    globalThis.matchMedia=q=>({matches:q.includes('orientation')});
    globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
    const {usePortraitSwipe}=load('hooks/usePortraitSwipe.ts',{
      react:{useRef:()=>({current:null}),useEffect:fn=>effects.push(fn)},'@/lib/mobile-controls':module.exports,
      '@/hooks/useMobileControlsPreferences':{useMobileControlsPreferences:()=>({preferences:{trail:false}})},
    });
    usePortraitSwipe({current:surface},true);const cleanup=effects[0]();
    handlers.get('pointerdown')({pointerType:'touch',isPrimary:true,pointerId:2,clientX:100,clientY:300,target:new Element(false)});
    handlers.get('pointerup')({pointerId:2,clientX:100,clientY:150});
    assert.equal(events.length,0,'touches outside the bottom zone never navigate');
    handlers.get('pointerdown')({pointerType:'touch',isPrimary:true,pointerId:1,clientX:100,clientY:300,target:new Element(true,true)});
    handlers.get('pointerup')({pointerId:1,clientX:100,clientY:150});
    assert.equal(events.length,1);assert.equal(events[0].detail.direction,1);
    let cancelled=false;handlers.get('click')({preventDefault(){cancelled=true;},stopPropagation(){}});assert.equal(cancelled,true);
    handlers.get('pointerdown')({pointerType:'touch',isPrimary:true,pointerId:3,clientX:150,clientY:300,target:new Element()});
    handlers.get('pointerup')({pointerId:3,clientX:60,clientY:300});
    assert.equal(events.length,2);assert.equal(events[1].detail.direction,1,'sideways navigation also starts only in bottom zone');
    let keyboardCancelled=false;handlers.get('click')({detail:0,preventDefault(){keyboardCancelled=true;},stopPropagation(){}});
    assert.equal(keyboardCancelled,false,'keyboard activation works even if the prior swipe had no click');
    handlers.get('pointerdown')({pointerType:'touch',isPrimary:true,pointerId:4,clientX:100,clientY:300,target:new Element(true,true)});
    handlers.get('pointerup')({pointerId:4,clientX:101,clientY:301});
    let tapCancelled=false;handlers.get('click')({preventDefault(){tapCancelled=true;},stopPropagation(){}});
    assert.equal(tapCancelled,false,'stationary menu-pad tap keeps its native click');
    assert.equal(events.length,2,'a menu-pad tap never navigates');
    cleanup();assert.equal(handlers.size,0);
  }finally{Object.assign(globalThis,saved);}
});
test('full panel temporarily disables background interaction and restores its prior inert state',()=>{
  const saved={document:globalThis.document,HTMLElement:globalThis.HTMLElement};
  try{
    const effects=[];globalThis.HTMLElement=class{constructor(inert=false,containsPanel=false){this.inert=inert;this.containsPanel=containsPanel;this.attributes=new Map();}contains(){return this.containsPanel;}getAttribute(name){return this.attributes.get(name)??null;}setAttribute(name,value){this.attributes.set(name,value);}removeAttribute(name){this.attributes.delete(name);}};
    const app=new HTMLElement(),alreadyInert=new HTMLElement(true),portal=new HTMLElement(false,true);
    globalThis.document={body:{children:[app,alreadyInert,portal]}};
    const {AdjustablePanel}=load('components/AdjustablePanel.tsx',{
      react:{...React,useCallback:fn=>fn,useEffect:fn=>effects.push(fn),useRef:()=>({current:{}}),useState:()=>['full',()=>{}]},
      '@/components/ui/dialog':{DialogContent:()=>null,DialogClose:()=>null},'@/lib/mobile-controls':module.exports,
      '@/hooks/useMobileControlsPreferences':{useMobileControlsPreferences:()=>({preferences:{hand:'right'}})},'./AdjustablePanel.css':{},
    });
    AdjustablePanel.render({children:'Conversation'},null);const cleanup=effects[0]();
    assert.equal(app.inert,true);assert.equal(app.getAttribute('data-clipt-panel-inert'),'true');assert.equal(alreadyInert.getAttribute('data-clipt-panel-inert'),null);assert.equal(portal.inert,false);cleanup();
    assert.equal(app.inert,false);assert.equal(app.getAttribute('data-clipt-panel-inert'),null);assert.equal(alreadyInert.inert,true);
  }finally{Object.assign(globalThis,saved);}
});

test('portrait menu-pad trail follows input inside the pad and clears after the gesture',()=>{
  const keys=['window','document','Element','matchMedia','requestAnimationFrame','cancelAnimationFrame'];
  const saved=Object.fromEntries(keys.map(key=>[key,globalThis[key]]));
  try {
    const handlers=new Map(),effects=[],frames=[];
    const attributes=new Map();const path={style:{},setAttribute:(key,value)=>attributes.set(key,value)};
    const surface={addEventListener:(key,fn)=>handlers.set(key,fn),removeEventListener:key=>handlers.delete(key),getBoundingClientRect:()=>({left:70,right:270,top:300,bottom:396}),setPointerCapture(){}};
    globalThis.Element=class {closest(selector){return selector==='.clipt-bottom-swipe-zone'?surface:null;}};
    globalThis.document={documentElement:{classList:{contains:()=>false}},querySelector:()=>null};
    globalThis.window={dispatchEvent(){},addEventListener(){},removeEventListener(){}};
    globalThis.matchMedia=query=>({matches:query.includes('orientation')});
    globalThis.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};globalThis.cancelAnimationFrame=()=>{};
    const {usePortraitSwipe}=load('hooks/usePortraitSwipe.ts',{
      react:{useRef:()=>({current:path}),useEffect:fn=>effects.push(fn)},'@/lib/mobile-controls':module.exports,
      '@/hooks/useMobileControlsPreferences':{useMobileControlsPreferences:()=>({preferences:{trail:true}})},
    });
    usePortraitSwipe({current:surface},true);const cleanup=effects[0]();
    handlers.get('pointerdown')({pointerType:'touch',isPrimary:true,pointerId:1,clientX:100,clientY:380,target:new Element()});
    handlers.get('pointermove')({pointerId:1,clientX:150,clientY:340});frames.shift()();
    assert.equal(attributes.get('d'),'M150,340');assert.equal(path.style.opacity,'1');
    handlers.get('pointermove')({pointerId:1,clientX:900,clientY:0});frames.shift()();
    assert.equal(attributes.get('d'),'M150,340 Q150,340 210,320','trail points clamp to the actual menu pad');
    handlers.get('pointerup')({pointerId:1,clientX:150,clientY:310});assert.equal(path.style.opacity,'0');
    cleanup();assert.equal(attributes.get('d'),'');assert.equal(handlers.size,0);
  } finally {Object.assign(globalThis,saved);}
});
test('closed Dialog content clears the mounted-element state even while its wrapper remains mounted',()=>{
  const effects=[],updates=[];let slot=0;
  const {AdjustablePanel}=load('components/AdjustablePanel.tsx',{
    react:{...React,useCallback:fn=>fn,useEffect:(fn,deps)=>effects.push({fn,deps}),useRef:()=>({current:null}),useState:initial=>{const index=slot++;return [initial,value=>updates.push({index,value})];}},
    '@/components/ui/dialog':{DialogContent:()=>null,DialogClose:()=>null},'@/lib/mobile-controls':module.exports,
    '@/hooks/useMobileControlsPreferences':{useMobileControlsPreferences:()=>({preferences:{hand:'right'}})},'./AdjustablePanel.css':{},
  });
  const tree=AdjustablePanel.render({children:'Menu'},null),node={};
  tree.ref(node);tree.ref(null);
  assert.deepEqual(updates,[{index:1,value:node},{index:1,value:null}]);
  assert.deepEqual(effects[0].deps,['half',null],'background effect tracks actual content presence, not just snap size');
});

test('panel follows the captured pointer within viewport bounds and clears transient sizing on cancel',()=>{
  const savedWindow=globalThis.window;const styles=new Map(),attributes=new Map();
  try {
    globalThis.window={innerHeight:600,visualViewport:{height:500}};
    const node={getBoundingClientRect:()=>({height:250}),style:{setProperty:(k,v)=>styles.set(k,v),removeProperty:k=>styles.delete(k)},setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k)};
    const {AdjustablePanel}=load('components/AdjustablePanel.tsx',{
      react:{...React,useCallback:fn=>fn,useEffect(){},useRef:()=>({current:null}),useState:initial=>[initial,()=>{}]},
      '@/components/ui/dialog':{DialogContent:()=>null,DialogClose:()=>null},'@/lib/mobile-controls':module.exports,
      '@/hooks/useMobileControlsPreferences':{useMobileControlsPreferences:()=>({preferences:{hand:'right'}})},'./AdjustablePanel.css':{},
    });
    const tree=AdjustablePanel.render({children:'Menu'},null);tree.ref(node);
    const handle=tree.props.children[0].props.children[1];
    handle.props.onPointerDown({button:0,pointerId:1,clientY:300,currentTarget:{setPointerCapture(){}}});
    handle.props.onPointerMove({pointerId:2,clientY:0});assert.equal(styles.size,0,'unrelated pointer ignored');
    handle.props.onPointerMove({pointerId:1,clientY:200});assert.equal(styles.get('--clipt-drag-height'),'350px');
    handle.props.onPointerMove({pointerId:1,clientY:-300});assert.equal(styles.get('--clipt-drag-height'),'484px');
    handle.props.onPointerCancel();assert.equal(styles.size,0);assert.equal(attributes.size,0);
  } finally {globalThis.window=savedWindow;}
});
