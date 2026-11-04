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
 await fixture(page);await page.setViewportSize({width:390,height:844});await openApp(page,'/clipts');const pad=page.getByRole('button',{name:'CLIPT — Open navigation',exact:true});await expect(pad).toBeVisible();
 for(const [height,top] of [[620,0],[844,0],[720,10]]){
  await page.evaluate(({height,top})=>{const v=(window as any).chromeViewportFixture;v.height=height;v.offsetTop=top;v.dispatchEvent(new Event('resize'));},{height,top});
  await expect.poll(async()=>Math.round((await pad.boundingBox())!.y+(await pad.boundingBox())!.height)).toBe(height+top);
  const p=await pad.boundingBox(),video=await page.locator('[data-active-clip="true"] .clipt-cinematic-media').boundingBox();expect(p!.y).toBeGreaterThanOrEqual(video!.y+video!.height);expect(await page.evaluate(()=>scrollY)).toBe(0);
 }
 await pad.click();await expect(page.getByRole('dialog',{name:'CLIPT navigation',exact:true})).toBeVisible();
});

for(const hand of ['right','left'])test('roomy computer/tablet CLIPT navigation is centered and separate ('+hand+')',async({page},info)=>{
 await fixture(page,hand);await page.setViewportSize({width:1280,height:800});await openApp(page,'/clipts');
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
for(const hand of ['right','left'])test('white creator and caption remain outside the video and navigation ('+hand+')',async({page},info)=>{
  const {stats,caption:originalCaption}=await captionFixture(page,hand);
  for(const size of [{width:390,height:844},{width:844,height:390},{width:1280,height:800},{width:768,height:1024},{width:195,height:422}]){
    await page.setViewportSize(size);await openApp(page,'/clipts');
    const footer=page.getByRole('complementary',{name:'Current Clipt details',exact:true});
    await expect(footer).toBeVisible();
    const creator=footer.getByRole('link',{name:"View FirstCreator's profile",exact:true});
    await expect(creator).toHaveText('First Creator');
    expect(await creator.evaluate(element=>getComputedStyle(element).color)).toBe('rgb(255, 255, 255)');
    const toggle=footer.getByRole('button',{name:'Show caption',exact:true});
    await expect(toggle).toHaveAttribute('aria-expanded','false');await expect(footer).not.toContainText(originalCaption);
    await toggle.click();await expect(footer.getByRole('button',{name:'Hide caption',exact:true})).toHaveAttribute('aria-expanded','true');
    await expect(footer).toContainText(originalCaption);
    const caption=footer.getByRole('button',{name:'Read full caption and comments',exact:true});
    expect(await caption.evaluate(element=>getComputedStyle(element).color)).toBe('rgb(255, 255, 255)');
    const f=(await footer.boundingBox())!,m=(await page.locator('[data-active-clip="true"] .clipt-cinematic-media').boundingBox())!;
    expect(m.y+m.height).toBeLessThanOrEqual(f.y+1);
    expect(f.x).toBeGreaterThanOrEqual(0);expect(f.x+f.width).toBeLessThanOrEqual(size.width+1);expect(f.y+f.height).toBeLessThanOrEqual(size.height+1);
    const pad=page.getByRole('button',{name:'CLIPT — Open navigation',exact:true});
    if(await page.locator('.clipt-controller').getAttribute('data-portrait-viewing')==='true'){
      expect(f.y+f.height).toBeLessThanOrEqual((await pad.boundingBox())!.y);
    }
    for(const button of await page.locator('.clipt-controller-action,.clipt-controller-home').all()){
      if(!await button.isVisible())continue;const b=(await button.boundingBox())!;
      expect(f.x+f.width<=b.x||b.x+b.width<=f.x||f.y+f.height<=b.y||b.y+b.height<=f.y,JSON.stringify({size,hand,action:await button.getAttribute('data-controller-action'),caption:f,button:b})).toBe(true);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&scrollY===0)).toBe(true);
    await page.screenshot({path:info.outputPath('white-caption-'+hand+'-'+size.width+'x'+size.height+'.png')});
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.locator('.clipt-feed-caption').evaluate(element=>getComputedStyle(element).transitionDuration)).toBe('0s');
  await page.getByRole('region',{name:'Clipts horizontal feed',exact:true}).focus();await page.keyboard.press('ArrowRight');
  const footer=page.getByRole('complementary',{name:'Current Clipt details',exact:true});
  await expect(footer.getByRole('link',{name:"View SecondCreator's profile",exact:true})).toBeVisible();
  await expect(footer).not.toContainText('Second original caption #Gaming');
  await footer.getByRole('button',{name:'Show caption',exact:true}).click();await expect(footer).toContainText('Second original caption #Gaming');
  await footer.getByRole('link',{name:"View SecondCreator's profile",exact:true}).click();await expect(page).toHaveURL(new RegExp('/user/'+picked+'$'));
  expect(stats.writes).toHaveLength(0);
});
test('caption fades and returns with controls while focus and comments preserve it',async({page})=>{
  const {caption,stats}=await captionFixture(page,'right',true);
  await page.setViewportSize({width:390,height:844});await openApp(page,'/clipts');
  const controller=page.locator('.clipt-controller'),footer=page.getByRole('complementary',{name:'Current Clipt details',exact:true}),video=page.locator('[data-active-clip="true"] video');
  await expect(footer).toBeVisible();await video.evaluate(element=>{element.dataset.captionPlaybackProbe='same-player';});
  const initial=(await page.locator('[data-active-clip="true"] .clipt-cinematic-media').boundingBox())!;
  await expect(controller).toHaveAttribute('data-hidden','true',{timeout:16000});
  await expect(footer).toBeHidden();
  await expect(video).toHaveAttribute('data-caption-playback-probe','same-player');
  expect((await page.locator('[data-active-clip="true"] .clipt-cinematic-media').boundingBox())!.height).toBe(initial.height);
  await page.locator('[data-active-clip="true"] .clipt-cinematic-media').click({position:{x:10,y:10}});
  await expect(controller).toHaveAttribute('data-hidden','false');await expect(footer).toBeVisible();
  await footer.getByRole('link',{name:"View FirstCreator's profile",exact:true}).focus();await page.waitForTimeout(10500);
  await expect(controller).toHaveAttribute('data-hidden','false');await expect(footer).toBeVisible();
  await footer.getByRole('button',{name:'Show caption',exact:true}).click();
  await footer.getByRole('button',{name:'Read full caption and comments',exact:true}).click();
  await expect(page.locator('.clipt-engagement-hud[role="dialog"]')).toBeVisible();
  await expect(page.locator('.clipt-comment-post-details')).toContainText(caption);
  await expect(video).toHaveAttribute('data-caption-playback-probe','same-player');
  expect(stats.writes).toHaveLength(0);
});
