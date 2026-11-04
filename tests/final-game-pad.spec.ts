import {openApp} from './fixtures/open-app';
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
 const f=await fixture(page);await page.setViewportSize({width:390,height:844});await openApp(page,'/new-post');await page.getByRole('textbox',{name:'Find a game',exact:true}).fill('Overwatch');
 const result=page.getByRole('button',{name:'Overwatch 2016 multiplayer first-person shooter video game',exact:true});await expect(result).toBeVisible();expect(f.searches()).toBeGreaterThan(0);expect(f.writes).toHaveLength(0);await result.click();
 await expect(page.getByRole('combobox',{name:'Game / category',exact:true})).toHaveValue(picked);await expect(page.getByRole('combobox',{name:'Game / category',exact:true}).locator('option:checked')).toHaveText('Overwatch · 2016 · PC');expect(f.resolutions()).toBe(1);expect(f.writes).toHaveLength(0);
 await page.getByLabel('Caption',{exact:true}).fill('Keep the selected game');await page.getByLabel('Clipt video',{exact:true}).setInputFiles(fileURLToPath(new URL('./fixtures/clip-test-h264.mp4',import.meta.url)));await expect(page.getByRole('button',{name:'Post Clipt',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Post Clipt',exact:true}).click();await expect.poll(()=>f.writes.length).toBe(1);expect(f.writes[0].game_id).toBe(picked);expect(f.writes[0].user_id).toBe(owner);
});
test('portrait swipe/menu pad follows expanded Safari chrome and stays below the video',async({page})=>{
 await page.addInitScript(()=>{const viewport=Object.assign(new EventTarget(),{width:390,height:620,offsetTop:0,offsetLeft:0,scale:1,pageTop:0,pageLeft:0});Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});(window as any).chromeViewportFixture=viewport;document.addEventListener('DOMContentLoaded',()=>Object.defineProperty(document.documentElement,'clientHeight',{configurable:true,get:()=>620}),{once:true});});
 await fixture(page);await page.setViewportSize({width:390,height:844});await openApp(page,'/clipts');await page.getByRole('button',{name:'Fit video',exact:true}).click();const pad=page.getByRole('button',{name:'CLIPT — Open navigation',exact:true});await expect(pad).toBeVisible();
 for(const [height,top] of [[620,0],[844,0],[720,10]]){
  await page.evaluate(({height,top})=>{const v=(window as any).chromeViewportFixture;v.height=height;v.offsetTop=top;v.dispatchEvent(new Event('resize'));},{height,top});
  await expect.poll(async()=>Math.round((await pad.boundingBox())!.y+(await pad.boundingBox())!.height)).toBe(height+top);
  const p=await pad.boundingBox(),video=await page.locator('[data-active-clip="true"] .clipt-cinematic-media').boundingBox();expect(p!.y).toBeGreaterThanOrEqual(video!.y+video!.height);expect(await page.evaluate(()=>scrollY)).toBe(0);
 }
 await pad.click();await expect(page.getByRole('dialog',{name:'CLIPT navigation',exact:true})).toBeVisible();
});

