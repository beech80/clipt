import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {openApp} from './fixtures/open-app';
const owner='00000000-0000-4000-8000-000000000077',postId='00000000-0000-4000-8000-000000000080',creator='00000000-0000-4000-8000-000000000081';
const achievement={id:'00000000-0000-4000-8000-000000000082',name:'Clip Rookie',description:'Get your first trophy on a clip',target_value:1,points:100,category:'general',progress_type:'count',reward_type:'points'};
async function setup(page:Page){
 const user={id:owner,aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-09-19T00:00:00Z',factors:[]};
 const profile={id:creator,username:'Beecher89',display_name:'Beecher',avatar_url:null};
 const post={id:postId,user_id:creator,content:'A real #gaming @beecher89 caption',video_url:'http://127.0.0.1:54321/fixture-video.mp4',image_url:null,post_type:'clipt',is_published:true,is_premium:false,is_subscriber_only:false,created_at:'2026-11-03T00:00:00Z',profiles:profile};
 let refreshes=0,writes=0;
 await page.addInitScript(({user})=>{
  const exp=Math.floor(Date.now()/1000)+3600,enc=(v:object)=>btoa(JSON.stringify(v)).replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
  localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:enc({alg:'HS256'})+'.'+enc({sub:user.id,exp,aal:'aal1',role:'authenticated'})+'.fixture',refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}));
  localStorage.setItem('clipt-controller-preferences-v1',JSON.stringify({layout:'auto',autoHide:false}));
  Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(value:string)=>{(window as any).__copiedPost=value;}}});
 },{user});
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;
  if(url.origin==='http://127.0.0.1:8081')return route.continue();
  if(url.origin!=='http://127.0.0.1:54321')return route.abort();
  let data:any=[],status=200;const head=req.method()==='HEAD';
  if(path==='/auth/v1/user')data=user;
  if(path==='/rest/v1/profiles')data=url.searchParams.get('select')==='id'?{id:creator}:[profile];
  if(path==='/rest/v1/posts')data=url.searchParams.has('id')?post:[post];
  if(path==='/rest/v1/rpc/clipt_posting_capabilities')data=true;
  if(path==='/rest/v1/rpc/sync_my_achievements'){
   refreshes++;data={trophies:3,rows:[{id:'progress',user_id:owner,achievement_id:achievement.id,current_value:3,achievement,tracked:true,completed:true,earned_at:'2026-11-03T00:00:00Z'}]};
  }
  if(path==='/rest/v1/achievements')data=[achievement];
  if(path==='/rest/v1/rpc/get_top_clipts')data=[{post_id:postId,creator_id:creator,content:post.content,username:'Beecher89',avatar_url:null,created_at:post.created_at,trophy_count:3}];
  if(path==='/rest/v1/game_channel_catalog')data=[{id:creator,name:'Overwatch',member_ids:[creator]}];
  if(path==='/rest/v1/follows')data=null;
  if(path==='/fixture-video.mp4')return route.fulfill({status:200,contentType:'video/mp4',body:readFileSync(fileURLToPath(new URL('./fixtures/clip-test-h264.mp4',import.meta.url)))});
  if(path.startsWith('/storage/v1/object/sign/')){
   if(req.method()==='POST')data={signedURL:'/object/sign/media/'+creator+'/sample.mp4?token=fixture'};
   else return route.fulfill({status:200,contentType:'video/mp4',body:readFileSync(fileURLToPath(new URL('./fixtures/clip-test-h264.mp4',import.meta.url)))});
  }
  if(req.method()==='POST'&&['/rest/v1/posts','/rest/v1/clip_votes','/rest/v1/comments'].includes(path))writes++;
  return route.fulfill({status,contentType:'application/json',headers:head?{'content-range':'0-0/3'}:{},body:head?'':JSON.stringify(data)});
 });
 return {refreshes:()=>refreshes,writes:()=>writes};
}
test('verified earned achievement and Trophy totals display, with an explicit refresh',async({page})=>{
 const f=await setup(page);await openApp(page,'/achievements');
 await expect(page.getByText('100 pts',{exact:true}).first()).toBeVisible();
 await expect(page.getByText('3 Trophies received',{exact:true})).toBeVisible();
 await expect(page.getByText('Earned!',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Refresh achievements',exact:true}).click();
 await expect.poll(f.refreshes).toBeGreaterThanOrEqual(2);expect(f.writes()).toBe(0);
});
test('caption @ suggestions support touch, keyboard and preserve surrounding text',async({page})=>{
 const f=await setup(page);await page.setViewportSize({width:390,height:844});await openApp(page,'/new-post');
 const caption=page.getByLabel('Caption',{exact:true});await caption.fill('Great game @Bee');
 await expect(page.getByRole('option',{name:'@Beecher89 · Beecher',exact:true})).toBeVisible();
 await caption.press('Enter');await expect(caption).toHaveValue('Great game @Beecher89 ');
 expect(f.writes()).toBe(0);
 await caption.fill('Email mail@example.com');await expect(page.getByRole('listbox',{name:'People to tag'})).toHaveCount(0);
 await caption.fill('Thanks @Bee');await page.getByRole('option',{name:'@Beecher89 · Beecher',exact:true}).click();
 await expect(caption).toHaveValue('Thanks @Beecher89 ');
});
test('post comments can tag people and Share Clipt copies the exact post link',async({page})=>{
 const f=await setup(page);await openApp(page,'/post/'+postId);
 await page.getByRole('button',{name:'Comment on post',exact:true}).click();
 const comment=page.getByRole('textbox',{name:'Add a comment...',exact:true});await expect(comment).toBeVisible();await comment.fill('@Bee');
 await page.getByRole('option',{name:'@Beecher89 · Beecher',exact:true}).click();await expect(comment).toHaveValue('@Beecher89 ');
 await page.getByRole('button',{name:'Share Clipt',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__copiedPost)).toBe('http://127.0.0.1:8081/post/'+postId);
 expect(f.writes()).toBe(0);
});
test('Top Clipts contains playable video and its Trophy count',async({page})=>{
 const f=await setup(page);await openApp(page,'/top-clipts');
 const video=page.locator('[aria-label="Ranked Clipt video"] video').first();await expect(video).toBeVisible();
 await video.evaluate(async element=>{element.muted=true;await element.play();});
 await expect.poll(()=>video.evaluate(element=>element.currentTime)).toBeGreaterThan(0);
 await expect(page.getByLabel('3 Trophies',{exact:true})).toBeVisible();expect(f.writes()).toBe(0);
});
test('landscape post video stays inside its frame and outside the controller',async({page},info)=>{
 await setup(page);await openApp(page,'/post/'+postId);
 for(const size of [{width:844,height:390},{width:1024,height:768},{width:1280,height:800}]){
  await page.setViewportSize(size);
  const video=page.locator('.clipt-watch-media video'),frame=page.locator('.clipt-watch-media .clipt-video-frame');
  await expect(video).toBeVisible();
  await expect.poll(async()=>{const v=await video.boundingBox(),f=await frame.boundingBox();return v&&f?Math.abs(v.height-f.height)+Math.abs(v.width-f.width):999;}).toBeLessThan(2);
  expect(await video.evaluate(element=>getComputedStyle(element).objectFit)).toBe('contain');
  const v=(await video.boundingBox())!,dock=(await page.locator('.clipt-controller').boundingBox())!;
  expect(v.y+v.height).toBeLessThanOrEqual(dock.y+1);
  await page.screenshot({path:info.outputPath('uncropped-post-'+size.width+'.png')});
 }
});

test('long @ suggestions wrap at large zoom and keyboard selection scrolls only the list',async({page})=>{
 await setup(page);await page.setViewportSize({width:195,height:422});
 const people=Array.from({length:8},(_,index)=>({id:'person-'+index,username:'user_'+String(index)+'a'.repeat(44),display_name:null}));
 await page.route('**/rest/v1/profiles?**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(people)}));
 await openApp(page,'/new-post');const caption=page.getByLabel('Caption',{exact:true});await caption.fill('@user');
 const list=page.getByRole('listbox',{name:'People to tag',exact:true});await expect(list.getByRole('option')).toHaveCount(8);
 for(let index=0;index<7;index++)await caption.press('ArrowDown');
 const selected=list.getByRole('option',{selected:true});await expect(selected).toContainText(people[7].username);
 await expect.poll(()=>list.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
 const bounds=(await list.boundingBox())!,row=(await selected.boundingBox())!;
 expect(row.y+row.height).toBeLessThanOrEqual(bounds.y+bounds.height+1);
 const width=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,overflows:[...document.querySelectorAll('.clipt-create *')].filter(element=>{const r=element.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1;}).slice(0,8).map(element=>({tag:element.tagName,className:element.className,text:element.textContent?.slice(0,70)}))}));
 expect(width.page,JSON.stringify(width)).toBeLessThanOrEqual(width.viewport);
 await caption.press('Enter');await expect(caption).toHaveValue('@'+people[7].username+' ');
});

test('a manually typed mention opens the same profile regardless of letter case',async({page})=>{
 await setup(page);
 await page.route('**/rest/v1/profiles?select=id&**',route=>{
  expect(new URL(route.request().url()).searchParams.get('username')).toBe('ilike.beecher89');
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:creator})});
 });
 await openApp(page,'/post/'+postId);
 await page.locator('.clipt-post-caption').getByRole('button',{name:"View @beecher89's profile",exact:true}).click();
 await expect(page).toHaveURL(new RegExp('/user/'+creator+'$'));
});

for(const size of [{width:390,height:844},{width:1024,height:768}])test('feed caption displays a tagged username and opens that profile at '+size.width,async({page})=>{
 const f=await setup(page);await page.setViewportSize(size);
 await page.route('**/rest/v1/public_clipt_discovery?**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{id:postId,user_id:creator,content:'A real #gaming @beecher89 caption',video_url:'/tests/fixtures/clip-test-h264.mp4',image_url:null,is_published:true,post_type:'clipt',created_at:'2026-11-03T00:00:00Z',profiles:{username:'Beecher89',avatar_url:null}}])}));
 await openApp(page,'/clipts');const footer=page.getByRole('complementary',{name:'Current Clipt details',exact:true});
 const tag=footer.getByRole('button',{name:"View @beecher89's profile",exact:true});
 await expect(tag).toBeVisible();await expect(tag).toHaveText('@beecher89');
 expect(await tag.evaluate(element=>getComputedStyle(element).color)).toBe('rgb(255, 255, 255)');
 expect(await tag.evaluate(element=>Boolean(element.parentElement?.closest('button')))).toBe(false);
 await tag.click();await expect(page).toHaveURL(new RegExp('/user/'+creator+'$'));expect(f.writes()).toBe(0);
});
