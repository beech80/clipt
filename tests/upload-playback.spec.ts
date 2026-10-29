import {createServer} from 'node:https';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {inspectH264Mp4} from '../supabase/functions/_shared/mp4-proof';

// All traffic is confined to the local fixture; no real account/session is used.
const owner='00000000-0000-4000-8000-000000000077';
const postId='00000000-0000-4000-8000-000000000078';
const fixturePath=fileURLToPath(new URL('./fixtures/clip-test-h264.mp4',import.meta.url));
const bytes=readFileSync(fixturePath);
async function setup(page:Page,{denied=false,holdRendition=false,gameLabel=false,converted=false}={}) {
  const user={id:owner,aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-09-19T00:00:00Z',factors:[]};
  const profile={id:owner,username:'upload_tester',display_name:'Upload Tester',avatar_url:null,bio:'Recorded test profile'};
  await page.addInitScript(({user})=>{
    const expires=Math.floor(Date.now()/1000)+3600;
    const encode=(value:object)=>btoa(JSON.stringify(value)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:`${encode({alg:'HS256'})}.${encode({sub:user.id,exp:expires,aal:'aal1',role:'authenticated'})}.fixture`,refresh_token:'fixture',expires_at:expires,expires_in:3600,token_type:'bearer',user}));
    localStorage.setItem('clipt-controller-preferences-v1',JSON.stringify({layout:'auto',autoHide:false}));
  },{user});
  let post:any=null,uploadedPath='',uploads=0,signs=0,reads=0,publicReads=0;
  let uploadedBytesMatch=false;
  let playbackBytes=bytes,convertedProof:ReturnType<typeof inspectH264Mp4>|null=null,convertedAudio=false;
  // Receive the real multipart body: browser routing APIs omit file bytes.
  const certificateDir=mkdtempSync(join(tmpdir(),'clipt-media-tls-'));
  const keyPath=join(certificateDir,'key.pem'),certPath=join(certificateDir,'cert.pem');
  execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=localhost','-keyout',keyPath,'-out',certPath],{stdio:'ignore'});
  const receiver=createServer({key:readFileSync(keyPath),cert:readFileSync(certPath)},(request,response)=>{
    response.setHeader('Access-Control-Allow-Origin','*');
    response.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers',request.headers['access-control-request-headers']||'*');
    if(request.method==='OPTIONS'){response.writeHead(204);response.end();return;}
    if(request.method!=='POST'||!request.url?.startsWith('/storage/v1/object/media/')){response.writeHead(404);response.end();return;}
    const chunks:Buffer[]=[];request.on('data',chunk=>chunks.push(Buffer.from(chunk)));
    request.on('end',()=>{
      uploads++;uploadedPath=request.url!.slice('/storage/v1/object/'.length);
      const body=Buffer.concat(chunks);
      if(converted) {
        try {
          const boundary=String(request.headers['content-type']).match(/boundary=(?:"([^"]+)"|([^;]+))/);
          const marker=body.indexOf(Buffer.from('Content-Type: video/mp4'));
          const start=body.indexOf(Buffer.from('\r\n\r\n'),marker)+4;
          const end=body.indexOf(Buffer.from('\r\n--'+(boundary?.[1]||boundary?.[2])),start);
          if(marker<0||start<4||end<=start)throw Error('Invalid multipart video');
          playbackBytes=body.subarray(start,end);convertedProof=inspectH264Mp4(playbackBytes);
          convertedAudio=playbackBytes.includes(Buffer.from('mp4a'));uploadedBytesMatch=true;
        } catch {uploadedBytesMatch=false;}
      } else uploadedBytesMatch=body.includes(bytes);
      response.writeHead(uploadedBytesMatch?200:400,{'Content-Type':'application/json'});
      response.end(JSON.stringify(uploadedBytesMatch?{Key:uploadedPath}:{message:'Invalid fixture upload'}));
    });
  });
  await new Promise<void>((resolve,reject)=>{receiver.once('error',reject);receiver.listen(54322,'127.0.0.1',resolve);});
  let renditionRequested=false,rewardRequested=false,newestFirst=false,hashtagRequested=false;
  let releaseRendition!:()=>void,releaseReward!:()=>void;
  const renditionGate=new Promise<void>(resolve=>{releaseRendition=resolve;});
  const rewardGate=new Promise<void>(resolve=>{releaseReward=resolve;});
  if(!holdRendition)releaseRendition();
  await page.route('**/*',async route=>{
    const request=route.request();const url=new URL(request.url());
    if(url.origin==='http://127.0.0.1:8082')return route.continue();
    if(url.origin!=='https://127.0.0.1:54322')return route.abort();
    let status=200,data:unknown=[];
    const path=url.pathname;
    if(path==='/auth/v1/user')data=user;
    if(path==='/rest/v1/profiles'||path==='/rest/v1/rpc/get_own_profile')data=profile;
    if(path.startsWith('/storage/v1/object/media/'))return route.continue();
    if(path.startsWith('/storage/v1/object/public/')) {publicReads++;return route.fulfill({status:403,body:'Private bucket'});}
    if(path.startsWith('/storage/v1/object/sign/')) {
      const object=path.slice('/storage/v1/object/sign/'.length);
      expect([uploadedPath,'media/'+owner+'/later-rendition.mp4']).toContain(object);
      if(request.method()==='POST') {
        signs++;
        if(denied){status=403;data={message:'Access denied',statusCode:'403',error:'Unauthorized'};}
        else data={signedURL:'/object/sign/'+object+'?token=fixture'};
      } else {
        reads++;
        return route.fulfill({status:200,contentType:'video/mp4',headers:{'accept-ranges':'bytes'},body:playbackBytes});
      }
    }
    if(path==='/rest/v1/posts') {
      if(request.method()==='POST') {
        const input=request.postDataJSON();
        expect(input.user_id).toBe(owner);expect(input.is_published).toBe(true);
        expect(input.video_url).toBe('https://127.0.0.1:54322/storage/v1/object/public/'+uploadedPath);
        post={...input,id:postId,created_at:'2026-10-28T00:00:00Z',profiles:profile,games:gameLabel?{id:'00000000-0000-4000-8000-000000000080',name:'Recorded game with a longer name'}:null,likes:[{count:0}],comments:[{count:0}]};
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
      data=holdRendition?{playback_url:'https://127.0.0.1:54322/storage/v1/object/public/media/'+owner+'/later-rendition.mp4'}:null;
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
    stats:()=>({uploads,uploadedBytesMatch,signs,reads,publicReads,renditionRequested,rewardRequested,newestFirst,hashtagRequested,convertedProof,convertedAudio}),
    allowSigning:()=>{denied=false;},releaseRendition,releaseReward,
    close:async()=>{receiver.closeAllConnections();await new Promise<void>(resolve=>receiver.close(()=>resolve()));rmSync(keyPath,{force:true});rmSync(certPath,{force:true});rmdirSync(certificateDir);},
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
    expect(service.stats().uploads).toBe(1);expect(service.stats().uploadedBytesMatch).toBe(true);expect(service.stats().reads).toBeGreaterThan(0);
    expect(service.stats().publicReads).toBe(0);expect(service.stats().renditionRequested).toBe(true);
    expect(service.stats().rewardRequested).toBe(true);expect(service.stats().newestFirst).toBe(true);
    const renditionResponse=page.waitForResponse(response=>new URL(response.url()).pathname==='/rest/v1/post_video_renditions');
    service.releaseRendition();await (await renditionResponse).finished();
    await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
    await expect(page.getByText('Loading video...',{exact:true})).toHaveCount(0);
    await expect(video).toHaveAttribute('data-continuity','original');await expect(video).toHaveAttribute('src',originalSrc!);
    await expect.poll(()=>video.evaluate(element=>element.paused)).toBe(false);
    expect(service.stats().signs).toBe(1); // The late lookup did not replace the playing source.
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
  } finally {service.releaseRendition();service.releaseReward();await service.close();}
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
  } finally {service.releaseRendition();service.releaseReward();await service.close();}
});