for(const hand of ['right','left'])test('roomy computer/tablet CLIPT navigation is centered and separate ('+hand+')',async({page},info)=>{
 await fixture(page,hand);await page.setViewportSize({width:1280,height:800});await openApp(page,'/clipts');await page.getByRole('button',{name:'Fit video',exact:true}).click();
 const home=page.getByRole('button',{name:'CLIPT — Open navigation',exact:true});
 const player=page.locator('[data-active-clip="true"] video');await expect(player).toBeVisible();
 await player.evaluate(element=>{element.dataset.wideLayoutProbe='kept';});
 for(const size of [{width:1280,height:800},{width:1024,height:768},{width:768,height:1024}]){
  await page.setViewportSize(size);await expect(home).toBeVisible();
  await expect.poll(async()=>{const r=await home.boundingBox();return r?Math.abs(r.x+r.width/2-size.width/2):Infinity;}).toBeLessThanOrEqual(1);
  const h=(await home.boundingBox())!;const media=(await page.locator('[data-active-clip="true"] .clipt-cinematic-media').boundingBox())!;expect(h.y).toBeGreaterThanOrEqual(media.y+media.height);expect(h.y+h.height).toBeLessThanOrEqual(size.height);expect(h.y).toBeGreaterThan(size.height-160);
  const socialBottoms:number[]=[];
  for(const button of await page.locator('.clipt-controller-actions > .clipt-controller-action, .clipt-controller-actions > .clipt-feed-flip').all()){
   if(!await button.isVisible())continue;const r=(await button.boundingBox())!;
   expect(h.x+h.width<=r.x||r.x+r.width<=h.x||h.y+h.height<=r.y||r.y+r.height<=h.y).toBe(true);
   if(size.width>size.height&&await button.getAttribute('data-controller-action')){expect(r.y).toBeGreaterThanOrEqual(media.y+media.height);socialBottoms.push(r.y+r.height);}
  }
  if(size.width>size.height){expect(socialBottoms).toHaveLength(4);expect(Math.max(...socialBottoms)).toBeGreaterThanOrEqual(size.height-16);expect(Math.max(...socialBottoms)).toBeLessThanOrEqual(size.height);}
  await expect(player).toHaveAttribute('data-wide-layout-probe','kept');
  expect(await page.evaluate(()=>scrollY)).toBe(0);
  await page.screenshot({path:info.outputPath('centered-'+hand+'-'+size.width+'x'+size.height+'.png')});
  await home.click();await expect(page.getByRole('dialog',{name:'CLIPT navigation',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Close',exact:true}).click();await expect(home).toBeFocused();
 }
});


async function captionFixture(page:Page,hand='right',autoHide=false){
  const stats=await fixture(page,hand);
  await page.addInitScript(({owner,autoHide})=>{
    localStorage.setItem('clipt-home-controls-v1:'+owner,'completed');
    localStorage.setItem('clipt-controller-preferences-v1',JSON.stringify({layout:'auto',autoHide}));
  },{owner,autoHide});
  const caption='A complete gaming caption with #Gaming and enough words to exercise the compact white preview without covering gameplay. '+ 'More original caption text. '.repeat(12);
  const rows=[{id:postId,user_id:owner,content:caption,video_url:'/tests/fixtures/clip-test-h264.mp4',image_url:null,game_id:known,is_published:true,post_type:'clipt',created_at:'2026-11-03T00:00:00Z',profiles:{username:'FirstCreator',display_name:'First Creator',avatar_url:null}},
    {id:'00000000-0000-4000-8000-000000000081',user_id:picked,content:'Second original caption #Gaming',video_url:'/tests/fixtures/clip-test-h264.mp4',image_url:null,game_id:known,is_published:true,post_type:'clipt',created_at:'2026-11-02T00:00:00Z',profiles:{username:'SecondCreator',display_name:'Second Creator',avatar_url:null}}];
  await page.route('**/rest/v1/posts?**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(rows)}));
  return {stats,caption};
}
for(const hand of ['right','left'])test('captions appear only in Comments and stay with the current clip ('+hand+')',async({page},info)=>{
  test.setTimeout(90000);
  const {stats,caption}=await captionFixture(page,hand);
  for(const size of [{width:390,height:844},{width:844,height:390},{width:1280,height:800},{width:768,height:1024},{width:195,height:422}]){
    await page.setViewportSize(size);await openApp(page,'/clipts');
    const video=page.locator('[data-active-clip="true"] video');
    await expect(video).toBeVisible();await video.evaluate(v=>{v.dataset.commentsContinuity='same-player';});
    await expect(page.locator('.clipt-feed-caption')).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Show caption',exact:true})).toHaveCount(0);
    await page.locator('.clipt-controller [data-controller-action="comment"]').click();
    const details=page.locator('.clipt-comment-post-details');
    await expect(details).toBeVisible();await expect(details).toContainText(caption);
    await expect(details.getByRole('link',{name:'@FirstCreator',exact:true})).toHaveAttribute('href','/user/'+owner);
    await expect(details.getByRole('link',{name:'#Gaming',exact:true})).toBeVisible();
    await expect(video).toHaveAttribute('data-comments-continuity','same-player');
    await page.getByRole('button',{name:'Back to controls',exact:true}).click();
    await expect(page.locator('.clipt-engagement-hud[role="dialog"]')).toHaveCount(0);
    await expect(page.locator('.clipt-feed-caption')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&scrollY===0)).toBe(true);
    await page.screenshot({path:info.outputPath('comments-only-'+hand+'-'+size.width+'x'+size.height+'.png')});
  }
  const track=page.getByRole('region',{name:'Clipts horizontal feed',exact:true});
  await track.focus();await track.press('ArrowRight');
  await expect(page.locator('[data-active-clip="true"]')).toHaveAttribute('data-post-id','00000000-0000-4000-8000-000000000081');
  await page.locator('.clipt-controller [data-controller-action="comment"]').click();
  await expect(page.locator('.clipt-comment-post-details')).toContainText('Second original caption #Gaming');
  await expect(page.locator('.clipt-comment-post-details')).not.toContainText(caption);
  expect(stats.writes).toHaveLength(0);
});
test('comments remain available after controls fade without restoring a caption overlay',async({page})=>{
  const {caption,stats}=await captionFixture(page,'right',true);
  await page.setViewportSize({width:390,height:844});await openApp(page,'/clipts');
  const controller=page.locator('.clipt-controller'),video=page.locator('[data-active-clip="true"] video');
  await expect(video).toBeVisible();await video.evaluate(v=>{v.dataset.commentsContinuity='same-player';});
  await expect(controller).toHaveAttribute('data-hidden','true',{timeout:16000});
  await expect(page.locator('.clipt-feed-caption')).toHaveCount(0);
  await page.locator('[data-active-clip="true"] .clipt-cinematic-media').click({position:{x:10,y:10}});
  await expect(controller).toHaveAttribute('data-hidden','false');
  await page.locator('.clipt-controller [data-controller-action="comment"]').click();
  await expect(page.locator('.clipt-comment-post-details')).toContainText(caption);
  await expect(video).toHaveAttribute('data-comments-continuity','same-player');
  await expect(page.locator('.clipt-feed-caption')).toHaveCount(0);
  expect(stats.writes).toHaveLength(0);
});

for(const hand of ['right','left'])test('feed fills the screen by default and Fit video preserves playback ('+hand+')',async({page},info)=>{
  test.setTimeout(60000);
  await captionFixture(page,hand);
  for(const size of [{width:390,height:844},{width:844,height:390},{width:768,height:1024},{width:1280,height:800},{width:195,height:422}]){
    await page.setViewportSize(size);await openApp(page,'/clipts');
    const feed=page.locator('.clipt-fyp'),video=page.locator('[data-active-clip="true"] video');
    await expect(feed).toHaveAttribute('data-video-fit','cover');
    await expect(video).toBeVisible();
    await expect.poll(()=>video.evaluate(v=>getComputedStyle(v).objectFit)).toBe('cover');
    await expect.poll(()=>video.evaluate(v=>{const stage=v.closest('.clipt-fyp-slide')!.getBoundingClientRect(),r=v.getBoundingClientRect();return Math.max(Math.abs(r.x-stage.x),Math.abs(r.y-stage.y),Math.abs(r.width-stage.width),Math.abs(r.height-stage.height));})).toBeLessThanOrEqual(1);
    await video.evaluate(v=>{v.dataset.fitContinuity='retained';});
    const source=await video.getAttribute('src');
    await page.getByRole('button',{name:'Fit video',exact:true}).click();
    await expect(feed).toHaveAttribute('data-video-fit','contain');
    await expect.poll(()=>video.evaluate(v=>getComputedStyle(v).objectFit)).toBe('contain');
    await expect(video).toHaveAttribute('data-fit-continuity','retained');expect(await video.getAttribute('src')).toBe(source);
    await page.getByRole('button',{name:'Fill screen',exact:true}).click();
    await expect(feed).toHaveAttribute('data-video-fit','cover');await expect(video).toHaveAttribute('data-fit-continuity','retained');
    for(const control of await page.locator('.clipt-controller-action:visible,.clipt-controller-home:visible,.clipt-video-fit-toggle').all()){
      const r=(await control.boundingBox())!;expect(r.x).toBeGreaterThanOrEqual(-1);expect(r.y).toBeGreaterThanOrEqual(-1);expect(r.x+r.width).toBeLessThanOrEqual(size.width+1);expect(r.y+r.height).toBeLessThanOrEqual(size.height+1);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&scrollY===0)).toBe(true);
    await page.screenshot({path:info.outputPath('fill-video-'+hand+'-'+size.width+'x'+size.height+'.png')});
  }
});
