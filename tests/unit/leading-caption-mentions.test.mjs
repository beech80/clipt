import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import ts from 'typescript';
import * as hashtags from '../../src/utils/hashtagUtils.ts';
const require=createRequire(import.meta.url),Mention=()=>null;
const source=ts.transpileModule(readFileSync(new URL('../../src/components/post/HashtagText.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const deps={'@/components/mentions/MentionProfileLink':{MentionProfileLink:Mention},'react-router-dom':{Link:()=>null},'@/utils/hashtagUtils':hashtags},mod={exports:{}};
new Function('require','module','exports',source)(name=>deps[name]??require(name),mod,mod.exports);
function usernames(text){const names=[];function walk(node){if(!node||typeof node!=='object')return;if(node.type===Mention)names.push(node.props.username);React.Children.toArray(node.props?.children).forEach(walk);}walk(mod.exports.HashtagText({text}));return names;}
test('a caption beginning with @ renders the tagged profile control',()=>{
 assert.deepEqual(usernames('@jayteevee2 test #clipt'),['jayteevee2']);
 assert.deepEqual(usernames('@jayteevee2'),['jayteevee2']);
 assert.deepEqual(usernames('Thanks @jayteevee2 and @Beecher89 #clipt'),['jayteevee2','Beecher89']);
 assert.deepEqual(usernames('(@jayteevee2)'),['jayteevee2']);
});
test('email addresses and incomplete @ text remain ordinary caption text',()=>{
 for(const text of ['mail@example.com','@','@ test','word@jayteevee2','@one@two'])assert.deepEqual(usernames(text),text==='@one@two'?['one']:[]);
});
