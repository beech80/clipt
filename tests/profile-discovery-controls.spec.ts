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
      data=url.searchParams.has('user_id')?records.slice(0,1):records.slice(0,2);
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
  test(`portrait swipe-menu and landscape rail remain usable (${hand} hand)`,async({page},info)=>{
    await fixture(page,hand);await page.setViewportSize({width:390,height:844});await page.goto('/clipts');
    const home=page.getByRole('button',{name:'CLIPT — Open navigation',exact:true});
    await expect(home).toBeVisible();
    await expect(home).toHaveClass(/clipt-bottom-swipe-zone/);
    await expect(page.locator('.clipt-controller-home')).toHaveCount(0);
    const video=page.locator('[data-active-clip="true"] video');
    await expect(video).toBeVisible();
    await video.evaluate(async element=>{element.muted=true;await element.play();});
    await expect.poll(()=>video.evaluate(element=>element.currentTime)).toBeGreaterThan(0);
    await video.evaluate(element=>element.pause());
    await expect(page.getByText('Loading video...',{exact:true})).toHaveCount(0);
    await expect(page.getByText('Loading page…',{exact:true})).toHaveCount(0);
    await expect(page.locator('.clipt-controller')).toHaveAttribute('data-portrait-viewing','true');
    await expect.poll(async()=>Math.round((await home.boundingBox())!.y)).toBeGreaterThan(740);
    await page.screenshot({path:info.outputPath(`portrait-${hand}.png`)});
    await home.click();
    await expect(page.getByRole('dialog',{name:'CLIPT navigation'})).toBeVisible();
    await page.getByRole('button',{name:'Close',exact:true}).click();
    await expect(home).toBeFocused();
    const cdp=await page.context().newCDPSession(page);
    const pad=(await home.boundingBox())!;
    const x=pad.x+pad.width/2, y=pad.y+pad.height-12;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-64}]});
    await expect(page.locator('[data-slide-index="1"] [data-active-clip="true"]')).toBeVisible();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await expect(page.getByRole('dialog',{name:'CLIPT navigation'})).toHaveCount(0);
    await cdp.detach();
    const currentVideo=page.locator('[data-active-clip="true"] video');
    await currentVideo.evaluate(async element=>{element.muted=true;await element.play();element.dataset.viewportProbe='kept';});
    await expect.poll(()=>currentVideo.evaluate(element=>element.currentTime)).toBeGreaterThan(0);
    await currentVideo.evaluate(element=>element.pause());
    for(const size of [{width:844,height:390},{width:740,height:320}]) {
      await page.setViewportSize(size);
      await expect(page.locator('.clipt-controller')).toHaveAttribute('data-portrait-viewing','false');
      await expect(home).toBeVisible();
      await expect.poll(()=>page.locator('[data-active-clip="true"]').evaluate(element=>{
        const slide=element.closest('[data-slide-index]')!.getBoundingClientRect();
        const track=element.closest('.clipt-fyp-track')!.getBoundingClientRect();
        return Math.abs((slide.left+slide.width/2)-(track.left+track.width/2));
      })).toBeLessThan(2);
      await expect(page.locator('[data-active-clip="true"]')).toHaveAttribute('data-post-id',records[1].id);
      await expect(currentVideo).toHaveAttribute('data-viewport-probe','kept');
      await expect(page.getByRole('button',{name:'POST',exact:true})).toHaveCount(0);
      const rect=(await home.boundingBox())!;
      expect(rect.y+rect.height).toBeLessThanOrEqual(size.height);
      expect(rect.y).toBeGreaterThan(size.height-100);
      if(hand==='right')expect(rect.x).toBeGreaterThan(size.width-100);else expect(rect.x).toBeLessThan(100);
      const feedSwitch=page.getByRole('switch',{name:'Squad feed',exact:true});
      if(await feedSwitch.isVisible()) {
        const toggle=(await feedSwitch.boundingBox())!;
        expect(toggle.y+toggle.height+4).toBeLessThanOrEqual(rect.y);
        await expect(feedSwitch).toContainText('FYP');
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      expect(await page.evaluate(()=>['html','body','#root','.app-container','.page-content'].every(selector=>{const style=getComputedStyle(document.querySelector(selector)!);return style.backgroundColor==='rgb(0, 0, 0)'&&style.backgroundImage==='none';}))).toBe(true);
      expect(await page.locator('.app-container').evaluate(element=>getComputedStyle(element,'::before').display)).toBe('none');
    }
    // Expose the outer canvas as on Safari devices with bottom and side safe areas.
    await page.addStyleTag({content:'.clipt-fyp { inset: 8px 24px 20px !important; }'});
    await page.screenshot({path:info.outputPath(`landscape-${hand}.png`)});
    await home.click();
    await expect(page.getByRole('dialog',{name:'CLIPT navigation'})).toBeVisible();
    await expect(page.getByRole('link',{name:'Post / Create',exact:true})).toBeVisible();
    await page.goto('/discovery');
    await expect(page.getByRole('heading',{name:'Discovery',exact:true})).toBeVisible();
    expect(await page.locator('.app-container').evaluate(element=>getComputedStyle(element).backgroundImage)).not.toBe('none');
  });
}
test('portrait menu remains reachable on an empty feed and narrow accessibility viewport',async({page})=>{
  await fixture(page);
  await page.route('**/rest/v1/posts?**',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await page.setViewportSize({width:195,height:422});await page.goto('/clipts');
  await expect(page.getByText('No clips yet. Be the first to share one.',{exact:true})).toBeVisible();
  const menu=page.getByRole('button',{name:'CLIPT — Open navigation',exact:true});
  await expect(menu).toBeVisible();
  const rect=(await menu.boundingBox())!;
  expect(rect.width).toBeGreaterThanOrEqual(44);expect(rect.height).toBeGreaterThanOrEqual(44);
  expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(195);
  expect(rect.y+rect.height).toBeLessThanOrEqual(422);
  await menu.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:'CLIPT navigation'})).toBeVisible();
  await page.getByRole('button',{name:'Close',exact:true}).click();await expect(menu).toBeFocused();
});
test('profile website, Playing game link and hashtag results remain reachable with pagination',async({page},info)=>{
  await fixture(page);await page.goto('/user/'+creator);
  await expect(page.getByRole('link',{name:'cliptgaming.com',exact:true})).toHaveAttribute('href','https://cliptgaming.com/');
  await page.screenshot({path:info.outputPath('profile-shared-chrome.png')});
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

test('Safari PNG encoder fallback uploads the actual format and confirms the profile update',async({page})=>{
  await fixture(page);
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob=function(callback,_mime,quality){original.call(this,callback,'image/png',quality);};
  });
  await page.route('**/rest/v1/rpc/get_own_profile',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:owner,username:'fixture_owner',display_name:'Fixture Owner',website:'https://cliptgaming.com/',bio:'Recorded profile'})}));
  let uploaded=false,updated=false;
  await page.route('**/storage/v1/object/avatars/**',async route=>{
    expect(route.request().method()).toBe('POST');
    expect(new URL(route.request().url()).pathname).toMatch(new RegExp('/avatars/'+owner+'/.+\\.png$'));
    expect(route.request().postDataBuffer()?.toString('latin1')).toContain('Content-Type: image/png');
    uploaded=true;
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({Key:'fixture.png'})});
  });
  await page.route('**/rest/v1/profiles?**',async route=>{
    if(route.request().method()!=='PATCH')return route.fallback();
    expect(uploaded).toBe(true);
    expect(route.request().postDataJSON().avatar_url).toMatch(new RegExp('/avatars/'+owner+'/.+\\.png$'));
    updated=true;
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:owner})});
  });
  await page.goto('/edit-profile');
  await expect(page.getByRole('button',{name:'Upload New Picture',exact:true})).toBeVisible();
  const png=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=2;canvas.height=2;canvas.getContext('2d')!.fillRect(0,0,2,2);return canvas.toDataURL('image/png').split(',')[1];});
  await page.locator('input[type="file"]').setInputFiles({name:'phone.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await expect(page.getByText('Profile picture updated successfully!',{exact:true})).toBeVisible();
  expect(uploaded).toBe(true);expect(updated).toBe(true);
});

