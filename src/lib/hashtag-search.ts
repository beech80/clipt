import {supabase} from '@/lib/supabase';
import {normalizeHashtag as validHashtag} from '@/utils/hashtagUtils';

export type HashtagSuggestion={tag:string;search_count:number;post_count:number};

export function normalizeHashtag(value:string){
  return validHashtag(value.trim())??'';
}

export async function hashtagSuggestions(term:string,signal?:AbortSignal){
  let query=supabase.rpc('search_hashtags',{p_term:term.trim().replace(/^#/,'').slice(0,40),p_limit:12});
  if(signal)query=query.abortSignal(signal);
  const {data,error}=await query.retry(false);
  if(error)throw error;
  return (data??[]) as HashtagSuggestion[];
}

export async function recordHashtagSearch(tag:string){
  const normalized=normalizeHashtag(tag);
  if(!normalized)return;
  const {error}=await supabase.rpc('record_hashtag_search',{p_tag:normalized}).retry(false);
  if(error)throw error;
}
