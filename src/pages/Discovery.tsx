import {Link} from 'react-router-dom';
import {useState} from 'react';
import {usePrivateMediaUrl} from '@/hooks/usePrivateMedia';
import {postImageReferences} from '@/lib/post-image-references';
import {useQuery} from '@tanstack/react-query';
import {Search} from 'lucide-react';
import {supabase} from '@/lib/supabase';
import {useAuth} from '@/contexts/AuthContext';
import {BackButton} from '@/components/ui/back-button';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {AspectRatio} from '@/components/ui/aspect-ratio';
import {Avatar,AvatarFallback,AvatarImage} from '@/components/ui/avatar';
import BoostedDiscovery from '@/components/BoostedDiscovery';

function DiscoveryImage({reference}:{reference:string|null}){
  const media=usePrivateMediaUrl(postImageReferences(reference)[0]);
  const [failedSrc,setFailedSrc]=useState<string|null>(null);
  return media.src&&failedSrc!==media.src?<img src={media.src} alt="" loading="lazy" onError={()=>setFailedSrc(media.src??null)} className="h-full w-full object-cover"/>:<div className="h-full w-full bg-primary/10 flex items-center justify-center p-2"><span className="text-xs text-muted-foreground">{media.isLoading?'Loading image…':media.error||failedSrc?'Image unavailable':'Watch Clipt'}</span></div>;
}

export default function Discovery(){
  const {user}=useAuth();
  const clips=useQuery({queryKey:['public-discovery',user?.id],retry:false,
    queryFn:async({signal})=>{
      const {data,error}=await supabase.from('public_clipt_discovery')
        .select('id,content,image_url,username,avatar_url')
        .order('created_at',{ascending:false}).limit(30).abortSignal(signal).retry(false);
      if(error)throw error;return data;
    }});
  return <main className="clipt-discovery mx-auto max-w-6xl space-y-5 px-4 py-6">
    <header className="space-y-4"><BackButton/><h1 className="text-2xl font-bold">Discovery</h1>
      <Button asChild variant="outline" className="w-full justify-start"><Link to="/retro-search"><Search className="mr-2 h-4 w-4" aria-hidden="true"/>Search games, creators and Clipts</Link></Button>
      <Button asChild variant="outline"><Link to="/top-games">Browse all games</Link></Button>
    </header>
    <BoostedDiscovery/>
    <section aria-label="Organic discovery" className="space-y-3">
      <h2 className="text-lg font-semibold">Explore Clipts</h2>
      <p className="text-sm text-muted-foreground">Recent public Clipts. Boosted opportunities are labeled separately.</p>
      {clips.isPending?<div role="status" aria-label="Loading Clipts" className="grid grid-cols-3 gap-2">{Array.from({length:9},(_,i)=><Skeleton key={i} className="aspect-square"/>)}</div>:
      clips.isError?<Card className="p-4"><p role="alert">Clipts could not be loaded.</p><Button onClick={()=>void clips.refetch()} className="mt-3">Retry Clipts</Button></Card>:
      !clips.data?.length?<Card className="p-4">No public Clipts yet.</Card>:
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">{clips.data.map(clip=><Link key={clip.id} to={`/post/${clip.id}`} aria-label={clip.content||'Watch Clipt'} className="relative overflow-hidden rounded-md border border-primary/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <AspectRatio ratio={1}><DiscoveryImage reference={clip.image_url}/></AspectRatio>
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1.5 flex items-center gap-1">
          <Avatar className="h-5 w-5 shrink-0"><AvatarImage src={clip.avatar_url||''} alt=""/><AvatarFallback>{clip.username?.charAt(0).toUpperCase()||'C'}</AvatarFallback></Avatar>
          <span className="truncate text-xs">{clip.username||'Creator'}</span>
        </div>
      </Link>)}</div>}
    </section>
  </main>;
}
