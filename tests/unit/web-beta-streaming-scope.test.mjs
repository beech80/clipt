import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function page(stage){
 let dashboards=0,obs=0;
 const source=readFileSync(new URL('../../src/pages/StreamSetup.tsx',import.meta.url),'utf8').replace('import.meta.env.VITE_APP_ENV',JSON.stringify(stage));
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const mod={exports:{}},deps={
  '@/components/streaming/StreamDashboard':{StreamDashboard:()=>{dashboards++;return React.createElement('section',null,'Existing stream dashboard');}},
  '@/components/streaming/ObsBroadcastDashboard':{ObsBroadcastDashboard:()=>{obs++;return React.createElement('section',null,'Computer OBS setup; phone broadcasting unavailable');}},
  'lucide-react':{Radio:()=>null,MonitorPlay:()=>null},
  'react-router-dom':{Link:({to,children,...props})=>React.createElement('a',{...props,href:to},children)}
 };
 new Function('require','module','exports',code)(name=>deps[name]??require(name),mod,mod.exports);
 return {html:renderToStaticMarkup(React.createElement(mod.exports.default)),dashboards:()=>dashboards,obs:()=>obs};
}
test('production mounts only the readiness-gated computer OBS dashboard',()=>{
 const result=page('production');assert.equal(result.dashboards(),0);assert.equal(result.obs(),1);
 assert.match(result.html,/Computer OBS setup; phone broadcasting unavailable/);
 assert.doesNotMatch(result.html,/Existing stream dashboard|Camera Live|Screen Live/);
});
test('development preserves the existing OBS pilot instructions and dashboard',()=>{
 const result=page('development');assert.equal(result.dashboards(),1);
 assert.match(result.html,/Existing stream dashboard/);assert.match(result.html,/Check Mux test status \/ playback/);
 assert.doesNotMatch(result.html,/Broadcasting is coming after the web beta/);
});
