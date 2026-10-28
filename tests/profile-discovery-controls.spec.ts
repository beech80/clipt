import {test,expect, type Page} from '@playwright/test';

const owner='00000000-0000-4000-8000-000000000077';
const creator='00000000-0000-4000-8000-000000000079';
const gameId='00000000-0000-4000-8000-000000000080';
const records=Array.from({length:51},(_,i)=>({id:`00000000-0000-4000-8000-${String(i+100).padStart(12,'0')}`,user_id:creator,content:`Recorded clip ${i+1} #Gaming`,username:'RecordedCreator',created_at:'2026-10-27T00:00:00Z',image_url:null,video_url:'/tests/fixtures/clip-test-h264.mp4',post_type:'clipt',is_published:true,profiles:{username:'RecordedCreator',avatar_url:null},games:{id:gameId,name:'Recorded Game'},likes:[{count:0}],comments:[{count:0}]}));
async function fixture(page:Page,hand='right') {
  const user={id:owner,aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-09-19T00:00:00Z',factors:[]};
  await page.addInitScript(({user,hand})=>{
    const expires=Math.floor(Date.now()/1000)+3600;
    const encode=(value:object)=>btoa(JSON.stringify(value)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:`${encode({alg:'HS256'})}.${encode({sub:user.id,exp:expires,aal:'aal1',role:'authenticated'})}.fixture`,refresh_token:'fixture',expires_at:expires,expires_in:3600,token_type:'bearer',user}));
    localStorage.setItem('clipt-mobile-controls-v1',JSON.stringify({hand,trail:false}));
    localStorage.setItem('clipt-controller-preferences-v1',JSON.stringify({layout:'auto',autoHide:false}));
  },{user,hand});
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin==='http://127.0.0.1:8081')return route.continue();
    if(url.origin!=='http://127.0.0.1:54321')return route.abort();
    let data:unknown=[];
    if(url.pathname==='/auth/v1/user')data=user;
    if(url.pathname==='/rest/v1/profiles')data={id:creator,username:'RecordedCreator',display_name:'Recorded Creator',bio:'A recorded profile',website:'https://cliptgaming.com/'};
    if(url.pathname==='/rest/v1/games')data={id:gameId,name:'Recorded Game',cover_url:null};
    if(url.pathname==='/rest/v1/posts') {
      data=url.searchParams.has('user_id')?records.slice(0,1):records.slice(0,1);
    }
    if(url.pathname==='/rest/v1/public_clipt_discovery') {
      const offset=Number(url.searchParams.get('offset')||0);
      const limit=Number(url.searchParams.get('limit')||25);
      data=records.slice(offset,offset+limit);
    }
    await route.fulfill({status:200,contentType:'application/json',headers:{'content-range':'0-0/1'},body:JSON.stringify(data)});
  });
}
for(const hand of ['right','left']) {
  test(`feed CLIPT stays low in portrait and replaces landscape camera (${hand} hand)`,async({page},info)=>{
    await fixture(page,hand);await page.setViewportSize({width:390,height:844});await page.goto('/clipts');
    const home=page.getByRole('button',{name:'CLIPT — Open navigation',exact:true});
    await expect(home).toBeVisible();
    await expect(page.locator('.clipt-controller')).toHaveAttribute('data-portrait-viewing','true');
    await expect.poll(async()=>Math.round((await home.boundingBox())!.y)).toBeGreaterThan(740);
    await page.screenshot({path:info.outputPath(`portrait-${hand}.png`)});
    for(const size of [{width:844,height:390},{width:740,height:320}]) {
      await page.setViewportSize(size);
      await expect(page.locator('.clipt-controller')).toHaveAttribute('data-portrait-viewing','false');
      await expect(home).toBeVisible();
      await expect(page.getByRole('button',{name:'POST',exact:true})).toHaveCount(0);
      const rect=(await home.boundingBox())!;
      expect(rect.y+rect.height).toBeLessThanOrEqual(size.height);
      expect(rect.y).toBeGreaterThan(size.height-100);
      if(hand==='right')expect(rect.x).toBeGreaterThan(size.width-100);else expect(rect.x).toBeLessThan(100);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
    await page.screenshot({path:info.outputPath(`landscape-${hand}.png`)});
    await home.click();
    await expect(page.getByRole('dialog',{name:'CLIPT navigation'})).toBeVisible();
    await expect(page.getByRole('link',{name:'Post / Create',exact:true})).toBeVisible();
  });
}
test('profile website, Playing game link and hashtag results remain reachable with pagination',async({page},info)=>{
  await fixture(page);await page.goto('/user/'+creator);
  await expect(page.getByRole('link',{name:'cliptgaming.com',exact:true})).toHaveAttribute('href','https://cliptgaming.com/');
  await page.getByRole('button',{name:'Clipts',exact:true}).click();
  await page.getByRole('link',{name:'Playing Recorded Game',exact:true}).click();
  await expect(page).toHaveURL(new RegExp('/game/'+gameId+'$'));
  const open=page.getByRole('link',{name:'Open Clipt',exact:true});
  await expect(open).toHaveCount(24);
  await page.getByRole('button',{name:'Load more Clipts',exact:true}).click();await expect(open).toHaveCount(48);
  await page.getByRole('button',{name:'Load more Clipts',exact:true}).click();await expect(open).toHaveCount(51);
  await expect(page.getByRole('button',{name:'Load more Clipts',exact:true})).toHaveCount(0);
  await page.getByRole('link',{name:'#Gaming',exact:true}).first().click();
  await expect(page).toHaveURL(/\/hashtag\/gaming$/);await expect(page.getByRole('heading',{name:'#gaming',exact:true})).toBeVisible();
  await expect(open).toHaveCount(24);await page.screenshot({path:info.outputPath('hashtag-results.png')});
});
