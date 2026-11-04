import test from 'node:test';
import assert from 'node:assert/strict';
import {mentionAtCaret,insertMention} from '../../src/lib/mention-input.ts';
import {loginDestination} from '../../src/lib/login-destination.ts';
test('mention selection replaces only the caret token and preserves the rest of a caption',()=>{
 const text='Good game @Beecher suffix',token=mentionAtCaret(text,14);
 assert.deepEqual(token,{start:10,end:18,term:'Bee'});
 assert.deepEqual(insertMention(text,token,'Beecher89'),{value:'Good game @Beecher89  suffix',caret:21});
 assert.equal(mentionAtCaret('mail@example.com',16),null);
 assert.equal(mentionAtCaret('hey @',5)?.term,'');
 assert.equal(mentionAtCaret('hi @bad name',12),null);
});
test('shared post login return rejects external, malformed and privileged targets',()=>{
 const post='/post/00000000-0000-4000-8000-000000000099';
 assert.equal(loginDestination('?next='+encodeURIComponent(post)),post);
 assert.equal(loginDestination('?next='+encodeURIComponent(post+'#comments')),post+'#comments');
 for(const target of ['https://evil.invalid','//evil.invalid','/admin','/post/invalid','/post/../admin','/post/%2fadmin'])
  assert.equal(loginDestination('?next='+encodeURIComponent(target)),'/clipts');
});
