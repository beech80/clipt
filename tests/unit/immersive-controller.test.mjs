import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import React from 'react';
import * as pageController from '../../src/lib/page-controller.ts';
const nativeRequire=createRequire(import.meta.url);
const require=name=>name==='@/lib/page-controller'?pageController:nativeRequire(name);
const read=path=>readFileSync(new URL('../../src/'+path,import.meta.url),'utf8');
function load(path,deps={}) {const imports={'@/components/post/HashtagText':{HashtagText:({text})=>text},'@/hooks/useMobileControlsPreferences':{useMobileControlsPreferences:()=>({preferences:{hand:'right',trail:true},update(){},saved:true})},'./accessibility/HandPreferenceSettings':{HandPreferenceSettings:()=>null},'./AdjustablePanel':{AdjustablePanel:()=>null},'@/components/AdjustablePanel':{AdjustablePanel:()=>null},'@/pages/Menu':{default:()=>null,__esModule:true},...deps};const mod={exports:{}};new Function('require','module','exports',ts.transpileModule(read(path),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(name=>imports[name]??require(name),mod,mod.exports);return mod.exports;}
const policy=load('lib/controller-layout.ts');
test('folding, orientation and resumed-page measurements follow available space and clean up listeners',()=>{
  const keys=['document','window','matchMedia','ResizeObserver'];const saved=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
  try{
    const listeners=new Map(),effects=[];let measure,index=0;
    const values=[{width:0,height:0,left:0,top:0,landscape:false,portraitConstrained:false,normalWidth:0},'visible',0];
    globalThis.document={documentElement:{clientWidth:360,clientHeight:780},activeElement:null};
    globalThis.window={screen:{width:360},visualViewport:{width:360,height:780,offsetLeft:0,offsetTop:0,addEventListener(){},removeEventListener(){}},addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
    globalThis.matchMedia=()=>({matches:document.documentElement.clientWidth>document.documentElement.clientHeight});
    globalThis.ResizeObserver=class{constructor(fn){measure=fn;}observe(){}disconnect(){}};
    const {useImmersiveController}=load('hooks/useImmersiveController.ts',{react:{useState:()=>{const slot=index++;return[values[slot],v=>values[slot]=typeof v==='function'?v(values[slot]):v];},useRef:()=>({current:null}),useEffect:fn=>effects.push(fn)},'@/lib/controller-layout':policy});
    useImmersiveController(true,{layout:'auto',autoHide:true},'/clipts',true);const cleanup=effects[0]();
    for(const [width,height] of [[360,780],[720,720],[960,720],[720,960],[280,620],[360,780]]){
      Object.assign(document.documentElement,{clientWidth:width,clientHeight:height});Object.assign(window.visualViewport,{width,height});window.screen.width=width;
      measure();assert.equal(values[0].width,width);assert.equal(values[0].height,height);assert.equal(values[0].landscape,width>height);
      listeners.get('orientationchange')();listeners.get('pageshow')();
    }
    cleanup();assert.equal(listeners.size,0);
  }finally{Object.assign(globalThis,saved);}
});
test('portrait zoom preserves normal narrow phones, ignores immersive preference until constrained, and has hysteresis',()=>{
  for(const width of [320,375,390,430]) for(const preference of ['auto','classic','immersive']) {
    assert.equal(policy.controllerLayout(width,660,false,preference,true,false,width),'classic');
  }
  assert.equal(policy.controllerLayout(312,528,false,'auto',true,false,390),'immersive');
  assert.equal(policy.portraitZoomConstrained(339,600,false,390),true);
  assert.equal(policy.portraitZoomConstrained(350,600,true,390),true);
  assert.equal(policy.portraitZoomConstrained(350,600,false,390),false);
  assert.equal(policy.portraitZoomConstrained(365,600,true,390),false);
  assert.equal(policy.portraitZoomConstrained(390,300,true,390),false,'keyboard alone must not activate at normal width');
  assert.equal(policy.controllerLayout(312,528,false,'auto',false,true,390),'classic','explicit opt-out wins');
});
test('portrait feed selector reuses one toggle event without switching the already selected feed',()=>{
  const {PortraitFeedToggle}=load('components/GameBoyControls.tsx',{
    'react-router-dom':{},'@/hooks/useControllerPreferences':{},'@/hooks/useImmersiveController':{},
    './ControllerSettings':{},'@/components/ui/dialog':{},'./GameBoyControls.css':{},
  });
  for(const feed of ['clipts','squad']) {
    let switches=0;const tree=PortraitFeedToggle({feed,onToggle:()=>switches++});
    assert.equal(tree.props.role,'group');
    const buttons=React.Children.toArray(tree.props.children);
    assert.equal(buttons.length,2);assert.deepEqual(buttons.map(b=>b.props['aria-pressed']),[feed==='clipts',feed==='squad']);
    buttons[feed==='clipts'?0:1].props.onClick();assert.equal(switches,0);
    buttons[feed==='clipts'?1:0].props.onClick();assert.equal(switches,1);
  }
});
test('portrait keyboard measurement follows the visual viewport without changing orientation mid-composition',()=>{
  const saved=Object.fromEntries(['document','window','matchMedia','ResizeObserver'].map(key=>[key,globalThis[key]]));
  try {
    let editing=true,measure;const values=[{width:312,height:528,left:0,top:0,landscape:false,portraitConstrained:true,normalWidth:390},'visible',0];
    let index=0;const effects=[];
    globalThis.document={documentElement:{clientWidth:312,clientHeight:528},activeElement:{matches:()=>editing}};
    globalThis.window={screen:{width:390},visualViewport:{width:312,height:250,offsetLeft:0,offsetTop:4,addEventListener(){},removeEventListener(){}},addEventListener(){},removeEventListener(){}};
    globalThis.matchMedia=()=>({matches:true});
    globalThis.ResizeObserver=class {constructor(fn){measure=fn;}observe(){}disconnect(){}};
    const {useImmersiveController}=load('hooks/useImmersiveController.ts',{
      react:{useState:()=>{const n=index++;return [values[n],v=>{values[n]=typeof v==='function'?v(values[n]):v;}];},useRef:()=>({current:false}),useEffect:fn=>effects.push(fn)},
      '@/lib/controller-layout':policy,
    });
    useImmersiveController(true,{layout:'auto',portraitZoom:true,autoHide:true},'/clipts');
    const cleanup=effects[0]();assert.equal(values[0].height,250);assert.equal(values[0].top,4);assert.equal(values[0].landscape,false);
    editing=false;measure();assert.equal(values[0].landscape,true);cleanup();
  } finally {Object.assign(globalThis,saved);}
});
test('caption renderer retains original text, hashtags, mentions and safe HTTP links without HTML injection',()=>{
  const {CaptionText}=load('components/post/EngagementHud.tsx',{
    '@tanstack/react-query':{},'@/components/ui/dialog':{},'@/components/ui/button':{},
    '@/lib/supabase':{},'@/contexts/AuthContext':{},'./CommentList':{},'@/components/ui/avatar':{},
  });
  const caption='Hello @matthew #clipt\nhttps://example.com/path javascript:alert(1) <img>';
  const parts=CaptionText({text:caption}).props.children;
  assert.equal(parts.map(p=>typeof p==='string'?p:(p.props.text??p.props.children)).join(''),caption);
  const anchors=parts.filter(p=>p?.type==='a');assert.equal(anchors.length,1);
  assert.equal(anchors[0].props.href,'https://example.com/path');assert.equal(anchors[0].props.rel,'noopener noreferrer');
});
test('keyboard resize reveals the already-focused composer by scrolling only the comments sheet',()=>{
  const saved=Object.fromEntries(['document','HTMLElement','requestAnimationFrame','cancelAnimationFrame','MutationObserver','ResizeObserver'].map(key=>[key,globalThis[key]]));
  try {
    let callback,changed,cancelled=false,index=0;const effects=[],styles=new Map();
    globalThis.MutationObserver=class {constructor(fn){changed=fn;}observe(){}disconnect(){}};
    globalThis.ResizeObserver=class {observe(){}disconnect(){}};
    const sheet={scrollTop:0,getBoundingClientRect:()=>({top:8,bottom:242})};
    globalThis.HTMLElement=class {matches(){return true;}closest(){return sheet;}getBoundingClientRect(){return {top:392,bottom:428};}};
    globalThis.document={addEventListener(){},removeEventListener(){},activeElement:new HTMLElement(),documentElement:{style:{setProperty:(k,v)=>styles.set(k,v),removeProperty:k=>styles.delete(k)}}};
    globalThis.requestAnimationFrame=fn=>{callback=fn;return 7;};globalThis.cancelAnimationFrame=id=>{cancelled=id===7;};
    const values=[{width:312,height:250,left:0,top:0,landscape:false,portraitConstrained:true,normalWidth:390},'visible',0];
    const {useImmersiveController}=load('hooks/useImmersiveController.ts',{
      react:{useState:()=>[values[index++],()=>{}],useRef:()=>({current:false}),useEffect:fn=>effects.push(fn)},'@/lib/controller-layout':policy,
    });
    useImmersiveController(true,{layout:'auto',portraitZoom:true,autoHide:true},'/clipts');
    const cleanup=effects[2]();assert.equal(styles.get('--clipt-portrait-visible-height'),'250px');callback();
    assert.equal(sheet.scrollTop,198);
    // Loading comments may move the focused form again after the initial frame.
    changed();callback();assert.equal(sheet.scrollTop,396);
    cleanup();assert.equal(styles.size,0);assert.equal(cancelled,true);
  } finally {Object.assign(globalThis,saved);}
});
test('actual available width AND height choose layout without assuming a Safari zoom percentage',()=>{
  for(const [w,h] of [[844,390],[932,430]]) assert.equal(policy.controllerLayout(w,h,true,'auto'),'classic');
  for(const scale of [1.25,1.5,1.75,2,2.5,3]) for(const [w,h] of [[844,390],[932,430]]) {
    const width=Math.floor(w/scale),height=Math.floor(h/scale);
    assert.equal(policy.controllerLayout(width,height,true,'auto'),width>=700&&height>=340?'classic':'immersive');
    assert.equal(policy.controllerLayout(width,height,true,'classic'),width>=700&&height>=340?'classic':'immersive');
  }
  assert.equal(policy.controllerLayout(932,430,true,'immersive'),'immersive');
  for (const preference of ['auto','classic','immersive']) {
    for (const [w,h] of [[390,660],[320,568],[256,454],[195,330]]) {
      assert.equal(policy.controllerLayout(w,h,false,preference),'classic');
      assert.equal(policy.controllerLayout(w,h,false,preference,true),w<340||(h<500&&w<360)?'immersive':'classic');
    }
  }
  assert.equal(policy.controllerLayout(768,1024,false,'auto'),'classic');
});
test('browser preference validation survives malformed/absent storage and retains explicit auto-hide Off',()=>{
  for(const value of [null,'broken','null','{"layout":"unknown"}']) assert.deepEqual(policy.readControllerPreferences(value),{layout:'auto',autoHide:true,portraitZoom:false});
  assert.deepEqual(policy.readControllerPreferences('{"layout":"immersive","autoHide":false}'),{layout:'immersive',autoHide:false,portraitZoom:false});
  assert.equal(policy.readControllerPreferences('{"portraitZoom":true}').portraitZoom,true);
  assert.equal(policy.readControllerPreferences('{"portraitZoom":"true"}').portraitZoom,false);
});
test('visibility setting preserves saved preferences while portrait viewing no longer depends on a zoom switch',()=>{
  const updates=[];
  const {ControllerSettings}=load('components/ControllerSettings.tsx',{
    '@/hooks/useControllerPreferences':{useControllerPreferences:()=>({preferences:{layout:'auto',autoHide:false,portraitZoom:false},saved:true,update:value=>updates.push(value)})},
  });
  const nodes=[];const visit=node=>{if(!node||typeof node!=='object')return;nodes.push(node);React.Children.toArray(node.props?.children).forEach(visit);};visit(ControllerSettings());
  const toggles=nodes.filter(node=>node.type==='input'&&node.props.type==='checkbox');
  assert.equal(toggles.length,1);const toggle=toggles[0];
  assert.equal(toggle.props.checked,false);toggle.props.onChange({target:{checked:true}});
  assert.deepEqual(updates,[{layout:'auto',autoHide:true,portraitZoom:false}]);
  assert.match(read('hooks/useImmersiveController.ts'),/preferences\.layout, preferences\.portraitZoom/);
});
test('10-second actual hook timer hides, pauses for each interaction, cancels and respects Off/manual state',()=>{
  const saved={document:globalThis.document,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
  try {
    for(const blocker of ['none','pointer','focus','dialog','off','manual']) {
      const values=[{width:563,height:260,left:0,top:0,landscape:true},blocker==='manual'?'manual':'visible',0];
      let index=0,ref=0,effects=[],scheduled=[],cleared=[];
      const refs=[{current:{contains:()=>blocker==='focus'}},{current:blocker==='pointer'},{current:false}];
      globalThis.document={activeElement:{},querySelector:()=>blocker==='dialog'?{}:null};
      globalThis.setTimeout=(fn,ms)=>{scheduled.push({fn,ms});return scheduled.length;};
      globalThis.clearTimeout=id=>cleared.push(id);
      const {useImmersiveController}=load('hooks/useImmersiveController.ts',{
        react:{useState:()=>{const n=index++;return [values[n],v=>{values[n]=typeof v==='function'?v(values[n]):v;}];},useRef:()=>refs[ref++],useEffect:fn=>effects.push(fn)},
        '@/lib/controller-layout':policy,
      });
      const render=()=>{index=0;ref=0;effects=[];return useImmersiveController(true,{layout:'auto',autoHide:blocker!=='off'},'/clipts');};
      render();const cleanup=effects[4]();
      if(['off','manual'].includes(blocker)){assert.equal(scheduled.length,0);continue;}
      assert.equal(scheduled[0].ms,10000);scheduled[0].fn();
      if(blocker==='none'){assert.equal(render().hidden,true);assert.equal(values[1],'auto');}
      else {assert.equal(values[1],'visible');assert.equal(scheduled.length,2);}
      cleanup();assert.equal(cleared.length,1);
    }
  } finally {Object.assign(globalThis,saved);}
});
test('layout keeps 44px targets, floating media, recovery, reduced motion and unchanged live/post delegation',()=>{
  const css=read('components/GameBoyControls.css'),source=read('components/GameBoyControls.tsx'),hook=read('hooks/useImmersiveController.ts');
  assert.match(css,/transition: opacity 300ms/);assert.match(css,/min-width: 44px; min-height: 44px/);
  assert.match(css,/prefers-reduced-motion: reduce/);assert.match(css,/data-emergency="true"/);
  assert.match(source,/button\.click\(\)/);assert.match(source,/liveContext \? liveButton\(action\)/);
  assert.match(source,/stepFromOverflow/);assert.match(hook,/Math\.hypot.*< 12/);
  assert.match(source,/if\(handoffFocus.current\)\{event.preventDefault\(\)/);
  assert.match(hook,/new ResizeObserver/);assert.match(hook,/visualViewport/);
  assert.match(read('pages/clipt-console.css'),/body:has\(\.clipt-controller\[data-layout="immersive"\]\) \.clipt-fyp \{ z-index: 0 !important/);
  assert.match(read('pages/Clipts.tsx'),/:not\(\[data-state="closed"\]\)/);
});
test('controller social actions, primary navigation and joystick reuse existing targets/events',()=>{
  const saved=Object.fromEntries(['document','window','innerWidth','innerHeight','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','CustomEvent'].map(key=>[key,globalThis[key]]));
  const activated=[],routes=[],events=[],frames=[];
  try {
    const buttons=Object.fromEntries(['like','comment','trophy','follow'].map(action=>[action,{disabled:false,getAttribute:()=>null,click:()=>activated.push(action)}]));
    const post={dataset:{postId:'real-post',activeClip:'true'},getBoundingClientRect:()=>({width:600,height:300,top:0,bottom:300,left:0,right:600}),querySelector:selector=>buttons[Object.keys(buttons).find(action=>selector.includes(action))]};
    globalThis.innerWidth=675;globalThis.innerHeight=312;globalThis.getComputedStyle=()=>({visibility:'visible'});
    globalThis.document={querySelector:()=>({dataset:{layout:'classic',mobileV2:'true'},getBoundingClientRect:()=>({top:0})}),querySelectorAll:()=>[post]};
    globalThis.window={dispatchEvent:event=>events.push(event)};
    globalThis.CustomEvent=class {constructor(type,options){this.type=type;this.detail=options.detail;}};
    globalThis.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};globalThis.cancelAnimationFrame=()=>{};
    const {default:Controller}=load('components/GameBoyControls.tsx',{
      react:{...React,useState:initial=>[initial&&typeof initial==='object'&&'like' in initial?{like:true,comment:true,trophy:true,follow:true}:initial,()=>{}],useRef:()=>({current:null}),useEffect:()=>{},useCallback:fn=>fn},
      'react-router-dom':{useLocation:()=>({pathname:'/clipts'}),useNavigate:()=>path=>routes.push(path)},
      '@/hooks/useControllerPreferences':{useControllerPreferences:()=>({preferences:{layout:'auto',autoHide:true}})},
      '@/hooks/useImmersiveController':{useImmersiveController:()=>({immersive:true,viewport:{width:675,height:312,landscape:true},rootRef:{current:null},hidden:false})},
      './ControllerSettings':{ControllerSettings:()=>null},'@/components/ui/dialog':{Dialog:()=>null,DialogContent:()=>null,DialogTitle:()=>null,DialogDescription:()=>null},'./GameBoyControls.css':{},
    });
    const nodes=[];const visit=node=>{if(!node||typeof node!=='object')return;nodes.push(node);React.Children.toArray(node.props?.children).forEach(visit);};visit(Controller({}));
    for(const action of ['like','comment','trophy','follow'])nodes.find(n=>n.props?.['data-controller-action']===action).props.onClick();
    assert.deepEqual(activated,['like','comment','trophy','follow']);
    for(const name of ['Open menu','CLIPT — Open navigation'])nodes.find(n=>n.props?.['aria-label']===name).props.onClick();
    assert.equal(nodes.filter(n=>n.type==='button'&&n.props?.['aria-label']==='POST').length,0,'landscape Post is available through navigation');
    const actionGroup=nodes.find(n=>n.props?.className==='clipt-controller-actions');
    assert.ok(React.Children.toArray(actionGroup.props.children).some(n=>n.props?.['aria-label']==='CLIPT — Open navigation'),'CLIPT occupies the former camera slot');
    assert.equal(nodes.filter(n=>n.props?.['aria-label']==='CLIPT — Open navigation').length,1);
    assert.deepEqual(routes,['/menu']);
    const joystick=nodes.find(n=>n.props?.role==='slider');
    joystick.props.onKeyDown({key:'ArrowRight',preventDefault(){}});assert.equal(events.at(-1).detail.direction,1);
    let captured=false;joystick.props.onPointerDown({pointerId:3,button:0,clientX:100,clientY:26,preventDefault(){},currentTarget:{getBoundingClientRect:()=>({left:0,top:0,width:52,height:52}),setPointerCapture(){captured=true;}}});
    frames[0](performance.now()+1000);assert.ok(captured);assert.equal(events.at(-1).detail.direction,1);
    joystick.props.onPointerUp();
    const overflowComment=nodes.find(n=>n.type==='button'&&Array.isArray(n.props?.children)&&n.props.children.includes('Comment — Open engagement'));
    overflowComment.props.onClick();
    const overflowDialog=nodes.filter(n=>n.props?.className==='clipt-controller-dialog').at(-1);
    let prevented=false;overflowDialog.props.onCloseAutoFocus({preventDefault(){prevented=true;}});
    assert.equal(prevented,true,'handoff must not steal focus from newly opened comments');
    prevented=false;overflowDialog.props.onCloseAutoFocus({preventDefault(){prevented=true;}});
    assert.equal(prevented,false,'handoff suppression is consumed once');
    const flip=nodes.find(n=>n.type?.name==='FeedFlipButton');assert.ok(flip);
    let switched=0;
    const flipTree=flip.type({feed:'clipts',onToggle:()=>switched++});
    assert.equal(flipTree.props.role,'switch');assert.equal(flipTree.props['aria-checked'],false);
    flipTree.props.onClick();assert.equal(switched,1);
    assert.equal(flip.type({feed:'squad',onToggle:()=>{}}).props['aria-checked'],true);
    flip.props.onToggle();assert.equal(events.at(-1).type,'clipt:toggle-feed');
  } finally {Object.assign(globalThis,saved);}
});
test('click-based media activation reveals manual hiding without cancelling the original media action',()=>{
  const saved=Object.fromEntries(['document','window','Element','MutationObserver'].map(key=>[key,globalThis[key]]));
  try {
    const events=new Map(),values=[{width:563,height:260,left:0,top:0,landscape:true},'manual',0];let index=0,ref=0;const effects=[];
    const refs=[{current:{contains:()=>false}},{current:false},{current:false}];
    globalThis.Element=class {closest(){return this;}};
    globalThis.document={querySelector:()=>null,body:{},addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:(name)=>events.delete(name)};
    globalThis.window={addEventListener:()=>{},removeEventListener:()=>{}};
    globalThis.MutationObserver=class {observe(){}disconnect(){}};
    const {useImmersiveController}=load('hooks/useImmersiveController.ts',{
      react:{useState:()=>{const n=index++;return [values[n],value=>{values[n]=typeof value==='function'?value(values[n]):value;}];},useRef:()=>refs[ref++],useEffect:fn=>effects.push(fn)},'@/lib/controller-layout':policy,
    });
    useImmersiveController(true,{layout:'auto',autoHide:true},'/clipts');const cleanup=effects[3]();
    let cancelled=false;events.get('click')({target:new Element(),preventDefault(){cancelled=true;}});
    assert.equal(values[1],'visible');assert.equal(cancelled,false);cleanup();assert.equal(events.size,0);
  } finally {Object.assign(globalThis,saved);}
});
