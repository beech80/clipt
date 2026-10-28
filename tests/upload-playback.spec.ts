import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

// All traffic is confined to the local fixture; no real account/session is used.
const owner='00000000-0000-4000-8000-000000000077';
const postId='00000000-0000-4000-8000-000000000078';
const fixturePath=fileURLToPath(new URL('./fixtures/clip-test-h264.mp4',import.meta.url));
const bytes=readFileSync(fixturePath);
async function setup(page:Page,{denied=false,holdRendition=false}={}) {
  const user={id:owner,aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-09-19T00:00:00Z',factors:[]};
  const profile={id:owner,username:'upload_tester',display_name:'Upload Tester',avatar_url:null,bio:'Recorded test profile'};
  await page.addInitScript(({user})=>{
    const expires=Math.floor(Date.now()/1000)+3600;
    const encode=(value:object)=>btoa(JSON.stringify(value)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:`${encode({alg:'HS256'})}.${encode({sub:user.id,exp:expires,aal:'aal1',role:'authenticated'})}.fixture`,refresh_token:'fixture',expires_at:expires,expires_in:3600,token_type:'bearer',user}));
    localStorage.setItem('clipt-controller-preferences-v1',JSON.stringify({layout:'auto',autoHide:false}));
  },{user});
  let post:any=null,uploadedPath='',uploads=0,signs=0,reads=0,publicReads=0;
  let renditionRequested=false,rewardRequested=false,newestFirst=false,hashtagRequested=false;
  let releaseRendition!:()=>void,releaseReward!:()=>void;
  const renditionGate=new Promise<void>(resolve=>{releaseRendition=resolve;});
  const rewardGate=new Promise<void>(resolve=>{releaseReward=resolve;});
  if(!holdRendition)releaseRendition();
  await page.route('**/*',async route=>{
    const request=route.request();const url=new URL(request.url());
    if(url.origin==='http://127.0.0.1:8081')return route.continue();
    if(url.origin!=='http://127.0.0.1:54321')return route.abort();
    let status=200,data:unknown=[];
    const path=url.pathname;
    if(path==='/auth/v1/user')data=user;
    if(path==='/rest/v1/profiles'||path==='/rest/v1/rpc/get_own_profile')data=profile;
    if(path.startsWith('/storage/v1/object/media/')&&request.method()==='POST') {
      uploads++;uploadedPath=path.slice('/storage/v1/object/'.length);
      expect(uploadedPath).toMatch(new RegExp('^media/'+owner+'/.+\\.mp4$'));
      expect(request.postDataBuffer()?.includes(bytes)).toBe(true);
      data={Key:uploadedPath};
    }
    if(path.startsWith('/storage/v1/object/public/')) {publicReads++;return route.fulfill({status:403,body:'Private bucket'});}
    if(path.startsWith('/storage/v1/object/sign/')) {
      const object=path.slice('/storage/v1/object/sign/'.length);
      expect(object).toBe(uploadedPath);
      if(request.method()==='POST') {
        signs++;
        if(denied){status=403;data={message:'Access denied',statusCode:'403',error:'Unauthorized'};}
        else data={signedURL:'/object/sign/'+object+'?token=fixture'};
      } else {
        reads++;
        return route.fulfill({status:200,contentType:'video/mp4',headers:{'accept-ranges':'bytes'},body:bytes});
      }
    }
    if(path==='/rest/v1/posts') {
      if(request.method()==='POST') {
        const input=request.postDataJSON();
        expect(input.user_id).toBe(owner);expect(input.is_published).toBe(true);
        expect(input.video_url).toBe('http://127.0.0.1:54321/storage/v1/object/public/'+uploadedPath);
        post={...input,id:postId,created_at:'2026-10-28T00:00:00Z',profiles:profile,games:null,likes:[{count:0}],comments:[{count:0}]};
        status=201;data={id:postId};
      } else if(url.searchParams.has('id'))data=post;
      else {
        if(!url.searchParams.has('user_id')) {
          expect(url.searchParams.get('order')).toBe('created_at.desc,id.desc');newestFirst=true;
        }
        data=post?[post]:[];
      }
    }
    if(path==='/rest/v1/post_video_renditions') {
      renditionRequested=true;await renditionGate;
      data=holdRendition?{playback_url:'http://127.0.0.1:54321/storage/v1/object/public/media/'+owner+'/later-rendition.mp4'}:null;
    }
    if(path==='/functions/v1/verify-clip-reward') {
      rewardRequested=true;await rewardGate;data={status:'not_eligible'};
    }
    if(path==='/rest/v1/public_clipt_discovery') {
      hashtagRequested=true;expect(url.searchParams.get('content')).toContain('imatch.');
      expect(url.searchParams.get('content')).toContain('#gaming');
      data=post?[{id:post.id,user_id:owner,username:profile.username,content:post.content,created_at:post.created_at}]:[];
    }
    if(path==='/rest/v1/follows'&&request.method()==='GET'&&!url.searchParams.has('order'))data=null;
    await route.fulfill({status,contentType:'application/json',headers:{'content-range':'0-0/0'},body:JSON.stringify(data)});
  });
  return {
    stats:()=>({uploads,signs,reads,publicReads,renditionRequested,rewardRequested,newestFirst,hashtagRequested}),
    allowSigning:()=>{denied=false;},releaseRendition,releaseReward,
  };
}
async function publish(page:Page) {
  await page.goto('/new-post');
  await page.getByLabel('Caption',{exact:true}).fill('Upload playback verification');
  await page.getByLabel('Hashtags',{exact:true}).fill('#Gaming');
  await page.getByLabel('Clipt video').setInputFiles(fixturePath);
  await expect(page.getByRole('button',{name:'Post Clipt',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Post Clipt',exact:true}).click();
  await expect(page).toHaveURL(/\/clipts$/);
  await expect(page.getByText('Your post is ready below.',{exact:true})).toBeVisible();
}
test('upload to private playback, creator profile and hashtag results works while optional services wait',async({page})=>{
  const service=await setup(page,{holdRendition:true});
  try {
    await page.setViewportSize({width:390,height:844});await publish(page);
    const video=page.locator('[data-active-clip="true"] video');
    await expect(video).toBeVisible();
    await video.evaluate(async element=>{element.loop=true;element.muted=true;element.dataset.continuity='original';await element.play();});
    await expect.poll(()=>video.evaluate(element=>element.currentTime)).toBeGreaterThan(0);
    const originalSrc=await video.getAttribute('src');
    expect(service.stats().uploads).toBe(1);expect(service.stats().reads).toBeGreaterThan(0);
    expect(service.stats().publicReads).toBe(0);expect(service.stats().renditionRequested).toBe(true);
    expect(service.stats().rewardRequested).toBe(true);expect(service.stats().newestFirst).toBe(true);
    service.releaseRendition();
    await expect(page.getByText('Loading video...',{exact:true})).toHaveCount(0);
    await expect(video).toHaveAttribute('data-continuity','original');await expect(video).toHaveAttribute('src',originalSrc!);
    await expect.poll(()=>video.evaluate(element=>element.paused)).toBe(false);
    await page.getByRole('button',{name:'Comment — Open engagement',exact:true}).click();
    const creator=page.getByRole('link',{name:'@upload_tester',exact:true});
    await expect(creator).toHaveAttribute('href','/user/'+owner);await creator.click();
    await expect(page).toHaveURL(new RegExp('/user/'+owner+'$'));
    await expect(page.getByText('Upload Tester',{exact:true}).first()).toBeVisible();
    await page.goto('/post/'+postId);
    await page.evaluate(()=>{(window as any).__profileNavigationProbe='kept';});
    await page.getByRole('button',{name:'upload_tester',exact:true}).first().click();
    await expect(page).toHaveURL(new RegExp('/user/'+owner+'$'));
    expect(await page.evaluate(()=>(window as any).__profileNavigationProbe)).toBe('kept');
    await page.goto('/post/'+postId);await page.getByRole('link',{name:'#gaming',exact:true}).first().click();
    await expect(page).toHaveURL(/\/hashtag\/gaming$/);
    await expect(page.getByRole('link',{name:'Open Clipt',exact:true})).toHaveCount(1);
    expect(service.stats().hashtagRequested).toBe(true);
  } finally {service.releaseRendition();service.releaseReward();}
});
test('denied private playback never falls back to public URLs and a successful access retry plays',async({page})=>{
  const service=await setup(page,{denied:true});
  try {
    await publish(page);
    await expect(page.getByText('Media access is unavailable.',{exact:true})).toBeVisible();
    expect(service.stats().publicReads).toBe(0);expect(service.stats().reads).toBe(0);
    service.allowSigning();await page.getByRole('button',{name:'Try Again',exact:true}).click();
    const video=page.locator('[data-active-clip="true"] video');await expect(video).toBeVisible();
    await video.evaluate(async element=>{element.muted=true;await element.play();});
    await expect.poll(()=>video.evaluate(element=>element.currentTime)).toBeGreaterThan(0);
    expect(service.stats().signs).toBe(2);expect(service.stats().publicReads).toBe(0);
  } finally {service.releaseRendition();service.releaseReward();}
});