test('the uploaded post plays in a visible frame in portrait, landscape and constrained viewports',async({page},info)=>{
  const service=await setup(page,{gameLabel:true});
  try {
    await page.setViewportSize({width:390,height:844});await publish(page);
    await page.goto('/post/'+postId);
    const video=page.locator('.clipt-watch-media video');
    await expect(video).toBeVisible();
    const oldRule=await page.addStyleTag({content:'.clipt-watch-content{max-width:min(520px,calc((100dvh - 420px) * 16 / 19 + 66px)) !important}.clipt-watch-media .clipt-video-frame{height:auto !important;aspect-ratio:16 / 19 !important}'});
    await page.setViewportSize({width:740,height:320});
    await page.screenshot({path:info.outputPath('post-short-before-sizing-fix.png')});
    await oldRule.evaluate(element=>element.remove());
    for(const size of [{width:390,height:844},{width:844,height:390},{width:740,height:320},{width:320,height:568},{width:195,height:422}]) {
      await page.setViewportSize(size);await page.evaluate(()=>scrollTo(0,0));
      await expect(video).toBeVisible();
      await expect.poll(()=>video.evaluate(element=>Math.round(element.getBoundingClientRect().width))).toBeGreaterThan(140);
      await expect.poll(()=>video.evaluate(element=>Math.round(element.getBoundingClientRect().height))).toBeGreaterThanOrEqual(96);
      await expect.poll(async()=>{const player=(await video.boundingBox())!;const dock=(await page.locator('.clipt-controller').boundingBox())!;return player.y+player.height-dock.y;}).toBeLessThanOrEqual(1);
      const playerRect=(await video.boundingBox())!,creatorRect=(await page.locator('.clipt-post-header').boundingBox())!;
      if(size.height<=600)expect(creatorRect.y).toBeGreaterThanOrEqual(playerRect.y+playerRect.height-1);
      else expect(playerRect.y).toBeGreaterThanOrEqual(creatorRect.y+creatorRect.height-1);
      await video.evaluate(async element=>{element.loop=true;element.muted=true;element.currentTime=0;await element.play();});
      await expect.poll(()=>video.evaluate(element=>element.currentTime)).toBeGreaterThan(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:info.outputPath('post-'+size.width+'x'+size.height+'.png')});
    }
    expect(service.stats().uploadedBytesMatch).toBe(true);expect(service.stats().publicReads).toBe(0);
  } finally {service.releaseRendition();service.releaseReward();await service.close();}
});

