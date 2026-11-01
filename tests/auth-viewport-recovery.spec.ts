import {test,expect,type Page} from '@playwright/test';

async function isolatedAuth(page:Page,status=200){
 let requests=0;let received:unknown;let redirect:string|null=null;
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin==='http://127.0.0.1:8081')return route.continue();
  if(url.origin!=='http://127.0.0.1:54321')return route.abort();
  if(url.pathname==='/auth/v1/recover'){
   requests++;received=route.request().postDataJSON();redirect=url.searchParams.get('redirect_to');
   await new Promise(resolve=>setTimeout(resolve,200));
   return route.fulfill({status,contentType:'application/json',body:JSON.stringify(status===200?{}:{code:'over_email_send_rate_limit',msg:'Please wait before requesting another reset email.'})});
  }
  if(url.pathname==='/auth/v1/token')return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({code:'invalid_credentials',msg:'Invalid login credentials'})});
  return route.fulfill({status:200,contentType:'application/json',body:'[]'});
 });
 return {requests:()=>requests,received:()=>received,redirect:()=>redirect};
}
async function assertFitted(page:Page){
 await expect(page.locator('.clipt-auth-shell')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>{
  const form=document.querySelector('.clipt-auth-shell > .page-content')!.getBoundingClientRect();
  const nav=document.querySelector('.clipt-controller[data-page-controller]')!.getBoundingClientRect();
  return Math.abs(form.bottom-nav.top);
 })).toBeLessThan(2);
 const screen=await page.evaluate(()=>({x:scrollX,y:scrollY,w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight}));
 expect(screen.x).toBe(0);expect(screen.y).toBe(0);expect(screen.sw).toBeLessThanOrEqual(screen.w+1);expect(screen.sh).toBeLessThanOrEqual(screen.h+1);
}
for(const size of [{width:390,height:844},{width:320,height:568},{width:260,height:500},{width:844,height:390}]){
 test('auth scroll stays above the controller at '+size.width+'x'+size.height,async({page},info)=>{
  await isolatedAuth(page);await page.setViewportSize(size);await page.goto('/login');
  await expect(page.getByRole('heading',{name:'Welcome Back'})).toBeVisible();await assertFitted(page);
  const before=await page.locator('.clipt-controller').boundingBox();
  await page.getByLabel('Email',{exact:true}).fill('owner@example.invalid');await page.getByLabel('Password',{exact:true}).fill('example-not-a-real-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'Invalid email or password'})).toBeVisible();
  const scroller=page.locator('.clipt-auth-shell > .page-content');
  await scroller.evaluate(el=>{el.scrollTop=el.scrollHeight;});
  const last=page.getByRole('link',{name:'Resend verification email',exact:true});await last.scrollIntoViewIfNeeded();
  const visible=await last.boundingBox(),surface=await scroller.boundingBox(),after=await page.locator('.clipt-controller').boundingBox();
  expect(visible!.y+visible!.height).toBeLessThanOrEqual(surface!.y+surface!.height+1);expect(after!.y).toBeCloseTo(before!.y,0);await assertFitted(page);
  await page.screenshot({path:info.outputPath('auth-fitted-'+size.width+'x'+size.height+'.png')});
  await page.getByRole('link',{name:'Forgot your password?',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Reset Password',exact:true})).toBeVisible();await assertFitted(page);
 });
}
test('reset request uses the recovery route and keeps an accessible confirmation on screen',async({page})=>{
 const f=await isolatedAuth(page);await page.setViewportSize({width:390,height:844});await page.goto('/reset-password');
 await page.getByLabel('Email for password reset',{exact:true}).fill('Owner@Example.invalid');
 await page.getByRole('button',{name:'Send Reset Link',exact:true}).click();
 await expect(page.getByRole('status').filter({hasText:'If an account exists for this email'})).toBeVisible();
 await expect(page).toHaveURL(/\/reset-password$/);expect(f.requests()).toBe(1);expect(f.received()).toMatchObject({email:'owner@example.invalid',gotrue_meta_security:{}});expect(f.redirect()).toBe('http://127.0.0.1:8081/update-password');
 await expect(page.getByRole('button',{name:'Send Reset Link',exact:true})).toHaveCount(0);await assertFitted(page);
 await page.getByRole('button',{name:'Back to Login',exact:true}).click();await expect(page).toHaveURL(/\/login$/);
});
test('reset rate-limit failure preserves the address and does not show a success confirmation',async({page})=>{
 const f=await isolatedAuth(page,429);await page.goto('/reset-password');await page.getByLabel('Email for password reset',{exact:true}).fill('owner@example.invalid');await page.getByRole('button',{name:'Send Reset Link',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'Please wait'})).toBeVisible();await expect(page.getByLabel('Email for password reset',{exact:true})).toHaveValue('owner@example.invalid');await expect(page.getByRole('status').filter({hasText:'If an account exists for this email'})).toHaveCount(0);expect(f.requests()).toBe(1);
});
test('auth layout follows the visible viewport when the keyboard opens without adding page scroll',async({page})=>{
 await page.addInitScript(()=>{const viewport=Object.assign(new EventTarget(),{height:window.innerHeight,width:window.innerWidth,offsetTop:0,offsetLeft:0,pageTop:0,pageLeft:0,scale:1});Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});(window as unknown as {authViewportFixture:typeof viewport}).authViewportFixture=viewport;});
 await isolatedAuth(page);await page.setViewportSize({width:390,height:844});await page.goto('/login');await assertFitted(page);
 await page.evaluate(()=>{const viewport=(window as unknown as {authViewportFixture:{height:number;width:number;offsetTop:number;dispatchEvent:(event:Event)=>boolean}}).authViewportFixture;viewport.height=360;viewport.width=390;viewport.offsetTop=24;viewport.dispatchEvent(new Event('resize'));});
 await expect.poll(async()=>Math.round((await page.locator('.clipt-auth-shell').boundingBox())!.height)).toBe(360);
 await expect.poll(async()=>Math.round((await page.locator('.clipt-auth-shell').boundingBox())!.y)).toBe(24);await assertFitted(page);
 await page.getByRole('link',{name:'Forgot your password?',exact:true}).click();await expect(page.getByRole('heading',{name:'Reset Password',exact:true})).toBeVisible();await assertFitted(page);
});
