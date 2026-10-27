import { useEffect, useState } from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { validateAuthenticatorCode } from '@/lib/mfa';

export const useAuthSecurity = () => {
  const { user } = useAuth();
  const queryClient=useQueryClient();
  const [enrollment, setEnrollment] = useState<{ id: string; qrCode: string; secret: string } | null>(null);
  const factorsQuery=useQuery({queryKey:['auth-factors',user?.id],enabled:Boolean(user),retry:false,staleTime:0,
    queryFn:async()=>{const {data,error}=await supabase.auth.mfa.listFactors();if(error)throw error;return data.totp;}});
  // MFA verification refreshes the session and can remount the Settings page.
  // Invalidate shared state after each mutation, including from an old mount.
  const refresh=()=>queryClient.invalidateQueries({queryKey:['auth-factors',user?.id]});
  useEffect(()=>{setEnrollment(null);},[user?.id]);

  const enroll = async () => {
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp', friendlyName: 'Clipt authenticator',
    });
    if (enrollError) throw enrollError;
    if (data.type !== 'totp') throw new Error('Authenticator enrollment was not returned.');
    setEnrollment({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  };
  const verifyEnrollment = async (code: string) => {
    if (!enrollment) throw new Error('Start authenticator setup first.');
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollment.id, code: validateAuthenticatorCode(code),
    });
    if (verifyError) throw verifyError;
    setEnrollment(null);
    await refresh();
  };
  const cancelEnrollment = async () => {
    if (!enrollment) return;
    const { error: cancelError } = await supabase.auth.mfa.unenroll({ factorId: enrollment.id });
    if (cancelError) throw cancelError;
    setEnrollment(null);
  };
  const removeFactor = async (factorId: string, code: string) => {
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId, code: validateAuthenticatorCode(code),
    });
    if (verifyError) throw verifyError;
    const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId });
    if (removeError) throw removeError;
    await refresh();
  };
  return { factors:factorsQuery.data??[], enrollment, error:factorsQuery.isError?'Could not load authenticator settings.':'', loading:Boolean(user)&&factorsQuery.isPending, enroll, verifyEnrollment, cancelEnrollment, removeFactor };
};
