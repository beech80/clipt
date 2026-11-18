import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {GameCatalogLookup} from '@/components/GameCatalogLookup';
import {GameCatalogCover} from '@/components/GameCatalogCover';
import {completeGameCatalog,gameLabel} from '@/lib/game-catalog';
import {Gamepad2,Users,Film,LayoutGrid,Hash} from 'lucide-react';
import {supabase} from '@/lib/supabase';
import {useAuth} from '@/contexts/AuthContext';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {BackButton} from '@/components/ui/back-button';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {searchPattern} from '@/lib/search-pattern';
import {usePrivateMediaUrl} from '@/hooks/usePrivateMedia';
import {postImageReferences} from '@/lib/post-image-references';
import {hashtagSuggestions,normalizeHashtag,recordHashtagSearch} from '@/lib/hashtag-search';

function SearchResultImage({src,icon:Icon}:{src:string|null|undefined;icon:typeof Gamepad2}){
  const [failedSrc,setFailedSrc]=useState<string|null>(null);
  const media=usePrivateMediaUrl(src);
  return media.src&&failedSrc!==media.src?<img src={media.src} alt="" loading="lazy" onError={()=>setFailedSrc(media.src??null)}/>:<><Icon aria-hidden="true"/><span className="sr-only">{media.isLoading?'Loading image':media.error||failedSrc?'Image unavailable':'No image'}</span></>;
}

export default function RetroSearchPage(){
  const {user}=useAuth();
  const [input,setInput]=useState('');const [term,setTerm]=useState('');
  const [category,setCategory]=useState('all');
  useEffect(()=>{const timer=setTimeout(()=>setTerm(input.trim().slice(0,80)),250);return()=>clearTimeout(timer);},[input]);
  const pattern=searchPattern(term.replace(/^@/,''));
  const games=useQuery({queryKey:['complete-catalog-search',user?.id,term],retry:false,
    queryFn:({signal})=>completeGameCatalog(term,signal)});
  const creators=useQuery({queryKey:['creator-search',user?.id,term],retry:false,
    queryFn:async({signal})=>{
      // Separate typed filters avoid interpolating search into PostgREST OR grammar.
      const base=()=>supabase.from('profiles').select('id,username,display_name,avatar_url').order('username').limit(20);
      const queries=term?[base().ilike('username',pattern),base().ilike('display_name',pattern)]:[base()];
      const results=await Promise.all(queries.map(q=>q.abortSignal(signal).retry(false)));
      const unique=new Map<string,NonNullable<typeof results[0]['data']>[number]>();
      for(const result of results){if(result.error)throw result.error;for(const row of result.data??[])unique.set(row.id,row);}
      return [...unique.values()].sort((a,b)=>(a.username||'').localeCompare(b.username||'')).slice(0,20);
    }});
  const clips=useQuery({queryKey:['public-clip-search',user?.id,term],retry:false,
    queryFn:async({signal})=>{let q=supabase.from('public_clipt_discovery').select('id,content,image_url').order('created_at',{ascending:false}).limit(20);
      if(term)q=q.ilike('content',pattern);const {data,error}=await q.abortSignal(signal).retry(false);if(error)throw error;return data;}});
  const hashtags=useQuery({queryKey:['hashtag-search',user?.id,term],enabled:Boolean(user),retry:false,queryFn:({signal})=>hashtagSuggestions(term,signal)});
  const sections=[
    {id:'games',title:'Games',icon:Gamepad2,query:games,items:games.data?.map(g=>({id:g.id,label:gameLabel(g),href:`/game/${g.id}`,image:g.cover_url}))},
    {id:'creators',title:'Creators',icon:Users,query:creators,items:creators.data?.map(p=>({id:p.id,label:p.display_name?`${p.display_name} (@${p.username})`:`@${p.username}`,href:`/user/${p.id}`,image:p.avatar_url}))},
    {id:'clipts',title:'Clipts',icon:Film,query:clips,items:clips.data?.map(p=>({id:p.id,label:p.content||'Watch Clipt',href:`/post/${p.id}`,image:postImageReferences(p.image_url)[0]}))},
    {id:'hashtags',title:'Hashtags',icon:Hash,query:hashtags,items:hashtags.data?.map(h=>({id:h.tag,label:`#${h.tag} · ${h.search_count.toLocaleString()} ${h.search_count===1?'search':'searches'}`,href:`/hashtag/${encodeURIComponent(h.tag)}`,image:null}))},
  ];
  return <main className="clipt-search mx-auto max-w-6xl space-y-4 px-4 py-4" data-search-category={category}>
    <header className="clipt-search-heading"><BackButton/><div><h1 className="text-lg font-bold">Discovery search</h1></div></header>
    <form role="search" className="flex flex-wrap gap-2" onSubmit={event=>{event.preventDefault();const next=input.trim().slice(0,80);setTerm(next);const tag=normalizeHashtag(next);if(user&&tag&&hashtags.data?.some(row=>row.tag===tag))void recordHashtagSearch(tag).then(()=>hashtags.refetch()).catch(()=>undefined);}}><Input aria-label="Search Clipt" type="search" maxLength={80} placeholder="Games, #hashtags, @creators, Clipts…" value={input} onChange={e=>setInput(e.target.value)} className="min-w-0 flex-1"/><Button type="submit">Search</Button>{input&&<Button type="button" variant="outline" onClick={()=>{setInput('');setTerm('');}}>Clear</Button>}</form>
    <Tabs value={category} onValueChange={setCategory}><TabsList className="clipt-search-categories w-full h-auto"><TabsTrigger value="all"><LayoutGrid aria-hidden="true"/>All</TabsTrigger><TabsTrigger value="games"><Gamepad2 aria-hidden="true"/>Games</TabsTrigger><TabsTrigger value="hashtags"><Hash aria-hidden="true"/>Tags</TabsTrigger><TabsTrigger value="creators"><Users aria-hidden="true"/>Creators</TabsTrigger><TabsTrigger value="clipts"><Film aria-hidden="true"/>Clipts</TabsTrigger></TabsList></Tabs>
    {input.trim()!==term&&<p role="status">Updating search…</p>}
    <div className="space-y-6">{sections.filter(s=>category==='all'||category===s.id).map(section=><section key={section.id} aria-label={`${section.title} results`} className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2"><section.icon className="h-5 w-5 text-primary" aria-hidden="true"/>{section.title}</h2>
      {section.query.isPending?<p role="status">Loading {section.title.toLowerCase()}…</p>:section.query.isError?<Card className="p-4"><p role="alert">Unable to load {section.title.toLowerCase()}. This is not an empty result.</p><Button variant="outline" className="mt-3" onClick={()=>void section.query.refetch()}>Retry {section.title.toLowerCase()}</Button></Card>:section.items?.length?<ul className="clipt-search-results" data-category={section.id}>{section.items.map(item=><li key={item.id}><Link to={item.href} onClick={()=>{if(section.id==='hashtags'&&user)void recordHashtagSearch(item.id).catch(()=>undefined);}} className="clipt-search-result">
        <div className="clipt-search-result-image">{section.id==='games'?<GameCatalogCover src={item.image} name={item.label}/>:<SearchResultImage src={item.image} icon={section.icon}/>}</div><span>{item.label}</span>
      </Link></li>)}</ul>:<Card className="p-4 text-muted-foreground">No {section.title.toLowerCase()} {term?'match this search.':'available yet.'}</Card>}
      {section.id==='games'&&<GameCatalogLookup term={term}/>}
    </section>)}</div>
  </main>;
}

