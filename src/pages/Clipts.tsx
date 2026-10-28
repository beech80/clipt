import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import PostItem from '@/components/PostItem';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { EngagementHud } from '@/components/post/EngagementHud';
import { RefreshCw, Clapperboard, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import './clipt-console.css';
import { usePortraitSwipe } from '@/hooks/usePortraitSwipe';
import {publishingSnapshot,subscribePublishing} from '@/lib/publishing-status';

const PAGE_SIZE = 20;
const MEDIA_FILTER = 'and(video_url.not.is.null,video_url.neq.),and(image_url.not.is.null,image_url.neq.)';
export default function Clipts() {
  const { user } = useAuth();
  const publishingState=useSyncExternalStore(subscribePublishing,publishingSnapshot,()=>null);
  const publishing=publishingState?.owner===user?.id?publishingState:null;
  const [hiddenPublishing,setHiddenPublishing]=useState('');
  const [feed, setFeed] = useState('clipts');
  useEffect(() => {
    const toggle = () => setFeed(current => current === 'squad' ? 'clipts' : 'squad');
    window.addEventListener('clipt:toggle-feed', toggle);
    return () => window.removeEventListener('clipt:toggle-feed', toggle);
  }, []);
  const muted=useQuery({queryKey:['muted-creators',user?.id],enabled:!!user,retry:false,queryFn:async()=>{
    const ids:string[]=[];
    for(let offset=0;;offset+=500){const {data,error}=await supabase.from('user_mutes').select('muted_id').eq('owner_id',user!.id).order('muted_id').range(offset,offset+499);if(error)throw error;ids.push(...data.map(x=>x.muted_id));if(data.length<500)return ids;}
  }});
  const following = useQuery({
    queryKey: ['squad-following', user?.id], enabled: feed === 'squad' && Boolean(user), retry: false,
    queryFn: async ({ signal }) => {
      const ids: string[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from('follows').select('following_id')
          .eq('follower_id', user!.id).order('following_id').range(offset, offset + 499).abortSignal(signal).retry(false);
        if (error) throw error;
        ids.push(...data.map(row => row.following_id));
        if (data.length < 500) return ids;
      }
    },
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [engagementOpen, setEngagementOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const swipeZoneRef = useRef<HTMLButtonElement>(null);
  const { data, error, isPending, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['clipts-feed', user?.id, feed, following.data, muted.data],
    enabled: (!user || muted.isSuccess) && (feed === 'clipts' || Boolean(user && following.isSuccess)),
    retry: false,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (feed === 'squad' && !following.data?.length) return [];
      let request = supabase.from('posts')
        .select('id, content, image_url, video_url, user_id, created_at, is_published, is_premium, is_subscriber_only, post_type, profiles(username, display_name, avatar_url), games(id, name)')
        .or(feed === 'squad' ? MEDIA_FILTER : `and(or(${MEDIA_FILTER}),or(post_type.is.null,post_type.neq.squad))`).eq('is_published', true)
        .order('created_at', { ascending: false }).order('id', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      if (feed === 'squad') request = request.in('user_id', following.data!);
      if(user && muted.data?.length) request=request.not('user_id','in',`(${muted.data.join(',')})`);
      const { data, error } = await request.retry(false);
      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage, pages) => lastPage.length === PAGE_SIZE ? pages.length : undefined,
  });
  const uploadedPost=useQuery({queryKey:['published-home-post',user?.id,publishing?.postId],enabled:Boolean(user&&publishing?.stage==='complete'&&publishing.postId),retry:false,
    queryFn:async({signal})=>{const {data,error}=await supabase.from('posts').select('id,content,image_url,video_url,user_id,created_at,is_published,is_premium,is_subscriber_only,post_type,profiles(username,display_name,avatar_url),games(id,name)')
      .eq('id',publishing!.postId!).eq('user_id',user!.id).eq('is_published',true).abortSignal(signal).retry(false).maybeSingle();if(error)throw error;return data;}});
  const basePosts=data?.pages.flat() || [];
  const ownUploaded=publishing?.stage==='complete' && uploadedPost.data && (uploadedPost.data.post_type==='squad' ? feed==='squad' : feed==='clipts') ? uploadedPost.data:null;
  const posts = user && !muted.isSuccess ? [] : [...new Map((ownUploaded?[ownUploaded,...basePosts]:basePosts).map(post => [post.id, post])).values()];
  useEffect(()=>{if(publishing?.stage==='complete'){setFeed(publishing.destination);setActiveIndex(0);trackRef.current?.scrollTo({left:0,behavior:'instant'});}},[publishing?.id,publishing?.stage]);
  const activePost = posts[activeIndex];
  const swipePath = usePortraitSwipe(swipeZoneRef, posts.length > 0);
  useEffect(() => {
    setActiveIndex(0);
    setEngagementOpen(false);
    trackRef.current?.scrollTo({ left: 0, behavior: 'instant' });
  }, [user?.id, feed]);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const navigate = (event: Event) => {
      if (document.querySelector('[data-sliding-panel][data-panel-size="full"]:not([data-state="closed"]), [role="dialog"]:not(.clipt-engagement-hud):not([data-sliding-panel]):not([data-state="closed"])')) return;
      const direction = (event as CustomEvent<{ direction: number }>).detail?.direction;
      if (direction !== -1 && direction !== 1) return;
      const nextIndex = Math.max(0, Math.min(posts.length - 1, activeIndex + direction));
      const slide = track.querySelector<HTMLElement>('[data-slide-index="' + nextIndex + '"]');
      if (!slide) return;
      track.scrollTo({ left: slide.offsetLeft - track.offsetLeft - (track.clientWidth - slide.clientWidth) / 2,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion') ? 'instant' : 'smooth' });
    };
    window.addEventListener('clipt:navigate', navigate);
    return () => window.removeEventListener('clipt:navigate', navigate);
  }, [activeIndex, posts.length]);
  // Preserve the visible clip through rotation, folding and viewport changes.
  // Scroll only the carousel; keep its keyed players and playback state intact.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !posts.length) return;
    const recenter = () => {
      const slide = track.querySelector<HTMLElement>('[data-slide-index="' + activeIndexRef.current + '"]');
      if (!slide) return;
      track.scrollTo({ left: slide.offsetLeft - track.offsetLeft - (track.clientWidth - slide.clientWidth) / 2, behavior: 'instant' });
    };
    const observer = new ResizeObserver(recenter);
    observer.observe(track);
    window.addEventListener('resize', recenter);
    window.visualViewport?.addEventListener('resize', recenter);
    return () => { observer.disconnect(); window.removeEventListener('resize', recenter); window.visualViewport?.removeEventListener('resize', recenter); };
  }, [posts.length]);
  useEffect(() => {
    if (posts.length && activeIndex >= posts.length - 3 && hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [activeIndex, posts.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return <main className="clipt-fyp" data-feed={feed}>
    {publishing && hiddenPublishing!==publishing.id && <aside className="clipt-publishing-status" role={publishing.stage==='error'?'alert':'status'}>
      {publishing.stage==='error'?<><strong>Upload needs attention</strong><p>{publishing.message}</p>{!publishing.uncertain&&<Link to="/new-post">Open posting</Link>}<Link to="/profile">Check my posts before retrying</Link></>:publishing.stage==='complete'?<><strong>{uploadedPost.data?'Your post is ready below.':'Upload saved.'}</strong>{!uploadedPost.data&&<p>It will appear after any required safety review. <button onClick={()=>void uploadedPost.refetch()}>Check again</button></p>}</>:<><strong>{publishing.stage==='uploading'?'Uploading your post…':publishing.stage==='reward'?'Post saved. Checking Token reward…':'Publishing your post…'}</strong><p>Keep CLIPT open until this finishes. You can watch while it uploads.</p></>}
      {['complete','error'].includes(publishing.stage)&&<button type="button" aria-label="Dismiss upload status" onClick={()=>setHiddenPublishing(publishing.id)}>Dismiss</button>}
    </aside>}
    <header className="clipt-fyp-header">
      <h1 className="sr-only">Clipts</h1>
      <Link to="/clipts" className="clipt-fyp-brand" aria-label="Clipt — For You home">CLIPT</Link>
      <div className="clipt-fyp-header-actions">
      <span className="clipt-fyp-counter" aria-live="polite">{posts.length ? activeIndex + 1 : 0} / {posts.length}{hasNextPage ? '+' : ''}</span>
      <Button aria-label="Refresh clips" onClick={() => void refetch()} disabled={isFetching} size="icon" variant="ghost">
        <RefreshCw className={isFetching ? 'animate-spin' : ''} />
      </Button>
      </div>
    </header>
    <Tabs value={feed} onValueChange={setFeed} className="clipt-feed-tabs"><TabsList aria-label="Choose Clipt feed"><TabsTrigger value="clipts" aria-label="Clipts" title="Clipts"><Clapperboard size={22} aria-hidden="true" /></TabsTrigger><TabsTrigger value="squad" aria-label="Squad" title="Squad"><UsersRound size={22} aria-hidden="true" /></TabsTrigger></TabsList></Tabs>
    {feed === 'squad' && !user ? <p className="clipt-feed-state"><Link to="/login">Sign in to see your Squad.</Link></p> : following.isError && feed === 'squad' ? <div className="clipt-feed-state" role="alert">Your following list could not be loaded. <Button onClick={() => void following.refetch()}>Retry Squad</Button></div> : isPending && <p role="status" className="clipt-feed-state">Loading Clipts…</p>}
    {muted.isError && user && <div role="alert" className="clipt-feed-state"><p>Mute preferences could not be loaded. Feed paused.</p><Button onClick={()=>void muted.refetch()}>Retry mute preferences</Button></div>}
    {error && <div role="alert" className="clipt-feed-state"><p>Could not load Clipts. Please try again.</p><Button onClick={() => void refetch()}>Retry</Button></div>}
    {!isPending && !error && posts.length === 0 && <p className="clipt-feed-state">{feed === 'squad' ? 'No Squad clips yet. Follow creators to see their clips here.' : 'No clips yet. Be the first to share one.'}</p>}
    {posts.length > 0 && <div ref={trackRef} className="clipt-fyp-track" data-horizontal-feed
      role="region" aria-roledescription="carousel" aria-label="Clipts horizontal feed" tabIndex={0}
      onKeyDown={event => {
        if (event.target !== event.currentTarget || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('clipt:navigate', { detail: { direction: ['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1 } }));
      }}
      onScroll={() => {
        const track = trackRef.current;
        if (!track) return;
        const midpoint = track.getBoundingClientRect().left + track.clientWidth / 2;
        let closest = 0, distance = Infinity;
        track.querySelectorAll<HTMLElement>('[data-slide-index]').forEach(slide => {
          const rect = slide.getBoundingClientRect();
          const candidate = Math.abs(rect.left + rect.width / 2 - midpoint);
          if (candidate < distance) { distance = candidate; closest = Number(slide.dataset.slideIndex); }
        });
        activeIndexRef.current = closest;
        setActiveIndex(closest);
      }}>
      {posts.map((post, index) => <section key={post.id} className="clipt-fyp-slide" data-slide-index={index}
        aria-label={'Clipt ' + (index + 1) + ' of ' + posts.length} aria-roledescription="slide">
        {Math.abs(index - activeIndex) <= 1
          ? <PostItem post={post} cinematic active={index === activeIndex} onOpenEngagement={() => setEngagementOpen(true)} />
          : <div className="clipt-fyp-placeholder">Clipt {index + 1}</div>}
      </section>)}
    </div>}
    <button ref={swipeZoneRef} type="button" className="clipt-bottom-swipe-zone" data-swipe-menu
      aria-label="CLIPT — Open navigation" aria-haspopup="dialog" aria-controls="clipt-navigation-panel"
      onClick={() => window.dispatchEvent(new CustomEvent('clipt:open-navigation'))}><span>CLIPT</span></button>
    <svg className="clipt-swipe-trail" aria-hidden="true"><path ref={swipePath} /></svg>
    <Dialog open={engagementOpen && Boolean(activePost)} onOpenChange={setEngagementOpen} modal={false}>
      {engagementOpen && activePost && <EngagementHud postId={activePost.id}
        username={activePost.profiles?.username} caption={activePost.content} avatarUrl={activePost.profiles?.avatar_url} followFeed />}
    </Dialog>
    {hasNextPage && <Button className="m-4" onClick={() => void fetchNextPage()} disabled={isFetchingNextPage}>
      {isFetchingNextPage ? 'Loading…' : 'Load more clips'}
    </Button>}
  </main>;
}
