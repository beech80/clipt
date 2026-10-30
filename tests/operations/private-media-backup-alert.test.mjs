import test from 'node:test';import assert from 'node:assert/strict';
import {reportPrivateBackup,BACKUP_ALERT_TITLE} from '../../scripts/report-private-media-backup.mjs';
const env=result=>({GITHUB_REPOSITORY:'beech80/clipt',GITHUB_REF:'refs/heads/main',GITHUB_RUN_ID:'77',GITHUB_TOKEN:'synthetic',CLIPT_BACKUP_RESULT:result});
const issue=()=>({number:5,title:BACKUP_ALERT_TITLE,user:{login:'github-actions[bot]'},body:'<!-- clipt-private-backup-alert-v1 -->'});
test('new failure notifies the existing owner without any source metadata or raw error content',async()=>{
 const writes=[];const result=await reportPrivateBackup({env:env('failure'),fetchImpl:async(url,opts)=>{assert(url.startsWith('https://api.github.com/repos/beech80/clipt/issues'));assert.equal(opts.redirect,'error');if(opts.method==='GET')return new Response('[]');writes.push(JSON.parse(opts.body));return new Response('{}');}});
 assert.equal(result.alert,'created');assert.deepEqual(writes[0].assignees,['beech80']);assert.equal(writes[0].title,BACKUP_ALERT_TITLE);assert(!JSON.stringify(writes).includes('storage/v1'));assert(!JSON.stringify(writes).includes('synthetic'));
});
test('repeated failure stays quiet and a verified recovery closes only its own incident',async()=>{
 let writes=[];const fetchImpl=async(url,opts)=>{if(opts.method==='GET')return new Response(JSON.stringify([issue(),{...issue(),number:6,user:{login:'beech80'}}]));writes.push({url,body:JSON.parse(opts.body)});return new Response('{}');};
 assert.equal((await reportPrivateBackup({env:env('failure'),fetchImpl})).alert,'already-open');assert.equal(writes.length,0);
 assert.equal((await reportPrivateBackup({env:env('success'),fetchImpl})).alert,'recovered');assert.equal(writes.length,2);assert(writes.every(x=>x.url.includes('/5')));assert.equal(writes[1].body.state,'closed');
});
test('healthy runs create no alert; unknown contexts and failed delivery fail visibly',async()=>{
 assert.equal((await reportPrivateBackup({env:env('success'),fetchImpl:async()=>new Response('[]')})).alert,'healthy');
 await assert.rejects(reportPrivateBackup({env:{...env('failure'),GITHUB_REF:'refs/heads/other'}}));
 await assert.rejects(reportPrivateBackup({env:env('failure'),fetchImpl:async()=>new Response('',{status:403})}));
});