for(const format of ['mov','hevc'] as const) {
  test('native conversion '+format+' uploads verified H.264 and plays the resulting post',async({page},info)=>{
    test.skip(format==='hevc'&&process.env.CLIPT_REQUIRE_HEVC!=='1','HEVC decoding is required in the macOS WebKit job.');
    const service=await setup(page,{converted:true});
    try {
      // Reproduce browsers that do not deliver preloading events to React.
      // Publishing must recover from a real, explicit play gesture instead.
      await page.addInitScript(()=>{for(const type of ['loadedmetadata','loadeddata','canplay'])document.addEventListener(type,event=>{if(event.target instanceof HTMLVideoElement&&event.target.closest('.clipt-create-media'))event.stopImmediatePropagation();},true);});
      await page.setViewportSize({width:390,height:844});await page.goto('/new-post');
      const candidate=format==='hevc'?readFileSync(fileURLToPath(new URL('./fixtures/clip-test-hevc.mp4',import.meta.url))):bytes;
      await page.getByLabel('Clipt video',{exact:true}).setInputFiles({name:format==='hevc'?'iphone.mp4':'iphone.mov',mimeType:format==='hevc'?'video/mp4':'video/quicktime',buffer:candidate});
      await expect(page.getByText('Converted to a compatible MP4 on your device. Your original is unchanged.',{exact:true})).toBeVisible({timeout:60000});
      const submit=page.getByRole('button',{name:'Post Clipt',exact:true});await expect(submit).toBeDisabled();
      await expect(page.getByText('Tap Play to check this video before posting.',{exact:true})).toBeVisible();
      await page.getByRole('button',{name:'Play video preview',exact:true}).click();
      await expect(submit).toBeEnabled();
      await submit.click();
      await expect(page.getByRole('alert')).toContainText('Add a caption before posting.');
      await expect(page.getByLabel('Caption',{exact:true})).toBeFocused();
      await expect(page.getByLabel('Caption',{exact:true})).toHaveAttribute('aria-invalid','true');
      expect(service.stats().uploads).toBe(0);
      await page.getByLabel('Caption',{exact:true}).fill('Converted iPhone recording');
      await expect(page.getByLabel('Caption',{exact:true})).toHaveAttribute('aria-invalid','false');
      await page.screenshot({path:info.outputPath('converted-'+format+'-ready.png')});
      await submit.click();await expect(page).toHaveURL(/\/clipts$/);
      await expect(page.getByText('Your post is ready below.',{exact:true})).toBeVisible();
      expect(service.stats().convertedProof?.codec).toMatch(/^avc[13]$/);
      if(format==='hevc')expect(service.stats().convertedAudio).toBe(true);
      expect(service.stats().uploads).toBe(1);expect(service.stats().publicReads).toBe(0);
      await page.goto('/post/'+postId);
      const video=page.locator('.clipt-watch-media video');await expect(video).toBeVisible();
      await video.evaluate(async element=>{element.muted=true;element.loop=true;await element.play();});
      await expect.poll(()=>video.evaluate(element=>element.currentTime)).toBeGreaterThan(0);
      await page.screenshot({path:info.outputPath('converted-'+format+'-playing.png')});
    } finally {service.releaseRendition();service.releaseReward();await service.close();}
  });
}
test('an unsupported HEVC decoder gives a recovery message without uploading',async({page})=>{
  const service=await setup(page,{converted:true});
  try {
    await page.addInitScript(()=>{
      if(typeof VideoDecoder==='undefined')return;
      const check=VideoDecoder.isConfigSupported.bind(VideoDecoder);
      VideoDecoder.isConfigSupported=async config=>/^(hvc1|hev1)/.test(config.codec)?{supported:false,config}:check(config);
    });
    await page.goto('/new-post');await page.getByLabel('Caption',{exact:true}).fill('Keep this caption');
    await page.getByLabel('Clipt video',{exact:true}).setInputFiles(fileURLToPath(new URL('./fixtures/clip-test-hevc.mp4',import.meta.url)));
    await expect(page.getByRole('alert')).toContainText('This browser cannot convert this iPhone video.');
    await expect(page.getByRole('button',{name:'Post Clipt',exact:true})).toBeDisabled();
    await expect(page.getByLabel('Caption',{exact:true})).toHaveValue('Keep this caption');
    expect(service.stats().uploads).toBe(0);
  } finally {service.releaseRendition();service.releaseReward();await service.close();}
});
test('cancelling video conversion keeps the caption and never posts',async({page})=>{
  const service=await setup(page,{converted:true});
  try {
    await page.addInitScript(()=>{
      if(typeof VideoDecoder==='undefined')return;
      const check=VideoDecoder.isConfigSupported.bind(VideoDecoder);
      VideoDecoder.isConfigSupported=async config=>{await new Promise(resolve=>setTimeout(resolve,1500));return check(config);};
    });
    await page.goto('/new-post');await page.getByLabel('Caption',{exact:true}).fill('Keep my cancelled recording caption');
    await page.getByLabel('Clipt video',{exact:true}).setInputFiles({name:'iphone.mov',mimeType:'video/quicktime',buffer:bytes});
    await page.getByRole('button',{name:'Cancel conversion',exact:true}).click();
    await expect(page.getByRole('alert')).toContainText('Conversion cancelled. Your caption has been kept.');
    await expect(page.getByRole('button',{name:'Post Clipt',exact:true})).toBeDisabled();
    await expect(page.getByLabel('Caption',{exact:true})).toHaveValue('Keep my cancelled recording caption');
    expect(service.stats().uploads).toBe(0);
  } finally {service.releaseRendition();service.releaseReward();await service.close();}
});
