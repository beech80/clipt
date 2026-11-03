import {useQuery} from '@tanstack/react-query';
import {loadAchievementSnapshot} from '@/lib/achievement-snapshot';
import {useAuth} from '@/contexts/AuthContext';
export const useAchievementProgress=(userId:string)=>{
 const {user}=useAuth();
 const result=useQuery({queryKey:['achievement-progress',userId,'verified'],enabled:Boolean(userId)&&userId===user?.id,retry:false,
  queryFn:async()=>{const snapshot=await loadAchievementSnapshot();return snapshot.rows.filter(row=>row.tracked);}});
 return {progress:result.data,isLoading:result.isLoading,error:result.error,refresh:result.refetch};
};
