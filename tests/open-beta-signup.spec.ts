import {test,expect,type Page} from '@playwright/test';
import {openApp} from './fixtures/open-app';
test('support opens directly for a guest without exposing account or feed data',async({page})=>{
 const stats=await fixture(page);await page.goto('/docs/user-guide');
 await expect(page.getByRole('heading',{name:'User Guide',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Contact support',exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'beecher@cliptgaming.com',exact:true})).toHaveAttribute('href','mailto:beecher@cliptgaming.com');
 await expect(page.locator('.clipt-launch')).toHaveCount(0);
 expect(stats.accessChecks).toBe(0);expect(stats.postsReads).toBe(0);expect(stats.rosterRequests).toBe(0);
 await page.goto('/clipts');await page.getByRole('button',{name:/ENTER CLIPT/}).click();
 await expect(page.getByRole('heading',{name:'CLIPT web beta',exact:true})).toBeVisible();
 await expect(page.locator('.clipt-fyp')).toHaveCount(0);expect(stats.postsReads).toBe(0);
});
const owner='00000000-0000-4000-8000-000000000097';
async function fixture(page:Page,{signedIn=false,allowed=true,signupError=false}={}){
 const user={id:owner,aud:'authenticated',role:'authenticated',email:'newplayer@example.invalid',email_confirmed_at:'2026-11-02T00:00:00Z',app_metadata:{},user_metadata:{username:'new_player'},created_at:'2026-11-02T00:00:00Z',factors:[]};
 const stats={signups:0,accessChecks:0,postsReads:0,rosterRequests:0,signins:0,body:null as any,redirect:null as string|null};
 if(signedIn)await page.addInitScript(user=>{
  const exp=Math.floor(Date.now()/1000)+3600,enc=(x:object)=>btoa(JSON.stringify(x)).replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
  localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:enc({alg:'HS256'})+'.'+enc({sub:user.id,exp,aal:'aal1',role:'authenticated'})+'.fixture',refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}));
  localStorage.setItem('clipt-home-controls-v1:'+user.id,'completed');
 },user);
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.origin==='http://127.0.0.1:8081')return route.continue();
  if(url.origin!=='http://127.0.0.1:54321')return route.abort();
  let status=200,data:unknown=[];
  if(url.pathname==='/auth/v1/signup'){
   stats.signups++;stats.body=route.request().postDataJSON();stats.redirect=url.searchParams.get('redirect_to');
   status=signupError?400:200;
   data=signupError?{code:'weak_password',msg:'Password does not meet the server security requirements.'}:{...user,email_confirmed_at:null,identities:[{id:owner,user_id:owner,provider:'email',identity_data:{email:user.email}}]};
  }else if(url.pathname==='/auth/v1/user')data=user;
  else if(url.pathname==='/auth/v1/token'){stats.signins++;status=400;data={msg:'Fixture does not sign into a real account'};}
  else if(url.pathname==='/rest/v1/rpc/clipt_beta_access'){stats.accessChecks++;data=allowed;}
  else if(url.pathname==='/rest/v1/posts')stats.postsReads++;
  if(url.pathname.includes('beta_members'))stats.rosterRequests++;
  return route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 return stats;
}
test('signup is reachable with the real admission flag enabled and waits for email confirmation',async({page},info)=>{
 const stats=await fixture(page);await page.setViewportSize({width:390,height:844});await openApp(page,'/login');
 await page.getByRole('button',{name:'Create a new account',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Create Account',exact:true})).toBeVisible();
 await page.getByLabel('Email',{exact:true}).fill('NewPlayer@Example.invalid');await page.getByLabel('Username',{exact:true}).fill('new_player');await page.getByLabel('Password',{exact:true}).fill('Fixture-password-2026!');await page.getByRole('button',{name:'Create account',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Check your email',exact:true})).toBeVisible();
 await expect(page.getByRole('status').filter({hasText:'Open the confirmation link'})).toContainText('newplayer@example.invalid');
 expect(stats.signups).toBe(1);expect(stats.body.email).toBe('newplayer@example.invalid');expect(stats.body.data.username).toBe('new_player');expect(stats.redirect).toBe('http://127.0.0.1:8081/login');
 expect(stats.postsReads).toBe(0);expect(stats.rosterRequests).toBe(0);
 await page.screenshot({path:info.outputPath('self-service-email-confirmation.png')});
 await page.getByRole('button',{name:'Go to sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Welcome Back'})).toBeVisible();
});
test('a confirmed session enters the feed without a membership request or another password form',async({page})=>{
 const stats=await fixture(page,{signedIn:true});await openApp(page,'/login');
 await expect(page).toHaveURL(/\/clipts$/);await expect(page.locator('.clipt-fyp')).toBeVisible();
 expect(stats.accessChecks).toBeGreaterThan(0);expect(stats.rosterRequests).toBe(0);expect(stats.signins).toBe(0);
});
test('server-denied identities remain blocked and guest signup does not reveal the feed',async({page})=>{
 const stats=await fixture(page,{signedIn:true,allowed:false});await openApp(page,'/clipts');
 await expect(page.getByRole('heading',{name:'CLIPT web beta',exact:true})).toBeVisible();
 await expect(page.getByText('This account cannot currently access the beta. Confirm your email or contact support for help.',{exact:true})).toBeVisible();
 await expect(page.locator('.clipt-fyp')).toHaveCount(0);expect(stats.postsReads).toBe(0);
});
test('guest admission screen links to signup without allowing anonymous data access',async({page})=>{
 const stats=await fixture(page);await openApp(page,'/clipts');
 await expect(page.getByRole('heading',{name:'CLIPT web beta',exact:true})).toBeVisible();
 await page.getByRole('link',{name:'Create a free account',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Create Account',exact:true})).toBeVisible();expect(stats.postsReads).toBe(0);
 await page.reload();await expect(page.getByRole('heading',{name:'Create Account',exact:true})).toBeVisible();
 await expect(page.locator('.clipt-launch')).toHaveCount(0);
});
test('signup rejection preserves the form without claiming a confirmation email was sent',async({page})=>{
 const stats=await fixture(page,{signupError:true});await openApp(page,'/signup');
 await page.getByLabel('Email',{exact:true}).fill('newplayer@example.invalid');await page.getByLabel('Username',{exact:true}).fill('new_player');await page.getByLabel('Password',{exact:true}).fill('Fixture-password-2026!');await page.getByRole('button',{name:'Create account',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'server security requirements'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Create Account',exact:true})).toBeVisible();await expect(page.getByLabel('Email',{exact:true})).toHaveValue('newplayer@example.invalid');
 await expect(page.getByRole('heading',{name:'Check your email',exact:true})).toHaveCount(0);expect(stats.signups).toBe(1);expect(stats.postsReads).toBe(0);
});
