import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';
import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),post='00000000-0000-4000-8000-000000000001',job='00000000-0000-4000-8000-000000000002';
function render({holds=[],reviews=[],error=false}={}){
 const code=ts.transpileModule(readFileSync(new URL('../../src/components/settings/PhotoSafetyNotices.tsx',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const replacements={
  '@tanstack/react-query':{useQuery:({queryKey})=>({data:queryKey[0]==='my-photo-review-holds'?holds:reviews,isError:error,isPending:false}),useMutation:()=>({isPending:false,isError:false}),useQueryClient:()=>({})},
  '@/integrations/supabase/client':{supabase:{},storageProjectUrl:'https://akiksrlzdqvipqbbjxpw.supabase.co'},
  '@/contexts/AuthContext':{useAuth:()=>({user:{id:'owner'}})},
  '@/components/ui/button':{Button:({children,variant,...props})=>React.createElement('button',props,children)},
  'react-router-dom':{Link:({to,children,...props})=>React.createElement('a',{href:to,...props},children)},
 };
 const mod={exports:{}};new Function('require','module','exports',code)(name=>replacements[name]??require(name),mod,mod.exports);
 return renderToStaticMarkup(React.createElement(mod.exports.PhotoSafetyNotices));
}
test('owner notices distinguish pending, failed, flagged, appealed and restored without claiming safety',()=>{
 assert.match(render({holds:[{post_id:post,state:'queued'}]}),/not public yet/);
 assert.match(render({holds:[{post_id:post,state:'failed'}]}),/remains out of public discovery/);
 const row={job_id:job,post_id:post,decision:null,appeal_requested_at:null};
 const flagged=render({reviews:[row]});assert.match(flagged,/Request human review/);assert.ok(flagged.includes('/post/'+post));
 const appealed=render({reviews:[{...row,appeal_requested_at:'2026-10-15T00:00:00Z'}]});assert.match(appealed,/review request is recorded/);assert.doesNotMatch(appealed,/Request human review/);
 assert.match(render({reviews:[{...row,decision:'restore'}]}),/photo restored/);
 const failed=render({error:true});assert.match(failed,/No safety approval is assumed/);assert.doesNotMatch(failed,/No photo quarantines recorded/);
});
test('notice reads use caller-scoped RPCs without browser-selected owner identities',()=>{
 const source=readFileSync(new URL('../../src/components/settings/PhotoSafetyNotices.tsx',import.meta.url),'utf8');
 assert.match(source,/rpc\('my_photo_quarantines'\)/);assert.match(source,/rpc\('my_photo_review_holds'\)/);
 assert.doesNotMatch(source,/service_role|user_metadata|p_user:/);
});
