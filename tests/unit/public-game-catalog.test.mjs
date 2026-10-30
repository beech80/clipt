import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';
const mod={exports:{}};new Function('module','exports',ts.transpileModule(readFileSync(new URL('../../supabase/functions/game-catalog/wikidata.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod,mod.exports);
const {publicSearchText,publicGame,createPublicGameCatalog,isPublicGameId}=mod.exports;
const claim=value=>({rank:'normal',mainsnak:{snaktype:'value',datavalue:{value}}});
const entity=(id,name,kind='Q7889')=>({id,labels:{en:{value:name}},claims:{P31:[claim({id:kind})],P577:[claim({time:'+2017-01-01T00:00:00Z'})],P400:[claim({id:'Q100'})],P5794:[claim('700')]}});
test('public catalog constrains searches to video games and keeps real identity, year and platforms',()=>{
 assert.equal(publicSearchText(''), 'haswbstatement:P31=Q7889');
 const text=publicSearchText('Doom OR -haswbstatement:P31=Q5 https://bad');assert.equal((text.match(/haswbstatement:/g)||[]).length,1);assert.ok(text.includes('OR*'));assert.ok(!text.includes('-haswbstatement:'));
 for(const value of ['Q0','Q01','q1','https://example.com','Q1|Q2',1])assert.equal(isPublicGameId(value),false);
 assert.equal(publicGame(entity('Q1','Not game','Q5')),null);assert.equal(publicGame(entity('Q1','')),null);
 const game=publicGame(entity('Q1','Game'),{Q100:'Windows'});assert.equal(game.id,'Q1');assert.equal(game.release_year,2017);assert.equal(game.platforms,'Windows');assert.equal(game.igdb_id,700);assert.equal(game.cover_url,null);
});
test('public catalog paginates, caches requests and resolves a verified game without provider credentials',async()=>{
 const calls=[];const catalog=createPublicGameCatalog(async(input,init)=>{
  const url=new URL(input);calls.push(url);assert.equal(url.origin,'https://www.wikidata.org');assert.equal(url.searchParams.get('maxlag'),'5');assert.match(init.headers['User-Agent'],/CLIPT/);assert.equal(init.redirect,'error');
  if(url.searchParams.get('action')==='query'){const second=url.searchParams.get('sroffset')==='20';return new Response(JSON.stringify({query:{searchinfo:{totalhits:178000},search:[{title:second?'Q2':'Q1'}]},...(!second?{continue:{sroffset:20}}:{})}));}
  const ids=url.searchParams.get('ids').split('|');if(ids.length===1&&ids[0]==='Q100')assert.equal(url.searchParams.get('props'),'labels');return new Response(JSON.stringify({entities:Object.fromEntries(ids.map(id=>[id,id==='Q100'?{id,labels:{en:{value:'Windows'}}}:entity(id,id==='Q1'?'Game one':'Game two')]))}));
 });
 const a=await catalog.search('',0),b=await catalog.search('',1);assert.equal(a.source,'wikidata');assert.equal(a.total,178000);assert.equal(a.more,true);assert.equal(b.more,false);assert.equal(a.games[0].name,'Game one');assert.equal(b.games[0].name,'Game two');
 const count=calls.length;await catalog.search('',0);assert.equal(calls.length,count);
 assert.equal((await catalog.resolve('Q1')).game.id,'Q1');await assert.rejects(catalog.resolve('https://example.com'));await assert.rejects(catalog.search('x',500));
});
test('public catalog stops on throttling, non-game records and malformed responses',async()=>{
 let calls=0;const throttled=createPublicGameCatalog(async()=>{calls++;return new Response('{}',{status:429,headers:{'Retry-After':'60'}});});
 await assert.rejects(throttled.search('x',0));await assert.rejects(throttled.search('y',0));assert.equal(calls,1);
 const invalid=createPublicGameCatalog(async input=>{const url=new URL(input);return new Response(JSON.stringify(url.searchParams.get('action')==='query'?{query:{search:[{title:'Q1'}]}}:{entities:{Q1:entity('Q1','Human','Q5')}}));});
 assert.deepEqual((await invalid.search('human',0)).games,[]);await assert.rejects(invalid.resolve('Q1'));
 const malformed=createPublicGameCatalog(async()=>new Response('not-json'));await assert.rejects(malformed.search('',0));
});
