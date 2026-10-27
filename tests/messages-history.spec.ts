import {test,expect} from '@playwright/test';

test('DM history loads newest first, retries older pages, and preserves read state',async({page})=>{
  const user={id:'00000000-0000-4000-8000-000000000077',aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-09-19T00:00:00Z',factors:[]};
  const peer='00000000-0000-4000-8000-000000000078';
  await page.addInitScript(({user})=>{
    const expires=Math.floor(Date.now()/1000)+3600;
    const encode=(value:object)=>btoa(JSON.stringify(value)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:`${encode({alg:'HS256'})}.${encode({sub:user.id,exp:expires,aal:'aal1',role:'authenticated'})}.fixture`,refresh_token:'fixture',expires_at:expires,expires_in:3600,token_type:'bearer',user}));
  },{user});
  const rows=Array.from({length:51},(_,index)=>({id:`00000000-0000-4000-8000-${String(index+100).padStart(12,'0')}`,sender_id:user.id,receiver_id:peer,content:`Message number ${index}`,created_at:new Date(Date.UTC(2026,8,1,0,index)).toISOString(),read:true}));
  let fail=true,failOlder=true;
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin==='http://127.0.0.1:8081')return route.continue();
    if(url.origin!=='http://127.0.0.1:54321')return route.abort();
    if(url.pathname==='/auth/v1/user')return route.fulfill({json:user});
    if(url.pathname==='/rest/v1/profiles')return route.fulfill({json:url.searchParams.has('id')&&url.searchParams.get('id')?.startsWith('eq.')?{id:peer,username:'peer',display_name:'Peer',avatar_url:null}:[{id:user.id,username:'fixture'}]});
    if(url.pathname==='/rest/v1/messages'&&url.searchParams.get('select')==='*'&&url.searchParams.get('order')==='created_at.desc,id.desc'){
      expect(url.searchParams.get('limit')).toBe('50');
      const older=url.searchParams.getAll('or').some(value=>value.includes('created_at.lt.'));
      if(fail || older&&failOlder)return route.fulfill({status:503,json:{message:'Controlled unavailable history'}});
      return route.fulfill({json:older?[rows[0]]:rows.slice(1).reverse()});
    }
    return route.fulfill({json:[]});
  });
  await page.goto(`/messages/${peer}`);
  await expect(page.getByText('Unable to load message history. Existing messages are unchanged.')).toBeVisible();
  await expect(page.getByText('No messages yet. Say hello!')).toHaveCount(0);
  fail=false;await page.getByRole('button',{name:'Retry message history'}).click();
  const log=page.getByRole('log',{name:'Conversation messages'});
  await expect(log.getByText('Message number 50',{exact:true})).toBeVisible();
  await expect(log.getByText('Read',{exact:true})).toHaveCount(50);
  await expect(log.getByText('Message number 0',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Load older messages'}).click();
  await expect(page.getByRole('button',{name:'Retry message history'})).toBeVisible();
  await expect(log.getByText('Message number 50',{exact:true})).toHaveCount(1);
  failOlder=false;await page.getByRole('button',{name:'Retry message history'}).click();
  await expect(log.getByText('Message number 0',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Load older messages'})).toHaveCount(0);
  await expect(log.getByText('Read',{exact:true})).toHaveCount(51);
  for(const width of [320,390,1440]){
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const input=await page.getByRole('textbox',{name:'Message',exact:true}).boundingBox();
    const controls=await page.getByRole('navigation',{name:'Clipt game controls'}).boundingBox();
    expect(input&&controls&&input.y+input.height<controls.y).toBeTruthy();
    await expect(page.getByLabel('Conversations',{exact:true})).toBeHidden();
    const conversation=await page.locator('.clipt-dm-panel').boundingBox();
    expect(conversation && conversation.width>width-60).toBeTruthy();
    const conversationRegion=page.getByRole('region',{name:'Conversation with peer',exact:true});
    await expect(conversationRegion.getByRole('button',{name:'Back to conversations',exact:true})).toBeVisible();
    await expect(page.getByRole('navigation',{name:'Clipt game controls'}).getByRole('button',{name:'Back to conversations',exact:true})).toBeVisible();
  }
});
