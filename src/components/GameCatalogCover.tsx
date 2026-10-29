import {useState} from 'react';import {usePrivateMediaUrl} from '@/hooks/usePrivateMedia';
export function GameCatalogCover({src,name}:{src:string|null|undefined;name:string}){
 const [failed,setFailed]=useState<string|null>(null);const image=usePrivateMediaUrl(src);
 const words=name.trim().split(/\s+/);const initials=words.length>1?words.slice(0,3).map(word=>word[0]).join(''):(name.slice(0,2)+name.slice(-2)).toUpperCase();
 return image.src&&failed!==image.src?<img className="clipt-game-cover" src={image.src} alt="" loading="lazy" onError={()=>setFailed(image.src??null)}/>:<span className="clipt-game-cover clipt-game-cover-fallback" aria-hidden="true">{initials.toUpperCase()}</span>;
}
