import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {Clapperboard,Radio} from 'lucide-react';
export function GameChannelToolbar({gameId,name,live=false,children}:{gameId:string;name:string;live?:boolean;children?:ReactNode}){
 return <aside className="clipt-game-channel-toolbar" aria-label="Game channel navigation"><strong>{name}</strong><nav className="flex flex-wrap items-center gap-2" aria-label="Game viewing mode">
 <Link className="clipt-channel-mode" aria-current={!live?'page':undefined} to={'/clipts?game='+gameId}><Clapperboard aria-hidden="true" size={18}/>FYP</Link>
 <Link className="clipt-channel-mode" aria-current={live?'page':undefined} to={'/live?game='+gameId}><Radio aria-hidden="true" size={18}/>Live streams</Link>
 <Link className="clipt-channel-mode" to="/clipts" aria-label="Clear game channel">All games</Link>{children}</nav></aside>;
}
