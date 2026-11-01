import {test,expect,type Page} from '@playwright/test';
import {fileURLToPath} from 'node:url';
const owner='00000000-0000-4000-8000-000000000077',known='00000000-0000-4000-8000-000000000078',picked='00000000-0000-4000-8000-000000000079',postId='00000000-0000-4000-8000-000000000080';
async function fixture(page:Page,hand='right'){
 const user={id:owner,aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-09-19T00:00:00Z',factors:[]};let searches=0,resolutions=0;const writes:any[]=[];
 await page.addInitScript(({user,hand})=>{const exp=Math.floor(Date.now()/1000)+3600;const enc=(x:object)=>btoa(JSON.stringify(x)).replaceAll('=','').replaceAll('+','-').replaceAll('/','_');localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:enc({alg:'HS256'})+'.'+enc({sub:user.id,exp,aal:'aal1',role:'authenticated'})+'.fixture',refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}));localStorage.setItem('clipt-mobile-controls-v1',JSON.stringify({hand,trail:false}));localStorage.setItem('clipt-controller-preferences-v1',JSON.stringify({layout:'auto',autoHide:false}));},{user,hand});
 await page.route('**/*',async route=>{const req=route.request(),url=new URL(req.url()),path=url.pathname;if(url.origin==='http://127.0.0.1:8081')return route.continue();if(url.origin!=='http://127.0.0.1:54321')return route.abort();let data:any=[],status=200;
 if(path==='/auth/v1/user')data=user;
 if(path==='/rest/v1/rpc/clipt_posting_capabilities')data=true;
 if(path==='/rest/v1/game_channel_catalog')data=[{id:known,name:'Configured game',member_ids:[known]}].filter(g=>!url.searchParams.has('name')||g.name.toLowerCase().includes(url.searchParams.get('name')!.replace(/^ilike[.]/,'').replace(/%/g,'').toLowerCase()));
 if(path==='/functions/v1/game-catalog'){const body=req.postDataJSON();if(body.action==='search'){searches++;expect(body.term).toBe('Overwatch');data={games:[{id:'Q18515944',name:'Overwatch',description:'2016 multiplayer first-person shooter video game',cover_url:null,release_year:null,platforms:null}],source:'wikidata',total:1,more:false};}else{resolutions++;expect(body.id).toBe('Q18515944');data={game:{id:picked,name:'Overwatch',release_year:2016,platforms:'PC'}};}}
 if(path.startsWith('/storage/v1/object/media')&&req.method()==='POST')data={Key:path.split('/object/')[1]};
 if(path==='/rest/v1/posts'&&req.method()==='POST'){writes.push(req.postDataJSON());status=201;data={id:postId};}
 if(path==='/rest/v1/public_clipt_discovery'||path==='/rest/v1/posts'&&req.method()==='GET')data=[{id:postId,user_id:owner,content:'A game moment',video_url:'/tests/fixtures/clip-test-h264.mp4',image_url:null,game_id:known,is_published:true,post_type:'clipt',created_at:'2026-11-01T00:00:00Z',profiles:{username:'fixture',avatar_url:null}}];
 return route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });return {writes,searches:()=>searches,resolutions:()=>resolutions};
}
test('typing Overwatch opens the full catalog and retains the verified game until an intentional post',async({page})=>{
 const f=await fixture(page);await page.setViewportSize({width:390,height:844});await page.goto('/new-post');await page.getByRole('textbox',{name:'Find a game',exact:true}).fill('Overwatch');
 const result=page.getByRole('button',{name:'Overwatch 2016 multiplayer first-person shooter video game',exact:true});await expect(result).toBeVisible();expect(f.searches()).toBeGreaterThan(0);expect(f.writes).toHaveLength(0);await result.click();
 await expect(page.getByRole('combobox',{name:'Game / category',exact:true})).toHaveValue(picked);await expect(page.getByRole('combobox',{name:'Game / category',exact:true}).locator('option:checked')).toHaveText('Overwatch · 2016 · PC');expect(f.resolutions()).toBe(1);expect(f.writes).toHaveLength(0);
 await page.getByLabel('Caption',{exact:true}).fill('Keep the selected game');await page.getByLabel('Clipt video',{exact:true}).setInputFiles(fileURLToPath(new URL('./fixtures/clip-test-h264.mp4',import.meta.url)));await expect(page.getByRole('button',{name:'Post Clipt',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Post Clipt',exact:true}).click();await expect.poll(()=>f.writes.length).toBe(1);expect(f.writes[0].game_id).toBe(picked);expect(f.writes[0].user_id).toBe(owner);
});
test('portrait swipe/menu pad follows expanded Safari chrome and stays below the video',async({page})=>{
 await page.addInitScript(()=>{const viewport=Object.assign(new EventTarget(),{width:390,height:620,offsetTop:0,offsetLeft:0,scale:1,pageTop:0,pageLeft:0});Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});(window as any).chromeViewportFixture=viewport;document.addEventListener('DOMContentLoaded',()=>Object.defineProperty(document.documentElement,'clientHeight',{configurable:true,get:()=>620}),{once:true});});
 await fixture(page);await page.setViewportSize({width:390,height:844});await page.goto('/clipts');const pad=page.getByRole('button',{name:'CLIPT — Open navigation',exact:true});await expect(pad).toBeVisible();
 for(const [height,top] of [[620,0],[844,0],[720,10]]){
  await page.evaluate(({height,top})=>{const v=(window as any).chromeViewportFixture;v.height=height;v.offsetTop=top;v.dispatchEvent(new Event('resize'));},{height,top});
  await expect.poll(async()=>Math.round((await pad.boundingBox())!.y+(await pad.boundingBox())!.height)).toBe(height+top);
  const p=await pad.boundingBox(),video=await page.locator('[data-active-clip="true"] .clipt-cinematic-media').boundingBox();expect(p!.y).toBeGreaterThanOrEqual(video!.y+video!.height);expect(await page.evaluate(()=>scrollY)).toBe(0);
 }
 await pad.click();await expect(page.getByRole('dialog',{name:'CLIPT navigation',exact:true})).toBeVisible();
});

for(const hand of ['right','left'])test('roomy computer/tablet CLIPT navigation is centered and separate ('+hand+')',async({page},info)=>{
 await fixture(page,hand);await page.setViewportSize({width:1280,height:800});await page.goto('/clipts');
 const home=page.getByRole('button',{name:'CLIPT — Open navigation',exact:true});
 const player=page.locator('[data-active-clip="true"] video');await expect(player).toBeVisible();
 await player.evaluate(element=>{element.dataset.wideLayoutProbe='kept';});
 for(const size of [{width:1280,height:800},{width:1024,height:768},{width:768,height:1024}]){
  await page.setViewportSize(size);await expect(home).toBeVisible();
  await expect.poll(async()=>{const r=(await home.boundingBox())!;return Math.abs(r.x+r.width/2-size.width/2);}).toBeLessThanOrEqual(1);
  const h=(await home.boundingBox())!;expect(h.y+h.height).toBeLessThanOrEqual(size.height);expect(h.y).toBeGreaterThan(size.height-160);
  for(const button of await page.locator('.clipt-controller-actions > .clipt-controller-action, .clipt-controller-actions > .clipt-feed-flip').all()){
   if(!await button.isVisible())continue;const r=(await button.boundingBox())!;
   expect(h.x+h.width<=r.x||r.x+r.width<=h.x||h.y+h.height<=r.y||r.y+r.height<=h.y).toBe(true);
  }
  await expect(player).toHaveAttribute('data-wide-layout-probe','kept');
  expect(await page.evaluate(()=>scrollY)).toBe(0);
  await page.screenshot({path:info.outputPath('centered-'+hand+'-'+size.width+'x'+size.height+'.png')});
  await home.click();await expect(page.getByRole('dialog',{name:'CLIPT navigation',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Close',exact:true}).click();await expect(home).toBeFocused();
 }
});
