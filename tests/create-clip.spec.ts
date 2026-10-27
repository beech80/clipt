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
    await expect(page.getByRole('alert')).toContainText(failure===403?'rejected':'uncertain');
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
      await page.getByRole('button',{name:'CLIPT — Open navigation',exact:true}).click();
      await page.getByRole('link',{name:'Post / Create',exact:true}).click();
      await expect(page.getByRole('alert')).toContainText('duplicate posting is blocked');
      await expect(publish).toBeDisabled();
    }
  });
}
