import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trophyIneligibility,trophyVoteError} from '../../src/lib/trophy-eligibility.ts';
import {beginPublishing,updatePublishing,publishingSnapshot,publishingBlocked,subscribePublishing} from '../../src/lib/publishing-status.ts';
const read=p=>readFileSync(new URL('../../src/'+p,import.meta.url),'utf8');

test('Trophy UX mirrors protected public video target requirements without changing RLS',()=>{
  const valid={video_url:'https://example.invalid/video.mp4',post_type:'clipt',is_published:true,is_premium:false,is_subscriber_only:false};
  for(const post_type of ['clipt','clipts','video'])assert.equal(trophyIneligibility({...valid,post_type}),null);
  for(const patch of [{video_url:null},{video_url:''},{is_published:false},{is_published:undefined},{is_premium:true},{is_subscriber_only:true},{post_type:'squad'},{post_type:'home'}])assert.equal(typeof trophyIneligibility({...valid,...patch}),'string');
  assert.match(trophyVoteError({code:'42501'}),/eligible|account/);
  assert.doesNotMatch(trophyVoteError({code:'42501'}),/clipt_vote_eligible_target|row-level/);
  assert.match(trophyVoteError({code:'23505'}),/already recorded/);
  assert.match(read('components/PostItem.tsx'),/trophyIneligibility\(post\)/);
  assert.match(read('pages/Clipts.tsx'),/is_premium, is_subscriber_only/);
});

test('Home upload status survives page subscription changes, rejects duplicates and ignores stale updates',()=>{
  let notified=0;const unsubscribe=subscribePublishing(()=>notified++);
  const id=beginPublishing('owner-a','clipts');assert.ok(id);
  assert.equal(beginPublishing('owner-a','clipts'),null);
  updatePublishing('stale-id',{stage:'complete'});assert.equal(publishingSnapshot().stage,'uploading');
  unsubscribe();updatePublishing(id,{stage:'publishing'});
  assert.equal(publishingSnapshot().stage,'publishing');assert.equal(notified,1);
  updatePublishing(id,{stage:'complete',postId:'saved-id'});
  assert.equal(publishingSnapshot().postId,'saved-id');assert.equal(publishingBlocked('owner-a'),false);
  const uncertain=beginPublishing('owner-a','squad');assert.ok(uncertain);
  updatePublishing(uncertain,{stage:'error',uncertain:true,message:'Uncertain result'});
  assert.equal(beginPublishing('owner-a','clipts'),null);
  assert.equal(publishingBlocked('owner-a'),true);
  assert.equal(publishingBlocked('other-owner'),false);
  const other=beginPublishing('other-owner','clipts');assert.ok(other);
  updatePublishing(other,{stage:'complete',postId:'other-post'});
  assert.equal(publishingBlocked('owner-a'),true,'switching accounts must not forget an uncertain publication');
  assert.equal(beginPublishing('owner-a','clipts'),null);
});

test('posting returns Home while uploading but drafts, uncertain responses and cleanup remain guarded',()=>{
  const source=read('pages/NewPost.tsx');
  assert.ok(source.indexOf("if (publishingId) navigate('/clipts')")<source.indexOf("storage.from('media').upload"));
  assert.match(source,/destination !== 'draft'.*beginPublishing/);
  assert.match(source,/destination === 'draft'.*navigate\('\/drafts'\)/);
  assert.match(source,/updatePublishing\(publishingId,\{uncertain:true\}\)/);
  assert.match(source,/publishingBlocked\(user\?\.id\)/);
  assert.match(source,/uploadedPath = null;\s*setUncertain\(true\)/);
  const home=read('pages/Clipts.tsx');
  assert.match(home,/publishingState\?\.owner===user\?\.id/);
  assert.match(home,/\.eq\('user_id',user!\.id\)\.eq\('is_published',true\)/);
  assert.match(home,/required safety review/);
});

test('all configured search games are loaded through the paginated catalog, not fabricated entries',()=>{
  const source=read('pages/RetroSearchPage.tsx');
  assert.match(source,/completeGameCatalog\(term,signal\)/);
  assert.match(source,/games\.data\?\.map/);
  assert.doesNotMatch(source,/games\.data\?\.pages|games\.hasNextPage/);
  assert.match(read('lib/game-catalog.ts'),/if \(result.length < 40\) return rows/);
  assert.match(read('pages/clipt-console.css'),/grid-template-columns: repeat\(auto-fill,minmax\(min\(100%,140px\),1fr\)\); grid-auto-flow: row; grid-auto-columns: auto/);
});

test('shared masthead removes marked shortcuts and plaque but preserves branded Home navigation',()=>{
  const masthead=read('components/ConsoleMasthead.tsx');
  assert.doesNotMatch(masthead,/className="clipt-screen-name"|Page shortcuts|UserRound|<Search/);
  assert.match(masthead,/className="sr-only">\{label\}/);
  assert.match(masthead,/aria-label="Clipt — For You home"/);
});

test('selected conversation occupies full available area above original page controller',()=>{
  assert.match(read('pages/Messages.tsx'),/data-conversation-open=\{Boolean\(selectedChat\)\}/);
  const css=read('pages/clipt-console.css');
  assert.match(css,/\.clipt-messages\[data-conversation-open="true"\] \{[\s\S]*?position: fixed/);
  assert.match(css,/bottom|clipt-page-controller-space/);
  assert.match(css,/\.clipt-messages\[data-conversation-open="true"\] \.clipt-inbox \{ display: none !important/);
  assert.match(read('components/GameBoyControls.tsx'),/Press CLIPT for guide/);
});
