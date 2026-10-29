import {Link,useSearchParams} from 'react-router-dom';
import {useInfiniteQuery} from '@tanstack/react-query';
import {useAuth} from '@/contexts/AuthContext';
import {channelMediaPage,channelLivePage,verifiedLiveBackend} from '@/lib/channel-feeds';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';
import DiscoveryPostCard from '@/components/post/DiscoveryPostCard';
import {LiveStreamCard} from '@/components/streaming/LiveStreamCard';
import {usePrivateMediaUrl} from '@/hooks/usePrivateMedia';
import {postImageReferences} from '@/lib/post-image-references';
import HashtagText from '@/components/post/HashtagText';
import '@/pages/clipt-channels.css';
function ChannelPost({post}:{post:{id:string;content:string|null;image_url?:string|null;user_id?:string|null;username?:string|null}}){
  const image=usePrivateMediaUrl(postImageReferences(post.image_url)[0]);
  return <article className="clipt-channel-post space-y-3">{post.user_id&&<Link className="inline-flex min-h-11 items-center font-semibold underline" to={'/user/'+post.user_id}>@{post.username||'Creator'}</Link>}{image.src&&<Link to={'/post/'+post.id} aria-label="Open post image"><img src={image.src} alt="Post image" loading="lazy"/></Link>}<p className="whitespace-pre-wrap [overflow-wrap:anywhere]"><HashtagText text={post.content||''}/></p><Link className="inline-flex min-h-11 items-center underline" to={'/post/'+post.id}>Open post</Link></article>;
}
export function GameChannelBrowser({gameId,gameName}:{gameId?:string;gameName?:string}){
  const {user}=useAuth();const [params,setParams]=useSearchParams();const tab=['clipts','live','posts'].includes(params.get('tab')||'')?params.get('tab')!:'clipts';
  const media=useInfiniteQuery({queryKey:['channel-media',gameId??'all',tab,user?.id],enabled:tab!=='live',retry:false,initialPageParam:0,
    queryFn:({pageParam,signal})=>channelMediaPage(tab==='posts'?'posts':'clipts',gameId,pageParam,signal),getNextPageParam:(last,pages)=>last.more?pages.length:undefined});
  const live=useInfiniteQuery({queryKey:['channel-live',gameId??'all',user?.id],enabled:tab==='live'&&(!verifiedLiveBackend||Boolean(user)),retry:false,initialPageParam:null as string|null,
    queryFn:({pageParam,signal})=>channelLivePage(gameId,pageParam,undefined,signal),getNextPageParam:last=>last.next??undefined,refetchInterval:tab==='live'?15000:false});
  const posts=[...new Map(media.data?.pages.flatMap(page=>page.items).map(post=>[post.id,post])??[]).values()];
  const streams=live.isError?[]:[...new Map(live.data?.pages.flatMap(page=>page.items).map(stream=>[stream.id,stream])??[]).values()];
  const status=tab==='live'?live:media;
  const label=tab==='live'?'live streams':tab==='posts'?'posts':'Clipts';
  return <section className="space-y-4" aria-label="Organic discovery">
    <Tabs value={tab} onValueChange={value=>setParams(current=>{current.set('tab',value);return current;})}><TabsList className="clipt-channel-tabs" aria-label="Channel content"><TabsTrigger value="clipts">Clipts</TabsTrigger><TabsTrigger value="live">Live streams</TabsTrigger><TabsTrigger value="posts">Posts</TabsTrigger></TabsList></Tabs>
    <header className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">{tab==='live'?'Live now':tab==='posts'?'Recent posts':'Recent organic Clipts'}</h2>{gameId&&tab==='clipts'&&<Button asChild variant="outline"><Link to={'/clipts?game='+gameId}>Watch this channel</Link></Button>}{tab==='live'&&<Button asChild variant="outline"><Link to={'/stream-setup'+(gameId?'?game='+gameId:'')}>Go Live</Link></Button>}</header>
    {tab==='live'&&verifiedLiveBackend&&!user?<p><Link className="underline" to="/login">Sign in to watch live streams.</Link></p>:<>
      {status.isPending&&<p role="status">Loading {label}…</p>}
      {status.isError&&<div role="alert"><p>Unable to load {label}.</p><Button onClick={()=>void (status.isFetchNextPageError?status.fetchNextPage():status.refetch())}>Retry {label}</Button></div>}
      {!status.isPending&&!status.isError&&(tab==='live'?streams.length===0:posts.length===0)&&<div className="gaming-card p-5"><p>{gameName?'No '+label+' for '+gameName+' yet.':'No '+label+' right now.'}</p></div>}
      <div className="clipt-channel-grid">{tab==='live'?streams.map(stream=><LiveStreamCard key={stream.id} stream={stream} gameName={gameName}/>):posts.map(post=>tab==='posts'?<ChannelPost key={post.id} post={post}/>:<DiscoveryPostCard key={post.id} post={post}/>)}</div>
      {status.hasNextPage&&<Button disabled={status.isFetching} onClick={()=>void status.fetchNextPage()}>{status.isFetchingNextPage?'Loading…':'Load more '+label}</Button>}
    </>}
  </section>;
}
