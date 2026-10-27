// Messages are immutable in this UI. Preserve sends/realtime inserts confirmed
// after an older history request started, while deduplicating by persisted ID.
export function directChatId(first: string, second: string): string {
  return `chat_${[first, second].sort().join('_')}`;
}

export function mergeMessageHistory<T extends {id:string;created_at:string;read?:boolean|null}>(history:T[],confirmed:T[]):T[] {
  const merged=new Map<string,T>();
  for(const item of [...history,...confirmed]) {
    const previous=merged.get(item.id);
    merged.set(item.id,previous?.read===true?{...item,read:true}:item);
  }
  return [...merged.values()]
    .sort((a,b)=>a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}
