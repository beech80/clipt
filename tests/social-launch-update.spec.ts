import {test,expect} from '@playwright/test';
import {openApp} from './fixtures/open-app';

test('social launch fits rotation, supports Life posts and searches real hashtag suggestions',async({page},info)=>{
 const user={id:'00000000-0000-4000-8000-000000000077',aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z',factors:[]};
 let searches=0;
 await page.addInitScript(user=>{
  const exp=Math.floor(Date.now()/1000)+3600,enc=(v:object)=>btoa(JSON.stringify(v)).replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
  localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:enc({alg:'HS256'})+'.'+enc({sub:user.id,exp,aal:'aal1',role:'authenticated'})+'.fixture',refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}));
 },user);
 await page.route('http://127.0.0.1:54321/**',async route=>{
  const path=new URL(route.request().url()).pathname;let data:unknown=[];
  if(path==='/auth/v1/user')data=user;
  else if(path.endsWith('/clipt_beta_access')||path.endsWith('/clipt_posting_capabilities'))data=true;
  else if(path.endsWith('/get_own_profile')||path.endsWith('/profiles'))data={id:user.id,username:'tester',avatar_url:null};
  else if(path.endsWith('/game_channel_catalog')||path.endsWith('/games'))data=[{id:'00000000-0000-4000-8000-000000000001',name:'Game Alpha',cover_url:null,member_ids:['00000000-0000-4000-8000-000000000001']}];
  else if(path.endsWith('/search_hashtags'))data=[{tag:'gaming',search_count:12+searches,post_count:3}];
  else if(path.endsWith('/record_hashtag_search')){searches++;data=12+searches;}
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.setViewportSize({width:390,height:844});
 await openApp(page,'/new-post');
 await expect(page.getByRole('heading',{name:'Create Clipt'})).toBeVisible();
 await page.getByRole('button',{name:'Life / No Game',exact:true}).click();
 await expect(page.getByLabel('Game / category')).toHaveCount(0);
 await expect(page.getByPlaceholder('Share a moment from your life…')).toBeVisible();
 await page.getByRole('button',{name:'Gaming',exact:true}).click();
 await expect(page.getByLabel('Game / category')).toBeVisible();
 await expect(page.getByText(/One MP4|One JPEG|Required before posting/)).toHaveCount(0);
 await page.screenshot({path:info.outputPath('create-phone.png')});
 await openApp(page,'/retro-search');
 await page.getByRole('searchbox',{name:'Search Clipt'}).fill('#gam');
 await page.getByRole('tab',{name:'Tags',exact:true}).click();
 await expect(page.getByRole('link',{name:'#gaming · 12 searches'})).toBeVisible();
 await page.getByRole('link',{name:'#gaming · 12 searches'}).click();
 await expect.poll(()=>searches).toBe(1);
 await openApp(page,'/discovery?tab=posts');
 await expect(page.getByRole('heading',{name:'Clipt Channels',exact:true})).toBeVisible();
 await expect(page.getByRole('tab',{name:'Posts',exact:true})).toHaveCount(0);
 await openApp(page,'/clipts');
 await expect(page.locator('.clipt-fyp')).toBeVisible();
 for(const size of [{width:844,height:390},{width:1366,height:768}]){
  await page.setViewportSize(size);
  await expect(page.locator('.clipt-fyp')).toBeVisible();
  const buttons=page.locator('.clipt-controller-actions > .clipt-controller-action');
  await expect(buttons).toHaveCount(4);
  await expect.poll(async()=>{const boxes=await buttons.evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().x));return Math.max(...boxes)-Math.min(...boxes);}).toBeLessThan(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
  await page.screenshot({path:info.outputPath('feed-'+size.width+'.png')});
 }
});
