import {test,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';

const userId='00000000-0000-4000-8000-000000000077';
const postId='00000000-0000-4000-8000-000000000078';
for (const failure of [403,503]) {
  test(`Create Clipt handles ${failure} without false success or unsafe cleanup`,async ({page}) => {
    const user={id:userId,aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-09-19T00:00:00Z',factors:[]};
    await page.addInitScript(({user}) => {
      const expires=Math.floor(Date.now()/1000)+3600;
      const encode=(value:object)=>btoa(JSON.stringify(value)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
      localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:`${encode({alg:'HS256'})}.${encode({sub:user.id,exp:expires,aal:'aal1',role:'authenticated'})}.fixture`,refresh_token:'fixture',expires_at:expires,expires_in:3600,token_type:'bearer',user}));
    },{user});
    let postAttempts=0,uploadAttempts=0,cleanups=0;
    await page.route('**/*',async route => {
      const url=new URL(route.request().url());
      if(url.origin==='http://127.0.0.1:8081') return route.continue();
      if(url.origin!=='http://127.0.0.1:54321') return route.abort();
      let status=200; let data:unknown=[];
      if(url.pathname==='/auth/v1/user') data=user;
      if(url.pathname.startsWith('/storage/v1/object/media')) {
        if(route.request().method()==='DELETE') {cleanups++;data=[];}
        else {uploadAttempts++;data={Key:url.pathname.split('/object/')[1]};}
      }
      if(url.pathname==='/rest/v1/posts' && route.request().method()==='POST') {
        postAttempts++;
        const body=route.request().postDataJSON();
        expect(body.user_id).toBe(userId); expect(body.post_type).toBe('clipt');
        expect(body.is_published).toBe(true); expect(body.content).toContain('#gaming');
        status=postAttempts===1 ? failure : 201;
        data=status===201 ? {id:postId} : {code:failure===403?'42501':'PGRST000',message:'Controlled failure'};
      }
      if(url.pathname==='/rest/v1/posts' && route.request().method()==='GET') {
        const post={id:postId,user_id:userId,content:'Fixture Clipt',image_url:null,video_url:null,is_published:true,post_type:'clipt',profiles:{username:'fixture'}};
        data=url.searchParams.has('id')?post:[post];
      }
      return route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
    });
    await page.goto('/new-post');
    await expect(page.getByRole('heading',{name:'Create Clipt'})).toBeVisible();
    await expect(page.getByText('Home Feed',{exact:true})).toHaveCount(0);
    await page.getByLabel('Caption',{exact:true}).fill('My gaming moment');
    await page.getByLabel('Hashtags',{exact:true}).fill('#Gaming');
    await page.getByLabel('Clipt video').setInputFiles(fileURLToPath(new URL('./fixtures/clip-test-h264.mp4',import.meta.url)));
    const publish=page.getByRole('button',{name:'Post Clipt',exact:true});
    await expect(publish).toBeEnabled();
    await publish.click();
    const publishingAlert=page.getByRole('alert').filter({hasText:failure===403?'rejected':'Publishing status is uncertain.'});
    await expect(publishingAlert).toHaveCount(1);
    await expect(publishingAlert).toContainText(failure===403?'rejected':'uncertain');
    await expect(page).toHaveURL(/\/clipts$/);
    expect(postAttempts).toBe(1); expect(uploadAttempts).toBe(1);
    expect(cleanups).toBe(failure===403?1:0);
    if(failure===403) {
      await page.getByRole('link',{name:'Open posting',exact:true}).click();
      await page.getByLabel('Caption',{exact:true}).fill('My gaming moment');
      await page.getByLabel('Hashtags',{exact:true}).fill('#Gaming');
      await page.getByLabel('Clipt video').setInputFiles(fileURLToPath(new URL('./fixtures/clip-test-h264.mp4',import.meta.url)));
      await expect(publish).toBeEnabled();await publish.click();
      await expect(page).toHaveURL(/\/clipts$/);
      await expect(page.getByText('Your post is ready below.',{exact:true})).toBeVisible();
      expect(postAttempts).toBe(2);expect(cleanups).toBe(1);
    } else {
      await expect(page.getByRole('link',{name:'Open posting',exact:true})).toHaveCount(0);
      await expect(page.getByRole('link',{name:'Check my posts before retrying'})).toBeVisible();
      // Restore the controller through its public recovery action if collapsed.
      const showControls=page.getByRole('button',{name:'Show controls',exact:true});
      if(await showControls.isVisible()) await showControls.click();
      const navigation=page.getByRole('button',{name:'CLIPT — Open navigation',exact:true});
      await expect(navigation).toBeVisible();
      await navigation.click();
      await page.getByRole('link',{name:'Post / Create',exact:true}).click();
      const duplicateWarning=page.getByRole('alert').filter({hasText:'duplicate posting is blocked'});
      await expect(duplicateWarning).toHaveCount(1);
      await expect(duplicateWarning).toContainText('duplicate posting is blocked');
      // The blocked submit keeps its busy label; verify the unique native submit control.
      const blockedPublish=page.locator('form button[type="submit"]');
      await expect(blockedPublish).toHaveCount(1);
      await expect(blockedPublish).toBeDisabled();
      expect(postAttempts).toBe(1);expect(uploadAttempts).toBe(1);expect(cleanups).toBe(0);
    }
  });
}