test('hashtag collections preserve pagination, profile routes and narrow readable cards',async({page},info)=>{
  await fixture(page);await page.setViewportSize({width:390,height:844});await page.goto('/hashtag/Gaming');
  await expect(page.getByRole('heading',{name:'#gaming',exact:true})).toBeVisible();
  await expect(page.getByText('Newest first',{exact:true})).toBeVisible();
  const collection=page.getByRole('region',{name:'Hashtag Clipts',exact:true});
  const open=collection.getByRole('link',{name:'Open Clipt',exact:true});
  await expect(open).toHaveCount(24);
  await expect(collection.getByRole('link',{name:'@RecordedCreator',exact:true}).first()).toHaveAttribute('href','/user/'+creator);
  await expect(collection.getByRole('link',{name:'Watch Clipt by @RecordedCreator',exact:true}).first()).toHaveAttribute('href','/post/'+records[0].id);
  await page.getByRole('button',{name:'Load more Clipts',exact:true}).click();await expect(open).toHaveCount(48);
  await page.getByRole('button',{name:'Load more Clipts',exact:true}).click();await expect(open).toHaveCount(51);
  await expect(page.getByText('51 Clipts loaded',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Load more Clipts',exact:true})).toHaveCount(0);
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:info.outputPath('hashtag-portrait-collection.png')});
  await page.setViewportSize({width:195,height:422});await page.goto('/hashtag/'+ 'a'.repeat(40));
  await expect(page.getByRole('heading',{name:'#'+'a'.repeat(40),exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('hashtag-constrained.png')});
  await page.setViewportSize({width:390,height:844});await page.goto('/hashtag/gaming');
  await collection.getByRole('link',{name:'@RecordedCreator',exact:true}).first().click();
  await expect(page).toHaveURL(new RegExp('/user/'+creator+'$'));
});
test('hashtag collections recover from errors and explain empty and invalid tags',async({page})=>{
  await fixture(page);
  let failed=true,empty=false,requests=0;
  await page.route('**/rest/v1/public_clipt_discovery?**',async route=>{
    requests++;expect(new URL(route.request().url()).searchParams.get('order')).toBe('created_at.desc,id.desc');
    await route.fulfill({status:failed?503:200,contentType:'application/json',body:JSON.stringify(failed?{message:'Recorded temporary failure'}:empty?[]:records.slice(0,1))});
  });
  await page.goto('/hashtag/gaming');await expect(page.getByText('Could not load this hashtag.',{exact:true})).toBeVisible();
  failed=false;await page.getByRole('button',{name:'Retry hashtag',exact:true}).click();
  await expect(page.getByRole('link',{name:'Open Clipt',exact:true})).toHaveCount(1);
  empty=true;await page.goto('/hashtag/empty');
  await expect(page.getByRole('heading',{name:'No published Clipts with this hashtag yet.',exact:true})).toBeVisible();
  const before=requests;await page.goto('/hashtag/invalid-tag');
  await expect(page.getByRole('heading',{name:'Hashtag unavailable',exact:true})).toBeVisible();
  await expect(page.getByText('Choose a hashtag of 1–40 letters, numbers or underscores.',{exact:true})).toBeVisible();
  expect(requests).toBe(before);
});

test('post Like, Follow, Trophy and comment actions use the current post and preserve failed drafts',async({page})=>{
  await fixture(page);await page.setViewportSize({width:1024,height:900});
  const post=records[0];let liked=false,following=false,voted=false,commentFailure=true;
  const comments:any[]=[],writes:string[]=[];
  await page.route('**/rest/v1/**',async route=>{
    const request=route.request(),url=new URL(request.url()),table=url.pathname.split('/').pop();
    if(table==='posts'&&url.searchParams.has('id'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(post)});
    if(!['likes','follows','clip_votes','comments'].includes(table!))return route.fallback();
    const method=request.method(),isWrite=['POST','DELETE'].includes(method);
    if(isWrite) {
      if(method==='POST') {const input=request.postDataJSON();if(table==='follows'){expect(input.follower_id).toBe(owner);expect(input.following_id).toBe(creator);}else{expect(input.user_id).toBe(owner);expect(input.post_id).toBe(post.id);}}
      else {expect(url.searchParams.get(table==='follows'?'follower_id':'user_id')).toBe('eq.'+owner);expect(url.searchParams.get(table==='follows'?'following_id':'post_id')).toBe('eq.'+(table==='follows'?creator:post.id));}
      writes.push(table+':'+method);
      if(table==='likes')liked=method==='POST';if(table==='follows')following=method==='POST';if(table==='clip_votes')voted=method==='POST';
      if(table==='comments') {
        if(commentFailure)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Recorded temporary comment failure'})});
        comments.push({...request.postDataJSON(),id:'00000000-0000-4000-8000-000000000099',created_at:'2026-10-28T00:00:00Z',likes_count:0,profiles:{username:'Fixture Owner',avatar_url:null}});
      }
    }
    const rows=table==='comments'?comments:(table==='likes'?liked:table==='follows'?following:voted)?[{id:'recorded',post_id:post.id,user_id:owner}]:[];
    const single=(request.headers()['accept']||'').includes('vnd.pgrst.object');
    const count=rows.length;await route.fulfill({status:200,contentType:'application/json',headers:{'content-range':count?'0-0/'+count:'*/0'},body:method==='HEAD'?'':JSON.stringify(single?rows[0]??null:rows)});
  });
  await page.goto('/post/'+post.id);
  const card=page.locator('article[data-post-id="'+post.id+'"]');
  await card.getByRole('button',{name:'Like post',exact:true}).evaluate(element=>element.scrollIntoView({block:'center'}));
  await card.getByRole('button',{name:'Like post',exact:true}).click();await expect(card.getByRole('button',{name:'Unlike post',exact:true})).toBeVisible();
  await card.getByRole('button',{name:'Unlike post',exact:true}).click();await expect(card.getByRole('button',{name:'Like post',exact:true})).toBeEnabled();
  await card.getByRole('button',{name:'Follow',exact:true}).click();await expect(card.getByRole('button',{name:'Following',exact:true})).toBeVisible();
  await card.getByRole('button',{name:'Following',exact:true}).click();await expect(card.getByRole('button',{name:'Follow',exact:true})).toBeVisible();
  await card.getByRole('button',{name:'Award trophy',exact:true}).click();await expect(page.getByText('Trophy awarded!',{exact:true})).toBeVisible();
  await expect(card.getByRole('button',{name:'Award trophy',exact:true})).toBeEnabled();await card.getByRole('button',{name:'Award trophy',exact:true}).click();await expect(page.getByText('Trophy removed',{exact:true})).toBeVisible();
  await card.getByRole('button',{name:'Comment on post',exact:true}).click();
  const draft=page.getByRole('textbox',{name:'Add a comment...',exact:true});await draft.fill('Recorded useful feedback');
  await page.getByRole('button',{name:'Post',exact:true}).click();await expect(page.getByText('Comment was not posted. Your draft has been kept; please try again.',{exact:true}).first()).toBeVisible();await expect(draft).toHaveValue('Recorded useful feedback');
  commentFailure=false;await page.getByRole('button',{name:'Post',exact:true}).click();await expect(draft).toHaveValue('');await expect(page.getByText('Recorded useful feedback',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Back to controls',exact:true}).click();
  expect(writes).toEqual(['likes:POST','likes:DELETE','follows:POST','follows:DELETE','clip_votes:POST','clip_votes:DELETE','comments:POST','comments:POST']);
});
