import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import ts from 'typescript';
import * as model from '../../src/lib/page-controller.ts';
const require=createRequire(import.meta.url);
const source=ts.transpileModule(readFileSync(new URL('../../src/components/GameBoyControls.tsx',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const cases=[['/discovery'],['/retro-search'],['/profile',{ownProfile:true}],['/user/creator'],['/messages'],['/messages/creator',{conversation:true}],['/live'],['/creator-dashboard'],['/notifications'],['/achievements'],['/tokens'],['/boosts'],['/settings'],['/new-post'],['/edit-profile'],['/top-games'],['/top-clipts'],['/game/42'],['/game-streamers/42'],['/drafts'],['/subscription'],['/comments/post'],['/stream-setup'],['/admin']];
for(const [pathname,context={}] of cases) test(`real controller dispatch delegates once to the current page: ${pathname} ${JSON.stringify(context)}`,()=>{
  const saved=Object.fromEntries(['document','getComputedStyle','KeyboardEvent','requestAnimationFrame'].map(key=>[key,globalThis[key]]));
  const calls=[],targets=new Map();let disabled=false;
  const layout=model.pageControllerLayout(pathname,context);
  for(const action of layout.actions) if(action.selector) targets.set(action.selector,[...(targets.get(action.selector)??[]),{
    textContent:action.text??'',tabIndex:0,getAttribute:key=>key==='role' && action.selector==='[role="tab"]'?'tab':null,dispatchEvent:()=>calls.push(['click',action.id]),closest:()=>null,matches:selector=>selector.includes(':disabled')?disabled:true,
    getClientRects:()=>[{}],click:()=>calls.push(['click',action.id]),scrollIntoView:()=>calls.push(['reveal',action.id]),focus:()=>calls.push(['focus',action.id]),
  }]);
  const root={querySelectorAll:selector=>[...(targets.get(selector)??[]),...(selector==='.clipt-profile button' && context.ownProfile?[{textContent:'Edit Profile'}]:[])],querySelector:()=>context.conversation?{}:null};
  globalThis.document={querySelector:selector=>selector==='.page-content'?root:null};
  globalThis.getComputedStyle=()=>({display:'block',visibility:'visible'});
  globalThis.KeyboardEvent=class {constructor(type,options){this.type=type;Object.assign(this,options);}};
  globalThis.requestAnimationFrame=fn=>{fn();return 1;};
  try{
    const deps={
      react:{...React,useState:initial=>[initial&&typeof initial==='object'&&'path' in initial?{path:pathname,layout,enabled:layout.actions.map(a=>a.id)}:initial,()=>{}],useRef:initial=>({current:initial}),useEffect:()=>{},useCallback:fn=>fn},
      'react-router-dom':{useLocation:()=>({pathname}),useNavigate:()=>to=>calls.push(['navigate',to])},
      '@/lib/page-controller':model,'./GameBoyControls.css':{},'@/pages/Menu':{default:()=>null},
      '@/hooks/useMobileControlsPreferences':{useMobileControlsPreferences:()=>({preferences:{hand:'right'}})},
      '@/hooks/useControllerPreferences':{useControllerPreferences:()=>({preferences:{layout:'auto',autoHide:true}})},
      '@/hooks/useImmersiveController':{useImmersiveController:()=>({immersive:false,viewport:{width:844,height:390,landscape:true},rootRef:{current:null},hidden:false})},
      './ControllerSettings':{ControllerSettings:()=>null},'./accessibility/HandPreferenceSettings':{HandPreferenceSettings:()=>null},'./AdjustablePanel':{AdjustablePanel:()=>null},
      '@/components/ui/dialog':{Dialog:()=>null,DialogContent:()=>null,DialogTitle:()=>null,DialogDescription:()=>null},
    };
    const mod={exports:{}};new Function('require','module','exports',source)(name=>deps[name]??require(name),mod,mod.exports);
    const nodes=[];const visit=node=>{if(!node||typeof node!=='object')return;nodes.push(node);React.Children.toArray(node.props?.children).forEach(visit);};visit(mod.exports.default({}));
    assert.equal(nodes.filter(node=>node.props?.['aria-label']==='Open menu'||node.props?.['aria-label']==='POST').length,0);
    let prevented=false;document.activeElement={matches:()=>true};nodes.find(node=>node.props?.className==='clipt-controller-home').props.onPointerDown({preventDefault(){prevented=true;}});assert.equal(prevented,true,'typing layout must not move the CLIPT button before click');
    for(const action of layout.actions){
      const node=nodes.find(node=>node.props?.['data-controller-action']===action.id);assert.ok(node,action.id);assert.equal(node.props.disabled,false);
      calls.length=0;node.props.onClick();
      assert.deepEqual(calls,action.kind==='navigate'?[['navigate',action.to]]:action.kind==='click'?[['click',action.id]]:[['reveal',action.id],['focus',action.id]]);
      if(action.kind!=='navigate') {disabled=true;calls.length=0;node.props.onClick();assert.deepEqual(calls,[],'permission/disabled state rechecked at activation');disabled=false;}
    }
    const group=nodes.find(node=>node.props?.['aria-label']==='Current page controller actions');
    const menuActions=React.Children.toArray(group.props.children).filter(node=>node.type==='button');
    menuActions[0].props.onClick();
    let handedOff=false;nodes.find(node=>node.props?.className==='clipt-navigation-panel').props.onCloseAutoFocus({preventDefault(){handedOff=true;}});
    assert.equal(handedOff,true,'menu close must not steal focus from the selected page control');
  }finally{Object.assign(globalThis,saved);}
});
