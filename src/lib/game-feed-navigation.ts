export function gameFeedNavigation(pathname:string,search:string){
 const params=new URLSearchParams(search),game=params.get('game');
 if(!game||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(game))return null;
 if(!['/clipts','/','/live'].includes(pathname))return null;
 const live=pathname==='/live';return {game,live,feed:live?'live':'clipts',to:(live?'/clipts':'/live')+'?game='+encodeURIComponent(game)};
}