test('Photos file-size feedback clears a rejected replacement and keeps the caption',async({page})=>{
  const user={id:userId,aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-09-19T00:00:00Z',factors:[]};
  await page.addInitScript(({user})=>{const expires=Math.floor(Date.now()/1000)+3600;const encode=(value:object)=>btoa(JSON.stringify(value)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:encode({alg:'HS256'})+'.'+encode({sub:user.id,exp:expires,aal:'aal1',role:'authenticated'})+'.fixture',refresh_token:'fixture',expires_at:expires,expires_in:3600,token_type:'bearer',user}));},{user});
  let uploads=0,posts=0;
  await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin==='http://127.0.0.1:8081')return route.continue();if(url.origin!=='http://127.0.0.1:54321')return route.abort();if(url.pathname.startsWith('/storage/v1/object/media'))uploads++;if(url.pathname==='/rest/v1/posts'&&route.request().method()==='POST')posts++;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(url.pathname==='/auth/v1/user'?user:[])});});
  await page.goto('/new-post');const picker=page.getByLabel('Clipt video',{exact:true}),submit=page.getByRole('button',{name:'Post Clipt',exact:true});
  await page.getByLabel('Caption',{exact:true}).fill('Keep my selected caption');
  // A valid MP4 with a legal trailing free box exercises the actual 49 MB
  // File/Photos handoff without transferring a customer's video.
  await picker.evaluate(async(input:HTMLInputElement)=>{const original=await (await fetch('/tests/fixtures/clip-test-h264.mp4')).arrayBuffer();const free=new Uint8Array(49*1024*1024-original.byteLength);new DataView(free.buffer).setUint32(0,free.length);free.set([102,114,101,101],4);const transfer=new DataTransfer();transfer.items.add(new File([original,free],'photos-under-limit.mp4',{type:'video/mp4'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));});
  await expect(submit).toBeEnabled();await expect(page.getByRole('status').filter({hasText:'Selected video:'})).toContainText('49 MB');
  await picker.evaluate((input:HTMLInputElement)=>{const transfer=new DataTransfer();transfer.items.add(new File([new Uint8Array(51*1024*1024)],'photos-export.mp4',{type:'video/mp4'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));});
  await expect(page.getByRole('alert')).toContainText('This video is 51 MB. The upload limit is 50 MB.');await expect(submit).toBeDisabled();
  await picker.setInputFiles(fileURLToPath(new URL('./fixtures/clip-test-h264.mp4',import.meta.url)));await expect(submit).toBeEnabled();
  await expect(page.getByRole('status').filter({hasText:'Selected video:'})).toContainText('clip-test-h264.mp4');
  await picker.setInputFiles({name:'cloud-placeholder.mp4',mimeType:'video/mp4',buffer:Buffer.alloc(0)});
  await expect(page.getByRole('alert')).toContainText('This video is empty or could not be read.');await expect(submit).toBeDisabled();await expect(page.locator('.clipt-create-media video')).toHaveCount(0);
  await expect(page.getByLabel('Caption',{exact:true})).toHaveValue('Keep my selected caption');
  await picker.setInputFiles(fileURLToPath(new URL('./fixtures/clip-test-h264.mp4',import.meta.url)));await expect(submit).toBeEnabled();
  expect(uploads).toBe(0);expect(posts).toBe(0);
});
