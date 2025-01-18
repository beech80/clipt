import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useAuthSecurity = () => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const checkIPStatus = async (ip: string) => {
    const { data: isBlocked, error: blockError } = await supabase
      .rpc('is_ip_blocked', { check_ip: ip });
    
    if (blockError) {
      console.error('Error checking IP block status:', blockError);
      return false;
    }
    
    const { data: isRateLimited, error: rateError } = await supabase
      .rpc('check_auth_rate_limit', { check_ip: ip });
    
    if (rateError) {
      console.error('Error checking rate limit:', rateError);
      return false;
    }

    setIsBlocked(isBlocked);
    setIsRateLimited(isRateLimited);
    return isBlocked || isRateLimited;
  };

  const recordAuthAttempt = async (ip: string, email: string, isSuccessful: boolean) => {
    const { error } = await supabase
      .from('auth_attempts')
      .insert([{ ip_address: ip, email, is_successful: isSuccessful }]);

    if (error) {
      console.error('Error recording auth attempt:', error);
    }
  };

  const toggle2FA = async (enabled: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('two_factor_auth')
      .upsert({ 
        user_id: user.id,
        is_enabled: enabled,
        backup_codes: enabled ? generateBackupCodes() : []
      });

    if (error) {
      toast.error('Failed to update 2FA settings');
      return false;
    }

    setIs2FAEnabled(enabled);
    toast.success(`Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  };

  const generateBackupCodes = () => {
    return Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );
  };

  const check2FAStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('two_factor_auth')
      .select('is_enabled')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setIs2FAEnabled(data.is_enabled);
    }
  };

  useEffect(() => {
    check2FAStatus();
  }, []);

  return {
    isRateLimited,
    isBlocked,
    is2FAEnabled,
    checkIPStatus,
    recordAuthAttempt,
    toggle2FA
  };
};