import {Link} from 'react-router-dom';
import {useState} from 'react';
import {Radio} from 'lucide-react';
import {usePrivateMediaUrl} from '@/hooks/usePrivateMedia';
export function LiveStreamCard({stream,gameName}:{stream:{id:string;title:string|null;description:string|null;thumbnail_url:string|null;viewer_count:number|null;game_id:string|null};gameName?:string}){
  const image=usePrivateMediaUrl(stream.thumbnail_url);const [failed,setFailed]=useState<string|null>(null);
  return <article className="gaming-card min-w-0 overflow-hidden rounded-xl border border-purple-400/30">
    <Link to={'/streaming/'+stream.id} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-300" aria-label={'Watch live: '+(stream.title||'Untitled stream')}>
      <div className="aspect-video relative flex items-center justify-center bg-black"><Radio aria-hidden="true" className="h-10 w-10 text-purple-300"/>{image.src&&failed!==image.src&&<img src={image.src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={()=>setFailed(image.src??null)}/>}<span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">LIVE</span></div>
      <div className="space-y-2 p-4"><h3 className="break-words font-semibold">{stream.title||'Untitled stream'}</h3>{gameName&&<p className="text-sm text-purple-200">{gameName}</p>}{stream.description&&<p className="line-clamp-2 text-sm text-muted-foreground">{stream.description}</p>}<p className="text-sm text-muted-foreground">{stream.viewer_count==null?'Viewer count unavailable':stream.viewer_count.toLocaleString()+' watching'}</p></div>
    </Link>
  </article>;
}
