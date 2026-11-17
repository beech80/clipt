import { expect, test } from '@playwright/test';

const routes = [
  '/', '/login', '/signup', '/reset-password', '/resend-verification',
  '/clipts', '/top-clipts', '/top-games', '/retro-search', '/discovery',
  '/subscription', '/docs/user-guide', '/privacy', '/terms', '/delete-account',
  '/profile', '/messages', '/notifications', '/tokens', '/creator-dashboard',
  '/settings', '/achievements', '/new-post', '/drafts', '/boosts', '/admin',
  '/streaming', '/live', '/stream-setup', '/definitely-not-a-real-route',
];

for (const viewport of [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1366, height: 768 },
]) {
  test(`production public route audit (${viewport.name})`, async ({ page }) => {
    test.skip(!process.env.LIVE_BASE_URL, 'Only runs against an explicitly supplied production URL.');
    await page.setViewportSize(viewport);
    const failures: string[] = [];
    page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error') failures.push(`console: ${message.text()}`);
    });

    for (const route of routes) {
      failures.length = 0;
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${route} HTTP status`).toBeLessThan(400);
      const enter = page.getByRole('button', { name: 'ENTER CLIPT', exact: true });
      if (await enter.isVisible().catch(() => false)) await enter.click();
      await expect(page.locator('body'), `${route} body`).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.body.innerText.trim().length), {
        message: `${route} has visible or accessible content`,
      }).toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${route} horizontal overflow`).toBe(true);
      expect(failures, `${route} runtime errors`).toEqual([]);
    }

    for (const route of ['/streaming', '/live', '/stream-setup']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      if (await page.getByRole('button', { name: 'ENTER CLIPT', exact: true }).isVisible().catch(() => false)) {
        await page.getByRole('button', { name: 'ENTER CLIPT', exact: true }).click();
      }
      const betaGate = page.getByRole('heading', { name: 'CLIPT web beta', exact: true });
      if (await betaGate.isVisible().catch(() => false)) {
        // Production currently keeps its server-backed admission gate in front
        // of private routes. A guest must never see a streaming surface there.
        await expect(page.getByText(/stream key|go live|live discovery/i)).toHaveCount(0);
      } else {
        await expect(page).toHaveURL(/\/clipts(?:[?#]|$)/);
      }
    }
  });
}

test('production bundle exposes exactly the five social Boosts to an authenticated fixture', async ({ page }) => {
  test.skip(!process.env.LIVE_BASE_URL, 'Only runs against an explicitly supplied production URL.');
  const owner = '00000000-0000-4000-8000-000000000097';
  const user = {id:owner,aud:'authenticated',role:'authenticated',email:'release@example.invalid',
    email_confirmed_at:'2026-11-17T00:00:00Z',app_metadata:{},user_metadata:{},created_at:'2026-11-17T00:00:00Z',factors:[]};
  await page.addInitScript(user => {
    const exp=Math.floor(Date.now()/1000)+3600,enc=(value:object)=>btoa(JSON.stringify(value)).replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
    localStorage.setItem('sb-slnjliheyiiummxhrgmk-auth-token',JSON.stringify({access_token:enc({alg:'HS256'})+'.'+enc({sub:user.id,exp,aal:'aal1',role:'authenticated'})+'.fixture',refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}));
  },user);
  const packages=[
    ['squad_blast','SQUAD BLAST',40,86400],['hidden_gem','HIDDEN GEM',50,43200],
    ['chain_reaction','CHAIN REACTION',60,21600],['squad_recruit','SQUAD RECRUIT',70,86400],
    ['king_now',"I'M THE KING NOW",80,7200],
  ].map(([code,name,price,duration_seconds])=>({code,name,base_price:price,final_price:price,duration_seconds,target_kind:'clipt',description:`${name} release verification`}));
  await page.route('https://slnjliheyiiummxhrgmk.supabase.co/**', async route => {
    const url=new URL(route.request().url());let data:unknown=[];
    if(url.pathname==='/auth/v1/user')data=user;
    else if(url.pathname==='/rest/v1/rpc/clipt_beta_access')data=true;
    else if(url.pathname==='/rest/v1/rpc/get_boost_economy')data={membership:'free',discount_percent:0,daily_earned_cap:100,stored_balance_cap:1000,balance:100,weekly_content_boost_entitled:false,weekly_mega_boost_status:'not_entitled',packages};
    else if(url.pathname==='/rest/v1/rpc/get_my_content_boosts')data=[];
    else if(url.pathname==='/rest/v1/posts')data=[];
    else if(url.pathname==='/rest/v1/profiles'||url.pathname==='/rest/v1/rpc/get_own_profile')data={id:owner,username:'release_fixture',avatar_url:null};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.goto('/boosts');
  const enter=page.getByRole('button',{name:'ENTER CLIPT',exact:true});await expect(enter).toBeVisible();await enter.click();
  await expect(page.getByRole('heading',{name:'Boost your Clipt',exact:true})).toBeVisible();
  for(const pack of packages)await expect(page.getByText(String(pack.name),{exact:true})).toBeVisible();
  await expect(page.getByText(/STREAM SURGE/i)).toHaveCount(0);
});
