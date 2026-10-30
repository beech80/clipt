export const BACKUP_ALERT_TITLE='[CLIPT backup] Recurring media backup needs attention';
const MARKER='<!-- clipt-private-backup-alert-v1 -->';
export async function reportPrivateBackup({env,fetchImpl=fetch}){
 if(env.GITHUB_REPOSITORY!=='beech80/clipt'||env.GITHUB_REF!=='refs/heads/main'||!/^[1-9][0-9]{0,19}$/.test(env.GITHUB_RUN_ID||'')||!['success','failure'].includes(env.CLIPT_BACKUP_RESULT)||!env.GITHUB_TOKEN)throw Error('backup-alert-context');
 const base='https://api.github.com/repos/beech80/clipt/issues';
 async function request(url,method='GET',body){
  const r=await fetchImpl(url,{method,redirect:'error',headers:{Authorization:'Bearer '+env.GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('backup-alert-delivery-failed');return r.status===204?null:r.json();
 }
 const found=[];
 for(let page=1;page<=5;page++){
  const issues=await request(base+'?state=open&per_page=100&page='+page);if(!Array.isArray(issues))throw Error('backup-alert-response');
  found.push(...issues.filter(i=>!i.pull_request&&i.title===BACKUP_ALERT_TITLE&&i.user?.login==='github-actions[bot]'&&typeof i.body==='string'&&i.body.includes(MARKER)));
  if(issues.length<100)break;if(page===5)throw Error('backup-alert-pagination-limit');
 }
 const link='https://github.com/beech80/clipt/actions/runs/'+env.GITHUB_RUN_ID;
 if(env.CLIPT_BACKUP_RESULT==='failure'){
  if(found.length)return {alert:'already-open'};
  await request(base,'POST',{title:BACKUP_ALERT_TITLE,assignees:['beech80'],body:MARKER+'\nA recurring private-media backup did not complete its required copy and restore verification. The last verified snapshot remains available. Review the fixed error code in this Actions run; do not paste credentials, private media URLs or manifests into this issue.\n\n'+link});
  return {alert:'created'};
 }
 for(const issue of found){
  if(!Number.isSafeInteger(issue.number)||issue.number<1)throw Error('backup-alert-response');
  await request(base+'/'+issue.number+'/comments','POST',{body:'A subsequent private-media backup completed and passed its restore verification.\n\n'+link});
  await request(base+'/'+issue.number,'PATCH',{state:'closed',state_reason:'completed'});
 }
 return {alert:found.length?'recovered':'healthy'};
}
