import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {postImageReferences} from '../../src/lib/post-image-references.ts';
import {notificationLink} from '../../src/lib/notification-link.ts';
import * as pageController from '../../src/lib/page-controller.ts';
import * as publishingStatus from '../../src/lib/publishing-status.ts';
import * as trophyEligibility from '../../src/lib/trophy-eligibility.ts';

const require=createRequire(import.meta.url);
test('mobile engagement reserves a full-width typing row without changing the comment handler',()=>{
  const css=readFileSync(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
  assert.match(css,/\.clipt-hud-comments form input \{[^}]*grid-column: 1 \/ -1;[^}]*font-size: 16px/);
  assert.match(css,/\.clipt-hud-comments form > \.relative > div \{[^}]*grid-template-columns: 44px minmax\(0,1fr\)/);
  assert.match(css,/\.clipt-engagement-hud \.clipt-engagement-metrics span \{[^}]*clip-path: inset\(50%\)/);
});
test('Settings subpanels share console material with explicit high-contrast fallback',()=>{
  const css=readFileSync(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
  assert.match(css,/\.clipt-settings-layout section > \.rounded-lg \{[^}]*background: linear-gradient/);
  assert.match(css,/html\.high-contrast \.clipt-settings-layout section > \.rounded-lg \{[^}]*background: #000/);
});
test('Search card rows contain descendant overflow without disabling their horizontal scroll',()=>{
  const css=readFileSync(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
  assert.match(css,/\.clipt-search-results \{[^}]*contain: layout paint/);
  assert.match(css,/\.clipt-search\[data-search-category="all"\] \.clipt-search-results \{[^}]*overflow-x: auto/);
});
test('narrow Token navigation stacks icons without breaking label words',()=>{
  const css=readFileSync(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
  const narrow=css.match(/@media\(max-width:400px\)\s*\{\s*\.clipt-store-topbar \.clipt-store-nav a\s*\{([^}]+)\}/)?.[1];
  assert.ok(narrow);
  for(const rule of ['flex-direction: column','overflow-wrap: normal','word-break: normal']) assert.ok(narrow.includes(rule));
});
function load(path, replacements={}) {
  replacements = {'@/lib/page-controller':pageController,'@/lib/publishing-status':publishingStatus,'@/lib/trophy-eligibility':trophyEligibility, ...replacements};
  replacements={'@/hooks/useMobileControlsPreferences':{useMobileControlsPreferences:()=>({preferences:{hand:'right',trail:true},update(){},saved:true})},'./accessibility/HandPreferenceSettings':{HandPreferenceSettings:()=>null},'./AdjustablePanel':{AdjustablePanel:()=>null},'@/components/AdjustablePanel':{AdjustablePanel:()=>null},'@/pages/Menu':{default:()=>null,__esModule:true},...replacements};
  const output=ts.transpileModule(readFileSync(new URL(`../../src/${path}`,import.meta.url),'utf8'),{
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}
  }).outputText;
  const mod={exports:{}};
  new Function('require','module','exports',output)(name=>replacements[name]??require(name),mod,mod.exports);
  return mod.exports;
}
const {donationAmountCents}=load('lib/donation-amount.ts');

test('local help stays in the console shell with one top-level heading',()=>{
  const source=readFileSync(new URL('../../src/pages/docs/UserGuide.tsx',import.meta.url),'utf8');
  const masthead=readFileSync(new URL('../../src/components/ConsoleMasthead.tsx',import.meta.url),'utf8');
  assert.match(source,/<main className="clipt-user-guide/);
  assert.match(source,/h1:\s*\(\{node, \.\.\.props\}\) => \(\s*<h2/);
  assert.match(source,/<BookOpen aria-hidden="true"/);
  assert.ok(masthead.includes("'/docs/user-guide': 'Help / User Guide'"));
});

test('achievement and analytics console materials preserve semantic selected states and high contrast',()=>{
  const css=readFileSync(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
  assert.ok(css.includes('.clipt-achievements [role="tab"][data-state="active"]'));
  assert.ok(css.includes('.clipt-creator-dashboard button[aria-pressed="true"]'));
  assert.ok(css.includes('html.high-contrast .clipt-achievements [role="tablist"]'));
  assert.ok(css.includes('.clipt-creator-dashboard .clipt-dashboard-metrics > .border'));
  assert.ok(css.includes('.clipt-achievements .clipt-achievement-catalog > .border'));
});

test('narrow console screen plaques never split individual words',()=>{
  const css=readFileSync(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
  const plaque=css.match(/\.clipt-screen-name\s*\{([^}]+)\}/)?.[1];
  assert.ok(plaque);
  for(const rule of ['min-width: 0','white-space: nowrap','overflow: hidden','text-overflow: ellipsis']) assert.ok(plaque.includes(rule));
  assert.doesNotMatch(plaque,/overflow-wrap:\s*anywhere/);
});
test('edit-profile reads never create accounts or fabricate profile data',()=>{
  const source=readFileSync(new URL('../../src/components/profile/ProfileEditForm.tsx',import.meta.url),'utf8');
  const query=source.slice(source.indexOf('queryFn: async'),source.indexOf('const form = useForm'));
  assert.match(query,/rpc\('get_own_profile'\)/);
  assert.doesNotMatch(query,/\.insert\(|Math\.random|dicebear|Welcome to my Clipt/);
  assert.match(query,/throw new Error\('Could not load profile data'\)/);
});
test('Profile reads use the existing owner RPC and never manufacture missing accounts',()=>{
  const source=readFileSync(new URL('../../src/pages/Profile.tsx',import.meta.url),'utf8');
  const read=source.slice(source.indexOf('const fetchProfileData'),source.indexOf('const loadProfileData'));
  assert.match(read,/rpc\('get_own_profile'\)/);
  assert.doesNotMatch(read,/\.upsert\(|\.insert\(|user_metadata|dicebear|Welcome to my Clipt/);
  assert.doesNotMatch(source,/Successfully loaded profile/);
});
test('game creator avatars use the shared caller-authorized media renderer',()=>{
  const source=readFileSync(new URL('../../src/pages/GameStreamers.tsx',import.meta.url),'utf8');
  assert.match(source,/AvatarImage src=\{creator\.avatar_url \|\| undefined\}/);
  assert.match(source,/AvatarFallback/);
  assert.doesNotMatch(source,/<img[^>]*creator\.avatar_url/);
});
test('sign-in preserves database-owned profile initialization without demo account writes',()=>{
  const source=readFileSync(new URL('../../src/contexts/AuthContext.tsx',import.meta.url),'utf8');
  assert.match(source,/signInWithPassword/);
  assert.doesNotMatch(source,/ensureUserProfile|\.upsert\(|dicebear|Welcome to my Clipt profile|Math\.random/);
});
test('donation amounts are exact cents and respect server limits',()=>{
  for(const [value,cents] of [['1',100],['5',500],['25.73',2573],['1.01',101],['500',50000]])assert.equal(donationAmountCents(value),cents);
  for(const value of ['','0','0.99','500.01','1.001','1e2','-5','NaN',' 5','5.'])assert.equal(donationAmountCents(value),null);
});
const Button=({children,variant,...props})=>React.createElement('button',props,children);
test('controller guide pulse preserves dimensional inset lighting and pressed depth',()=>{
  const styles=readFileSync(new URL('../../src/components/GameBoyControls.css',import.meta.url),'utf8');
  const pulse=styles.slice(styles.indexOf('@keyframes clipt-controller-pulse'),styles.indexOf('@media (max-width: 350px)'));
  assert.match(pulse,/0%,100% \{ box-shadow: inset -8px -5px 12px/);
  assert.match(pulse,/50% \{ box-shadow: inset -8px -5px 12px/);
  assert.match(styles,/\.clipt-controller-home:not\(:disabled\):active \{ animation: none; transform: translateY\(2px\)/);
  assert.match(styles,/\.clipt-controller-secondary button:not\(:disabled\):active/);
  assert.match(styles,/prefers-reduced-motion: reduce/);
});
test('message reference materials preserve actual content, receipts and accessible history',()=>{
  const source=readFileSync(new URL('../../src/pages/Messages.tsx',import.meta.url),'utf8');
  const styles=readFileSync(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
  for(const name of ['clipt-inbox-heading','clipt-conversation-row','clipt-dm-heading','clipt-dm-history','clipt-message-bubble','clipt-dm-composer']) assert.match(source,new RegExp(name));
  assert.match(source,/data-message-direction=\{msg.sender_id === user\?\.id \? 'outgoing' : 'incoming'\}/);
  assert.match(source,/\{msg.content\}/);
  assert.match(source,/msg.read\?'Read':'Sent'/);
  assert.match(source,/aria-label="Conversation messages" role="log"/);
  assert.match(source,/disabled=\{isSending \|\| !message.trim\(\)\}/);
  assert.match(styles,/\.clipt-dm-composer input \{ min-width: 0/);
  assert.doesNotMatch(source,/Online •|Nashville, TN|appreciate you!/);
});
test('Boost confirmation uses the controller-safe HUD without changing server confirmation',()=>{
  const source=readFileSync(new URL('../../src/pages/Boosts.tsx',import.meta.url),'utf8');
  const styles=readFileSync(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
  assert.match(source,/AlertDialogContent className="clipt-boost-review overflow-y-auto"/);
  assert.doesNotMatch(source,/max-h-\[80dvh\]/);
  assert.match(styles,/\.clipt-boost-review\[role="alertdialog"\]\s*\{[\s\S]*?bottom: calc\(160px/);
  assert.match(styles,/\.clipt-boost-review\[role="alertdialog"\]\s*\{[\s\S]*?max-height: calc\(100dvh - 180px/);
  assert.match(source,/rpc\('purchase_content_boost'/);
  assert.match(source,/rpc\('redeem_weekly_squad_blast'/);
  assert.match(source,/z\.string\(\)\.uuid\(\)\.safeParse\(id\)\.success/);
});
test('token reference top bar uses actual balance and preserves unavailable purchase state',()=>{
  for(const unavailable of [false,true]) {
    const {default:Tokens}=load('pages/TokenStore.tsx',{
      'react-router-dom':{Link:({to,children,...props})=>React.createElement('a',{href:to,...props},children)},
      '@/contexts/AuthContext':{useAuth:()=>({user:{id:'fixture-viewer'}})},
      '@tanstack/react-query':{useQuery:({queryKey})=>queryKey[0]==='token-wallet'?{data:{balance:37},isPending:false,isError:unavailable}:{data:[],isPending:false,isError:false}},
      '@/integrations/supabase/client':{supabase:{}},'@/lib/clip-reward':{},'@/components/ui/button':{Button},
    });
    const html=renderToStaticMarkup(React.createElement(Tokens));
    assert.match(html,/clipt-store-topbar/);
    assert.match(html,/aria-label="Token economy"/);
    assert.match(html,/Tokens cannot be purchased/);
    assert.doesNotMatch(html,/Buy Tokens/);
    assert.match(html,/not Trophy votes/);
    if(unavailable) { assert.match(html,/Balance is unavailable, not zero/); assert.doesNotMatch(html,/37 tokens/); }
    else assert.match(html,/37 tokens/);
    assert.doesNotMatch(html,/3,250|\$4\.99|Payment successful/);
  }
});
test('security reference styling reflects only the actual authenticator state',()=>{
  for(const verified of [false,true]) {
    const {TwoFactorSettings}=load('components/settings/TwoFactorSettings.tsx',{
      '@/hooks/useAuthSecurity':{useAuthSecurity:()=>({factors:verified?[{id:'verified-factor',friendly_name:'Recorded factor'}]:[],loading:false,error:'',enrollment:null})},
      '@/components/ui/button':{Button},'@/components/ui/input':{Input:props=>React.createElement('input',props)},
      '@/components/ui/card':Object.fromEntries(['Card','CardHeader','CardTitle','CardDescription','CardContent'].map(key=>[key,({children,...props})=>React.createElement('div',props,children)])),
    });
    const html=renderToStaticMarkup(React.createElement(TwoFactorSettings));
    assert.match(html,/clipt-security-symbol/);
    if(verified) { assert.match(html,/Authenticator verified on your account/); assert.match(html,/Recorded factor/); }
    else { assert.match(html,/No verified authenticator on your account/); assert.match(html,/Set up authenticator/); }
    assert.doesNotMatch(html,/Security Status Strong|SMS Verification|Biometric Login|iPhone 15 Pro/);
  }
});
test('settings section selection retains real controls without fabricated security state',()=>{
  const {default:Settings}=load('pages/Settings.tsx',{
    '@/contexts/AuthContext':{useAuth:()=>({user:{id:'fixture-viewer'},signOut:()=>{}})},
    'react-router-dom':{useNavigate:()=>()=>{},useLocation:()=>({hash:'#settings-security'}),Link:({to,children,...props})=>React.createElement('a',{href:to,...props},children)},
    '@tanstack/react-query':{useQuery:()=>({data:{enable_notifications:true,enable_sounds:false},isLoading:false,isError:false}),useMutation:()=>({isPending:false,mutate:()=>{}}),useQueryClient:()=>({invalidateQueries:()=>{}})},
    '@/lib/supabase':{supabase:{}},sonner:{toast:{error:()=>{},success:()=>{}}},
    '@/components/ui/button':{Button},
    '@/components/ui/card':{Card:({children,...props})=>React.createElement('section',props,children)},
    '@/components/ui/label':{Label:({children,...props})=>React.createElement('label',props,children)},
    '@/components/ui/separator':{Separator:()=>React.createElement('hr')},
    '@/components/ui/switch':{Switch:({checked,onCheckedChange,...props})=>React.createElement('button',{...props,role:'switch','aria-checked':checked})},
    '@/components/accessibility/AccessibilitySettings':{AccessibilitySettings:()=>null},
    '@/components/ControllerSettings':{ControllerSettings:()=>null},
    '@/components/settings/TwoFactorSettings':{TwoFactorSettings:()=>React.createElement('div',null,'Actual MFA component')},
    '@/components/settings/DeviceStorageSettings':{DeviceStorageSettings:()=>null},
    '@/components/settings/DataPrivacySettings':{DataPrivacySettings:()=>null},
    '@/components/settings/PhotoSafetyNotices':{PhotoSafetyNotices:()=>null},
    '@/components/settings/CreatorSafetySettings':{CreatorSafetySettings:()=>null},
    '@/components/streaming/StreamSettings':{StreamSettings:()=>null},
  });
  const html=renderToStaticMarkup(React.createElement(Settings));
  assert.match(html,/<a[^>]*href="#settings-security"[^>]*aria-current="location"/);
  assert.doesNotMatch(html,/<a[^>]*href="#settings-account"[^>]*aria-current/);
  assert.match(html,/Actual MFA component/);
  assert.match(html,/aria-label="Sound Effects"[^>]*aria-checked="false"/);
  assert.match(html,/clipt-account-heading/);
  assert.doesNotMatch(html,/Security Status Strong|iPhone 15 Pro|Nashville/);
});
test('notification icon layout preserves actual activity, destination and read controls',()=>{
  const postId='00000000-0000-4000-8000-000000000042';
  const row={id:'notification-fixture',type:'comment',content:'Stored content',created_at:'2026-10-03T12:00:00Z',read:false,resource_id:postId,resource_type:'post',actor:{username:'actual_creator'}};
  const {default:Notifications}=load('pages/Notifications.tsx',{
    react:{...React,useState:value=>[value,()=>{}],useEffect:()=>{}},
    '@tanstack/react-query':{useInfiniteQuery:()=>({data:{pages:[[row]]},isPending:false,isError:false}),useMutation:()=>({mutate:()=>{},isPending:false}),useQueryClient:()=>({invalidateQueries:()=>{}})},
    'react-router-dom':{Link:({to,children,...props})=>React.createElement('a',{href:to,...props},children)},
    '@/contexts/AuthContext':{useAuth:()=>({user:{id:'fixture-viewer'}})},
    '@/lib/supabase':{supabase:{}},'@/lib/notification-link':{notificationLink},
    '@/components/settings/PhotoSafetyNotices':{PhotoSafetyNotices:()=>null},
    '@/components/ui/button':{Button},sonner:{toast:{error:()=>{}}},
  });
  const html=renderToStaticMarkup(React.createElement(Notifications));
  assert.match(html,/actual_creator commented on your Clipt/);
  assert.ok(html.includes(`href="/post/${postId}"`));
  assert.match(html,/Mark as read/);
  assert.match(html,/clipt-notification-icon/);
  assert.match(html,/aria-label="Notification filters"/);
  assert.doesNotMatch(html,/12\.4K|fake|demo/i);
});
function createMarkup(result) {
  const {default:Create}=load('pages/NewPost.tsx',{
    'react-router-dom':{useNavigate:()=>()=>{},useSearchParams:()=>[new URLSearchParams()],Link:({to,children,...props})=>React.createElement('a',{href:to,...props},children)},
    '@/contexts/AuthContext':{useAuth:()=>({user:{id:'fixture-viewer'}})},
    '@/hooks/usePrivateMedia':{usePrivateMediaUrl:()=>({})},
    '@/lib/game-catalog':{completeGameCatalog:()=>[]},
    '@tanstack/react-query':{useQuery:()=>result,useQueryClient:()=>({})},
    '@/components/ui/button':{Button},
    '@/components/ui/input':{Input:props=>React.createElement('input',props)},
    '@/components/ui/textarea':{Textarea:props=>React.createElement('textarea',props)},
    '@/components/ui/back-button':{BackButton:()=>React.createElement('button',null,'Back')},
    '@/lib/supabase':{supabase:{}},
    '@/lib/clip-upload':{}, '@/lib/photo-upload':{}, '@/lib/search-pattern':{}, '@/lib/clip-reward':{},
    '@/lib/community-text':load('lib/community-text.ts'),
  });
  return renderToStaticMarkup(React.createElement(Create));
}
test('Create/Post distinguishes game loading, empty results and retryable errors',()=>{
  assert.match(createMarkup({isPending:true}),/Loading game categories/);
  assert.match(createMarkup({data:[]}),/No game categories are available/);
  const failed=createMarkup({isError:true,isFetching:true});
  assert.match(failed,/Games could not be loaded/);
  assert.match(failed,/<button[^>]*disabled[^>]*>Retry games/);
  assert.doesNotMatch(failed,/No game categories are available/);
});
test('Create/Post preserves actual game IDs, caption limit and disabled empty upload',()=>{
  const html=createMarkup({data:[{id:'recorded-game',name:'Recorded game'}]});
  assert.match(html,/<option value="recorded-game">Recorded game<\/option>/);
  assert.match(html,/aria-describedby="clip-caption-count"/);
  assert.match(html,/maxLength="2000"/);
  assert.match(html,/0 \/ 2,000 characters/);
  assert.match(html,/<button[^>]*disabled[^>]*>Post Clipt/);
});

test('posting destinations distinguish public, follower-only and private draft without unsafe fallback',()=>{
  const html=createMarkup({data:[]});
  for(const value of ['clipts','squad','draft'])assert.match(html,new RegExp(`name="clip-destination"[^>]*value="${value}"`));
  assert.match(html,/People who follow you/);assert.match(html,/Private · Only you/);
  assert.match(html,/<input(?=[^>]*value="squad")(?=[^>]*disabled)[^>]*>/);
  assert.match(html,/href="\/drafts"/);
  const source=readFileSync(new URL('../../src/pages/NewPost.tsx',import.meta.url),'utf8');
  assert.match(source,/is_published: destination !== 'draft'/);
  assert.match(source,/destination === 'squad' && !squadReady/);
  assert.match(source,/\.eq\('user_id', user\.id\)\.eq\('is_published', false\)/);
  assert.doesNotMatch(source,/Your draft is still here/);
});

test('home feed tabs remain below brand and never replace horizontal active-neighbor carousel',()=>{
  const source=readFileSync(new URL('../../src/pages/Clipts.tsx',import.meta.url),'utf8');
  assert.ok(source.indexOf('clipt-feed-tabs')>source.indexOf('clipt-fyp-brand'));
  assert.match(source,/value="clipts" aria-label="Clipts" title="Clipts"/);assert.match(source,/value="squad" aria-label="Squad" title="Squad"/);
  assert.match(source,/<Clapperboard size=\{22\} aria-hidden="true"/);
  assert.match(source,/<UsersRound size=\{22\} aria-hidden="true"/);
  assert.match(source,/\.eq\('follower_id', user!\.id\)/);
  assert.match(source,/post_type\.neq\.squad/);
  assert.match(source,/data-horizontal-feed/);assert.match(source,/Math\.abs\(index - activeIndex\) <= 1/);
});

test('metallic space background and edge-to-edge controller retain accessible contrast and depth',()=>{
  const css=readFileSync(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
  const controller=readFileSync(new URL('../../src/components/GameBoyControls.css',import.meta.url),'utf8');
  assert.match(css,/\.app-container::before[^}]*pointer-events: none/);
  assert.match(css,/html\.high-contrast \.app-container::before \{ display: none/);
  assert.match(controller,/max-width: none; margin-inline: 0/);
  assert.match(controller,/radial-gradient\(circle at 35% 25%/);
  assert.match(controller,/translateY\(2px\)/);
});
test('AuthGuard keeps private children hidden until authenticated and announces session loading',()=>{
  for(const auth of [{user:null,loading:true},{user:null,loading:false},{user:{id:'actual-user'},loading:false}]) {
    const notices=[];const redirects=[];
    const {AuthGuard}=load('components/AuthGuard.tsx',{
      react:{...React,useEffect:effect=>effect()},
      'react-router-dom':{useNavigate:()=> (...args)=>redirects.push(args)},
      '@/contexts/AuthContext':{useAuth:()=>auth},
      sonner:{toast:{error:(...args)=>notices.push(args)}},
    });
    const html=renderToStaticMarkup(React.createElement(AuthGuard,null,'Protected child'));
    if(auth.loading) {
      assert.match(html,/role="status"/);assert.match(html,/Checking your session/);
      assert.doesNotMatch(html,/Protected child/);assert.equal(redirects.length,0);
    } else if(!auth.user) {
      assert.equal(html,'');assert.deepEqual(redirects,[['/login',{replace:true}]]);
      assert.equal(notices[0][1].id,'clipt-auth-required');
    } else {
      assert.match(html,/Protected child/);assert.equal(redirects.length,0);assert.equal(notices.length,0);
    }
  }
});
function controllerMarkup(pathname, onEligibility=()=>{}) {
  const {default:Controller}=load('components/GameBoyControls.tsx',{
    'react-router-dom':{useLocation:()=>({pathname}),useNavigate:()=>()=>{}},
    './GameBoyControls.css':{},
    '@/components/ui/dialog':{Dialog:()=>null,DialogContent:()=>null,DialogTitle:()=>null,DialogDescription:()=>null},
    './ControllerSettings':{ControllerSettings:()=>null},
    '@/hooks/useControllerPreferences':{useControllerPreferences:()=>({preferences:{layout:'auto',autoHide:true}})},
    '@/hooks/useImmersiveController':{useImmersiveController:eligible=>{onEligibility(eligible);return {immersive:false,viewport:{width:844,height:390},rootRef:React.createRef(),hidden:false};}},
  });
  return renderToStaticMarkup(React.createElement(Controller));
}
test('shared controller preserves analog, center guide and four icon actions',()=>{
  const html=controllerMarkup('/clipts');
  assert.match(html,/role="slider"/);
  assert.match(html,/aria-orientation="horizontal"/);
  assert.match(html,/clipt-controller-stick/);
  assert.match(html,/aria-label="CLIPT — Open navigation"/);
  assert.match(html,/clipt-controller-secondary/);
  assert.match(html,/data-expanded="true"/);
  assert.match(html,/<button(?=[^>]*aria-expanded="true")(?=[^>]*aria-controls="clipt-feed-extra-controls")(?=[^>]*aria-label="Hide controls")[^>]*>/);
  assert.match(html,/lucide-x/);
  assert.match(html,/id="clipt-feed-extra-controls"/);
  assert.match(html,/Open menu/);assert.match(html,/aria-label="POST"/);assert.match(html,/clipt-post-label/);
  assert.equal((html.match(/data-controller-action=/g)||[]).length,4);
  for(const label of ['Trophy — Rank this Clipt','Comment — Open engagement','Like','Follow creator'])assert.ok(html.includes(`aria-label="${label}"`));
  assert.doesNotMatch(html,/d-pad|>A<|>B<|>X<|>Y</i);
});
test('live controller changes ranking action to donation, never paid Trophy',()=>{
  const html=controllerMarkup('/streaming/real-stream');
  assert.match(html,/Donate — Live donation review/);
  assert.match(html,/aria-label="Live Chat"/);
  assert.doesNotMatch(html,/Trophy — Rank this Clipt/);
  assert.match(html,/lucide-dollar-sign/);
});
test('controller retains the same shared controls across reference routes',()=>{
  for(const route of ['/start','/profile','/messages','/messages/other','/notifications','/tokens','/boosts','/settings','/admin','/new-post','/live','/stream-setup','/top-clipts','/retro-search']) {
    const html=controllerMarkup(route);
    assert.match(html,/class="gameboy-controls clipt-controller"/,route);
    assert.match(html,/clipt-controller-joystick/,route);
    assert.match(html,/clipt-controller-center/,route);
    assert.match(html,/clipt-controller-actions/,route);
  }
});
test('only the main video feed may use the new immersive layout; every other page keeps the classic console',()=>{
  for(const route of ['/','/clipts','/post/real-post','/streaming/real-stream','/settings','/discovery','/profile','/messages']) {
    let eligible;const html=controllerMarkup(route,value=>{eligible=value;});
    assert.equal(eligible,route==='/'||route==='/clipts',route);
    if(route!=='/'&&route!=='/clipts') {
      assert.match(html,/data-layout="classic"/);assert.match(html,/role="slider"/);
      assert.doesNotMatch(html,/aria-label="Open menu"|aria-label="POST"/);
    }
  }
});
function rankingsMarkup(result) {
  const {default:Rankings}=load('pages/TopClipts.tsx',{
    '@tanstack/react-query':{useQuery:()=>result},
    'react-router-dom':{Link:({to,children,...props})=>React.createElement('a',{href:to,...props},children)},
    '@/integrations/supabase/client':{supabase:{}},
    '@/contexts/AuthContext':{useAuth:()=>({user:null})},
    '@/components/ui/button':{Button},
    '@/components/ui/avatar':{
      Avatar:({children,...props})=>React.createElement('span',props,children),
      AvatarImage:({src,alt})=>src?React.createElement('img',{src,alt}):null,
      AvatarFallback:({children})=>React.createElement('span',null,children),
    },
  });
  return renderToStaticMarkup(React.createElement(Rankings));
}
test('rankings distinguish loading, error and genuine empty periods',()=>{
  assert.match(rankingsMarkup({isPending:true}),/Loading rankings/);
  const failed=rankingsMarkup({isError:true});
  assert.match(failed,/No results have been substituted/);assert.match(failed,/Retry/);
  const empty=rankingsMarkup({data:[]});
  assert.match(empty,/No ranked Clipts/);assert.doesNotMatch(empty,/data-rank=/);
});
test('podium preserves actual server order, identities and organic Trophy counts',()=>{
  const html=rankingsMarkup({data:[
    {post_id:'one',creator_id:'first',username:'RecordedFirst',content:'First actual result',trophy_count:8},
    {post_id:'two',creator_id:'second',username:'RecordedSecond',content:'Second actual result',trophy_count:3},
  ]});
  assert.match(html,/data-rank="1"/);assert.match(html,/data-rank="2"/);
  assert.match(html,/href="\/post\/one"/);assert.match(html,/href="\/user\/second"/);
  assert.match(html,/8 Trophies/);assert.match(html,/3 Trophies/);
  assert.ok(html.indexOf('RecordedFirst')<html.indexOf('RecordedSecond'));
  assert.doesNotMatch(html,/data-rank="3"|Leaderboard rewards|100K Tokens/);
});
function engagementMarkup(result) {
  const plain=({children,className})=>React.createElement('div',{className},children);
  const {EngagementHud}=load('components/post/EngagementHud.tsx',{
    '@tanstack/react-query':{useQuery:()=>result},
    '@/contexts/AuthContext':{useAuth:()=>({user:null})},
    '@/lib/supabase':{supabase:{}},
    '@/components/ui/button':{Button},
    '@/components/ui/dialog':{DialogContent:plain,DialogTitle:plain,DialogDescription:plain,DialogClose:({children})=>children},
    './CommentList':{CommentList:({postId})=>React.createElement('p',null,`Real comments target: ${postId}`)},
    '@/components/ui/avatar':{Avatar:plain,AvatarImage:()=>null,AvatarFallback:plain},
  });
  return renderToStaticMarkup(React.createElement(EngagementHud,{postId:'actual-post'}));
}
test('engagement HUD announces loading and keeps missing totals unknown',()=>{
  const html=engagementMarkup({isPending:true});
  assert.match(html,/role="status"/);assert.match(html,/Loading engagement totals/);
  assert.equal((html.match(/<strong>—<\/strong>/g)||[]).length,5);
  assert.match(html,/Real comments target: actual-post/);
});
test('engagement HUD renders recorded totals and exposes retry on failure',()=>{
  const recorded=engagementMarkup({data:[0,12,3,1,7]});
  for(const count of [0,12,3,1,7])assert.ok(recorded.includes(`<strong>${count}</strong>`));
  assert.match(recorded,/Trophies/);
  const failed=engagementMarkup({error:new Error('unavailable'),isFetching:true});
  assert.match(failed,/Engagement totals are unavailable/);
  assert.match(failed,/<button[^>]*disabled[^>]*>Retry totals/);
  assert.doesNotMatch(failed,/<strong>0<\/strong>/);
});
function achievementMarkup(result, props={userId:'test-user'}) {
  const {default:List}=load('components/achievements/AchievementList.tsx',{
    '@/contexts/AuthContext':{useAuth:()=>({user:{id:'test-user'}})},
    '@tanstack/react-query':{useQuery:()=>result},
    '@/components/ui/button':{Button},
    '@/services/achievementService':{achievementService:{getUserAchievements:()=>{throw Error('No network in rendering test');}}},
    './AchievementItem':{__esModule:true,default:({achievement,progress})=>React.createElement('p',null,`${achievement.name}: ${progress.currentValue}`)},
  });
  return renderToStaticMarkup(React.createElement(List,props));
}
test('empty achievements never synthesize demo progress',()=>{
  const html=achievementMarkup({data:[],isPending:false,isError:false});
  assert.match(html,/No recorded achievements/);
  assert.doesNotMatch(html,/Growing Community|Complete 4 Daily Quests|Content Creator/);
});
test('achievement loading and failures are distinct from empty results',()=>{
  assert.match(achievementMarkup({isPending:true}),/Loading achievements/);
  const html=achievementMarkup({isError:true,isPending:false});
  assert.match(html,/role="alert"/);assert.match(html,/Retry achievements/);assert.doesNotMatch(html,/No recorded achievements/);
});
test('real recorded achievements reach the rendered item',()=>{
  const html=achievementMarkup({data:[{id:'real',currentValue:7,achievement:{name:'Recorded milestone',category:'social'}}],isPending:false,isError:false});
  assert.match(html,/Recorded milestone: 7/);assert.doesNotMatch(html,/No recorded achievements/);
});
test('unconnected game achievements do not expose demo player counts',()=>{
  const html=achievementMarkup({data:[]},{userId:'test-user',gameId:1});
  assert.match(html,/Verified game achievements are not connected/);assert.doesNotMatch(html,/980|Master Chief/);
});
test('other profiles never present private progress as zero achievements',()=>{
  const html=achievementMarkup({data:[],isPending:false,isError:false},{userId:'another-user'});
  assert.match(html,/Achievement progress is private/);assert.doesNotMatch(html,/No recorded achievements/);
});
test('profile tile navigates to real post without eagerly mounting videos',()=>{
  const {default:Tile}=load('components/profile/ProfilePostTile.tsx',{
    'react-router-dom':{Link:({to,children,...props})=>React.createElement('a',{href:to,...props},children)},
    '@/hooks/usePrivateMedia':{usePrivateMediaUrl:src=>({src,isLoading:false,error:null})},
    '@/lib/post-image-references':{postImageReferences},
  });
  const html=renderToStaticMarkup(React.createElement(Tile,{post:{id:'real-post',content:'Real caption',video_url:'https://example.invalid/media.mp4'},likes:12,comments:3}));
  assert.match(html,/href="\/post\/real-post"/);assert.match(html,/Real caption/);assert.match(html,/12/);assert.match(html,/3/);assert.doesNotMatch(html,/<video/);
});

function donationMarkup(confirm) {
  const state=[true,confirm,'25',false,'Real support message'];
  let cursor=0;
  const plain=({children})=>React.createElement('div',null,children);
  const {default:Hud}=load('components/streaming/LiveDonationHud.tsx',{
    react:{...React,useState:()=>[state[cursor++],()=>{}]},
    '@/lib/donation-amount':{donationAmountCents},
    '@/components/ui/button':{Button},
    '@/components/ui/input':{Input:props=>React.createElement('input',props)},
    '@/components/ui/textarea':{Textarea:props=>React.createElement('textarea',props)},
    '@/components/ui/dialog':{Dialog:plain,DialogContent:plain,DialogHeader:plain,DialogTitle:plain,DialogDescription:plain,DialogTrigger:plain},
  });
  return renderToStaticMarkup(React.createElement(Hud,{creator:'Actual creator',disabled:false}));
}
test('donation HUD offers amounts and review without claiming payment',()=>{
  const html=donationMarkup(false);
  for(const value of ['$1','$5','$10','$25','$50','Custom','Continue to review','Actual creator'])assert.ok(html.includes(value));
  assert.match(html,/No payment will be taken/);
  assert.doesNotMatch(html,/Payment successful|Visa|4242/);
});
test('donation confirmation remains disabled without verified provider configuration',()=>{
  const html=donationMarkup(true);
  assert.match(html,/Confirm Donation/);assert.match(html,/\$25\.00/);assert.match(html,/Real support message/);
  assert.match(html,/This review does not create or confirm a transaction/);
  assert.match(html,/<button[^>]*disabled[^>]*>Confirm Donation — sandbox unavailable/);
  assert.doesNotMatch(html,/Payment successful|Visa|4242|2\.9%/);
});

test('game links retain complete catalog IDs and Squad cannot request organic Trophy votes',()=>{
  const source=readFileSync(new URL('../../src/components/PostItem.tsx',import.meta.url),'utf8');
  assert.match(source,/String\(post.games.id\)/);
  assert.doesNotMatch(source,/replace\('00000000-0000-0000-0000-'/);
  assert.match(source,/if \(trophyLoading \|\| trophyUnavailable\)/);
  assert.match(source,/disabled=\{trophyLoading \|\| Boolean\(trophyUnavailable\)\}/);
});

test('post watching uses purple materials, requested frame ratio and non-modal side engagement',()=>{
  const read=path=>readFileSync(new URL('../../src/'+path,import.meta.url),'utf8');
  const page=read('pages/PostPage.tsx'),item=read('components/PostItem.tsx'),media=read('components/post/PostContent.tsx'),css=read('pages/clipt-console.css');
  assert.match(page,/clipt-watch-page/);assert.doesNotMatch(page,/#1a237e|#0d1b3c/);
  assert.match(page,/<PostItem post=\{post\} watchPage/);
  assert.match(item,/frameAspectRatio=\{watchPage \? '16 \/ 19'/);
  assert.match(item,/modal=\{false\}/);
  assert.match(media,/aspectRatio: frameAspectRatio/);assert.match(media,/object-contain/);assert.match(media,/playsInline/);
  assert.match(css,/width: min\(68vw,360px\)/);assert.match(css,/bottom: calc\(160px \+ env\(safe-area-inset-bottom/);
  const home=read('pages/Clipts.tsx');assert.doesNotMatch(home,/CLIPTS \/ FOR YOU|CLIPTS \/ SQUAD|For You — discover/);
  assert.match(home,/<h1 className="sr-only">Clipts/);
});

test('engagement Trophy totals query actual caller-visible votes alongside existing metrics',async()=>{
  let query;const tables=[];
  const plain=({children})=>React.createElement('div',null,children);
  const {EngagementHud}=load('components/post/EngagementHud.tsx',{
    '@tanstack/react-query':{useQuery:options=>{query=options.queryFn;return {}; }},
    '@/contexts/AuthContext':{useAuth:()=>({user:{id:'independent-test-user'}})},
    '@/lib/supabase':{supabase:{from:table=>({select:(columns,options)=>{tables.push([table,columns,options]);return {eq:async(key,value)=>{assert.equal(key,'post_id');assert.equal(value,'actual-post');return {count:table==='clip_votes'?7:2,error:null};}};}})}},
    '@/components/ui/button':{Button},'@/components/ui/dialog':{DialogContent:plain,DialogTitle:plain,DialogDescription:plain,DialogClose:({children})=>children},'./CommentList':{CommentList:()=>null},
    '@/components/ui/avatar':{Avatar:plain,AvatarImage:()=>null,AvatarFallback:plain},
  });
  renderToStaticMarkup(React.createElement(EngagementHud,{postId:'actual-post'}));
  assert.deepEqual(await query(),[2,2,2,2,7]);
  assert.deepEqual(tables.map(row=>row[0]),['post_views','likes','comments','external_shares','clip_votes']);
  assert.ok(tables.every(([,columns,options])=>columns==='id'&&options.count==='exact'&&options.head===true));
});
