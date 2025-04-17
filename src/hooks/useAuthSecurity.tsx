import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useAuthSecurity() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isContactVerified, setIsContactVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getSecuritySettings = async () => {
      try {
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        
        setUserId(userData.user.id);
        
        // Get security settings from the database
        const { data, error } = await supabase
          .from('profiles')
          .select('enable_2fa, contact_verified')
          .eq('id', userData.user.id)
          .single();
        
        if (error) throw error;
        
        setIs2FAEnabled(data?.enable_2fa || false);
        setIsContactVerified(data?.contact_verified || false);
      } catch (err) {
        console.error('Error fetching security settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    getSecuritySettings();
  }, []);

  const toggle2FA = async (enabled: boolean) => {
    if (!userId) return false;
    
    try {
      setIsLoading(true);
      
      if (enabled && !isContactVerified) {
        toast.error('Please verify your contact information first');
        return false;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ enable_2fa: enabled })
        .eq('id', userId);
      
      if (error) throw error;
      
      setIs2FAEnabled(enabled);
      
      toast.success(`Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    } catch (err) {
      console.error('Error toggling 2FA:', err);
      toast.error('Failed to update 2FA settings');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyContact = async (method: 'email' | 'phone', value: string) => {
    if (!userId) return false;
    
    try {
      setIsLoading(true);
      
      // In a real app, this would send a verification code to the email/phone
      // For demo purposes, we'll simulate a successful verification
      
      // Store the contact method and value
      const { error: contactError } = await supabase
        .from('two_factor_auth')
        .upsert({
          user_id: userId,
          contact_method: method,
          contact_value: value,
          is_enabled: is2FAEnabled
        });
      
      if (contactError) throw contactError;
      
      // Mark contact as verified
      const { error } = await supabase
        .from('profiles')
        .update({ contact_verified: true })
        .eq('id', userId);
      
      if (error) throw error;
      
      setIsContactVerified(true);
      
      toast.success('Contact verification successful');
      return true;
    } catch (err) {
      console.error('Error verifying contact:', err);
      toast.error('Failed to verify contact information');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    is2FAEnabled,
    isContactVerified,
    isLoading,
    toggle2FA,
    verifyContact
  };
}
