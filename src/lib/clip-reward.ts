import {z} from 'zod';
import {supabase} from '@/lib/supabase';

const resultSchema=z.object({status:z.enum(['awarded','already_checked','duplicate_content','limit_reached']),awarded:z.number().int().min(0).max(3)});
export async function checkClipReward(postId:string) {
  const controller=new AbortController();const timer=window.setTimeout(()=>controller.abort(),25000);
  try{
    const {data,error}=await supabase.functions.invoke('verify-clip-reward',{body:{postId},signal:controller.signal});
    if(error)throw new Error('Reward verification was not confirmed. Your published Clipt is unchanged; retry from Token Store.');
    return resultSchema.parse(data);
  }finally{window.clearTimeout(timer);}
}
export function clipRewardMessage(result:z.infer<typeof resultSchema>) {
  if(result.status==='already_checked')return 'This publication reward was already checked. No additional Tokens were added.';
  if(result.status==='duplicate_content')return 'This upload matches your previously rewarded content. No additional Tokens were added.';
  if(result.status==='limit_reached')return 'Your daily earning or storage limit was reached. No Tokens were added.';
  return `${result.awarded} Tokens earned, confirmed by the server.`;
}
