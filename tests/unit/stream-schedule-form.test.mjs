import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as z from 'zod';
const source=readFileSync(new URL('../../src/components/streaming/schedule/ScheduleStream.tsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('ScheduleStream.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let schema;
function visit(node){
 if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='scheduleFormSchema') {
  // Compile the real TypeScript initializer, including Zod 4 input generics.
  const compiled=ts.transpileModule(`const schema = ${node.initializer.getText(ast)};`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  schema=new Function('z',`${compiled}; return schema;`)(z);
 }
 ts.forEachChild(node,visit);
}
visit(ast);
const valid=()=>({title:'Upcoming fixture',description:'',scheduled_for:new Date(Date.now()+86400000),duration_minutes:60,tags:'test',is_public:false});
test('schedule form rejects past dates, distant dates, fractional durations and blank titles',()=>{
 assert.ok(schema.safeParse(valid()).success);
 for(const change of [{scheduled_for:new Date(0)},{scheduled_for:new Date(Date.now()+400*86400000)},{duration_minutes:15.5},{duration_minutes:721},{title:'   '},{tags:'x'.repeat(101)}])
  assert.equal(schema.safeParse({...valid(),...change}).success,false);
});
test('schedule form persists tags, defaults private and prevents same-turn resubmission',()=>{
 assert.match(source,/tags: values\.tags/);
 assert.match(source,/is_public: false/);
 assert.match(source,/if \(submitting\.current\) return;\s*submitting\.current = true;/);
 assert.doesNotMatch(source,/<SelectItem value=""/);
 assert.doesNotMatch(source,/created_at: new Date/);
});
